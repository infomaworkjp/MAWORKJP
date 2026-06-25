"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/use-auth";
import { getDashboardMetrics, DashboardMetrics } from "@/app/actions/dashboard";
import { 
  Building, Users, CalendarDays, BellRing, RefreshCw, AlertCircle, 
  ChevronRight, Check, FileText, ShieldCheck, AlertTriangle, Download, 
  Scale, FileWarning 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getEmployeesByCompanyId } from "@/app/actions/employees";
import { getCompanyById } from "@/app/actions/companies";
import { useToast } from "@/hooks/use-toast";
import {
  submitOptionRequest,
  submitTranslationRequest,
  submitInterpretationRequest,
  submitUpgradeRequest,
  getRequestsByCompanyId,
  incrementLineConsultationUsage
} from "@/app/actions/requests";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, X, ShieldAlert, Award, Star, TrendingUp, BarChart2 } from "lucide-react";

const PLAN_CONFIGS: Record<string, any> = {
  entry: {
    name: "エントリー",
    price: "39,800",
    headcount: "1〜5名",
    overage: "3,000",
    translationLimit: 1,
    interpretationLimit: 0,
    consultationLimit: "LINE月3回",
  },
  basic: {
    name: "ベーシック",
    price: "69,800",
    headcount: "6〜15名",
    overage: "3,000",
    translationLimit: 2,
    interpretationLimit: 1,
    consultationLimit: "LINE月5回",
  },
  standard: {
    name: "スタンダード",
    price: "98,000",
    headcount: "16〜30名",
    overage: "2,500",
    translationLimit: 3,
    interpretationLimit: 2,
    consultationLimit: "常時受付",
  },
  advance: {
    name: "アドバンス",
    price: "148,000",
    headcount: "31〜50名",
    overage: "2,500",
    translationLimit: 5,
    interpretationLimit: 3,
    consultationLimit: "常時受付",
  },
  pro: {
    name: "プロ",
    price: "198,000",
    headcount: "51〜80名",
    overage: "2,000",
    translationLimit: 8,
    interpretationLimit: 5,
    consultationLimit: "常時受付",
  },
  premium: {
    name: "プレミアム",
    price: "298,000",
    headcount: "81名以上",
    overage: "2,000",
    translationLimit: Infinity,
    interpretationLimit: 8,
    consultationLimit: "専属担当",
  },
};

const OPTIONS_LIST = [
  { key: "safety_education", name: "安全教育（多言語）", price: "15,000", desc: "外国人雇用に必要な多言語安全教育の実施・修了証発行。" },
  { key: "site_visit", name: "現場訪問サポート", price: "20,000", desc: "専門スタッフが現場に同行し、通訳やヒアリングを代行します。" },
  { key: "emergency_interpretation", name: "緊急通訳手配", price: "15,000", desc: "事故やトラブル時の24時間緊急電話通訳対応。" },
  { key: "spot_consult", name: "スポット労務相談", price: "5,000", desc: "ビザ更新や雇用トラブルについて専門家への個別単発相談。" },
  { key: "translation_add", name: "翻訳追加（1ページ）", price: "8,000", desc: "A4用紙1ページ（1〜1,500文字程度）の追加翻訳。" },
  { key: "interpretation_add", name: "通訳追加（1時間）", price: "10,000", desc: "通訳担当者による現場・オンラインの1時間追加対応。" },
  { key: "certificate_only", name: "修了証PDF発行のみ", price: "5,000", desc: "安全講習などの修了証PDFの単発発行および保管。" },
  { key: "document_draft", name: "案内文作成代行", price: "3,000", desc: "外国人向け社内通知文書や案内文の翻訳・ドラフト作成。" },
  { key: "employment_contract_draft", name: "雇用契約書作成依頼", price: "10,000", desc: "外国人スタッフ用の雇用契約書（多言語対応可）の作成代行。" },
  { key: "labor_conditions_draft", name: "労働条件通知書作成依頼", price: "8,000", desc: "トラブル防止のための多言語労働条件通知書の作成代行。" },
  { key: "contract_audit", name: "契約内容確認依頼", price: "5,000", desc: "既存の契約内容が入管法や労基法に適合しているかの監査・確認。" },
  { key: "report_draft", name: "報告書作成依頼", price: "5,000", desc: "ヒアリング内容に基づく双方合意の事実確認報告書の作成代行。" }
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [company, setCompany] = useState<any | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // --- New Request & Options State Variables ---
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<any | null>(null);
  const [isOptionFeeChecked, setIsOptionFeeChecked] = useState(false);
  const [isOptionConsentChecked, setIsOptionConsentChecked] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Translation Modal State
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [translationText, setTranslationText] = useState("");
  const [translationPages, setTranslationPages] = useState(1);
  const [translationLang, setTranslationLang] = useState("ベトナム語");
  const [translationDate, setTranslationDate] = useState("");

  // Interpretation Modal State
  const [isInterpretationModalOpen, setIsInterpretationModalOpen] = useState(false);
  const [interpretationDate, setInterpretationDate] = useState("");
  const [interpretationHours, setInterpretationHours] = useState(1);
  const [interpretationDesc, setInterpretationDesc] = useState("");

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState("");

  // Analytics View State
  const [activeAnalysisDetail, setActiveAnalysisDetail] = useState<string | null>(null);

  const loadRequests = async () => {
    if (user?.companyId) {
      const res = await getRequestsByCompanyId(user.companyId);
      if (res.success && res.data) {
        setRequestsList(res.data);
      }
    }
  };

  const handleOptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !selectedOption) return;
    setIsSubmittingRequest(true);
    try {
      const res = await submitOptionRequest(user.companyId, selectedOption.key, isOptionConsentChecked);
      if (res.success) {
        toast({
          title: "申請完了",
          description: "追加オプション「" + selectedOption.name + "」の申請を送信しました。",
        });
        setIsOptionModalOpen(false);
        setSelectedOption(null);
        setIsOptionFeeChecked(false);
        setIsOptionConsentChecked(false);
        loadRequests();
        if (user.companyId) {
          getCompanyById(user.companyId).then((resComp) => {
            if (resComp.success && resComp.data) {
              setCompany(resComp.data);
            }
          });
        }
      } else {
        toast({
          title: "申請エラー",
          description: res.error || "申請処理に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleTranslationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !translationDate) return;
    setIsSubmittingRequest(true);
    
    const fees = calculateTranslationFees();
    try {
      const res = await submitTranslationRequest(user.companyId, {
        text: translationText,
        pages: translationPages,
        targetLanguage: translationLang,
        scheduledDate: translationDate,
        basePrice: fees.base,
        surcharge: fees.surcharge,
        totalPrice: fees.total
      });

      if (res.success) {
        toast({
          title: "依頼完了",
          description: "翻訳のご依頼を送信しました。利用カウンターが更新されました。",
        });
        setIsTranslationModalOpen(false);
        setTranslationText("");
        setTranslationPages(1);
        setTranslationDate("");
        loadRequests();
        if (user.companyId) {
          getCompanyById(user.companyId).then((resComp) => {
            if (resComp.success && resComp.data) {
              setCompany(resComp.data);
            }
          });
        }
      } else {
        toast({
          title: "依頼エラー",
          description: res.error || "依頼処理に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleInterpretationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !interpretationDate) return;
    setIsSubmittingRequest(true);

    const fees = calculateInterpretationFees();
    try {
      const res = await submitInterpretationRequest(user.companyId, {
        scheduledDate: interpretationDate,
        hours: interpretationHours,
        description: interpretationDesc,
        basePrice: fees.base,
        surcharge: fees.surcharge,
        totalPrice: fees.total
      });

      if (res.success) {
        toast({
          title: "依頼完了",
          description: "通訳対応のご依頼を送信しました。利用カウンターが更新されました。",
        });
        setIsInterpretationModalOpen(false);
        setInterpretationDate("");
        setInterpretationHours(1);
        setInterpretationDesc("");
        loadRequests();
        if (user.companyId) {
          getCompanyById(user.companyId).then((resComp) => {
            if (resComp.success && resComp.data) {
              setCompany(resComp.data);
            }
          });
        }
      } else {
        toast({
          title: "依頼エラー",
          description: res.error || "依頼処理に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !selectedUpgradePlan) return;
    setIsSubmittingRequest(true);
    try {
      const res = await submitUpgradeRequest(user.companyId, selectedUpgradePlan);
      if (res.success) {
        toast({
          title: "申請完了",
          description: "プランのアップグレード申請を完了し、プランが更新されました。",
        });
        setIsUpgradeModalOpen(false);
        setSelectedUpgradePlan("");
        loadRequests();
        if (user.companyId) {
          getCompanyById(user.companyId).then((resComp) => {
            if (resComp.success && resComp.data) {
              setCompany(resComp.data);
            }
          });
        }
      } else {
        toast({
          title: "申請エラー",
          description: res.error || "アップグレード申請に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const calculateTranslationFees = () => {
    const base = translationPages * 8000;
    if (!translationDate) return { base, surcharge: 0, total: base, rate: 0 };
    
    const diffTime = new Date(translationDate).getTime() - new Date().setHours(0,0,0,0);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let rate = 0;
    if (diffDays <= 0) rate = 1.0;      // 当日
    else if (diffDays === 1) rate = 0.5; // 翌日
    else if (diffDays <= 3) rate = 0.3;  // 3日前以内
    
    const isPremium = company?.plan_type === "premium";
    const surcharge = base * rate;
    
    if (isPremium) {
      if (diffDays >= 7) {
        return { base: 0, surcharge: 0, total: 0, rate: 0 };
      } else {
        return { base: 0, surcharge, total: surcharge, rate };
      }
    }
    
    return { base, surcharge, total: base + surcharge, rate };
  };

  const calculateInterpretationFees = () => {
    const base = interpretationHours * 10000;
    if (!interpretationDate) return { base, surcharge: 0, total: base, rate: 0 };
    
    const diffTime = new Date(interpretationDate).getTime() - new Date().setHours(0,0,0,0);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let rate = 0;
    if (diffDays <= 0) rate = 1.0;
    else if (diffDays === 1) rate = 0.5;
    else if (diffDays <= 3) rate = 0.3;
    
    const surcharge = base * rate;
    return { base, surcharge, total: base + surcharge, rate };
  };

  const loadMetrics = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setIsTimeout(false);

    // Timeout Promise (5 seconds)
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("TIMEOUT"));
      }, 5000);
    });

    try {
      const data = await Promise.race([
        getDashboardMetrics(user.role, user.companyId),
        timeoutPromise
      ]);
      clearTimeout(timeoutId!);
      
      if (data) {
        setMetrics(data);
      } else {
        setError("データの取得に失敗しました。");
      }
    } catch (err: any) {
      clearTimeout(timeoutId!);
      console.error("Failed to load dashboard metrics:", err);
      if (err.message === "TIMEOUT") {
        setIsTimeout(true);
      } else {
        setError(err.message || "予期せぬエラーが発生しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        loadMetrics();
        loadRequests();
        if (user.role === "company" && user.companyId) {
          getCompanyById(user.companyId).then((res) => {
            if (res.success && res.data) {
              setCompany(res.data);
            }
          });
          getEmployeesByCompanyId(user.companyId).then((res) => {
            if (res.success && res.data) {
              setEmployees(res.data);
            }
          });
        }
      }
    }
  }, [user, authLoading]);

  if (authLoading || (loading && !metrics && !error && !isTimeout)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">データを読み込んでいます...</p>
      </div>
    );
  }

  if (isTimeout) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 animate-pulse" />
        <div className="space-y-1">
          <h3 className="text-lg font-bold">読み込みタイムアウト</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            データの取得に時間がかかりすぎています。接続を確認して再試行してください。
          </p>
        </div>
        <Button onClick={loadMetrics} className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/90 font-bold flex items-center gap-1.5 shadow-sm">
          <RefreshCw className="h-4 w-4" />
          再試行する
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-destructive">エラーが発生しました</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {error}
          </p>
        </div>
        <Button onClick={loadMetrics} className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/90 font-bold flex items-center gap-1.5 shadow-sm">
          <RefreshCw className="h-4 w-4" />
          再試行する
        </Button>
      </div>
    );
  }

  // --- Compliance Report Generation Helpers ---
  const fetchFontBase64 = async () => {
    try {
      const fontUrl = "/fonts/NotoSansJP-Regular.ttf";
      const response = await fetch(fontUrl);
      if (!response.ok) throw new Error("Font fetch failed");
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64 = base64data.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Could not load local font:", err);
      return null;
    }
  };

  const getVisaExpiringIn6MonthsCount = () => {
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setDate(now.getDate() + 180);
    return employees.filter(emp => {
      if (!emp.expirationDate) return false;
      const expDate = new Date(emp.expirationDate.replace(/\//g, "-"));
      return !isNaN(expDate.getTime()) && expDate >= now && expDate <= sixMonthsLater;
    }).length;
  };

  const getMissingDocsCount = () => {
    return employees.filter(emp => !emp.cardNumber || !emp.passportNumber || !emp.address || !emp.phone).length;
  };

  const downloadMonthlyComplianceReport = async () => {
    if (!company) return;
    setIsExporting("compliance");
    toast({
      title: "レポート出力中",
      description: "月次コンプライアンスレポートを生成しています。しばらくお待ちください...",
    });

    const fontBase64 = await fetchFontBase64();
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const fontName = fontBase64 ? "NotoSansJP" : "helvetica";
      if (fontBase64) {
        doc.addFileToVFS("NotoSansJP-Regular.ttf", fontBase64);
        doc.addFont("NotoSansJP-Regular.ttf", "NotoSansJP", "normal");
      }
      doc.setFont(fontName);

      const margin = 15;
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("MA WORK JP - Compliance Report", 210 - margin, 15, { align: "right" });

      doc.setFontSize(18);
      doc.setTextColor(26, 58, 123);
      doc.text("月次コンプライアンスレポート", margin, 25);

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const targetMonth = "2026年06月";
      doc.text(`対象月: ${targetMonth}  |  出力日時: ${new Date().toLocaleString("ja-JP")}`, margin, 32);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, 210 - margin, 35);

      // Section 1: Company Profile Summary
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("■ 企業・契約概要", margin, 43);

      const profileHeaders = [["企業名", "業種", "現在のプラン", "アクティブオプション"]];
      const activeOptsJapanese = (company.active_options || []).map((o: string) => {
        if (o === "safety_education") return "安全教育";
        if (o === "translation") return "翻訳";
        if (o === "interpretation") return "通訳";
        if (o === "ai_audit") return "AI監査";
        if (o === "expert_matching") return "専門家相談";
        return o;
      }).join(", ") || "なし";

      const profileRows = [[
        company.name || "",
        company.industry || "",
        (company.plan_type || company.plan || "entry").toUpperCase(),
        activeOptsJapanese
      ]];

      autoTable(doc, {
        startY: 46,
        head: profileHeaders,
        body: profileRows,
        styles: { font: fontName, fontSize: 9 },
        headStyles: { fillColor: [26, 58, 123], font: fontName, fontStyle: "normal" },
        margin: { left: margin, right: margin }
      });

      // Section 2: Compliance Risk Summary
      doc.setFontSize(11);
      doc.text("■ 法令遵守状況・リスク評価", margin, (doc as any).lastAutoTable.finalY + 12);

      const expiredCount = employees.filter(e => e.status === "expired").length;
      const expiringCount = employees.filter(e => e.status === "expiring_soon").length;
      const missingCount = getMissingDocsCount();
      
      let complianceScore = "A (優良・リスク極小)";
      if (expiredCount > 0) {
        complianceScore = "C (要指導・期限切れ警告あり)";
      } else if (expiringCount > 0 || missingCount > 0) {
        complianceScore = "B (通常・注意対象あり)";
      }

      const riskHeaders = [["項目", "数値", "評価・判定"]];
      const riskRows = [
        ["管理対象の総外国人従業員数", `${employees.length} 名`, "登録済み従業員台帳"],
        ["在留期限超過 (期限切れ警告)", `${expiredCount} 名`, expiredCount > 0 ? "🚨 速やかに更新代行を申請してください" : "✓ 期限切れなし"],
        ["3ヶ月以内満了予定者 (ビザ/契約)", `${expiringCount} 名`, expiringCount > 0 ? "⚠️ 更新手続きを準備してください" : "✓ 順調"],
        ["法定提出書類/データの不足", `${missingCount} 名`, missingCount > 0 ? "⚠️ プロフィールを補完してください" : "✓ 書類充足"],
        ["総合コンプライアンス判定", complianceScore, expiredCount > 0 ? "🚨 要改善" : "✓ 適法稼働中"]
      ];

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: riskHeaders,
        body: riskRows,
        styles: { font: fontName, fontSize: 9 },
        headStyles: { fillColor: [26, 58, 123], font: fontName, fontStyle: "normal" },
        margin: { left: margin, right: margin }
      });

      doc.save(`${company.name}_月次コンプライアンスレポート_202606.pdf`);
      toast({ title: "レポート出力完了", description: "PDFファイルのダウンロードが完了しました。" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "出力エラー", description: "PDFの生成に失敗しました。", variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  const downloadVisaExpirySchedule = async () => {
    if (!company) return;
    setIsExporting("visa");
    toast({
      title: "レポート出力中",
      description: "在留期限・更新予定表を生成しています。しばらくお待ちください...",
    });

    const fontBase64 = await fetchFontBase64();
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const fontName = fontBase64 ? "NotoSansJP" : "helvetica";
      if (fontBase64) {
        doc.addFileToVFS("NotoSansJP-Regular.ttf", fontBase64);
        doc.addFont("NotoSansJP-Regular.ttf", "NotoSansJP", "normal");
      }
      doc.setFont(fontName);

      const margin = 15;
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("MA WORK JP - Compliance Report", 210 - margin, 15, { align: "right" });

      doc.setFontSize(18);
      doc.setTextColor(26, 58, 123);
      doc.text("在留期限・更新予定表", margin, 25);

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`対象範囲: 今後6ヶ月以内の期限満了者  |  出力日時: ${new Date().toLocaleString("ja-JP")}`, margin, 32);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, 210 - margin, 35);

      const now = new Date();
      const sixMonthsLater = new Date();
      sixMonthsLater.setDate(now.getDate() + 180);

      const expiringList = employees.filter(emp => {
        if (!emp.expirationDate) return false;
        const expDate = new Date(emp.expirationDate.replace(/\//g, "-"));
        return !isNaN(expDate.getTime()) && expDate >= now && expDate <= sixMonthsLater;
      });

      if (expiringList.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.text("今後6ヶ月以内に満了する在留期限・更新手続き対象の従業員はいません。", margin, 48);
      } else {
        const tableHeaders = [["氏名", "国籍", "在留資格", "期限満了日", "残り日数", "推奨アクション"]];
        const tableRows = expiringList.map((emp) => {
          const expDate = new Date(emp.expirationDate.replace(/\//g, "-"));
          const diffTime = expDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let actionText = "✓ 有効期限内";
          if (diffDays < 0) {
            actionText = "🚨 期限超過 (不法就労状態)";
          } else if (diffDays < 90) {
            actionText = "🚨 行政書士への代行依頼を推奨 (90日未満)";
          } else if (diffDays < 120) {
            actionText = "⚠️ 更新必要書類の準備開始 (120日未満)";
          }

          return [
            emp.name || "",
            emp.nationality || "",
            emp.statusOfResidence || "",
            emp.expirationDate || "",
            `${diffDays} 日`,
            actionText
          ];
        });

        autoTable(doc, {
          startY: 42,
          head: tableHeaders,
          body: tableRows,
          styles: { font: fontName, fontSize: 8.5, cellPadding: 3.5 },
          headStyles: { fillColor: [26, 58, 123], font: fontName, fontStyle: "normal" },
          margin: { left: margin, right: margin }
        });
      }

      doc.save(`${company.name}_在留期限_更新予定表.pdf`);
      toast({ title: "レポート出力完了", description: "PDFファイルのダウンロードが完了しました。" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "出力エラー", description: "PDFの生成に失敗しました。", variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  const downloadMissingDocumentsList = async () => {
    if (!company) return;
    setIsExporting("missing");
    toast({
      title: "レポート出力中",
      description: "書類不足・未提出者リストを生成しています。しばらくお待ちください...",
    });

    const fontBase64 = await fetchFontBase64();
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const fontName = fontBase64 ? "NotoSansJP" : "helvetica";
      if (fontBase64) {
        doc.addFileToVFS("NotoSansJP-Regular.ttf", fontBase64);
        doc.addFont("NotoSansJP-Regular.ttf", "NotoSansJP", "normal");
      }
      doc.setFont(fontName);

      const margin = 15;
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("MA WORK JP - Compliance Report", 210 - margin, 15, { align: "right" });

      doc.setFontSize(18);
      doc.setTextColor(26, 58, 123);
      doc.text("書類不足・未提出者リスト", margin, 25);

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`対象範囲: 必須法定書類/情報の未提出・未登録者  |  出力日時: ${new Date().toLocaleString("ja-JP")}`, margin, 32);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, 210 - margin, 35);

      const missingList = employees.filter(emp => !emp.cardNumber || !emp.passportNumber || !emp.address || !emp.phone);

      if (missingList.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.text("現在、必須項目や書類データに未登録・不足のある従業員はいません。", margin, 48);
      } else {
        const tableHeaders = [["氏名", "国籍", "在留資格", "不足データ・書類", "リスク区分"]];
        const tableRows = missingList.map((emp) => {
          const missingFields = [];
          if (!emp.cardNumber) missingFields.push("在留カード番号");
          if (!emp.passportNumber) missingFields.push("パスポート番号/期限");
          if (!emp.address) missingFields.push("現住所");
          if (!emp.phone) missingFields.push("連絡用電話番号");
          
          let riskType = "中: 連絡・管理困難";
          if (!emp.cardNumber || !emp.expirationDate) {
            riskType = "高: 不法就労・入管法違反リスク";
          }

          return [
            emp.name || "",
            emp.nationality || "",
            emp.statusOfResidence || "",
            missingFields.join("、"),
            riskType
          ];
        });

        autoTable(doc, {
          startY: 42,
          head: tableHeaders,
          body: tableRows,
          styles: { font: fontName, fontSize: 8.5, cellPadding: 3.5 },
          headStyles: { fillColor: [26, 58, 123], font: fontName, fontStyle: "normal" },
          margin: { left: margin, right: margin }
        });
      }

      doc.save(`${company.name}_法定書類不足_未提出者リスト.pdf`);
      toast({ title: "レポート出力完了", description: "PDFファイルのダウンロードが完了しました。" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "出力エラー", description: "PDFの生成に失敗しました。", variant: "destructive" });
    } finally {
      setIsExporting(null);
    }
  };

  if (user?.role === "company") {
    const now = new Date();
    
    const parseDateStr = (dateStr: string | null | undefined): Date | null => {
      if (!dateStr) return null;
      const cleaned = dateStr.trim().replace(/\//g, "-");
      const d = new Date(cleaned);
      return isNaN(d.getTime()) ? null : d;
    };

    const parseContractEndDate = (period: string | null | undefined): Date | null => {
      if (!period) return null;
      const cleaned = period.trim();
      if (cleaned.includes("~")) {
        const parts = cleaned.split("~");
        const endDateStr = parts[parts.length - 1].trim();
        return parseDateStr(endDateStr);
      }
      return parseDateStr(cleaned);
    };

    const threeMonthsLater = new Date();
    threeMonthsLater.setDate(now.getDate() + 90);

    // 1. Expired Visas
    const expiredVisaEmployees = employees.filter(emp => {
      const expDate = parseDateStr(emp.expirationDate);
      return expDate !== null && expDate < now;
    });

    // 2. Expired Contracts
    const expiredContractEmployees = employees.filter(emp => {
      const endDate = parseContractEndDate(emp.contractPeriod);
      return endDate !== null && endDate < now;
    });

    // 3. Expiring Visas in 3 months (excluding expired)
    const expiringVisaEmployees = employees.filter(emp => {
      const expDate = parseDateStr(emp.expirationDate);
      return expDate !== null && expDate >= now && expDate <= threeMonthsLater;
    });

    // 4. Expiring Contracts in 3 months (excluding expired)
    const expiringContractEmployees = employees.filter(emp => {
      const endDate = parseContractEndDate(emp.contractPeriod);
      return endDate !== null && endDate >= now && endDate <= threeMonthsLater;
    });

    const hasExpiredItems = expiredVisaEmployees.length > 0 || expiredContractEmployees.length > 0;

    return (
      <div className="space-y-8 font-sans bg-[#F0F4FA] dark:bg-zinc-950 -m-4 sm:-m-6 md:-m-8 p-6 sm:p-8 md:p-10 min-h-[calc(100vh-4rem)]">
        {/* Welcome Title & Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <img src="/mawork-logo.jpg" alt="M-A WORK JP Logo" className="h-12 w-12 rounded-lg object-contain border shadow-sm" />
            <div className="border-l-4 border-l-[#1A3A7B] pl-4 py-1">
              <h1 className="text-3xl font-black text-[#1A3A7B] tracking-tight">MA WORK JP 企業マイページ</h1>
              <p className="text-sm text-slate-500 mt-1.5">
                企業名：<span className="font-bold text-slate-800">{company?.name || "読み込み中..."}</span>
                <span className="mx-2">|</span>
                担当者：<span className="font-bold text-[#1A3A7B]">{user?.displayName}</span>
              </p>
            </div>
          </div>
          
          {user.companyId && (
            <Button asChild className="bg-gradient-to-r from-[#1A3A7B] to-[#2B59C3] text-white hover:from-[#1A3A7B]/90 hover:to-[#2B59C3]/90 font-bold text-xs shadow-md h-10 px-4 border-none transition-all active:scale-[0.98] shrink-0">
              <Link href={"/dashboard/companies/" + user.companyId} className="flex items-center gap-1.5">
                詳細プロフィール
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* --- High Priority Expired Items Banner --- */}
        {hasExpiredItems && (
          <Card className="border-l-4 border-l-red-600 bg-red-50/50 dark:bg-red-950/20 rounded-xl shadow-md overflow-hidden animate-pulse">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-red-700 dark:text-red-400 font-black flex items-center gap-2 text-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0" />
                【最優先警告】期限切れの対象者が存在します
              </CardTitle>
              <CardDescription className="text-xs text-red-650 dark:text-red-300 font-semibold mt-1">
                直ちに対処（更新申請または退職手続き）が必要な従業員が検出されました。
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-3">
              {expiredVisaEmployees.map(emp => (
                <div key={emp.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border border-red-200 dark:border-red-900 gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border shrink-0">
                      <AvatarFallback className="font-bold text-[10px] bg-red-100 text-red-800">{emp.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{emp.name}</span>
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border border-red-250">在留資格期限切れ</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="text-xs font-mono font-bold text-red-600">満了日: {emp.expirationDate}</span>
                    <Button size="sm" variant="destructive" asChild className="h-8 text-xs font-bold shadow-sm">
                      <Link href={`/dashboard/companies/${user.companyId}?tab=employees&filter=expired`}>確認する</Link>
                    </Button>
                  </div>
                </div>
              ))}
              {expiredContractEmployees.map(emp => (
                <div key={emp.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border border-red-200 dark:border-red-900 gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border shrink-0">
                      <AvatarFallback className="font-bold text-[10px] bg-red-100 text-red-800">{emp.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{emp.name}</span>
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border border-red-250">雇用契約期限切れ</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="text-xs font-mono font-bold text-red-600">満了日: {emp.contractPeriod}</span>
                    <Button size="sm" variant="destructive" asChild className="h-8 text-xs font-bold shadow-sm">
                      <Link href={`/dashboard/companies/${user.companyId}?tab=employees&filter=expired`}>確認する</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Redesigned 8-Category Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* 1. 自社プロフィール */}
          <Card className="hover:shadow-lg transition-all border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl flex flex-col justify-between overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/10 dark:from-zinc-900 dark:to-zinc-900/50 p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-700 dark:text-blue-200 shrink-0">
                  <Building className="h-5.5 w-5.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100">1. 自社プロフィール</CardTitle>
                  <CardDescription className="text-xs mt-1">会社情報の確認・編集を行うことができます。</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-end">
              <Button asChild className="w-full bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/90 font-bold gap-1 shadow-sm">
                <Link href={`/dashboard/companies/${user.companyId}?tab=profile`}>
                  自社プロフィールを開く <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 2. 従業員一覧 */}
          <Card className="hover:shadow-lg transition-all border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl flex flex-col justify-between overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/10 dark:from-zinc-900 dark:to-zinc-900/50 p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-700 dark:text-indigo-200 shrink-0">
                  <Users className="h-5.5 w-5.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100">2. 従業員一覧</CardTitle>
                  <CardDescription className="text-xs mt-1">登録されている従業員の確認や詳細表示を行います。</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-end">
              <Button asChild className="w-full bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/90 font-bold gap-1 shadow-sm">
                <Link href={`/dashboard/companies/${user.companyId}?tab=employees`}>
                  従業員一覧を開く <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 3. 基本管理 */}
          <Card className="hover:shadow-lg transition-all border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden flex flex-col">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/10 dark:from-zinc-900 dark:to-zinc-900/50 p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900 rounded-lg text-emerald-700 dark:text-emerald-250 shrink-0">
                  <CalendarDays className="h-5.5 w-5.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100">3. 基本管理</CardTitle>
                  <CardDescription className="text-xs mt-1">在留カード、雇用契約書の満了管理やPDF出力。</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <Button size="sm" variant="outline" asChild className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350">
                  <Link href={`/dashboard/companies/${user.companyId}?tab=employees&filter=visa`}>
                    🛡️ 在留カード期限管理 ({expiringVisaEmployees.length}名対象)
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350">
                  <Link href={`/dashboard/companies/${user.companyId}?tab=employees&filter=contract`}>
                    📄 契約書更新管理 ({expiringContractEmployees.length}名対象)
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350">
                  <Link href={`/dashboard/companies/${user.companyId}?tab=employees&filter=expired`}>
                    🚨 アラート対象一覧 (期限切れ従業員)
                  </Link>
                </Button>
              </div>

              <div className="pt-4 border-t space-y-2">
                <span className="text-[10px] font-black text-slate-400 block mb-1">📑 各種PDFレポート出力</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button size="sm" variant="outline" onClick={downloadMonthlyComplianceReport} disabled={isExporting !== null} className="text-[10px] h-8 justify-center gap-1 font-bold">
                    {isExporting === "compliance" ? <RefreshCw className="h-3 w-3 animate-spin" /> : "月次レポ"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadVisaExpirySchedule} disabled={isExporting !== null} className="text-[10px] h-8 justify-center gap-1 font-bold">
                    {isExporting === "visa" ? <RefreshCw className="h-3 w-3 animate-spin" /> : "予定表"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadMissingDocumentsList} disabled={isExporting !== null} className="text-[10px] h-8 justify-center gap-1 font-bold">
                    {isExporting === "missing" ? <RefreshCw className="h-3 w-3 animate-spin" /> : "不足者"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. 翻訳・通訳・相談 */}
          <Card className="hover:shadow-lg transition-all border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/10 dark:from-zinc-900 dark:to-zinc-900/50 p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900 rounded-lg text-amber-700 dark:text-amber-200 shrink-0">
                  <RefreshCw className="h-5.5 w-5.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100">4. 翻訳・通訳・相談</CardTitle>
                  <CardDescription className="text-xs mt-1">各種翻訳・通訳対応や専門家への相談依頼。</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" onClick={() => setIsTranslationModalOpen(true)} className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/90 font-bold gap-1.5 text-xs h-9">
                  📝 翻訳依頼
                </Button>
                <Button size="sm" onClick={() => setIsInterpretationModalOpen(true)} className="bg-[#2B59C3] text-white hover:bg-[#2B59C3]/90 font-bold gap-1.5 text-xs h-9">
                  🗣️ 通訳依頼
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" asChild className="text-[11px] font-bold h-8">
                  <a href="mailto:support@maworkjp.com?subject=ポータルからの相談&body=ご相談内容をご記入ください：">
                    ✉️ メール相談
                  </a>
                </Button>
                <Button size="sm" variant="outline" asChild className="text-[11px] font-bold h-8 border-emerald-500 text-emerald-700 hover:bg-emerald-50">
                  <a href="https://line.me" target="_blank" rel="noopener noreferrer">
                    💬 LINE相談
                  </a>
                </Button>
              </div>

              <div className="pt-4 border-t">
                <span className="text-[10px] font-black text-slate-400 block mb-1.5">📋 最近の依頼履歴 (最新3件)</span>
                {requestsList.length === 0 ? (
                  <span className="text-[10px] text-slate-400 block">依頼履歴はまだありません。</span>
                ) : (
                  <div className="space-y-1 max-h-[85px] overflow-y-auto">
                    {requestsList.slice(0, 3).map((req: any) => (
                      <div key={req.id} className="flex justify-between items-center text-[10px] bg-slate-50 dark:bg-zinc-800 p-1.5 rounded border border-slate-100">
                        <span className="font-bold truncate max-w-[150px]">
                          {req.type === "translation" && "📝 翻訳"}
                          {req.type === "interpretation" && "🗣️ 通訳"}
                          {req.type === "option" && `⚙️ ${OPTIONS_LIST.find(o => o.key === req.optionKey)?.name || req.optionKey}`}
                          {req.type === "upgrade" && "⭐ プラン変更"}
                        </span>
                        <span className="text-slate-500 font-semibold">{req.status === "pending" ? "⏳ 申請中" : "✓ 完了"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 5. 雇用契約サポート */}
          <Card className="hover:shadow-lg transition-all border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/10 dark:from-zinc-900 dark:to-zinc-900/50 p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-100 dark:bg-violet-900 rounded-lg text-violet-700 dark:text-violet-200 shrink-0">
                  <FileText className="h-5.5 w-5.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100">5. 雇用契約サポート</CardTitle>
                  <CardDescription className="text-xs mt-1">雇用契約書等の多言語書類作成や契約確認の依頼。</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-2 flex-1 flex flex-col justify-end">
              <Button size="sm" variant="outline" onClick={() => {
                const opt = OPTIONS_LIST.find(o => o.key === "employment_contract_draft");
                if (opt) { setSelectedOption(opt); setIsOptionModalOpen(true); }
              }} className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350 text-xs">
                📄 雇用契約書作成依頼
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                const opt = OPTIONS_LIST.find(o => o.key === "labor_conditions_draft");
                if (opt) { setSelectedOption(opt); setIsOptionModalOpen(true); }
              }} className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350 text-xs">
                📄 労働条件通知書作成依頼
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                const opt = OPTIONS_LIST.find(o => o.key === "contract_audit");
                if (opt) { setSelectedOption(opt); setIsOptionModalOpen(true); }
              }} className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350 text-xs">
                🔍 契約内容整合性確認依頼
              </Button>
            </CardContent>
          </Card>

          {/* 6. 法令・安全教育 */}
          <Card className="hover:shadow-lg transition-all border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/10 dark:from-zinc-900 dark:to-zinc-900/50 p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-900 rounded-lg text-rose-700 dark:text-rose-200 shrink-0">
                  <ShieldCheck className="h-5.5 w-5.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100">6. 法令・安全教育</CardTitle>
                  <CardDescription className="text-xs mt-1">外国人労働者向けの多言語安全教育と修了証発行。</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-2 flex-1 flex flex-col justify-end">
              <Button size="sm" variant="outline" onClick={() => {
                const opt = OPTIONS_LIST.find(o => o.key === "safety_education");
                if (opt) { setSelectedOption(opt); setIsOptionModalOpen(true); }
              }} className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350 text-xs">
                🏫 多言語安全教育（講習申請）
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350 text-xs pointer-events-none opacity-60">
                ✏️ 理解度チェック（安全教育修了テスト）
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                const opt = OPTIONS_LIST.find(o => o.key === "certificate_only");
                if (opt) { setSelectedOption(opt); setIsOptionModalOpen(true); }
              }} className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350 text-xs">
                🎓 修了証PDF発行のみ依頼
              </Button>
            </CardContent>
          </Card>

          {/* 7. 現場労務対応 */}
          <Card className="hover:shadow-lg transition-all border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/10 dark:from-zinc-900 dark:to-zinc-900/50 p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900 rounded-lg text-emerald-700 dark:text-emerald-250 shrink-0">
                  <Scale className="h-5.5 w-5.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100">7. 現場労務対応</CardTitle>
                  <CardDescription className="text-xs mt-1">トラブル相談、面談の同席調整や報告書作成。</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-2 flex-1 flex flex-col justify-end">
              <Button size="sm" variant="outline" onClick={() => {
                const opt = OPTIONS_LIST.find(o => o.key === "spot_consult");
                if (opt) { setSelectedOption(opt); setIsOptionModalOpen(true); }
              }} className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350 text-xs">
                ⚖️ 雇用トラブル・労務の緊急相談
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsInterpretationModalOpen(true)} className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350 text-xs">
                🗣️ 面談同席（専門スタッフ通訳）
              </Button>
              <Button size="sm" variant="outline" asChild className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350 text-xs">
                <Link href={`/dashboard/companies/${user.companyId}?tab=employees`}>
                  📋 双方ヒアリング記録確認
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                const opt = OPTIONS_LIST.find(o => o.key === "report_draft");
                if (opt) { setSelectedOption(opt); setIsOptionModalOpen(true); }
              }} className="w-full justify-start font-bold gap-2 text-slate-700 dark:text-slate-350 text-xs">
                📝 労務対応ヒアリング報告書作成依頼
              </Button>
            </CardContent>
          </Card>

          {/* 8. 上位プラン専用 */}
          {(() => {
            const isHighTier = ["standard", "advance", "pro", "premium"].includes(company?.plan_type || "");
            return (
              <Card className="hover:shadow-lg transition-all border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden flex flex-col justify-between relative">
                <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/10 dark:from-zinc-900 dark:to-zinc-900/50 p-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-700 dark:text-purple-200 shrink-0">
                      {isHighTier ? <Star className="h-5.5 w-5.5 text-amber-500 fill-amber-500 animate-pulse" /> : <Lock className="h-5.5 w-5.5" />}
                    </div>
                    <div>
                      <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        8. 上位プラン専用
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">未払い残業、適合性監査、定着度予測等の高度分析。</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex-1 flex flex-col justify-end relative">
                  {!isHighTier && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-zinc-950/90 flex flex-col items-center justify-center p-4 text-center rounded-b-xl">
                      <Lock className="h-7 w-7 text-[#1A3A7B] mb-2" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">この機能は上位プラン専用です</span>
                      <span className="text-[10px] text-slate-500 mt-1">スタンダードプラン以上への変更が必要です</span>
                      <Button size="sm" onClick={() => setIsUpgradeModalOpen(true)} className="mt-3 text-[10px] h-8 bg-gradient-to-r from-[#1A3A7B] to-[#2B59C3] text-white hover:from-[#1A3A7B]/95 font-bold shadow active:scale-98">
                        プランアップグレード申請
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" onClick={() => setActiveAnalysisDetail("overtime")} className="w-full justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                      <span>⏰ 未払い残業リスク分析</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setActiveAnalysisDetail("risk")} className="w-full justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                      <span>🛡️ 外国人適合性・労務リスク診断</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setActiveAnalysisDetail("retention")} className="w-full justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                      <span>📈 離職予測・エンゲージメント推移</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setActiveAnalysisDetail("kpi")} className="w-full justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                      <span>📊 雇用管理KPI成熟度監査</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

        </div>

        {/* --- Dialog Modals Restore Section --- */}
        
        {/* 1. Options / Request Form Modal */}
        <Dialog open={isOptionModalOpen} onOpenChange={setIsOptionModalOpen}>
          <DialogContent className="max-w-md bg-background border rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-primary flex items-center gap-1.5">
                <FileText className="h-5 w-5 text-indigo-500" />
                オプションサービスの申請
              </DialogTitle>
              <DialogDescription className="text-xs">
                以下の追加サービスの申請を完了します。
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleOptionSubmit} className="space-y-4 py-2 text-xs">
              <div className="p-4 bg-muted/30 border rounded-xl space-y-2">
                <div className="flex justify-between font-bold">
                  <span>サービス名:</span>
                  <span className="text-slate-800">{selectedOption?.name}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>費用目安:</span>
                  <span className="text-indigo-600">{selectedOption?.price} 円 (税別)</span>
                </div>
                <hr className="my-1.5" />
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  {selectedOption?.desc}
                </p>
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-lg bg-amber-50/20">
                <input 
                  type="checkbox" 
                  id="optionFeeCheck" 
                  checked={isOptionFeeChecked}
                  onChange={(e) => setIsOptionFeeChecked(e.target.checked)}
                  className="rounded text-primary h-3.5 w-3.5 border-slate-300"
                  required
                />
                <Label htmlFor="optionFeeCheck" className="font-bold text-[11px] text-slate-600 leading-none cursor-pointer">
                  上記費用（または個別見積り）および利用規約に同意する
                </Label>
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-lg bg-emerald-50/20">
                <input 
                  type="checkbox" 
                  id="optionConsentCheck" 
                  checked={isOptionConsentChecked}
                  onChange={(e) => setIsOptionConsentChecked(e.target.checked)}
                  className="rounded text-primary h-3.5 w-3.5 border-slate-300"
                />
                <Label htmlFor="optionConsentCheck" className="font-bold text-[11px] text-slate-600 leading-none cursor-pointer">
                  (推奨) 専門スタッフによるヒアリングと自動進行の許可
                </Label>
              </div>

              <DialogFooter className="pt-4 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsOptionModalOpen(false); setSelectedOption(null); }}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={!isOptionFeeChecked || isSubmittingRequest} className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold">
                  {isSubmittingRequest ? <RefreshCw className="h-4 w-4 animate-spin" /> : "申請を確定する"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 2. Translation Request Modal */}
        <Dialog open={isTranslationModalOpen} onOpenChange={setIsTranslationModalOpen}>
          <DialogContent className="max-w-lg bg-background border rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-primary flex items-center gap-1.5">
                <RefreshCw className="h-5 w-5 text-indigo-500" />
                多言語翻訳のご依頼
              </DialogTitle>
              <DialogDescription className="text-xs">
                就業規則、各種契約、社内通知などの翻訳依頼を送信できます。
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleTranslationSubmit} className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="translationText" className="font-bold text-slate-500">対象テキスト (または書類概要)</Label>
                <Textarea 
                  id="translationText"
                  placeholder="翻訳を希望する文面をここに貼り付けるか、書類の概要をご記入ください。"
                  value={translationText}
                  onChange={(e) => setTranslationText(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="translationLang" className="font-bold text-slate-500">翻訳先言語</Label>
                  <Select value={translationLang} onValueChange={setTranslationLang}>
                    <SelectTrigger id="translationLang">
                      <SelectValue placeholder="言語を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ベトナム語">ベトナム語</SelectItem>
                      <SelectItem value="インドネシア語">インドネシア語</SelectItem>
                      <SelectItem value="フィリピン語">フィリピン語（タガログ）</SelectItem>
                      <SelectItem value="ネパール語">ネパール語</SelectItem>
                      <SelectItem value="英語">英語</SelectItem>
                      <SelectItem value="中国語">中国語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="translationPages" className="font-bold text-slate-500">枚数目安 (A4)</Label>
                  <Input 
                    id="translationPages"
                    type="number"
                    min={1}
                    value={translationPages}
                    onChange={(e) => setTranslationPages(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="translationDate" className="font-bold text-slate-500">希望納期 <span className="text-destructive">*</span></Label>
                  <Input 
                    id="translationDate"
                    type="date"
                    value={translationDate}
                    onChange={(e) => setTranslationDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[#1A3A7B] leading-relaxed">
                <p className="font-semibold text-[11px] flex gap-1 items-start">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  ※翻訳は1週間前（7日前）までにご依頼ください。期限未満の場合は緊急対応料金（3日以内: +30%, 翌日: +50%, 当日: +100%）が発生します（プレミアムプランの無料枠分にも適用されます）。
                </p>
              </div>

              {/* Dynamic Fee Simulators Display */}
              {(() => {
                const fees = calculateTranslationFees();
                const isEmergency = fees.surcharge > 0;
                return (
                  <div className="p-4 bg-muted/40 border rounded-xl space-y-2 font-bold text-xs">
                    <div className="flex justify-between">
                      <span>基本料金 (8,000円/枚):</span>
                      <span className={company?.plan_type === "premium" && fees.base === 0 ? "line-through text-slate-400" : ""}>
                        {(translationPages * 8000).toLocaleString()}円
                      </span>
                    </div>
                    {company?.plan_type === "premium" && (
                      <div className="flex justify-between text-emerald-700">
                        <span>プレミアム特典（基本料免除）:</span>
                        <span>-{(translationPages * 8000).toLocaleString()}円</span>
                      </div>
                    )}
                    {isEmergency && (
                      <div className="flex justify-between text-red-650">
                        <span>緊急対応料金 ({Math.round(fees.rate * 100)}%加算):</span>
                        <span>+{fees.surcharge.toLocaleString()}円</span>
                      </div>
                    )}
                    <hr />
                    <div className="flex justify-between font-black text-sm text-primary">
                      <span>お支払見積り合計 (税別):</span>
                      <span className="text-[#1A3A7B] text-base">{fees.total.toLocaleString()}円</span>
                    </div>
                  </div>
                );
              })()}

              <DialogFooter className="pt-4 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsTranslationModalOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={isSubmittingRequest} className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold">
                  {isSubmittingRequest ? <RefreshCw className="h-4 w-4 animate-spin" /> : "翻訳を依頼する"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 3. Interpretation Booking Modal */}
        <Dialog open={isInterpretationModalOpen} onOpenChange={setIsInterpretationModalOpen}>
          <DialogContent className="max-w-lg bg-background border rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-primary flex items-center gap-1.5">
                <Users className="h-5 w-5 text-indigo-500" />
                通訳対応の予約申請
              </DialogTitle>
              <DialogDescription className="text-xs">
                通訳希望の予定日、時間、対応内容（面談、安全指導等）を入力してください。
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleInterpretationSubmit} className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="interpretationDesc" className="font-bold text-slate-500">通訳内容の説明・目的</Label>
                <Textarea 
                  id="interpretationDesc"
                  placeholder="外国人スタッフ向けの現場安全教育時通訳、個別雇用条件説明面談など"
                  value={interpretationDesc}
                  onChange={(e) => setInterpretationDesc(e.target.value)}
                  className="min-h-[80px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="interpretationHours" className="font-bold text-slate-500">予定時間（時間）</Label>
                  <Input 
                    id="interpretationHours"
                    type="number"
                    min={1}
                    value={interpretationHours}
                    onChange={(e) => setInterpretationHours(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="interpretationDate" className="font-bold text-slate-500">通訳実施予定日 <span className="text-destructive">*</span></Label>
                  <Input 
                    id="interpretationDate"
                    type="date"
                    value={interpretationDate}
                    onChange={(e) => setInterpretationDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Dynamic Fee Simulators Display */}
              {(() => {
                const fees = calculateInterpretationFees();
                const isEmergency = fees.surcharge > 0;
                return (
                  <div className="p-4 bg-muted/40 border rounded-xl space-y-2 font-bold text-xs">
                    <div className="flex justify-between">
                      <span>基本通訳料金 (10,000円/時):</span>
                      <span>{(interpretationHours * 10000).toLocaleString()}円</span>
                    </div>
                    {isEmergency && (
                      <div className="flex justify-between text-red-600">
                        <span>緊急対応料金 ({Math.round(fees.rate * 100)}%加算):</span>
                        <span>+{fees.surcharge.toLocaleString()}円</span>
                      </div>
                    )}
                    <hr />
                    <div className="flex justify-between font-black text-sm text-primary">
                      <span>お支払見積り合計 (税別):</span>
                      <span className="text-[#1A3A7B] text-base">{fees.total.toLocaleString()}円</span>
                    </div>
                  </div>
                );
              })()}

              <DialogFooter className="pt-4 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsInterpretationModalOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={isSubmittingRequest} className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold">
                  {isSubmittingRequest ? <RefreshCw className="h-4 w-4 animate-spin" /> : "通訳を予約する"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 4. Plan Upgrade Application Modal */}
        <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
          <DialogContent className="max-w-md bg-background border rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-primary flex items-center gap-1.5">
                <Award className="h-5 w-5 text-indigo-500" />
                プランアップグレード申請
              </DialogTitle>
              <DialogDescription className="text-xs">
                より上位のプランへ変更し、各種利用回数上限の拡大や、専用の高度分析機能を解放します。
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpgradeSubmit} className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="upgradePlan" className="font-bold text-slate-500">変更先プラン</Label>
                <Select value={selectedUpgradePlan} onValueChange={setSelectedUpgradePlan}>
                  <SelectTrigger id="upgradePlan">
                    <SelectValue placeholder="プランを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {(company?.plan_type || "entry") === "entry" && <SelectItem value="basic">ベーシック（月額69,800円）</SelectItem>}
                    {["entry", "basic"].includes(company?.plan_type || "entry") && <SelectItem value="standard">スタンダード（月額98,000円）</SelectItem>}
                    {["entry", "basic", "standard"].includes(company?.plan_type || "entry") && <SelectItem value="advance">アドバンス（月額148,000円）</SelectItem>}
                    {["entry", "basic", "standard", "advance"].includes(company?.plan_type || "entry") && <SelectItem value="pro">プロ（月額198,000円）</SelectItem>}
                    {(company?.plan_type || "entry") !== "premium" && <SelectItem value="premium">プレミアム（月額298,000円）</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-[#1A3A7B] dark:text-indigo-200 rounded-xl leading-relaxed">
                アップグレードを行うことで、各機能制限が即時解除されます。差額分の月額保守費用は、次回請求時に調整されます。
              </div>

              <DialogFooter className="pt-4 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsUpgradeModalOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={!selectedUpgradePlan || isSubmittingRequest} className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold">
                  {isSubmittingRequest ? <RefreshCw className="h-4 w-4 animate-spin" /> : "アップグレード申請"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 5. Detailed Interactive Analysis Reports Modal */}
        <Dialog open={activeAnalysisDetail !== null} onOpenChange={() => setActiveAnalysisDetail(null)}>
          <DialogContent className="max-w-3xl bg-background border rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-primary flex items-center gap-2">
                <BarChart2 className="h-5.5 w-5.5 text-indigo-500" />
                {activeAnalysisDetail === "overtime" && "未払い残業リスク分析レポート"}
                {activeAnalysisDetail === "risk" && "外国人雇用適合性・労務リスク診断"}
                {activeAnalysisDetail === "retention" && "離職予測・エンゲージメント推移"}
                {activeAnalysisDetail === "kpi" && "雇用管理KPI成熟度・満足度監査"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                当月集計された御社専用の詳細データです。
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4 text-xs leading-relaxed max-h-[500px] overflow-y-auto">
              {activeAnalysisDetail === "overtime" && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-250 rounded-xl">
                    <strong>⚠️ 残業時間監査警告:</strong> 製造部所属の2名において、今月の時間外労働時間が36協定の特別条項限度（単月80時間）の80%を超える予測値（68時間）を検知しました。シフトの再調整を推奨します。
                  </div>
                  <table className="w-full text-left border border-collapse text-slate-700 dark:text-slate-350">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-zinc-800 font-bold border-b">
                        <th className="p-2.5">部署</th>
                        <th className="p-2.5">平均残業時間</th>
                        <th className="p-2.5">労基違反リスク</th>
                        <th className="p-2.5">推奨改善アクション</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2.5 font-bold">営業部</td>
                        <td className="p-2.5">15.5時間</td>
                        <td className="p-2.5 text-emerald-600 font-bold">低 (安全)</td>
                        <td className="p-2.5">現状維持</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2.5 font-bold">製造部</td>
                        <td className="p-2.5">48.2時間</td>
                        <td className="p-2.5 text-red-650 font-bold">高 (注意)</td>
                        <td className="p-2.5 font-semibold text-red-700 dark:text-red-400">【要介入】シフト再設計、業務の平準化</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2.5 font-bold">建設部</td>
                        <td className="p-2.5">32.0時間</td>
                        <td className="p-2.5 text-amber-600 font-bold">中 (観察)</td>
                        <td className="p-2.5">時間外労働ログのデイリー監視</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeAnalysisDetail === "risk" && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-250 rounded-xl">
                    <strong>✓ 適合性チェック完了:</strong> 法定帳票類および特定技能関係提出書類の整合性スコアは <strong>94%</strong> です。入管法・労基法に抵触する即時重大リスクは検知されませんでした。
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white">【指摘・推奨改善項目】</h5>
                    <ul className="list-disc pl-5 space-y-1.5 text-slate-655 dark:text-slate-400">
                      <li>特定技能スタッフ1名の転居後の住民票写しおよび居住地変更届出の回収が未完了です。（中リスク。2週間以内に回収完了してください）</li>
                      <li>労働条件通知書の一部項目（賃金の締め・支払日）が就業規則の改定内容と不整合になっています。（低リスク。次回更新時に自動修正版を反映予定）</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeAnalysisDetail === "retention" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 p-4 border rounded-xl flex-wrap gap-2">
                    <div>
                      <span className="text-slate-400 font-bold text-[10px] block">当月外国人スタッフ定着率</span>
                      <span className="text-2xl font-black text-[#1A3A7B] dark:text-[#5C85D3]">97.2%</span>
                      <span className="text-xs text-emerald-600 font-bold ml-2">(前月比 +0.5%)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 font-bold text-[10px] block">離職リスク注意者</span>
                      <span className="text-xl font-bold text-amber-600">2名 (中リスク)</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white">離職リスク低減ロードマップ</h5>
                    <p className="text-slate-655 dark:text-slate-400">
                      中リスクと判定されたスタッフは、日本語能力試験に向けた学習進捗の遅れ、および宿舎変更に伴う一時的な環境不満が主な要因です。提携の多言語通訳スタッフによる個別面談時にメンタルケアを実施します。
                    </p>
                  </div>
                </div>
              )}

              {activeAnalysisDetail === "kpi" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-xl text-center space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">雇用管理KPI総合スコア</span>
                      <span className="text-3xl font-black text-indigo-750 dark:text-indigo-400">88 / 100</span>
                    </div>
                    <div className="p-4 border rounded-xl text-center space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">教育プログラム完了率</span>
                      <span className="text-3xl font-black text-emerald-700">92%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white">主要評価項目</h5>
                    <div className="space-y-1.5 text-slate-655 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>在留カード期限管理更新の適時性:</span>
                        <span className="font-bold text-emerald-600">S (100%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>多言語安全教育講習受講状況:</span>
                        <span className="font-bold text-emerald-600">A (92%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>労働条件通知の不満把握適時性:</span>
                        <span className="font-bold text-amber-600">B (84%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 border-t mt-4">
              <Button type="button" onClick={() => setActiveAnalysisDetail(null)} className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold">
                閉じる
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    );
  }
  
  if (!metrics) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">データを読み込んでいます...</p>
      </div>
    );
  }
  const m = metrics;

  // Admin Dashboard Welcome Title
  return (
    <div className="space-y-8 font-sans bg-[#F1F5F9] -m-4 sm:-m-6 md:-m-8 p-6 sm:p-8 md:p-10 min-h-[calc(100vh-4rem)]">
      {/* Welcome Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <img src="/mawork-logo.jpg" alt="M-A WORK JP Logo" className="h-12 w-12 rounded-lg object-contain border shadow-sm" />
          <div className="border-l-4 border-l-[#1A3A7B] pl-4 py-1">
            <h1 className="text-3xl font-black text-[#1e293b] tracking-tight">MA WORK JP ポータル ダッシュボード</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              全体管理者としてログイン中：<span className="font-bold text-[#1e40af]">{user?.displayName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid for statistics cards */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Companies */}
        <Card className="bg-white rounded-xl shadow-md border-t-0 border-r-0 border-b-0 border-l-4 border-l-[#1A3A7B] p-6 flex flex-col justify-between h-full hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">登録企業数</span>
            <div className="p-2.5 rounded-full bg-blue-50 text-[#1A3A7B] shrink-0">
              <Building className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-black text-[#1e40af] tracking-tight">
              {m.totalCompanies}<span className="text-xs font-bold text-slate-400 ml-1">社</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">目標比: 100%</p>
          </div>
        </Card>

        {/* Card 2: Total Employees */}
        <Card className="bg-white rounded-xl shadow-md border-t-0 border-r-0 border-b-0 border-l-4 border-l-[#1A3A7B] p-6 flex flex-col justify-between h-full hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">総従業員数</span>
            <div className="p-2.5 rounded-full bg-blue-50 text-emerald-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-black text-[#1e40af] tracking-tight">
              {m.totalEmployees}<span className="text-xs font-bold text-slate-400 ml-1">名</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">今月登録の新規スタッフ含む</p>
          </div>
        </Card>

        {/* Card 3: Renewals in 3 months */}
        <Card className="bg-white rounded-xl shadow-md border-t-0 border-r-0 border-b-0 border-l-4 border-l-[#1A3A7B] p-6 flex flex-col justify-between h-full hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">3ヶ月以内の更新対象</span>
            <div className="p-2.5 rounded-full bg-blue-50 text-indigo-600 shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-black text-[#1e40af] tracking-tight">
              {m.renewalsIn3MonthsCount}<span className="text-xs font-bold text-slate-400 ml-1">名</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">ビザ・雇用契約の満了間近</p>
          </div>
        </Card>

        {/* Card 4: Alerts */}
        {(() => {
          const hasAlertWarning = m.alertsCount > 0;
          return (
            <Card className={`bg-white rounded-xl shadow-md border-t-0 border-r-0 border-b-0 border-l-4 p-6 flex flex-col justify-between h-full hover:shadow-lg transition-shadow ${hasAlertWarning ? "border-l-red-500 bg-red-50/5" : "border-l-[#1A3A7B]"}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${hasAlertWarning ? "text-red-700 font-black" : "text-slate-450"}`}>アラート</span>
                <div className={`p-2.5 rounded-full shrink-0 ${hasAlertWarning ? "bg-red-50 text-red-500" : "bg-blue-50 text-[#1A3A7B]"}`}>
                  <BellRing className={`h-5 w-5 ${hasAlertWarning ? "animate-bounce" : ""}`} />
                </div>
              </div>
              <div className="mt-4">
                <div className={`text-4xl font-black tracking-tight ${hasAlertWarning ? "text-red-600" : "text-[#1e40af]"}`}>
                  {m.alertsCount}<span className="text-xs font-bold text-slate-400 ml-1">件</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">即時対応が必要な警告</p>
              </div>
            </Card>
          );
        })()}
      </div>

      {/* Grid: Upcoming renewals & Alerts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left pane: Upcoming renewals */}
        <Card className="lg:col-span-2 border-t-0 border-r-0 border-b-0 border-l-4 border-l-[#1A3A7B] bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1.5 bg-[#1A3A7B] rounded-full shrink-0" />
              <CardTitle className="text-lg font-black text-[#1e293b] tracking-wide">
                近日中の更新予定
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">在留期限が残り3ヶ月未満の外国人従業員を表示します。</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            {m.upcomingRenewals.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-2">
                <Check className="h-8 w-8 text-emerald-600" />
                現在、3ヶ月以内に満了を迎える従業員はいません。
              </div>
            ) : (
              m.upcomingRenewals.map((emp: any) => (
                <div key={emp.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <Avatar className="h-10 w-10 border border-muted">
                    <AvatarFallback className="font-bold text-xs bg-indigo-50 text-indigo-600">{emp.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-sm text-slate-900 truncate">{emp.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      在留資格: <strong className="text-slate-800">{emp.statusOfResidence}</strong> / 期限日: <strong className="text-red-600 font-mono font-bold">{emp.expirationDate}</strong>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="text-xs font-semibold h-8 border-slate-200 text-slate-700 hover:bg-slate-50">
                    <Link href={`/dashboard/employees/${emp.id}`}>詳細表示</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right pane: Alerts & News */}
        <div className="space-y-8">
          {/* Alerts Card */}
          <Card className={`border-t-0 border-r-0 border-b-0 border-l-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow ${m.alerts.length > 0 ? "border-l-red-500 bg-red-50/5" : "border-l-[#1A3A7B]"}`}>
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-1.5 bg-[#1A3A7B] rounded-full shrink-0" />
                <CardTitle className="text-lg font-black text-[#1e293b] tracking-wide">
                  アラート一覧
                </CardTitle>
              </div>
              <CardDescription className="text-xs mt-1">対応待ちの期限通知を表示します。</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {m.alerts.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Check className="h-8 w-8 text-emerald-600 animate-pulse" />
                  現在アクティブなアラートはありません。
                </div>
              ) : (
                <ul className="space-y-3">
                  {m.alerts.map((alert: any) => (
                    <li key={alert.id} className="flex flex-col gap-2 p-3 bg-red-500/5 rounded-lg border border-red-500/10 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-bold ${alert.severity === "critical" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
                          {alert.severity === "critical" ? "🚨 重大警告" : "⚠️ 注意喚起"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{alert.dueDate}</span>
                      </div>
                      <p className="text-slate-600 font-semibold leading-relaxed">{alert.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* MA WORK News Card */}
          <Card className="border-t-0 border-r-0 border-b-0 border-l-4 border-l-[#1A3A7B] bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-1.5 bg-[#1A3A7B] rounded-full shrink-0" />
                <CardTitle className="text-lg font-black text-[#1e293b] tracking-wide">
                  MA WORK ニュース
                </CardTitle>
              </div>
              <CardDescription className="text-xs mt-1">最新の入管法改正やシステムアップデート情報。</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-background space-y-1.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">入管法改正</span>
                  <span className="text-[10px] text-slate-500">2026/06/01</span>
                </div>
                <h5 className="font-bold text-slate-800">特定技能の受入れ分野拡大に伴う新運用ガイドラインが公開されました</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">今回の改正に伴い、対象となる分野での受け入れ手続きや必要提出書類が一部更新されています。詳細はガイドラインを参照ください。</p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-background space-y-1.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">システム</span>
                  <span className="text-[10px] text-slate-500">2026/05/28</span>
                </div>
                <h5 className="font-bold text-slate-800">専門家宛て連絡テンプレートおよび自動メール作成機能の改善アップデート</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">士業や通訳者へ、ポータルからワンクリックで最適化された依頼メールを送信・ログ保存できる機能がダッシュボードへ実装されました。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom pane: Calendar & Quick access */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="border-t-0 border-r-0 border-b-0 border-l-4 border-l-[#1A3A7B] bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1.5 bg-[#1A3A7B] rounded-full shrink-0" />
              <CardTitle className="text-lg font-black text-[#1e293b] tracking-wide">
                カレンダー
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">満了期限などの期日管理用カレンダー。</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 flex justify-center">
            <Calendar className="border border-slate-100 rounded-lg p-2" />
          </CardContent>
        </Card>
        
        <Card className="border-t-0 border-r-0 border-b-0 border-l-4 border-l-[#1A3A7B] bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1.5 bg-[#1A3A7B] rounded-full shrink-0" />
              <CardTitle className="text-lg font-black text-[#1e293b] tracking-wide">
                企業クイックアクセス
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">登録されている企業プロフィールに素早くアクセスできます。</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {m.companies.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400 flex flex-col items-center justify-center space-y-3">
                <p className="font-medium">まだ登録がありません。まずは企業を登録しましょう</p>
                {user?.role === "admin" && (
                  <Button asChild className="bg-gradient-to-r from-[#1A3A7B] to-[#2B59C3] text-white hover:from-[#1A3A7B]/90 hover:to-[#2B59C3]/90 font-bold shadow-md h-10 px-4 border-none transition-all active:scale-[0.98]">
                    <Link href="/dashboard/companies/new">企業を新規登録する</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {m.companies.map((company: any) => (
                  <Button key={company.id} className="w-full justify-between hover:bg-slate-50 border-slate-100 bg-white text-slate-800 font-semibold h-11 px-4 rounded-xl shadow-sm transition-all hover:shadow" variant="outline" asChild>
                    <Link href={`/dashboard/companies/${company.id}`}>
                      <span className="flex items-center font-bold text-slate-850">
                        <Avatar className="mr-3 h-7 w-7 border border-slate-100">
                          <AvatarFallback className="bg-slate-50 text-slate-600 font-bold text-xs">{company.name.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        {company.name}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
