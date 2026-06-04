"use server";

import { z } from "zod";
import { firebaseConfig } from "@/lib/firebase/config";
import { readMockDB, writeMockDB } from "@/lib/mock-db";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, setDoc } from "firebase/firestore";
import { sendExpertEmail } from "./emails";

// Check if we are in mock mode
const isMock = firebaseConfig.apiKey === "mock-api-key";

const CompanySchema = z.object({
  name: z.string().min(1, "企業名は必須項目です"),
  address: z.string().min(1, "住所は必須項目です"),
  industry: z.string().min(1, "業種は必須項目です"),
  plan: z.enum(["light", "standard", "premium"]).optional(), // Mapped compatibility
  plan_type: z.enum(["entry", "basic", "standard", "advance", "pro", "premium"]),
  active_options: z.array(z.string()),
  status: z.enum(["active", "suspended", "invited"]),
  contactName: z.string().min(1, "担当者名は必須項目です"),
  contactEmail: z.string().email("有効なメールアドレスを入力してください"),
  contactPhone: z.string().min(1, "電話番号は必須項目です"),
  scrivenerName: z.string().optional().nullable(),
  scrivenerEmail: z.string().email("有効なメールアドレスを入力してください").or(z.literal("")).optional().nullable(),
  laborConsultantName: z.string().optional().nullable(),
  laborConsultantEmail: z.string().email("有効なメールアドレスを入力してください").or(z.literal("")).optional().nullable(),
  attorneyName: z.string().optional().nullable(),
  attorneyEmail: z.string().email("有効なメールアドレスを入力してください").or(z.literal("")).optional().nullable(),
  contractPdfUrl: z.string().optional().nullable(),
  contractExpirationDate: z.string().optional().nullable(),
});

export type CompanyData = z.infer<typeof CompanySchema>;

// Role-based Access Control Guard Helper
async function verifyAdminRole(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    if (isMock) {
      const dbData = readMockDB();
      const user = dbData.users?.find((u: any) => u.uid === uid);
      return user?.role === "admin";
    } else {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() && docSnap.data()?.role === "admin";
    }
  } catch (e) {
    console.error("verifyAdminRole error:", e);
    return false;
  }
}

// 1. Create Company (Integrated with Invitation Flow)
export async function createCompany(adminUid: string, data: CompanyData) {
  try {
    const isAdmin = await verifyAdminRole(adminUid);
    if (!isAdmin) {
      throw new Error("権限がありません。管理者のみ実行可能です。");
    }

    const validated = CompanySchema.parse(data);
    const companyId = "company-" + Math.random().toString(36).substring(2, 9);
    
    // Generate secure token for invitation
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours validity

    const inviteData = {
      token,
      companyName: validated.name,
      email: validated.contactEmail,
      contactName: validated.contactName,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    // Save invitation record
    if (isMock) {
      const dbData = readMockDB();
      dbData.invitations = dbData.invitations || [];
      // Clean up previous pending invitations for this email to avoid duplicates
      dbData.invitations = dbData.invitations.filter((i: any) => !(i.email === validated.contactEmail && i.status === "pending"));
      dbData.invitations.push({ id: "invite-" + Math.random().toString(36).substring(2, 9), ...inviteData });
      writeMockDB(dbData);
    } else {
      await addDoc(collection(db, "invitations"), inviteData);
    }

    // Construct registration URL
    let origin = "http://localhost:3000";
    try {
      const { headers } = require("next/headers");
      const headersList = await headers();
      const host = headersList.get("host") || "localhost:3000";
      const proto = headersList.get("x-forwarded-proto") || "http";
      origin = `${proto}://${host}`;
    } catch (e) {
      console.warn("Could not retrieve origin headers, using default:", e);
    }
    const registerUrl = `${origin}/register?token=${token}`;

    // Send invitation email
    const subject = "【MA WORK JP】アカウント本登録のご案内";
    const message = `${validated.contactName} 様

いつもお世話になっております。
MA WORK JP 運営事務局です。

新規契約企業用のアカウントを発行いたしました。
下記のリンクよりパスワードを設定し、本登録（アカウントの有効化）を完了させてください。

■ 本登録用URL:
${registerUrl}

※ 本登録用URLの有効期限は発行から24時間となっております。
※ ログイン用IDは、ご登録のメールアドレス（${validated.contactEmail}）となります。

何卒よろしくお願い申し上げます。`;

    let emailStatus = "sent";
    try {
      const mailRes = await sendExpertEmail("admin-system", validated.contactName, validated.contactEmail, subject, message, "manual_email", "MA WORK JP 運営");
      if (!mailRes.success) {
        emailStatus = "failed";
      }
    } catch (mailError) {
      console.warn("Invitation email failed to send: ", mailError);
      emailStatus = "failed";
    }

    // Save Company Record with invited status
    const newCompany = {
      id: companyId,
      ...validated,
      plan: ["premium", "standard"].includes(validated.plan_type) ? validated.plan_type : "light", // Backwards compatibility mapping
      logoUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isMock) {
      const dbData = readMockDB();
      dbData.companies.unshift(newCompany);
      writeMockDB(dbData);
    } else {
      await setDoc(doc(db, "companies", companyId), {
        ...newCompany,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return {
      success: true,
      id: companyId,
      inviteUrl: registerUrl,
      emailStatus,
    };
  } catch (error: any) {
    console.error("createCompany error:", error);
    return { success: false, error: error.message || "企業登録に失敗しました" };
  }
}

// 2. Read All Companies
export async function getCompanies() {
  try {
    if (isMock) {
      const dbData = readMockDB();
      return { success: true, data: dbData.companies };
    } else {
      const q = query(collection(db, "companies"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const companies = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });
      return { success: true, data: companies };
    }
  } catch (error: any) {
    console.error("getCompanies error:", error);
    return { success: false, error: error.message || "企業一覧の取得に失敗しました", data: [] };
  }
}

// 3. Read Company By ID
export async function getCompanyById(id: string) {
  try {
    if (isMock) {
      const dbData = readMockDB();
      const company = dbData.companies.find((c) => c.id === id);
      if (!company) throw new Error("対象の企業が見つかりません");
      return { success: true, data: company };
    } else {
      const docRef = doc(db, "companies", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("対象の企業が見つかりません");
      }
      const data = docSnap.data();
      return {
        success: true,
        data: {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        },
      };
    }
  } catch (error: any) {
    console.error("getCompanyById error:", error);
    return { success: false, error: error.message || "企業情報の取得に失敗しました" };
  }
}

// 4. Update Company Details (Core Info)
export async function updateCompany(adminUid: string, id: string, data: Partial<CompanyData>) {
  try {
    const isAdmin = await verifyAdminRole(adminUid);
    if (!isAdmin) {
      throw new Error("権限がありません。管理者のみ実行可能です。");
    }

    if (isMock) {
      const dbData = readMockDB();
      const index = dbData.companies.findIndex((c) => c.id === id);
      if (index === -1) throw new Error("対象の企業が見つかりません");

      dbData.companies[index] = {
        ...dbData.companies[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeMockDB(dbData);
      return { success: true };
    } else {
      const docRef = doc(db, "companies", id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      });
      return { success: true };
    }
  } catch (error: any) {
    console.error("updateCompany error:", error);
    return { success: false, error: error.message || "企業情報の更新に失敗しました" };
  }
}

// 5. Delete Company
export async function deleteCompany(adminUid: string, id: string) {
  try {
    const isAdmin = await verifyAdminRole(adminUid);
    if (!isAdmin) {
      throw new Error("権限がありません。管理者のみ実行可能です。");
    }

    if (isMock) {
      const dbData = readMockDB();
      dbData.companies = dbData.companies.filter((c) => c.id !== id);
      writeMockDB(dbData);
      return { success: true };
    } else {
      const docRef = doc(db, "companies", id);
      await deleteDoc(docRef);
      return { success: true };
    }
  } catch (error: any) {
    console.error("deleteCompany error:", error);
    return { success: false, error: error.message || "企業削除に失敗しました" };
  }
}

// 6. Resend Invitation
export async function resendInvitation(adminUid: string, companyId: string) {
  try {
    const isAdmin = await verifyAdminRole(adminUid);
    if (!isAdmin) {
      throw new Error("権限がありません。管理者のみ実行可能です。");
    }

    let companyName = "";
    let email = "";
    let contactName = "";

    if (isMock) {
      const dbData = readMockDB();
      const company = dbData.companies.find((c: any) => c.id === companyId);
      if (!company) throw new Error("対象の企業が見つかりません");
      companyName = company.name;
      email = company.contactEmail;
      contactName = company.contactName;
    } else {
      const docRef = doc(db, "companies", companyId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("対象の企業が見つかりません");
      const company = docSnap.data();
      companyName = company.name;
      email = company.contactEmail;
      contactName = company.contactName;
    }

    // Generate secure token for invitation
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours validity

    const inviteData = {
      token,
      companyName,
      email,
      contactName,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    if (isMock) {
      const dbData = readMockDB();
      dbData.invitations = dbData.invitations || [];
      // Clean up previous pending invitations for this email to avoid duplicates
      dbData.invitations = dbData.invitations.filter((i: any) => !(i.email === email && i.status === "pending"));
      dbData.invitations.push({ id: "invite-" + Math.random().toString(36).substring(2, 9), ...inviteData });
      writeMockDB(dbData);
    } else {
      await addDoc(collection(db, "invitations"), inviteData);
    }

    // Construct registration URL
    let origin = "http://localhost:3000";
    try {
      const { headers } = require("next/headers");
      const headersList = await headers();
      const host = headersList.get("host") || "localhost:3000";
      const proto = headersList.get("x-forwarded-proto") || "http";
      origin = `${proto}://${host}`;
    } catch (e) {
      console.warn("Could not retrieve origin headers, using default:", e);
    }
    const registerUrl = `${origin}/register?token=${token}`;

    // Send invitation email
    const subject = "【MA WORK JP】アカウント本登録のご案内（再送）";
    const message = `${contactName} 様

いつもお世話になっております。
MA WORK JP 運営事務局です。

新規契約企業用のアカウント登録URLを再送いたします。
下記のリンクよりパスワードを設定し、本登録（アカウントの有効化）を完了させてください。

■ 本登録用URL:
${registerUrl}

※ 本登録用URLの有効期限は発行から24時間となっております。
※ ログイン用IDは、ご登録 of メールアドレス（${email}）となります。

何卒よろしくお願い申し上げます。`;

    let emailStatus = "sent";
    try {
      const mailRes = await sendExpertEmail("admin-system", contactName, email, subject, message, "manual_email", "MA WORK JP 運営");
      if (!mailRes.success) {
        emailStatus = "failed";
      }
    } catch (mailError) {
      console.warn("Invitation email failed to send: ", mailError);
      emailStatus = "failed";
    }

    return {
      success: true,
      inviteUrl: registerUrl,
      emailStatus,
    };
  } catch (error: any) {
    console.error("resendInvitation error:", error);
    return { success: false, error: error.message || "招待状の再送に失敗しました" };
  }
}

// 7. Update Company Status (Suspend / Resume Login)
export async function updateCompanyStatus(adminUid: string, companyId: string, status: "active" | "suspended" | "invited") {
  try {
    const isAdmin = await verifyAdminRole(adminUid);
    if (!isAdmin) {
      throw new Error("権限がありません。管理者のみ実行可能です。");
    }

    if (isMock) {
      const dbData = readMockDB();
      const index = dbData.companies.findIndex((c: any) => c.id === companyId);
      if (index === -1) throw new Error("対象の企業が見つかりません");
      
      dbData.companies[index].status = status;
      dbData.companies[index].updatedAt = new Date().toISOString();
      writeMockDB(dbData);
      return { success: true };
    } else {
      const docRef = doc(db, "companies", companyId);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date(),
      });
      return { success: true };
    }
  } catch (error: any) {
    console.error("updateCompanyStatus error:", error);
    return { success: false, error: error.message || "ステータス更新に失敗しました" };
  }
}

// 8. Update Company Settings (Plan & Active Options)
export async function updateCompanySettings(
  adminUid: string,
  companyId: string,
  planType: "entry" | "basic" | "standard" | "advance" | "pro" | "premium",
  activeOptions: string[]
) {
  try {
    const isAdmin = await verifyAdminRole(adminUid);
    if (!isAdmin) {
      throw new Error("権限がありません。管理者のみ実行可能です。");
    }

    if (isMock) {
      const dbData = readMockDB();
      const index = dbData.companies.findIndex((c: any) => c.id === companyId);
      if (index === -1) throw new Error("対象の企業が見つかりません");
      
      dbData.companies[index].plan_type = planType;
      dbData.companies[index].active_options = activeOptions;
      
      // Update plan field for legacy backwards compatibility
      if (["premium", "standard"].includes(planType)) {
        dbData.companies[index].plan = planType;
      } else {
        dbData.companies[index].plan = "light";
      }

      dbData.companies[index].updatedAt = new Date().toISOString();
      writeMockDB(dbData);
      return { success: true };
    } else {
      const docRef = doc(db, "companies", companyId);
      const planCompat = ["premium", "standard"].includes(planType) ? planType : "light";
      await updateDoc(docRef, {
        plan_type: planType,
        active_options: activeOptions,
        plan: planCompat,
        updatedAt: new Date(),
      });
      return { success: true };
    }
  } catch (error: any) {
    console.error("updateCompanySettings error:", error);
    return { success: false, error: error.message || "プラン・オプションの更新に失敗しました" };
  }
}

// 9. Upload Contract PDF (Admin only)
export async function uploadContractPdf(
  adminUid: string,
  companyId: string,
  base64Data: string,
  fileName: string
) {
  try {
    const isAdmin = await verifyAdminRole(adminUid);
    if (!isAdmin) {
      throw new Error("権限がありません。管理者のみ実行可能です。");
    }

    if (!base64Data) {
      throw new Error("ファイルデータがありません。");
    }

    const fs = require("fs");
    const path = require("path");

    // base64 format is "data:application/pdf;base64,xxxx" or just "xxxx"
    let cleanBase64 = base64Data;
    if (base64Data.includes("base64,")) {
      cleanBase64 = base64Data.split("base64,")[1];
    }

    const buffer = Buffer.from(cleanBase64, "base64");
    
    // Ensure public/contracts folder exists
    const dir = path.join(process.cwd(), "public", "contracts");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save to public/contracts/contract-[companyId].pdf
    const relativePath = `/contracts/contract-${companyId}.pdf`;
    const absolutePath = path.join(dir, `contract-${companyId}.pdf`);
    
    fs.writeFileSync(absolutePath, buffer);

    // Update company in DB
    if (isMock) {
      const dbData = readMockDB();
      const index = dbData.companies.findIndex((c: any) => c.id === companyId);
      if (index === -1) throw new Error("対象の企業が見つかりません");
      dbData.companies[index].contractPdfUrl = relativePath;
      dbData.companies[index].updatedAt = new Date().toISOString();
      writeMockDB(dbData);
    } else {
      const docRef = doc(db, "companies", companyId);
      await updateDoc(docRef, {
        contractPdfUrl: relativePath,
        updatedAt: new Date(),
      });
    }

    return {
      success: true,
      pdfUrl: relativePath,
    };
  } catch (error: any) {
    console.error("uploadContractPdf error:", error);
    return { success: false, error: error.message || "契約書のアップロードに失敗しました" };
  }
}
