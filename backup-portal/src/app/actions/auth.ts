"use server";

import { z } from "zod";

const CreateUserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(["admin", "company"]),
  companyId: z.string().nullable(),
});

// Since Firestore Admin SDK might be used here, we can set up a basic server action.
// In a real environment, this action creates/syncs user profiles.
export async function createUserProfile(profileData: z.infer<typeof CreateUserProfileSchema>) {
  try {
    const validated = CreateUserProfileSchema.parse(profileData);
    
    // In actual production, you would use Firebase Admin SDK to write to Firestore,
    // which operates securely on the server side:
    // const adminDb = getAdminDb();
    // await adminDb.collection('users').doc(validated.uid).set({...});
    
    console.log("Server side user profile synced:", validated);
    return { success: true };
  } catch (error: any) {
    console.error("createUserProfile Server Action error:", error);
    return { success: false, error: error.message || "プロフィール作成に失敗しました" };
  }
}

// Authenticate user in mock environment checking hashed passwords
export async function authenticateMockUser(email: string, passwordSecret: string) {
  try {
    if (!email || !passwordSecret) {
      throw new Error("メールアドレスとパスワードを入力してください");
    }

    const { readMockDB } = require("@/lib/mock-db");
    const { hashPassword } = require("./invitations");

    let authUser: any = null;

    // Standard hardcoded mock user fallback
    if (email === "admin@mawork.jp" && passwordSecret === "password") {
      authUser = {
        uid: "mock-admin-uid",
        email: "admin@mawork.jp",
        displayName: "MA WORK JP 管理者",
        role: "admin",
        companyId: null,
      };
    } else if (email === "company@abc.com" && passwordSecret === "password") {
      const dbData = readMockDB();
      const dbUser = dbData.users?.find((u: any) => u.email === email);
      authUser = {
        uid: "mock-company-uid",
        email: "company@abc.com",
        displayName: "ABC商事 担当者",
        role: "company",
        companyId: dbUser?.companyId || "mock-company-id-abc",
      };
    } else {
      const dbData = readMockDB();
      const mockUser = dbData.users?.find((u: any) => u.email === email);

      if (!mockUser) {
        throw new Error("ログインIDまたはパスワードが正しくありません。");
      }

      // Verify hashed password
      const hashedPassword = await hashPassword(passwordSecret);
      if (mockUser.passwordHash && mockUser.passwordHash !== hashedPassword) {
        throw new Error("ログインIDまたはパスワードが正しくありません。");
      }

      authUser = {
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        role: mockUser.role,
        companyId: mockUser.companyId,
      };
    }

    // Check if company status is suspended
    if (authUser.role === "company" && authUser.companyId) {
      const dbData = readMockDB();
      const company = dbData.companies?.find((c: any) => c.id === authUser.companyId);
      if (company && company.status === "suspended") {
        throw new Error("このアカウントは一時的に停止されています。管理者にお問い合わせください。");
      }
    }

    return {
      success: true,
      user: authUser
    };
  } catch (error: any) {
    console.error("authenticateMockUser error:", error);
    return { success: false, error: error.message || "ログインに失敗しました" };
  }
}
