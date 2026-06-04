"use server";

import { firebaseConfig } from "@/lib/firebase/config";
import { readMockDB } from "@/lib/mock-db";
import { db } from "@/lib/firebase/client";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const isMock = firebaseConfig.apiKey === "mock-api-key";

export async function getLegalProfessionals() {
  try {
    if (isMock) {
      const dbData = readMockDB();
      return { success: true, data: dbData.legalProfessionals || [] };
    } else {
      const querySnapshot = await getDocs(collection(db, "legalProfessionals"));
      const pros = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });
      return { success: true, data: pros };
    }
  } catch (error: any) {
    console.error("getLegalProfessionals error:", error);
    return { success: false, error: error.message || "士業一覧の取得に失敗しました", data: [] };
  }
}

export async function getLegalProfessionalById(id: string) {
  try {
    if (!id) return { success: false, error: "IDが指定されていません" };
    
    if (isMock) {
      const dbData = readMockDB();
      const pro = dbData.legalProfessionals.find((p) => p.id === id);
      if (!pro) throw new Error("対象の専門家が見つかりません");
      return { success: true, data: pro };
    } else {
      const docRef = doc(db, "legalProfessionals", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("対象の専門家が見つかりません");
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
    console.error("getLegalProfessionalById error:", error);
    return { success: false, error: error.message || "専門家情報の取得に失敗しました" };
  }
}
