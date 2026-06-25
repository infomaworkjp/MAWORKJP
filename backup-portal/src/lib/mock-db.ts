import fs from "fs";
import path from "path";

const MOCK_DB_PATH = path.join(process.cwd(), ".mock-db.json");

export interface MockDBData {
  companies: any[];
  employees: any[];
  legalProfessionals: any[];
  alerts: any[];
  users: any[];
  emailHistory: any[];
  trainingLogs?: any[];
  invitations?: any[];
  requests?: any[];
}

const DEFAULT_EXPERTS = [
  {
    id: "legal-pro-1",
    name: "行政書士 佐藤 護",
    officeName: "佐藤国際法務事務所",
    email: "sato@legal-office.com",
    phone: "03-8765-4321",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "legal-pro-2",
    name: "弁護士 田中 誠",
    officeName: "田中法律事務所",
    email: "tanaka@law-office.com",
    phone: "03-1111-2222",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "legal-pro-3",
    name: "社会保険労務士 鈴木 茂",
    officeName: "鈴木労務管理事務所",
    email: "suzuki@sr-office.com",
    phone: "03-3333-4444",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const DEFAULT_DATA: MockDBData = {
  users: [
    {
      uid: "mock-admin-uid",
      email: "admin@mawork.jp",
      displayName: "MA WORK JP 管理者",
      role: "admin",
      companyId: null,
      createdAt: new Date().toISOString(),
    },
    {
      uid: "mock-company-uid",
      email: "company@abc.com",
      displayName: "ABC商事 担当者",
      role: "company",
      companyId: "mock-company-id-abc",
      createdAt: new Date().toISOString(),
    }
  ],
  companies: [
    {
      id: "company-r5hajd5",
      name: "小畑組",
      address: "栃木県小山市",
      industry: "建設・土木",
      plan: "premium",
      plan_type: "premium",
      active_options: ["safety_education", "translation", "interpretation", "ai_audit", "expert_matching"],
      status: "active",
      contactName: "小畑",
      contactEmail: "service.ma07@gmail.com",
      contactPhone: "090-9854-6498",
      scrivenerName: "行政書士 佐藤 護",
      scrivenerEmail: "sato@legal-office.com",
      laborConsultantName: "社会保険労務士 鈴木 茂",
      laborConsultantEmail: "suzuki@sr-office.com",
      attorneyName: "弁護士 田中 誠",
      attorneyEmail: "tanaka@law-office.com",
      logoUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  employees: [],
  legalProfessionals: DEFAULT_EXPERTS,
  alerts: [],
  emailHistory: [],
  invitations: [],
  requests: [],
};

// Thread-safe read/write helper
export function readMockDB(): MockDBData {
  try {
    if (!fs.existsSync(MOCK_DB_PATH)) {
      writeMockDB(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    const raw = fs.readFileSync(MOCK_DB_PATH, "utf-8");
    const data = JSON.parse(raw);
    
    // Auto-migrate missing structures
    let updated = false;
    if (!data.emailHistory) {
      data.emailHistory = [];
      updated = true;
    }
    if (!data.legalProfessionals || data.legalProfessionals.length === 0) {
      data.legalProfessionals = DEFAULT_EXPERTS;
      updated = true;
    }
    if (!data.employees) {
      data.employees = [];
      updated = true;
    }
    if (!data.trainingLogs) {
      data.trainingLogs = [];
      updated = true;
    }
    if (!data.invitations) {
      data.invitations = [];
      updated = true;
    }
    if (!data.requests) {
      data.requests = [];
      updated = true;
    }

    // Company schema migration
    if (data.companies && Array.isArray(data.companies)) {
      for (const comp of data.companies) {
        if (comp.plan_type === undefined) {
          if (comp.plan === "premium") comp.plan_type = "premium";
          else if (comp.plan === "standard") comp.plan_type = "standard";
          else comp.plan_type = "basic";
          updated = true;
        }
        if (comp.active_options === undefined) {
          if (comp.plan_type === "premium") {
            comp.active_options = ["safety_education", "translation", "interpretation", "ai_audit", "expert_matching"];
          } else if (comp.plan_type === "pro") {
            comp.active_options = ["safety_education", "translation", "interpretation", "expert_matching"];
          } else {
            comp.active_options = [];
          }
          updated = true;
        }
        if (comp.status === undefined) {
          comp.status = "active";
          updated = true;
        }
        if (comp.contractPdfUrl === undefined) {
          comp.contractPdfUrl = null;
          updated = true;
        }
        if (comp.contractExpirationDate === undefined) {
          comp.contractExpirationDate = null;
          updated = true;
        }
        if (comp.usage_line === undefined) {
          comp.usage_line = 0;
          updated = true;
        }
        if (comp.usage_interpretation === undefined) {
          comp.usage_interpretation = 0;
          updated = true;
        }
        if (comp.usage_translation === undefined) {
          comp.usage_translation = 0;
          updated = true;
        }
      }
    }
    
    // Update company-r5hajd5 in case it doesn't have the details
    const obata = data.companies?.find((c: any) => c.id === "company-r5hajd5");
    if (obata && (!obata.scrivenerName || obata.plan !== "premium" || !obata.plan_type || !obata.contractExpirationDate)) {
      obata.scrivenerName = "行政書士 佐藤 護";
      obata.scrivenerEmail = "sato@legal-office.com";
      obata.laborConsultantName = "社会保険労務士 鈴木 茂";
      obata.laborConsultantEmail = "suzuki@sr-office.com";
      obata.attorneyName = "弁護士 田中 誠";
      obata.attorneyEmail = "tanaka@law-office.com";
      obata.plan = "premium";
      obata.plan_type = "premium";
      obata.active_options = ["safety_education", "translation", "interpretation", "ai_audit", "expert_matching"];
      obata.status = "active";
      obata.industry = "建設・土木";
      obata.contractExpirationDate = "2026-06-18"; // 15 days from local time 2026-06-03
      obata.contractPdfUrl = obata.contractPdfUrl || null;
      updated = true;
    } else if (!obata && data.companies) {
      data.companies.push(DEFAULT_DATA.companies[0]);
      updated = true;
    }

    if (updated) {
      writeMockDB(data);
    }
    return data as MockDBData;
  } catch (error) {
    console.error("Mock DB Read Error:", error);
    return DEFAULT_DATA;
  }
}

export function writeMockDB(data: MockDBData): void {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Mock DB Write Error:", error);
  }
}

