"use server";

import { firebaseConfig } from "@/lib/firebase/config";
import { readMockDB } from "@/lib/mock-db";
import { db } from "@/lib/firebase/client";
import { collection, getDocs } from "firebase/firestore";

const isMock = firebaseConfig.apiKey === "mock-api-key";

export interface DashboardMetrics {
  totalCompanies: number;
  totalEmployees: number;
  renewalsIn3MonthsCount: number;
  alertsCount: number;
  upcomingRenewals: any[];
  alerts: any[];
  companies: any[];
  companyContractPdfUrl?: string | null;
  companyContractExpirationDate?: string | null;
  companyContractDaysLeft?: number | null;
  employeeContractRenewalsCount?: number;
}

export async function getDashboardMetrics(userRole: "admin" | "company", companyId: string | null): Promise<DashboardMetrics> {
  try {
    let companies: any[] = [];
    let employees: any[] = [];
    let alerts: any[] = [];

    if (isMock) {
      const dbData = readMockDB();
      companies = dbData.companies || [];
      employees = dbData.employees || [];
      alerts = dbData.alerts || [];
    } else {
      // Real Firestore operation
      const companiesSnap = await getDocs(collection(db, "companies"));
      companies = companiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const employeesSnap = await getDocs(collection(db, "employees"));
      employees = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const alertsSnap = await getDocs(collection(db, "alerts"));
      alerts = alertsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Role-based filtering:
    // If company user, filter only self-company info
    if (userRole === "company" && companyId) {
      companies = companies.filter(c => c.id === companyId);
      employees = employees.filter(e => e.companyId === companyId);
      alerts = alerts.filter(a => a.companyId === companyId);
    }

    // Calculate renewals in 3 months (90 days)
    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setDate(now.getDate() + 90);

    const upcomingRenewals = employees.filter(emp => {
      if (!emp.expirationDate) return false;
      const expDate = new Date(emp.expirationDate);
      return expDate >= now && expDate <= threeMonthsLater;
    });

    const renewalsIn3MonthsCount = upcomingRenewals.length;

    // Filter active alerts
    const activeAlerts = alerts.filter(alert => alert.status !== "dismissed");
    const alertsCount = activeAlerts.length;

    // Helper to parse employee contract end dates
    const parseContractEndDate = (period: string | null | undefined): Date | null => {
      if (!period) return null;
      const cleaned = period.trim();
      if (cleaned.includes("~")) {
        const parts = cleaned.split("~");
        const endDateStr = parts[parts.length - 1].trim();
        const d = new Date(endDateStr);
        return isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(cleaned.replace(/\//g, "-"));
      return isNaN(d.getTime()) ? null : d;
    };

    const employeeContractRenewalsCount = employees.filter(emp => {
      const endDate = parseContractEndDate(emp.contractPeriod);
      if (!endDate) return false;
      const future = new Date();
      future.setDate(now.getDate() + 90);
      return endDate >= now && endDate <= future;
    }).length;

    let companyContractDaysLeft: number | null = null;
    let companyContractPdfUrl: string | null = null;
    let companyContractExpirationDate: string | null = null;

    if (userRole === "company" && companyId) {
      const company = companies.find(c => c.id === companyId);
      if (company) {
        companyContractPdfUrl = company.contractPdfUrl || null;
        companyContractExpirationDate = company.contractExpirationDate || null;
        if (company.contractExpirationDate) {
          const expDate = new Date(company.contractExpirationDate);
          const expMid = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
          const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const diffTime = expMid.getTime() - nowMid.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          companyContractDaysLeft = diffDays;
        }
      }
    }

    return {
      totalCompanies: companies.length,
      totalEmployees: employees.length,
      renewalsIn3MonthsCount,
      alertsCount,
      upcomingRenewals: upcomingRenewals.slice(0, 5), // Max 5 items
      alerts: activeAlerts.slice(0, 5), // Max 5 items
      companies: companies.slice(0, 5), // Max 5 items
      companyContractPdfUrl,
      companyContractExpirationDate,
      companyContractDaysLeft,
      employeeContractRenewalsCount,
    };
  } catch (error) {
    console.error("getDashboardMetrics error:", error);
    return {
      totalCompanies: 0,
      totalEmployees: 0,
      renewalsIn3MonthsCount: 0,
      alertsCount: 0,
      upcomingRenewals: [],
      alerts: [],
      companies: [],
      companyContractPdfUrl: null,
      companyContractExpirationDate: null,
      companyContractDaysLeft: null,
      employeeContractRenewalsCount: 0,
    };
  }
}
