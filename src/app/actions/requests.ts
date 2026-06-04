"use server";

import { firebaseConfig } from "@/lib/firebase/config";
import { readMockDB, writeMockDB } from "@/lib/mock-db";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, doc, getDoc, updateDoc, setDoc, query, where, getDocs, orderBy } from "firebase/firestore";

const isMock = firebaseConfig.apiKey === "mock-api-key";

// 1. Submit Option Request
export async function submitOptionRequest(companyId: string, optionKey: string, consent: boolean) {
  try {
    if (!companyId || !optionKey || !consent) {
      throw new Error("必須項目が不足しているか、同意が得られていません");
    }

    const requestLog = {
      id: "req-" + Math.random().toString(36).substring(2, 9),
      companyId,
      type: "option",
      item: optionKey,
      status: "completed",
      createdAt: new Date().toISOString(),
    };

    if (isMock) {
      const dbData = readMockDB();
      const compIdx = dbData.companies.findIndex((c) => c.id === companyId);
      if (compIdx === -1) throw new Error("企業が見つかりません");

      const comp = dbData.companies[compIdx];
      comp.active_options = comp.active_options || [];
      if (!comp.active_options.includes(optionKey)) {
        comp.active_options.push(optionKey);
      }
      comp.updatedAt = new Date().toISOString();

      dbData.requests = dbData.requests || [];
      dbData.requests.push(requestLog);
      writeMockDB(dbData);
    } else {
      const compRef = doc(db, "companies", companyId);
      const compSnap = await getDoc(compRef);
      if (!compSnap.exists()) throw new Error("企業が見つかりません");

      const currentOptions = compSnap.data().active_options || [];
      if (!currentOptions.includes(optionKey)) {
        currentOptions.push(optionKey);
      }

      await updateDoc(compRef, {
        active_options: currentOptions,
        updatedAt: new Date(),
      });

      await addDoc(collection(db, "requests"), {
        ...requestLog,
        createdAt: new Date(),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("submitOptionRequest error:", error);
    return { success: false, error: error.message || "オプションの追加申請に失敗しました" };
  }
}

// 2. Submit Translation Request
export async function submitTranslationRequest(
  companyId: string,
  data: {
    text: string;
    pages: number;
    targetLanguage: string;
    scheduledDate: string;
    basePrice: number;
    surcharge: number;
    totalPrice: number;
  }
) {
  try {
    if (!companyId || !data.scheduledDate || data.pages <= 0) {
      throw new Error("必須項目が不足しています");
    }

    const requestLog = {
      id: "req-" + Math.random().toString(36).substring(2, 9),
      companyId,
      type: "translation",
      details: `翻訳依頼: ${data.targetLanguage} (A4 ${data.pages}枚)`,
      pages: data.pages,
      scheduledDate: data.scheduledDate,
      basePrice: data.basePrice,
      surcharge: data.surcharge,
      totalPrice: data.totalPrice,
      status: "completed",
      createdAt: new Date().toISOString(),
    };

    if (isMock) {
      const dbData = readMockDB();
      const compIdx = dbData.companies.findIndex((c) => c.id === companyId);
      if (compIdx === -1) throw new Error("企業が見つかりません");

      const comp = dbData.companies[compIdx];
      comp.usage_translation = (comp.usage_translation || 0) + 1;
      comp.updatedAt = new Date().toISOString();

      dbData.requests = dbData.requests || [];
      dbData.requests.push(requestLog);
      writeMockDB(dbData);
    } else {
      const compRef = doc(db, "companies", companyId);
      const compSnap = await getDoc(compRef);
      if (!compSnap.exists()) throw new Error("企業が見つかりません");

      const currentUsage = compSnap.data().usage_translation || 0;
      await updateDoc(compRef, {
        usage_translation: currentUsage + 1,
        updatedAt: new Date(),
      });

      await addDoc(collection(db, "requests"), {
        ...requestLog,
        createdAt: new Date(),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("submitTranslationRequest error:", error);
    return { success: false, error: error.message || "翻訳依頼の申請に失敗しました" };
  }
}

// 3. Submit Interpretation Request
export async function submitInterpretationRequest(
  companyId: string,
  data: {
    scheduledDate: string;
    hours: number;
    description: string;
    basePrice: number;
    surcharge: number;
    totalPrice: number;
  }
) {
  try {
    if (!companyId || !data.scheduledDate || data.hours <= 0) {
      throw new Error("必須項目が不足しています");
    }

    const requestLog = {
      id: "req-" + Math.random().toString(36).substring(2, 9),
      companyId,
      type: "interpretation",
      details: `通訳対応: ${data.description} (${data.hours}時間)`,
      hours: data.hours,
      scheduledDate: data.scheduledDate,
      basePrice: data.basePrice,
      surcharge: data.surcharge,
      totalPrice: data.totalPrice,
      status: "completed",
      createdAt: new Date().toISOString(),
    };

    if (isMock) {
      const dbData = readMockDB();
      const compIdx = dbData.companies.findIndex((c) => c.id === companyId);
      if (compIdx === -1) throw new Error("企業が見つかりません");

      const comp = dbData.companies[compIdx];
      comp.usage_interpretation = (comp.usage_interpretation || 0) + 1;
      comp.updatedAt = new Date().toISOString();

      dbData.requests = dbData.requests || [];
      dbData.requests.push(requestLog);
      writeMockDB(dbData);
    } else {
      const compRef = doc(db, "companies", companyId);
      const compSnap = await getDoc(compRef);
      if (!compSnap.exists()) throw new Error("企業が見つかりません");

      const currentUsage = compSnap.data().usage_interpretation || 0;
      await updateDoc(compRef, {
        usage_interpretation: currentUsage + 1,
        updatedAt: new Date(),
      });

      await addDoc(collection(db, "requests"), {
        ...requestLog,
        createdAt: new Date(),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("submitInterpretationRequest error:", error);
    return { success: false, error: error.message || "通訳対応の申請に失敗しました" };
  }
}

// 4. Submit Upgrade Request
export async function submitUpgradeRequest(companyId: string, targetPlan: string) {
  try {
    if (!companyId || !targetPlan) {
      throw new Error("必須項目が不足しています");
    }

    const requestLog = {
      id: "req-" + Math.random().toString(36).substring(2, 9),
      companyId,
      type: "upgrade",
      details: `プランアップグレード申請: ${targetPlan}`,
      status: "completed",
      createdAt: new Date().toISOString(),
    };

    if (isMock) {
      const dbData = readMockDB();
      const compIdx = dbData.companies.findIndex((c) => c.id === companyId);
      if (compIdx === -1) throw new Error("企業が見つかりません");

      const comp = dbData.companies[compIdx];
      comp.plan_type = targetPlan;
      comp.plan = ["premium", "standard"].includes(targetPlan) ? targetPlan : "light";
      comp.updatedAt = new Date().toISOString();

      dbData.requests = dbData.requests || [];
      dbData.requests.push(requestLog);
      writeMockDB(dbData);
    } else {
      const compRef = doc(db, "companies", companyId);
      const compSnap = await getDoc(compRef);
      if (!compSnap.exists()) throw new Error("企業が見つかりません");

      const planCompat = ["premium", "standard"].includes(targetPlan) ? targetPlan : "light";
      await updateDoc(compRef, {
        plan_type: targetPlan,
        plan: planCompat,
        updatedAt: new Date(),
      });

      await addDoc(collection(db, "requests"), {
        ...requestLog,
        createdAt: new Date(),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("submitUpgradeRequest error:", error);
    return { success: false, error: error.message || "アップグレード申請に失敗しました" };
  }
}

// 5. Get Requests by Company ID
export async function getRequestsByCompanyId(companyId: string) {
  try {
    if (isMock) {
      const dbData = readMockDB();
      const list = (dbData.requests || []).filter((r: any) => r.companyId === companyId);
      // Sort by date desc
      list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { success: true, data: list };
    } else {
      // In real Firestore, search the collection
      const q = query(
        collection(db, "requests"),
        where("companyId", "==", companyId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      return { success: true, data: list };
    }
  } catch (error: any) {
    console.error("getRequestsByCompanyId error:", error);
    return { success: false, error: error.message || "申請履歴の取得に失敗しました", data: [] };
  }
}

// 6. Increment LINE Consultation Usage
export async function incrementLineConsultationUsage(companyId: string) {
  try {
    if (!companyId) {
      throw new Error("企業IDが指定されていません");
    }

    if (isMock) {
      const dbData = readMockDB();
      const compIdx = dbData.companies.findIndex((c) => c.id === companyId);
      if (compIdx === -1) throw new Error("企業が見つかりません");

      const comp = dbData.companies[compIdx];
      comp.usage_line = (comp.usage_line || 0) + 1;
      comp.updatedAt = new Date().toISOString();
      writeMockDB(dbData);
    } else {
      const compRef = doc(db, "companies", companyId);
      const compSnap = await getDoc(compRef);
      if (!compSnap.exists()) throw new Error("企業が見つかりません");

      const currentUsage = compSnap.data().usage_line || 0;
      await updateDoc(compRef, {
        usage_line: currentUsage + 1,
        updatedAt: new Date(),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("incrementLineConsultationUsage error:", error);
    return { success: false, error: error.message || "相談カウントの更新に失敗しました" };
  }
}

