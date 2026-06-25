"use server";

import crypto from "crypto";
import { firebaseConfig } from "@/lib/firebase/config";
import { readMockDB, writeMockDB } from "@/lib/mock-db";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, getDocs, query, where, updateDoc, doc, setDoc } from "firebase/firestore";
import { sendExpertEmail } from "./emails";

const isMock = firebaseConfig.apiKey === "mock-api-key";

export interface Invitation {
  id?: string;
  token: string;
  companyName: string;
  email: string;
  contactName: string;
  status: "pending" | "completed";
  createdAt: string;
  expiresAt: string;
}

// Password hashing function using standard SHA-256
export async function hashPassword(password: string): Promise<string> {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// 1. Create Invitation
export async function createInvitation(companyName: string, email: string, contactName: string) {
  try {
    if (!companyName || !email || !contactName) {
      throw new Error("必須項目が不足しています");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours validity

    const inviteData: Omit<Invitation, "id"> = {
      token,
      companyName,
      email,
      contactName,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    let inviteId = "";

    if (isMock) {
      const dbData = readMockDB();
      // Ensure invitations table exists
      (dbData as any).invitations = (dbData as any).invitations || [];
      
      // Check if email already has pending invite
      const existingPending = (dbData as any).invitations.find(
        (inv: any) => inv.email === email && inv.status === "pending"
      );
      if (existingPending) {
        throw new Error("このメールアドレスには既に未完了の招待状が存在します。");
      }

      inviteId = "invite-" + Math.random().toString(36).substring(2, 9);
      (dbData as any).invitations.push({ id: inviteId, ...inviteData });
      writeMockDB(dbData);
    } else {
      // Check existing pending in Firestore
      const q = query(
        collection(db, "invitations"),
        where("email", "==", email),
        where("status", "==", "pending")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error("このメールアドレスには既に未完了の招待状が存在します。");
      }

      const docRef = await addDoc(collection(db, "invitations"), inviteData);
      inviteId = docRef.id;
    }

    // Try to send email (simulate or Resend)
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
    const subject = "【MA WORK JP】アカウント本登録のご案内";
    const message = `${contactName} 様

いつもお世話になっております。
MA WORK JP 運営事務局です。

新規契約企業用のアカウントを発行いたしました。
下記のリンクよりパスワードを設定し、本登録（アカウントの有効化）を完了させてください。

■ 本登録用URL:
${registerUrl}

※ 本登録用URLの有効期限は発行から24時間となっております。
※ ログイン用IDは、ご登録のメールアドレス（${email}）となります。

何かご不明な点がございましたら、お気軽にお問い合わせください。
何卒よろしくお願い申し上げます。`;

    // Attempt email sending
    let emailStatus = "sent";
    try {
      // Create a temporary dummy company id for invitation email history tracking
      const mailRes = await sendExpertEmail("admin-system", contactName, email, subject, message, "manual_email", "MA WORK JP 運営");
      if (!mailRes.success) {
        emailStatus = "failed";
      }
    } catch (mailError) {
      console.warn("Mail dispatch failed, continuing with fallback URL: ", mailError);
      emailStatus = "failed";
    }

    return {
      success: true,
      inviteId,
      inviteUrl: registerUrl,
      emailStatus,
    };
  } catch (error: any) {
    console.error("createInvitation error:", error);
    return { success: false, error: error.message || "招待の発行に失敗しました" };
  }
}

// 2. Validate Invitation Token
export async function validateInvitationToken(token: string) {
  try {
    if (!token) {
      throw new Error("トークンが提供されていません");
    }

    let invitation: Invitation | null = null;

    if (isMock) {
      const dbData = readMockDB();
      const invites = (dbData as any).invitations || [];
      const found = invites.find((inv: any) => inv.token === token);
      if (found) {
        invitation = found;
      }
    } else {
      const q = query(collection(db, "invitations"), where("token", "==", token));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        invitation = { id: d.id, ...d.data() } as Invitation;
      }
    }

    if (!invitation) {
      throw new Error("無効な招待トークンです。");
    }

    if (invitation.status === "completed") {
      throw new Error("この招待は既に本登録が完了しています。");
    }

    const isExpired = new Date(invitation.expiresAt) < new Date();
    if (isExpired) {
      throw new Error("招待リンクの有効期限（24時間）が切れています。");
    }

    return {
      success: true,
      invitation: {
        companyName: invitation.companyName,
        email: invitation.email,
        contactName: invitation.contactName,
      },
    };
  } catch (error: any) {
    console.error("validateInvitationToken error:", error);
    return { success: false, error: error.message || "トークンの検証に失敗しました" };
  }
}

// 3. Complete Registration
export async function completeRegistration(token: string, passwordSecret: string) {
  try {
    if (!token || !passwordSecret) {
      throw new Error("必須項目が不足しています");
    }

    let invitation: Invitation | null = null;
    let inviteDocIdOrIndex: any = null;

    if (isMock) {
      const dbData = readMockDB();
      const invites = (dbData as any).invitations || [];
      const index = invites.findIndex((inv: any) => inv.token === token);
      if (index !== -1) {
        invitation = invites[index];
        inviteDocIdOrIndex = index;
      }
    } else {
      const q = query(collection(db, "invitations"), where("token", "==", token));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        invitation = { id: d.id, ...d.data() } as Invitation;
        inviteDocIdOrIndex = d.id;
      }
    }

    if (!invitation) {
      throw new Error("招待トークンが見つかりません。");
    }

    if (invitation.status === "completed") {
      throw new Error("この招待は既に本登録が完了しています。");
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      throw new Error("招待リンクの有効期限が切れています。");
    }

    let companyId = "";
    const userId = "user-" + Math.random().toString(36).substring(2, 9);
    const hashedPassword = await hashPassword(passwordSecret);

    // Save company and user to database
    if (isMock) {
      const dbData = readMockDB();
      
      // Find existing company registered with invitation's email
      const existingCompany = dbData.companies.find((c: any) => c.contactEmail === invitation!.email);
      if (existingCompany) {
        companyId = existingCompany.id;
        existingCompany.status = "active";
        existingCompany.updatedAt = new Date().toISOString();
      } else {
        // Fallback in case company wasn't pre-created
        companyId = "company-" + Math.random().toString(36).substring(2, 9);
        const newCompany = {
          id: companyId,
          name: invitation!.companyName,
          address: "栃木県小山市",
          industry: "建設・土木",
          plan: "light",
          plan_type: "basic",
          active_options: [],
          status: "active",
          contactName: invitation!.contactName,
          contactEmail: invitation!.email,
          contactPhone: "未設定",
          scrivenerName: null,
          scrivenerEmail: null,
          laborConsultantName: null,
          laborConsultantEmail: null,
          attorneyName: null,
          attorneyEmail: null,
          logoUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        dbData.companies.push(newCompany);
      }

      // Create User Record
      const newUser = {
        uid: userId,
        email: invitation!.email,
        displayName: `${invitation!.contactName}（担当者）`,
        role: "company",
        companyId: companyId,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
      };
      dbData.users.push(newUser);

      // Complete invitation status
      dbData.invitations![inviteDocIdOrIndex].status = "completed";

      writeMockDB(dbData);
    } else {
      // Find existing company in Firestore
      const qCompany = query(collection(db, "companies"), where("contactEmail", "==", invitation.email));
      const companySnap = await getDocs(qCompany);
      
      if (!companySnap.empty) {
        companyId = companySnap.docs[0].id;
        const compRef = doc(db, "companies", companyId);
        await updateDoc(compRef, {
          status: "active",
          updatedAt: new Date(),
        });
      } else {
        // Fallback in case company wasn't pre-created
        companyId = "company-" + Math.random().toString(36).substring(2, 9);
        await setDoc(doc(db, "companies", companyId), {
          name: invitation.companyName,
          address: "栃木県小山市",
          industry: "建設・土木",
          plan: "light",
          plan_type: "basic",
          active_options: [],
          status: "active",
          contactName: invitation.contactName,
          contactEmail: invitation.email,
          contactPhone: "未設定",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Create User Profile Document in Firestore
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, {
        email: invitation.email,
        displayName: `${invitation.contactName}（担当者）`,
        role: "company",
        companyId: companyId,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
      });

      // Update Invitation Status in Firestore
      const inviteDocRef = doc(db, "invitations", inviteDocIdOrIndex);
      await updateDoc(inviteDocRef, { status: "completed" });
    }

    return {
      success: true,
      email: invitation.email,
    };
  } catch (error: any) {
    console.error("completeRegistration error:", error);
    return { success: false, error: error.message || "登録処理に失敗しました" };
  }
}

// 4. Self-registration for companies
export async function selfRegisterCompany(data: {
  name: string;
  address: string;
  industry: string;
  plan_type: "entry" | "basic" | "standard" | "advance" | "pro" | "premium";
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  passwordSecret: string;
}) {
  try {
    if (!data.name || !data.address || !data.industry || !data.plan_type || !data.contactName || !data.contactEmail || !data.contactPhone || !data.passwordSecret) {
      throw new Error("必須項目が不足しています");
    }

    const hashedPassword = await hashPassword(data.passwordSecret);
    const companyId = "company-" + Math.random().toString(36).substring(2, 9);
    const userId = "user-" + Math.random().toString(36).substring(2, 9);

    if (isMock) {
      const dbData = readMockDB();

      // Check if email already registered
      const existingUser = dbData.users?.find((u: any) => u.email === data.contactEmail);
      if (existingUser) {
        throw new Error("このメールアドレスは既に登録されています。");
      }

      // Create company record
      const newCompany = {
        id: companyId,
        name: data.name,
        address: data.address,
        industry: data.industry,
        plan: ["premium", "standard"].includes(data.plan_type) ? data.plan_type : "light",
        plan_type: data.plan_type,
        active_options: [],
        status: "active",
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        scrivenerName: null,
        scrivenerEmail: null,
        laborConsultantName: null,
        laborConsultantEmail: null,
        attorneyName: null,
        attorneyEmail: null,
        logoUrl: null,
        usage_line: 0,
        usage_interpretation: 0,
        usage_translation: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dbData.companies.unshift(newCompany);

      // Create User Record
      const newUser = {
        uid: userId,
        email: data.contactEmail,
        displayName: `${data.contactName}（担当者）`,
        role: "company",
        companyId: companyId,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
      };
      dbData.users.push(newUser);

      writeMockDB(dbData);
    } else {
      // Check existing in Firestore
      const qUser = query(collection(db, "users"), where("email", "==", data.contactEmail));
      const userSnap = await getDocs(qUser);
      if (!userSnap.empty) {
        throw new Error("このメールアドレスは既に登録されています。");
      }

      // Create company document
      const planCompat = ["premium", "standard"].includes(data.plan_type) ? data.plan_type : "light";
      await setDoc(doc(db, "companies", companyId), {
        name: data.name,
        address: data.address,
        industry: data.industry,
        plan: planCompat,
        plan_type: data.plan_type,
        active_options: [],
        status: "active",
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        scrivenerName: null,
        scrivenerEmail: null,
        laborConsultantName: null,
        laborConsultantEmail: null,
        attorneyName: null,
        attorneyEmail: null,
        logoUrl: null,
        usage_line: 0,
        usage_interpretation: 0,
        usage_translation: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create user document
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, {
        email: data.contactEmail,
        displayName: `${data.contactName}（担当者）`,
        role: "company",
        companyId: companyId,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      email: data.contactEmail,
    };
  } catch (error: any) {
    console.error("selfRegisterCompany error:", error);
    return { success: false, error: error.message || "企業自己登録に失敗しました" };
  }
}

