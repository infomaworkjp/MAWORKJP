"use server";

import { firebaseConfig } from "@/lib/firebase/config";
import { readMockDB, writeMockDB } from "@/lib/mock-db";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

const isMock = firebaseConfig.apiKey === "mock-api-key";

export interface TrainingLogItem {
  id: string;
  employeeId: string;
  companyId: string;
  videoId: string;
  videoTitle: string;
  completedAt: string;
}

// 1. Save Training Log (Prevent Duplicates)
export async function saveTrainingLog(
  employeeId: string,
  companyId: string,
  videoId: string,
  videoTitle: string
) {
  try {
    if (!employeeId || !companyId || !videoId || !videoTitle) {
      throw new Error("必須項目が不足しています");
    }

    const logItem: Omit<TrainingLogItem, "id"> = {
      employeeId,
      companyId,
      videoId,
      videoTitle,
      completedAt: new Date().toISOString(),
    };

    if (isMock) {
      const dbData = readMockDB();
      dbData.trainingLogs = dbData.trainingLogs || [];
      
      // Check duplicate
      const exists = dbData.trainingLogs.some(
        (log) => log.employeeId === employeeId && log.videoId === videoId
      );
      if (exists) {
        return { success: true, id: "duplicate", msg: "既に受講完了しています" };
      }

      const newLog = {
        id: "log-" + Math.random().toString(36).substring(2, 9),
        ...logItem,
      };
      dbData.trainingLogs.unshift(newLog);
      writeMockDB(dbData);
      return { success: true, id: newLog.id };
    } else {
      // Real Firestore operation
      // Check duplicate
      const q = query(
        collection(db, "trainingLogs"),
        where("employeeId", "==", employeeId),
        where("videoId", "==", videoId)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return { success: true, id: "duplicate", msg: "既に受講完了しています" };
      }

      const docRef = await addDoc(collection(db, "trainingLogs"), {
        ...logItem,
        completedAt: new Date(),
      });
      return { success: true, id: docRef.id };
    }
  } catch (error: any) {
    console.error("saveTrainingLog error:", error);
    return { success: false, error: error.message || "受講記録の保存に失敗しました" };
  }
}

// 2. Get Training Logs By Company ID
export async function getTrainingLogsByCompanyId(companyId: string) {
  try {
    if (!companyId) return { success: false, error: "企業IDが指定されていません", data: [] };

    if (isMock) {
      const dbData = readMockDB();
      const logs = (dbData.trainingLogs || []).filter(
        (log) => log.companyId === companyId
      );
      return { success: true, data: logs };
    } else {
      const q = query(collection(db, "trainingLogs"), where("companyId", "==", companyId));
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          completedAt: data.completedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });
      return { success: true, data: logs };
    }
  } catch (error: any) {
    console.error("getTrainingLogsByCompanyId error:", error);
    return { success: false, error: error.message || "受講記録の取得に失敗しました", data: [] };
  }
}
