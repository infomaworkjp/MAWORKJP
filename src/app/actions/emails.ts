"use server";

import { firebaseConfig } from "@/lib/firebase/config";
import { readMockDB, writeMockDB } from "@/lib/mock-db";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { getLegalProfessionalById } from "./legal-pros";
import { Resend } from "resend";

const isMock = firebaseConfig.apiKey === "mock-api-key";

export interface EmailHistoryItem {
  id: string;
  companyId: string;
  expertId: string;
  expertName: string;
  expertEmail: string;
  senderName: string;
  subject: string;
  message: string;
  type: "manual_email" | "auto_apply";
  status: "sent" | "applied";
  sentAt: string;
}

export async function sendExpertEmail(
  companyId: string,
  recipientName: string,
  recipientEmail: string,
  subject: string,
  message: string,
  type: "manual_email" | "auto_apply" = "manual_email",
  senderName: string = "MA WORK JP システム"
) {
  try {
    if (!companyId || !recipientName || !recipientEmail || !subject || !message) {
      throw new Error("必須項目が不足しています");
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("環境変数 RESEND_API_KEY が設定されていません。プロジェクトルートの .env に設定してください。");
    }

    // 1. Initialize Resend
    const resend = new Resend(apiKey);

    // 2. Send actual email via Resend
    let sendResult = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: recipientEmail,
      subject: subject,
      text: message,
    });

    // 2.1 Handle sandbox/trial account restrictions (unverified domains can only send to registered address)
    if (sendResult.error && sendResult.error.message.includes("You can only send testing emails to your own email address")) {
      console.warn("Detected Resend sandbox restriction. Redirecting to registered email for testing...");
      
      let fallbackEmail = "andresymikiko1207@gmail.com";
      const match = sendResult.error.message.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        fallbackEmail = match[1];
      }

      const decoratedMessage = `【デモ環境の自動転送通知】\n※このメールは、Resend無料プランの制限（未検証ドメイン宛の送信制限）により、アカウント登録時のメールアドレス（${fallbackEmail}）宛に自動転送されました。\n\n元の宛先: ${recipientEmail}\n-------------------------------------------\n\n${message}`;

      sendResult = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: fallbackEmail,
        subject: `[デモ転送] ${subject}`,
        text: decoratedMessage,
      });
    }

    if (sendResult.error) {
      console.error("Resend API error detail:", sendResult.error);
      throw new Error(`メール送信サービスエラー: ${sendResult.error.message || "詳細不明"}`);
    }

    // 3. Write to history ONLY after successful delivery
    const emailItem: Omit<EmailHistoryItem, "id"> = {
      companyId,
      expertId: "direct_input",
      expertName: recipientName,
      expertEmail: recipientEmail,
      senderName,
      subject,
      message,
      type,
      status: type === "auto_apply" ? "applied" : "sent",
      sentAt: new Date().toISOString(),
    };

    if (isMock) {
      const dbData = readMockDB();
      const newHistory = {
        id: "email-" + Math.random().toString(36).substring(2, 9),
        ...emailItem,
      };
      dbData.emailHistory = dbData.emailHistory || [];
      dbData.emailHistory.unshift(newHistory);
      writeMockDB(dbData);
      
      return { success: true, id: newHistory.id };
    } else {
      // Real Firestore operation
      const docRef = await addDoc(collection(db, "emailHistory"), {
        ...emailItem,
        sentAt: new Date(), // Firestore Timestamp
      });

      return { success: true, id: docRef.id };
    }
  } catch (error: any) {
    console.error("sendExpertEmail error:", error);
    return { success: false, error: error.message || "メール送信に失敗しました" };
  }
}

export async function getEmailHistory(companyId: string) {
  try {
    if (!companyId) return { success: false, error: "企業IDが指定されていません", data: [] };

    if (isMock) {
      const dbData = readMockDB();
      const history = (dbData.emailHistory || [])
        .filter((item) => item.companyId === companyId)
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      return { success: true, data: history };
    } else {
      const q = query(
        collection(db, "emailHistory"),
        where("companyId", "==", companyId),
        orderBy("sentAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          sentAt: data.sentAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });
      return { success: true, data: history };
    }
  } catch (error: any) {
    console.error("getEmailHistory error:", error);
    return { success: false, error: error.message || "履歴の取得に失敗しました", data: [] };
  }
}
