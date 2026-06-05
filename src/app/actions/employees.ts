"use server";

import { z } from "zod";
import { firebaseConfig } from "@/lib/firebase/config";
import { readMockDB, writeMockDB } from "@/lib/mock-db";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

const isMock = firebaseConfig.apiKey === "mock-api-key";

const EmployeeSchema = z.object({
  companyId: z.string().min(1, "所属企業は必須項目です"),
  name: z.string().min(1, "氏名は必須項目です"),
  nationality: z.string().min(1, "国籍は必須項目です"),
  birthDate: z.string().min(1, "生年月日は必須項目です"),
  gender: z.string().min(1, "性別は必須項目です"),
  address: z.string().min(1, "住所は必須項目です"),
  phone: z.string().min(1, "電話番号は必須項目です"),
  email: z.string().email("有効なメールアドレスを入力してください").or(z.literal("")),
  statusOfResidence: z.string().min(1, "在留資格は必須項目です"),
  cardNumber: z.string().min(1, "在留カード番号は必須項目です"),
  expirationDate: z.string().min(1, "満了日は必須項目です"),
  passportNumber: z.string().min(1, "パスポート番号は必須項目です"),
  passportExpirationDate: z.string().min(1, "パスポート満了日は必須項目です"),
  contractPeriod: z.string().min(1, "雇用契約期間は必須項目です"),
  status: z.enum(["active", "expiring_soon", "expired", "resigned"]).default("active"),
  department: z.string().optional().nullable(),
  lineId: z.string().optional().nullable().or(z.literal("")),
  whatsappPhone: z.string().optional().nullable().or(z.literal("")),
});

export type EmployeeData = z.infer<typeof EmployeeSchema>;

// 1. Get Employees By Company ID
export async function getEmployeesByCompanyId(companyId: string) {
  try {
    if (!companyId) return { success: false, error: "企業IDが指定されていません", data: [] };

    if (isMock) {
      const dbData = readMockDB();
      const companyEmployees = (dbData.employees || []).filter(
        (emp) => emp.companyId === companyId
      );
      return { success: true, data: companyEmployees };
    } else {
      const q = query(collection(db, "employees"), where("companyId", "==", companyId));
      const querySnapshot = await getDocs(q);
      const employees = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });
      return { success: true, data: employees };
    }
  } catch (error: any) {
    console.error("getEmployeesByCompanyId error:", error);
    return { success: false, error: error.message || "従業員一覧の取得に失敗しました", data: [] };
  }
}

// 2. Create Employee
export async function createEmployee(data: EmployeeData) {
  try {
    const validated = EmployeeSchema.parse(data);

    if (isMock) {
      const dbData = readMockDB();
      const newEmployee = {
        id: "emp-" + Math.random().toString(36).substring(2, 9),
        ...validated,
        photoUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dbData.employees.unshift(newEmployee);
      writeMockDB(dbData);
      return { success: true, id: newEmployee.id };
    } else {
      // Real Firestore operation
      const docRef = await addDoc(collection(db, "employees"), {
        ...validated,
        photoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { success: true, id: docRef.id };
    }
  } catch (error: any) {
    console.error("createEmployee error:", error);
    return { success: false, error: error.message || "従業員登録に失敗しました" };
  }
}

// 3. Update Employee
export async function updateEmployee(id: string, data: Partial<EmployeeData>) {
  try {
    if (isMock) {
      const dbData = readMockDB();
      const index = dbData.employees.findIndex((e) => e.id === id);
      if (index === -1) throw new Error("対象の従業員が見つかりません");

      dbData.employees[index] = {
        ...dbData.employees[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeMockDB(dbData);
      return { success: true };
    } else {
      const docRef = doc(db, "employees", id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      });
      return { success: true };
    }
  } catch (error: any) {
    console.error("updateEmployee error:", error);
    return { success: false, error: error.message || "従業員情報の更新に失敗しました" };
  }
}

// 4. Delete Employee
export async function deleteEmployee(id: string) {
  try {
    if (isMock) {
      const dbData = readMockDB();
      dbData.employees = dbData.employees.filter((e) => e.id !== id);
      writeMockDB(dbData);
      return { success: true };
    } else {
      const docRef = doc(db, "employees", id);
      await deleteDoc(docRef);
      return { success: true };
    }
  } catch (error: any) {
    console.error("deleteEmployee error:", error);
    return { success: false, error: error.message || "従業員削除に失敗しました" };
  }
}
