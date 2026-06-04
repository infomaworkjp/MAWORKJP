"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  Building, ArrowLeft, ShieldAlert, RefreshCw, Mail, Phone, MapPin, Check, 
  Sparkles, AlertCircle, FileCheck, Lock, Users, ShieldCheck, FileText, 
  Send, History, BookmarkCheck, TrendingUp, Landmark, FileSymlink, HelpCircle,
  Plus, Trash2, Edit2, Download, UserPlus, Info, Scale, Play, Video, Languages,
  Calculator
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getCompanyById, updateCompanySettings } from "@/app/actions/companies";
import { getLegalProfessionalById } from "@/app/actions/legal-pros";
import { 
  getEmployeesByCompanyId, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee 
} from "@/app/actions/employees";
import { sendExpertEmail, getEmailHistory } from "@/app/actions/emails";
import { saveTrainingLog, getTrainingLogsByCompanyId } from "@/app/actions/training";
import { getIndustryContent } from "@/lib/industryConfig";
import { ResidenceCardScanner } from "@/components/residence-card/scanner-card";
import { getRequestsByCompanyId } from "@/app/actions/requests";
import { ResidenceCardData } from "@/app/actions/scan-residence-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface CompanyWithId {
  id: string;
  name: string;
  address: string;
  industry: string;
  plan: "light" | "standard" | "premium";
  plan_type?: "entry" | "basic" | "standard" | "advance" | "pro" | "premium" | null;
  active_options?: string[] | null;
  status?: "active" | "suspended" | "invited" | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl: string | null;
  scrivenerName?: string | null;
  scrivenerEmail?: string | null;
  laborConsultantName?: string | null;
  laborConsultantEmail?: string | null;
  attorneyName?: string | null;
  attorneyEmail?: string | null;
  taxAccountantName?: string | null;
  taxAccountantEmail?: string | null;
  createdAt: string;
  updatedAt: string;
}

const getIncludedOptions = (plan: string): string[] => {
  switch (plan) {
    case "premium":
      return ["safety_education", "translation", "interpretation", "ai_audit", "expert_matching"];
    case "pro":
    case "advance":
      return ["safety_education", "translation", "interpretation", "ai_audit"];
    case "standard":
      return ["safety_education", "ai_audit"];
    case "basic":
      return ["interpretation"];
    case "entry":
    default:
      return [];
  }
};

const AVAILABLE_OPTIONS = [
  { key: "safety_education", name: "安全教育", amount: "15,000", label: "安全教育（15,000円）" },
  { key: "translation", name: "翻訳サービス", amount: "8,000〜", label: "翻訳サービス（8,000円〜）" },
  { key: "interpretation", name: "通訳サービス", amount: "10,000/時", label: "通訳サービス（10,000円/時）" },
  { key: "site_visit", name: "現場訪問", amount: "20,000", label: "現場訪問（20,000円）" },
  { key: "document_management", name: "契約書管理", amount: "5,000", label: "契約書管理（5,000円）" },
  { key: "ai_audit", name: "AI監査レポート", amount: "30,000", label: "AI監査レポート（30,000円）" },
  { key: "expert_matching", name: "専門家相談・士業連携", amount: "25,000", label: "専門家相談・士業連携（25,000円）" },
];

const getPlanDetails = (planName: string) => {
  const nameLower = (planName || "entry").toLowerCase();
  switch (nameLower) {
    case "premium":
      return {
        name: "プレミアムプラン (PREMIUM)",
        price: "月額 700,000円",
        color: "border-amber-400 bg-amber-50/10 dark:bg-amber-950/10 dark:border-amber-900",
        textColor: "text-amber-800 dark:text-amber-300",
        badgeColor: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-900",
        features: [
          { title: "AIコンプライアンス監査", desc: "雇用契約・労働条件通知の事前コンプライアンスチェック機能。" },
          { title: "エグゼクティブ・ダッシュボード", desc: "ESG経営スコアリングおよび受給可能助成金の自動提案。" },
          { title: "雇用契約リスク診断", desc: "適合性チェック・未払い残業リスク分析" },
          { title: "安全教育統括サポート", desc: "月4回の教育通訳・資料の完全多言語化" },
          { title: "在留資格総合管理支援", desc: "期限の完全管理・管理体制の構築サポート" },
          { title: "現場安全教育通訳（月4回） & 多言語相談窓口" }
        ]
      };
    case "pro":
      return {
        name: "プロプラン (PRO)",
        price: "月額 500,000円",
        color: "border-emerald-400 bg-emerald-50/10 dark:bg-emerald-950/10 dark:border-emerald-900",
        textColor: "text-emerald-800 dark:text-emerald-300",
        badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-900",
        features: [
          { title: "安全教育・教育用動画", desc: "外国人向けの安全教育多言語動画および受講状況ログ機能。" },
          { title: "現場訪問通訳サポート", desc: "月2回の現場訪問通訳サポート" },
          { title: "在留資格期限アラート・管理", desc: "期限のアラート管理および更新手続の専門家直接連携。" },
          { title: "多言語相談窓口", desc: "外国人従業員向けの常時多言語相談窓口" }
        ]
      };
    case "advance":
      return {
        name: "アドバンスプラン (ADVANCE)",
        price: "月額 350,000円",
        color: "border-purple-400 bg-purple-50/10 dark:bg-purple-950/10 dark:border-purple-900",
        textColor: "text-purple-800 dark:text-purple-300",
        badgeColor: "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-900",
        features: [
          { title: "在留資格管理（強化版）", desc: "期限の管理および提携行政書士との直接更新連携。" },
          { title: "多言語相談窓口", desc: "外国人従業員向けの多言語相談窓口（常時受付）" },
          { title: "月次定例報告", desc: "月1回の定例報告書の提出" },
          { title: "年1回総合雇用リスクチェック", desc: "年1回の総合的な雇用リスクチェック" }
        ]
      };
    case "standard":
      return {
        name: "スタンダードプラン (STANDARD)",
        price: "月額 200,000円",
        color: "border-indigo-400 bg-indigo-50/10 dark:bg-indigo-950/10 dark:border-indigo-900",
        textColor: "text-indigo-800 dark:text-indigo-300",
        badgeColor: "bg-indigo-100 text-indigo-900 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-900",
        features: [
          { title: "在留期限管理カレンダー", desc: "在留期限の自動管理および3ヶ月前からの期限警告アラート。" },
          { title: "メール・電話相談", desc: "手続きやトラブルに関する個別相談（月5回まで）" },
          { title: "年1回簡易雇用リスクチェック", desc: "年1回の簡易的な労務チェックの実施" }
        ]
      };
    case "basic":
      return {
        name: "ベーシックプラン (BASIC)",
        price: "月額 100,000円",
        color: "border-blue-400 bg-blue-50/10 dark:bg-blue-950/10 dark:border-blue-900",
        textColor: "text-blue-800 dark:text-blue-300",
        badgeColor: "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-900",
        features: [
          { title: "在留カードAI読取", desc: "在留カードスキャナーによる正確な情報の自動デジタル化。" },
          { title: "在留期限アラート通知", desc: "在留期限が迫った外国人従業員のアラート警告。" }
        ]
      };
    case "entry":
    case "light":
    default:
      return {
        name: "エントリープラン (ENTRY)",
        price: "月額 50,000円",
        color: "border-slate-300 bg-slate-50/10 dark:bg-zinc-950/20 dark:border-zinc-800",
        textColor: "text-slate-800 dark:text-zinc-300",
        badgeColor: "bg-slate-100 text-slate-900 border-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800",
        features: [
          { title: "従業員基本情報の登録・管理", desc: "外国人雇用に必要な情報の台帳管理機能。" },
          { title: "会社プロフィール閲覧", desc: "自社の登録内容および契約ステータスの確認。" }
        ]
      };
  }
};

export default function CompanyDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [company, setCompany] = useState<CompanyWithId | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [employeeFilter, setEmployeeFilter] = useState<string | null>(null);

  // Option Modal State
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [selectedOptionKey, setSelectedOptionKey] = useState("");
  const [isOptionConsentChecked, setIsOptionConsentChecked] = useState(false);
  const [isSavingOption, setIsSavingOption] = useState(false);

  // Save Option Handler
  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !selectedOptionKey || !isOptionConsentChecked || !user) return;
    setIsSavingOption(true);

    try {
      const selectedOpt = AVAILABLE_OPTIONS.find(o => o.key === selectedOptionKey);
      if (!selectedOpt) return;

      const currentOptions = company.active_options || [];
      if (currentOptions.includes(selectedOptionKey)) {
        toast({
          title: "すでに追加されています",
          description: `「${selectedOpt.name}」オプションは既にこの企業に追加されています。`,
          variant: "destructive"
        });
        setIsOptionModalOpen(false);
        return;
      }

      const updatedOptions = [...currentOptions, selectedOptionKey];
      const planVal = company.plan_type || company.plan || "entry";

      const res = await updateCompanySettings(
        user.uid,
        company.id,
        planVal as any,
        updatedOptions
      );

      if (res.success) {
        toast({
          title: "オプション追加完了",
          description: `「${selectedOpt.name}」オプションを追加しました。`,
        });
        
        // Refresh local data
        setCompany(prev => prev ? { ...prev, active_options: updatedOptions } : null);
        setIsOptionModalOpen(false);
        setSelectedOptionKey("");
        setIsOptionConsentChecked(false);
      } else {
        toast({
          title: "追加エラー",
          description: res.error || "オプションの追加に失敗しました。",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "エラー",
        description: "通信エラーが発生しました。",
        variant: "destructive"
      });
    } finally {
      setIsSavingOption(false);
    }
  };

  // Email Modal State
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [mailSubject, setMailSubject] = useState("");
  const [mailMessage, setMailMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientRole, setRecipientRole] = useState("");

  // Automatic Application State
  const [applyingEmployeeId, setApplyingEmployeeId] = useState<string | null>(null);

  // Employee Add/Edit Modal State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);
  const [isAiFilled, setIsAiFilled] = useState(false);

  // Safety Video Player Modal State
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<"ja" | "en" | "vi" | "es" | "pt" | "id">("ja");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [countdown, setCountdown] = useState(10);
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);
  const [trainingLogs, setTrainingLogs] = useState<any[]>([]);
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  const [empForm, setEmpForm] = useState({
    name: "",
    nationality: "",
    birthDate: "",
    gender: "男性",
    address: "",
    phone: "",
    email: "",
    statusOfResidence: "",
    cardNumber: "",
    expirationDate: "",
    passportNumber: "",
    passportExpirationDate: "",
    contractPeriod: "",
    status: "active" as "active" | "expiring_soon" | "expired" | "resigned",
    department: ""
  });

  // Read URL search query for initial tab activation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get("tab");
      if (tab) {
        setActiveTab(tab);
      }
      const filter = searchParams.get("filter");
      if (filter) {
        setEmployeeFilter(filter);
      }
    }
  }, []);

  // Guard: Protect route for admin or specific company user
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast({
          title: "認証エラー",
          description: "ログインが必要です。",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }
      if (user.role === "company" && user.companyId !== id) {
        toast({
          title: "権限エラー",
          description: "自社以外の企業詳細ページにはアクセスできません。",
          variant: "destructive",
        });
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, id, router, toast]);

  // Load all necessary page data
  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Get Company Details
      const response = await getCompanyById(id);
      if (response.success && response.data) {
        const compData = response.data as CompanyWithId;
        setCompany(compData);

        // 3. Get Company Employees
        const empRes = await getEmployeesByCompanyId(id);
        if (empRes.success && empRes.data) {
          setEmployees(empRes.data);
        }

        // 4. Get Training Logs
        const trainingRes = await getTrainingLogsByCompanyId(id);
        if (trainingRes.success && trainingRes.data) {
          setTrainingLogs(trainingRes.data);
        }

        // 5. Get Email History (Admin or Company)
        if (user?.role === "admin" || user?.role === "company") {
          setHistoryLoading(true);
          const historyRes = await getEmailHistory(id);
          if (historyRes.success && historyRes.data) {
            setEmailHistory(historyRes.data);
          }
          setHistoryLoading(false);
        }

        // 6. Get Requests History
        setRequestsLoading(true);
        const reqRes = await getRequestsByCompanyId(id);
        if (reqRes.success && reqRes.data) {
          setRequests(reqRes.data);
        }
        setRequestsLoading(false);
      } else {
        if (user?.role === "company") {
          toast({
            title: "会社プロフィール未登録",
            description: "自社のアカウント情報がまだ登録されていません。システム管理者に登録をご依頼ください。",
          });
        } else {
          toast({
            title: "取得失敗",
            description: response.error || "会社データが見つかりません。",
            variant: "destructive",
          });
        }
        router.push(user?.role === "admin" ? "/dashboard/companies" : "/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "エラー",
        description: "情報の取得中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "admin" || user.companyId === id)) {
      loadData();
    }
  }, [id, user]);

  const openMailModal = (name: string, email: string, templateType: string) => {
    setRecipientName(name);
    setRecipientEmail(email);
    setRecipientRole(templateType);
    setIsMailModalOpen(true);

    // Automatically load template
    setSelectedTemplate(templateType);
    if (!company) return;

    if (templateType === "none") {
      setMailSubject("");
      setMailMessage("");
      return;
    }

    const compName = company.name || "貴社名";
    const usrName = user?.displayName || "お名前";

    if (templateType === "visa") {
      setMailSubject(`【在留資格更新】在留期限更新に関する書類送付（${compName}）`);
      setMailMessage(`${name} 先生\n\nいつもお世話になっております。\nMA WORK JP システムです。\n\n${compName}様より、在留資格の更新手続きに係る書類送付およびご相談の依頼がございました。\n対象従業員の情報と提出資料の件につきまして、ご確認のほどよろしくお願い申し上げます。\n\nお手数ですが、ご確認いただき次第、進め方のご指示をいただけますと幸いです。\n何卒よろしくお願い申し上げます。`);
    } else if (templateType === "legal") {
      setMailSubject(`【リーガルチェック依頼】新規雇用契約のリーガルチェック依頼（${compName}）`);
      setMailMessage(`${name} 先生\n\nいつもお世話になっております。\nMA WORK JP システムです。\n\n${compName}様にて新規採用予定の外国人従業員に係る雇用契約内容につきまして、リーガルリスク（労働基準法および在留資格条件の整合性）のチェックをお願いしたく存じます。\n\n契約書の草案は別途共有させていただきます。\nご査収 of ほど、よろしくお願い申し上げます。`);
    } else if (templateType === "subsidy") {
      setMailSubject(`【助成金相談】雇用調整・育成に関する助成金申請のご相談（${compName}）`);
      setMailMessage(`${name} 先生\n\nいつもお世話になっております。\nMA WORK JP システムです。\n\n${compName}様において、従業員の教育訓練または雇用維持に関する助成金の申請を検討しております。\n現在のプランで受給可能な助成金の要件や、必要となる申請書類の準備についてアドバイスをいただけますでしょうか。\n\nよろしくお願い申し上げます。`);
    } else if (templateType === "translation") {
      setMailSubject(`【通訳・翻訳依頼】ご相談（${compName}/${usrName}）`);
      setMailMessage(`担当通訳・翻訳者様\n\nお世話になっております。\n${compName}/${usrName}です。\n\n通訳・翻訳の依頼について相談したくご連絡いたしました。\n\n■依頼内容：\n■希望日時/納期：\n■使用言語：`);
    } else if (templateType === "tax") {
      setMailSubject(`【税務相談】決算・確定申告に関するご相談（${compName}）`);
      setMailMessage(`担当税理士様\n\nいつもお世話になっております。\nMA WORK JP システムです。\n\n${compName}様より、決算および確定申告に係る税務相談のご依頼がございました。\n面談希望日や必要資料についてご教示いただけますと幸いです。\n\n何卒よろしくお願い申し上げます。`);
    }
  };

  // Load and apply template changes in email modal
  const handleTemplateChange = (tplVal: string) => {
    setSelectedTemplate(tplVal);
    if (!recipientName || !company) return;

    if (tplVal === "none") {
      setMailSubject("");
      setMailMessage("");
      return;
    }

    const compName = company.name || "貴社名";
    const usrName = user?.displayName || "お名前";
    let subjectText = "";
    let bodyText = "";

    if (tplVal === "visa") {
      subjectText = `【在留資格更新】在留期限更新に関する書類送付（${compName}）`;
      bodyText = `${recipientName} 先生\n\nいつもお世話になっております。\nMA WORK JP システムです。\n\n${compName}様より、在留資格の更新手続きに係る書類送付およびご相談の依頼がございました。\n対象従業員の情報と提出資料の件につきまして、ご確認のほどよろしくお願い申し上げます。\n\nお手数ですが、ご確認いただき次第、進め方のご指示をいただけますと幸いです。\n何卒よろしくお願い申し上げます。`;
    } else if (tplVal === "legal") {
      subjectText = `【リーガルチェック依頼】新規雇用契約のリーガルチェック依頼（${compName}）`;
      bodyText = `${recipientName} 先生\n\nいつもお世話になっております。\nMA WORK JP システムです。\n\n${compName}様にて新規採用予定の外国人従業員に係る雇用契約内容につきまして、リーガルリスク（労働基準法および在留資格条件の整合性）のチェックをお願いしたく存じます。\n\n契約書の草案は別途共有させていただきます。\nご査収 of ほど、よろしくお願い申し上げます。`;
    } else if (tplVal === "subsidy") {
      subjectText = `【助成金相談】雇用調整・育成に関する助成金申請のご相談（${compName}）`;
      bodyText = `${recipientName} 先生\n\nいつもお世話になっております。\nMA WORK JP システムです。\n\n${compName}様において、従業員の教育訓練または雇用維持に関する助成金の申請を検討しております。\n現在のプランで受給可能な助成金の要件や、必要となる申請書類の準備についてアドバイスをいただけますでしょうか。\n\nよろしくお願い申し上げます。`;
    } else if (tplVal === "translation") {
      subjectText = `【通訳・翻訳依頼】ご相談（${compName}/${usrName}）`;
      bodyText = `担当通訳・翻訳者様\n\nお世話になっております。\n${compName}/${usrName}です。\n\n通訳・翻訳の依頼について相談したくご連絡いたしました。\n\n■依頼内容：\n■希望日時/納期：\n■使用言語：`;
    } else if (tplVal === "tax") {
      subjectText = `【税務相談】決算・確定申告に関するご相談（${compName}）`;
      bodyText = `担当税理士様\n\nいつもお世話になっております。\nMA WORK JP システムです。\n\n${compName}様より、決算および確定申告に係る税務相談のご依頼がございました。\n面談希望日や必要資料についてご教示いただけますと幸いです。\n\n何卒よろしくお願い申し上げます。`;
    }

    setMailSubject(subjectText);
    setMailMessage(bodyText);
  };

  // Submit manual email
  const handleSendManualEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !recipientEmail) return;
    setIsSendingMail(true);

    try {
      const senderDisplayName = user?.displayName || "MA WORK JP 管理者";
      const res = await sendExpertEmail(
        company.id,
        recipientName,
        recipientEmail,
        mailSubject,
        mailMessage,
        "manual_email",
        senderDisplayName
      );

      if (res.success) {
        toast({
          title: "送信完了",
          description: "専門家への連絡メールを送信しました。",
        });
        setIsMailModalOpen(false);
        setMailSubject("");
        setMailMessage("");
        setSelectedTemplate("none");
        
        // Reload history log
        const historyRes = await getEmailHistory(company.id);
        if (historyRes.success && historyRes.data) {
          setEmailHistory(historyRes.data);
        }
      } else {
        toast({
          title: "送信エラー",
          description: res.error || "メールの送信に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "エラー",
        description: "通信エラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsSendingMail(false);
    }
  };

  // Execute automatic email application workflow for an employee
  const handleAutoApply = async (emp: any, targetRole: "scrivener" | "laborConsultant" = "scrivener") => {
    if (!company) return;

    const expertName = targetRole === "scrivener" ? company.scrivenerName : company.laborConsultantName;
    const expertEmail = targetRole === "scrivener" ? company.scrivenerEmail : company.laborConsultantEmail;
    const roleJapanese = targetRole === "scrivener" ? "行政書士" : "社会保険労務士";

    if (!expertName || !expertEmail) {
      toast({
        title: "設定エラー",
        description: `担当${roleJapanese}の名前またはメールアドレスが設定されていません。`,
        variant: "destructive"
      });
      return;
    }

    setApplyingEmployeeId(emp.id);

    try {
      let subject = "";
      let message = "";

      if (targetRole === "scrivener") {
        subject = `【自動申請連携】在留資格更新申請の代行依頼（${emp.name} 様）`;
        message = `${expertName} 先生\n\nいつもお世話になっております。\nMA WORK JP システムです。\n\n下記従業員の在留資格期限が迫っているため、更新申請手続きの代行を申請いたします。\n\n【対象従業員情報】\n・氏名: ${emp.name}\n・国籍: ${emp.nationality}\n・現在留資格: ${emp.statusOfResidence}\n・在留期限日: ${emp.expirationDate}\n・在留カード番号: ${emp.cardNumber || "未設定"}\n\n【必要書類】\n・在留カード写し（ポータル内データ参照可）\n・パスポート写し\n\n詳細の進め方について、ご指示をいただけますと幸いです。\n何卒よろしくお願い申し上げます。`;
      } else {
        subject = `【助成金相談】${emp.name}についてのご相談`;
        message = `${expertName} 先生\n\nいつもお世話になっております。\nMA WORK JP システムです。\n\n${company.name}様において、助成金の申請を検討しております。\n\n対象事業/内容：${emp.name}\n対象従業員範囲：${emp.nationality}\n目的：${emp.statusOfResidence}\n\n要件や必要となる申請書類の準備についてアドバイスをいただけますでしょうか。\n何卒よろしくお願い申し上げます。`;
      }

      const senderDisplayName = user?.displayName || "MA WORK JP システム";
      const res = await sendExpertEmail(
        company.id,
        expertName,
        expertEmail,
        subject,
        message,
        "auto_apply",
        senderDisplayName
      );

      if (res.success) {
        toast({
          title: "自動申請完了",
          description: `「${emp.name}」の専門家自動申請が完了し、履歴に記録されました。`,
        });

        // Reload data and history
        const historyRes = await getEmailHistory(company.id);
        if (historyRes.success && historyRes.data) {
          setEmailHistory(historyRes.data);
        }
      } else {
        toast({
          title: "申請エラー",
          description: res.error || "自動申請処理に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "エラー",
        description: "通信中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setApplyingEmployeeId(null);
    }
  };

  // Employee Form Open (Create mode)
  const handleOpenCreateEmpModal = () => {
    setEditingEmployee(null);
    setIsAiFilled(false);
    setEmpForm({
      name: "",
      nationality: "",
      birthDate: "",
      gender: "男性",
      address: "",
      phone: "",
      email: "",
      statusOfResidence: "",
      cardNumber: "",
      expirationDate: "",
      passportNumber: "",
      passportExpirationDate: "",
      contractPeriod: "",
      status: "active",
      department: ""
    });
    setIsEmpModalOpen(true);
  };

  // Employee Form Open (Edit mode)
  const handleOpenEditEmpModal = (emp: any) => {
    setEditingEmployee(emp);
    setIsAiFilled(false);
    setEmpForm({
      name: emp.name || "",
      nationality: emp.nationality || "",
      birthDate: emp.birthDate || "",
      gender: emp.gender || "男性",
      address: emp.address || "",
      phone: emp.phone || "",
      email: emp.email || "",
      statusOfResidence: emp.statusOfResidence || "",
      cardNumber: emp.cardNumber || "",
      expirationDate: emp.expirationDate || "",
      passportNumber: emp.passportNumber || "",
      passportExpirationDate: emp.passportExpirationDate || "",
      contractPeriod: emp.contractPeriod || "",
      status: emp.status || "active",
      department: emp.department || ""
    });
    setIsEmpModalOpen(true);
  };

  // AI OCR Scanner Completion handler
  const handleEmpScanComplete = (scannedData: ResidenceCardData) => {
    setEmpForm(prev => ({
      ...prev,
      name: scannedData.name || "",
      statusOfResidence: scannedData.statusOfResidence || "",
      expirationDate: scannedData.expirationDate || "",
      cardNumber: scannedData.cardNumber || "",
      nationality: scannedData.nationality || "",
      birthDate: scannedData.birthDate || "",
      // Clear manual details for new scanning entry
      gender: "男性",
      address: "",
      phone: "",
      email: "",
      passportNumber: "",
      passportExpirationDate: "",
      contractPeriod: "",
      status: "active",
      department: ""
    }));
    setIsAiFilled(true);
    setIsScannerModalOpen(false); // Close scanner modal
    setIsEmpModalOpen(true); // Open pre-filled form modal
    toast({
      title: "AIスキャン完了",
      description: "在留カードの読取情報をフォームに自動反映しました。追加項目を入力して保存してください。",
    });
  };

  // Save employee changes
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setIsSavingEmployee(true);

    try {
      const payload = {
        ...empForm,
        companyId: company.id
      };

      let res;
      if (editingEmployee) {
        res = await updateEmployee(editingEmployee.id, payload);
      } else {
        res = await createEmployee(payload);
      }

      if (res.success) {
        toast({
          title: editingEmployee ? "従業員情報更新完了" : "従業員登録成功",
          description: `「${empForm.name}」のデータを保存しました。`,
        });
        setIsEmpModalOpen(false);
        
        // Reload employee list
        const empRes = await getEmployeesByCompanyId(company.id);
        if (empRes.success && empRes.data) {
          setEmployees(empRes.data);
        }
      } else {
        toast({
          title: "保存エラー",
          description: res.error || "データの保存に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "システムエラー",
        description: "通信エラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsSavingEmployee(false);
    }
  };

  // Delete employee record
  const handleDeleteEmployee = async (empId: string, name: string) => {
    if (!confirm(`本当に「${name}」さんのデータを削除しますか？`)) return;

    try {
      const res = await deleteEmployee(empId);
      if (res.success) {
        toast({
          title: "削除完了",
          description: `「${name}」さんのデータを削除しました。`,
        });
        
        // Reload employee list
        const empRes = await getEmployeesByCompanyId(id);
        if (empRes.success && empRes.data) {
          setEmployees(empRes.data);
        }
      } else {
        toast({
          title: "削除エラー",
          description: res.error || "データの削除に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "エラー",
        description: "通信エラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  // Complete PDF Export Implementation with Local Japanese Font Embedding & Retry Fallbacks
  const handlePdfDownload = async () => {
    if (!company) return;
    
    toast({
      title: "PDFレポート生成中",
      description: "ローカルフォントファイルを読み込んでいます。しばらくお待ちください...",
    });

    let fontBase64: string | null = null;

    try {
      // 1. Fetch NotoSansJP font from local path with 3 retries
      const fontUrl = "/fonts/NotoSansJP-Regular.ttf";
      
      const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<Response> => {
        for (let i = 0; i < retries; i++) {
          try {
            const response = await fetch(url);
            if (response.ok) return response;
            console.warn(`Font fetch attempt ${i + 1} failed with status: ${response.status}`);
          } catch (err) {
            console.warn(`Font fetch attempt ${i + 1} encountered error:`, err);
          }
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
        throw new Error("ローカルフォントファイルを取得できませんでした。");
      };

      const response = await fetchWithRetry(fontUrl, 3, 800);
      const blob = await response.blob();
      
      const blobToBase64 = (b: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const base64 = base64data.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(b);
        });
      };

      fontBase64 = await blobToBase64(blob);
    } catch (fontError) {
      console.error("Failed to load local Japanese font:", fontError);
      toast({
        title: "フォント読み込み失敗 (警告)",
        description: "日本語フォントの読み込みに失敗しました。標準フォントでPDF生成を試みます（日本語が文字化けする可能性があります）。",
        variant: "destructive",
      });
    }

    try {
      // 2. Initialize jsPDF (A4 size: 210mm x 297mm)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // 3. Register NotoSansJP font if successfully loaded, otherwise fallback to helvetica
      const fontName = fontBase64 ? "NotoSansJP" : "helvetica";
      if (fontBase64) {
        const fontFilename = "NotoSansJP-Regular.ttf";
        doc.addFileToVFS(fontFilename, fontBase64);
        doc.addFont(fontFilename, "NotoSansJP", "normal");
      }
      doc.setFont(fontName);

      // 4. Design the layout
      const margin = 15;
      
      // Header: MA WORK JP (Top right)
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("MA WORK JP", 210 - margin, 15, { align: "right" });

      // Title: [Company Name] 所属従業員一覧 (Top left)
      doc.setFontSize(18);
      doc.setTextColor(26, 58, 123); // #1A3A7B
      doc.text(`${company.name} 所属従業員一覧`, margin, 28);

      // Output Date (Top right below system name)
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      const nowStr = new Date().toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(`出力日時: ${nowStr}`, 210 - margin, 28, { align: "right" });

      // Divider Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, 33, 210 - margin, 33);

      // 5. Prepare employee table rows
      const tableHeaders = [["氏名", "国籍", "在留資格", "期限満了日", "ステータス"]];
      const tableRows = employees.map((emp) => {
        let statusText = "有効";
        if (emp.status === "expiring_soon") {
          statusText = "更新手続き中";
        } else if (emp.status === "expired") {
          statusText = "期限切れ警告";
        } else if (emp.status === "resigned") {
          statusText = "退職・帰国";
        }
        return [
          emp.name || "",
          emp.nationality || "",
          emp.statusOfResidence || "",
          emp.expirationDate || "",
          statusText
        ];
      });

      // 6. Generate table via jspdf-autotable
      autoTable(doc, {
        startY: 38,
        head: tableHeaders,
        body: tableRows,
        styles: {
          font: fontName,
          fontStyle: "normal",
          fontSize: 9,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [26, 58, 123], // #1A3A7B primary brand color
          textColor: [255, 255, 255],
          fontStyle: "normal",
        },
        columnStyles: {
          0: { cellWidth: 50 }, // Name
          1: { cellWidth: 30 }, // Nationality
          2: { cellWidth: 35 }, // Status of Residence
          3: { cellWidth: 35 }, // Expiration Date
          4: { cellWidth: 30 }, // Status
        },
        margin: { left: margin, right: margin },
        theme: "striped",
      });

      // 7. Download PDF
      doc.save(`${company.name}_従業員一覧.pdf`);

      toast({
        title: "PDF出力完了",
        description: "PDFファイルのダウンロードが完了しました。",
      });
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      toast({
        title: "PDF出力エラー",
        description: error.message || "PDFの出力中に致命的なエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  // Complete PDF Export for AI Audit Report
  const handleAuditPdfDownload = async () => {
    if (!company) return;
    
    toast({
      title: "PDFレポート生成中",
      description: "ローカルフォントファイルを読み込んでいます。しばらくお待ちください...",
    });

    let fontBase64: string | null = null;

    try {
      // 1. Fetch NotoSansJP font from local path with 3 retries
      const fontUrl = "/fonts/NotoSansJP-Regular.ttf";
      
      const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<Response> => {
        for (let i = 0; i < retries; i++) {
          try {
            const response = await fetch(url);
            if (response.ok) return response;
            console.warn(`Font fetch attempt ${i + 1} failed with status: ${response.status}`);
          } catch (err) {
            console.warn(`Font fetch attempt ${i + 1} encountered error:`, err);
          }
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
        throw new Error("ローカルフォントファイルを取得できませんでした。");
      };

      const response = await fetchWithRetry(fontUrl, 3, 800);
      const blob = await response.blob();
      
      const blobToBase64 = (b: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const base64 = base64data.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(b);
        });
      };

      fontBase64 = await blobToBase64(blob);
    } catch (fontError) {
      console.error("Failed to load local Japanese font:", fontError);
      toast({
        title: "フォント読み込み失敗 (警告)",
        description: "日本語フォントの読み込みに失敗しました。標準フォントでPDF生成を試みます（日本語が文字化けする可能性があります）。",
        variant: "destructive",
      });
    }

    try {
      // 2. Initialize jsPDF (A4 size: 210mm x 297mm)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // 3. Register NotoSansJP font if successfully loaded, otherwise fallback to helvetica
      const fontName = fontBase64 ? "NotoSansJP" : "helvetica";
      if (fontBase64) {
        const fontFilename = "NotoSansJP-Regular.ttf";
        doc.addFileToVFS(fontFilename, fontBase64);
        doc.addFont(fontFilename, "NotoSansJP", "normal");
      }
      doc.setFont(fontName);

      // 4. Design the layout
      const margin = 20; // 20mm margins for a cleaner letter look
      
      // Top Header Info
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("MA WORK JP - AIコンプライアンス監査レポート", margin, 15);
      
      // Right side print date
      const nowStr = new Date().toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      doc.text(`発行日: ${nowStr}`, 210 - margin, 15, { align: "right" });

      // Divider Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, 18, 210 - margin, 18);

      // Document Title
      doc.setFontSize(22);
      doc.setTextColor(26, 58, 123); // #1A3A7B Primary Brand Color
      doc.text("AIコンプライアンス監査レポート", margin, 32);

      // Basic Information Header
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("■ 対象企業基本情報", margin, 45);

      // Draw Company Info Box
      doc.setFillColor(248, 250, 252); // slate-50 background
      doc.setDrawColor(226, 232, 240); // slate-200 border
      doc.setLineWidth(0.3);
      doc.rect(margin, 49, 210 - margin * 2, 32, "FD");

      // Company Info details
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(`企業名: ${company.name}`, margin + 5, 56);
      doc.text(`業種: ${company.industry || "未設定"}`, margin + 5, 62);
      doc.text(`所在地: ${company.address || "未設定"}`, margin + 5, 68);
      doc.text(`従業員数: ${employees.length} 名`, margin + 5, 74);

      // Draw Score Badge on the right inside the company info box
      doc.setFillColor(209, 250, 229); // emerald-100 (emerald bg)
      doc.setDrawColor(167, 243, 208); // emerald-200 border
      doc.rect(210 - margin - 45, 53, 40, 24, "FD");
      
      doc.setFontSize(8);
      doc.setTextColor(6, 95, 70); // emerald-800
      doc.text("労務適合スコア", 210 - margin - 25, 59, { align: "center" });
      
      doc.setFontSize(20);
      doc.text("A+", 210 - margin - 25, 71, { align: "center" });

      // Audit Checklist Section
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("■ 監査チェック項目詳細", margin, 92);

      // Prepare data for Table
      const headers = [["監査チェック項目", "ステータス", "適合度"]];
      const rows = [
        ["在留資格許容活動との適合性", "適合", "100%"],
        ["雇用契約における重要事項説明", "適合", "100%"],
        ["最低労働条件・賃金基準", "適合", "100%"],
        ["時間外労働・残業管理状態", "一部確認推奨", "-"],
      ];

      autoTable(doc, {
        startY: 96,
        head: headers,
        body: rows,
        styles: {
          font: fontName,
          fontSize: 9,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [26, 58, 123], // Brand color #1A3A7B
          textColor: [255, 255, 255],
          fontStyle: "normal",
        },
        columnStyles: {
          0: { cellWidth: 90 }, // Audit item
          1: { cellWidth: 40 }, // Status
          2: { cellWidth: 40 }, // Compliance rate
        },
        margin: { left: margin, right: margin },
        theme: "striped",
      });

      // Feedback Advice Section
      let finalY = (doc as any).lastAutoTable.finalY + 12;

      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("■ AI監査フィードバックアドバイス", margin, finalY);

      // Feedback Text background box
      finalY += 4;
      const adviceText = "現在、在留カードデータおよび雇用契約整合性には一切 of 違反の兆候は見られません。時間外労働に関して、建設現場での夏期超過勤務（時間外上限規制）に配慮し、勤怠ログの毎週チェックをおすすめします。";
      
      const splitText = doc.splitTextToSize(adviceText, 210 - margin * 2 - 10);
      const textHeight = splitText.length * 5 + 4; // 5mm per line

      doc.setFillColor(239, 246, 255); // blue-50 background
      doc.setDrawColor(191, 219, 254); // blue-200 border
      doc.rect(margin, finalY, 210 - margin * 2, textHeight + 6, "FD");

      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(splitText, margin + 5, finalY + 7);

      // Footer notice
      const footerY = 280;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("本レポートはAIによる自動監査結果であり、最終的な法的適合性を保証するものではありません。", margin, footerY);
      doc.text("必要に応じて、担当の行政書士または社会保険労務士にご相談ください。", margin, footerY + 4);

      // Save the PDF
      doc.save(`Audit_Report_${company.name}.pdf`);

      toast({
        title: "PDF出力完了",
        description: "PDF監査レポートのダウンロードが完了しました。",
      });
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      toast({
        title: "PDF出力エラー",
        description: error.message || "PDFの出力中に致命的なエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  // Open Video Player Modal Handler
  const openVideoPlayer = (video: any) => {
    setSelectedVideo(video);
    setSelectedLanguage("ja");
    
    // Default to the first employee if available
    if (employees && employees.length > 0) {
      setSelectedEmployeeId(employees[0].id);
    } else {
      setSelectedEmployeeId("");
    }
    
    setCountdown(10);
    setIsCountdownComplete(false);
    setIsPlayerModalOpen(true);
  };

  // Manage countdown timer for safety video training
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (isPlayerModalOpen && !isCountdownComplete && selectedEmployeeId) {
      timerId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsCountdownComplete(true);
            clearInterval(timerId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isPlayerModalOpen, isCountdownComplete, selectedEmployeeId]);

  // Load YouTube Iframe API dynamically
  useEffect(() => {
    if (isPlayerModalOpen) {
      if (!(window as any).YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }
  }, [isPlayerModalOpen]);

  // Initialize YT Player and poll current time
  useEffect(() => {
    let intervalId: any;
    let ytPlayer: any;
    let timer: any;

    if (isPlayerModalOpen && selectedVideo) {
      const checkReady = () => {
        if ((window as any).YT && (window as any).YT.Player) {
          try {
            ytPlayer = new (window as any).YT.Player("yt-player", {
              events: {
                onStateChange: (event: any) => {
                  if (event.data === (window as any).YT.PlayerState.PLAYING) {
                    startPolling();
                  } else {
                    stopPolling();
                  }
                },
              },
            });
            setPlayer(ytPlayer);
          } catch (e) {
            console.error("Error creating YT.Player:", e);
          }
        } else {
          timer = setTimeout(checkReady, 200);
        }
      };

      const startPolling = () => {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
          if (ytPlayer && typeof ytPlayer.getCurrentTime === "function") {
            setCurrentTime(ytPlayer.getCurrentTime());
          }
        }, 250);
      };

      const stopPolling = () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      };

      // Give iframe element some time to render in DOM
      timer = setTimeout(checkReady, 500);

      return () => {
        clearTimeout(timer);
        if (intervalId) clearInterval(intervalId);
        setPlayer(null);
        setCurrentTime(0);
      };
    }
  }, [isPlayerModalOpen, selectedVideo]);

  // Find active segment index to optimize auto-scroll triggers
  const activeSegmentIndex = (selectedVideo && selectedVideo.scripts && selectedVideo.scripts[selectedLanguage])
    ? selectedVideo.scripts[selectedLanguage].findIndex((seg: any) => currentTime >= seg.start && currentTime < seg.end)
    : -1;

  // Auto-scroll active script segment into view
  useEffect(() => {
    if (scriptContainerRef.current) {
      const activeElement = scriptContainerRef.current.querySelector(".active-script-segment");
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeSegmentIndex]);

  // Click-to-seek translation text
  const handleSegmentClick = (start: number) => {
    if (player && typeof player.seekTo === "function") {
      player.seekTo(start, true);
      if (typeof player.playVideo === "function") {
        player.playVideo();
      }
    }
  };

  // Submit Safety Training Log to Database
  const handleSaveTrainingLog = async () => {
    if (!company || !selectedVideo || !selectedEmployeeId) return;
    setIsSavingLog(true);

    try {
      const selectedEmpObj = employees.find(e => e.id === selectedEmployeeId);
      const empName = selectedEmpObj ? selectedEmpObj.name : "不明な従業員";
      
      const res = await saveTrainingLog(
        selectedEmployeeId,
        company.id,
        selectedVideo.id,
        selectedVideo.title
      );

      if (res.success) {
        toast({
          title: "受講完了を記録しました",
          description: `「${empName}」の ${selectedVideo.title} 受講履歴を保存しました。`,
        });
        
        // Reload training logs
        const trainingRes = await getTrainingLogsByCompanyId(company.id);
        if (trainingRes.success && trainingRes.data) {
          setTrainingLogs(trainingRes.data);
        }

        // Close modal
        setIsPlayerModalOpen(false);
      } else {
        toast({
          title: "受講記録エラー",
          description: res.error || "受講記録の保存に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "エラー",
        description: "通信エラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsSavingLog(false);
    }
  };

  // Trigger simulated upgrade consultation
  const handleUpgradeConsult = () => {
    toast({
      title: "アップグレード申請受付",
      description: "プランのアップグレードに関するご相談を受け付けました。担当者より追ってご連絡いたします。",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Final role guard check
  if (!user || (user.role === "company" && user.companyId !== id)) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h2 className="text-xl font-bold">アクセス権限がありません</h2>
        <p className="text-muted-foreground text-sm">
          この企業のデータにアクセスする権限がありません。
        </p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-bold">企業データが見つかりません</h2>
      </div>
    );
  }

  if (user?.role === "company") {
    const planInfo = getPlanDetails(company.plan_type || company.plan || "entry");

    return (
      <div className="space-y-8 max-w-6xl mx-auto font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild className="h-9 w-9">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-primary tracking-tight">{company.name} プロフィール</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${planInfo.badgeColor}`}>
                  {(company.plan_type || company.plan || "entry").toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                自社の基本情報およびご契約状況を管理する画面です。
              </p>
            </div>
          </div>
          <Button variant="outline" asChild size="sm">
            <Link href="/dashboard">ダッシュボードへ戻る</Link>
          </Button>
        </div>

        {/* 2-Column Responsive Layout (Left 1/3, Right 2/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (1/3 width on desktop) */}
          <div className="lg:col-span-1 space-y-6">
            {/* 1. 自社プロフィール */}
            <Card className="shadow-sm border border-border bg-white dark:bg-zinc-900">
              <CardHeader className="bg-muted/15 pb-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-primary">
                  <Building className="h-4 w-4 text-[#1A3A7B]" /> 自社プロフィール
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-sm leading-relaxed">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">企業名</Label>
                  <p className="font-semibold text-primary">{company.name}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">住所</Label>
                  <p className="font-semibold text-primary">{company.address || "未設定"}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">電話番号</Label>
                  <p className="font-semibold text-primary">{company.contactPhone || "未設定"}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">窓口担当者</Label>
                  <p className="font-semibold text-primary">{company.contactName}</p>
                  <p className="text-xs text-muted-foreground">{company.contactEmail}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">業種</Label>
                  <p className="font-semibold text-primary">{company.industry}</p>
                </div>
              </CardContent>
            </Card>

            {/* 2. 現在のプラン */}
            <Card className={`shadow-sm border-2 ${planInfo.color}`}>
              <CardHeader className="border-b border-muted/80 pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground">現在のご契約プラン</span>
                  <CardTitle className="text-sm font-extrabold text-primary flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                    {planInfo.name}
                  </CardTitle>
                </div>
                <div className="mt-2">
                  <p className="text-base font-black text-indigo-900 dark:text-indigo-200">{planInfo.price}</p>
                  <p className="text-[10px] text-muted-foreground">※月額定額保守費用</p>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-xs font-bold text-primary flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-indigo-500" />
                  提供される主なサポート内容
                </h3>
                <div className="space-y-2.5 text-xs">
                  {planInfo.features.map((feature: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-start p-2.5 rounded-lg bg-white/70 dark:bg-zinc-950/60 border border-muted/50">
                      <div className="p-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 rounded-full shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary">
                          {typeof feature === "string" ? feature : feature.title}
                        </h4>
                        {typeof feature !== "string" && feature.desc && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{feature.desc}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 3. 外部専門家 */}
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-muted/15 pb-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-primary">
                  <Landmark className="h-4.5 w-4.5 text-indigo-600" />
                  外部専門家・顧問ネットワーク
                </CardTitle>
                <CardDescription className="text-xs">
                  自社を担当している士業専門家窓口および緊急連絡先です。
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Scrivener */}
                  <div
                    onClick={() => {
                      window.location.href = `mailto:${company.scrivenerEmail || "sato@legal-office.com"}`;
                    }}
                    className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-md hover:bg-white/95 dark:hover:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-900 w-fit">
                          <FileCheck className="h-3.5 w-3.5 shrink-0" />
                          担当行政書士
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          対応可能
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-xs">
                          行
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-primary truncate">{company.scrivenerName || "佐藤 護"}</h4>
                          <div className="text-[11px] text-muted-foreground break-all flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{company.scrivenerEmail || "sato@legal-office.com"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Labor Consultant */}
                  <div
                    onClick={() => {
                      window.location.href = `mailto:${company.laborConsultantEmail || "suzuki@sr-office.com"}`;
                    }}
                    className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-md hover:bg-white/95 dark:hover:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-900 w-fit">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          担当社労士
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                          オンライン
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br from-emerald-400 to-teal-600 text-xs">
                          労
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-primary truncate">{company.laborConsultantName || "鈴木 茂"}</h4>
                          <div className="text-[11px] text-muted-foreground break-all flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{company.laborConsultantEmail || "suzuki@sr-office.com"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Attorney */}
                  <div
                    onClick={() => {
                      window.location.href = `mailto:${company.attorneyEmail || "tanaka@law-office.com"}`;
                    }}
                    className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-md hover:bg-white/95 dark:hover:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-100 dark:border-amber-900 w-fit">
                          <Scale className="h-3.5 w-3.5 shrink-0" />
                          担当弁護士
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          対応可能
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br from-amber-400 to-orange-600 text-xs">
                          弁
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-primary truncate">{company.attorneyName || "田中 誠"}</h4>
                          <div className="text-[11px] text-muted-foreground break-all flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{company.attorneyEmail || "tanaka@law-office.com"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Translator & Interpreter Advisor */}
                  <div
                    onClick={() => {
                      window.location.href = `mailto:info@mawork.jp`;
                    }}
                    className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-md hover:bg-white/95 dark:hover:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-800 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-md border border-purple-100 dark:border-purple-900 w-fit">
                          <Languages className="h-3.5 w-3.5 shrink-0" />
                          翻訳通訳顧問
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                          オンライン
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br from-purple-400 to-fuchsia-600 text-xs">
                          訳
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-primary truncate">MAWORKJP</h4>
                          <div className="text-[11px] text-muted-foreground break-all flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">info@mawork.jp</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. Emergency Contact */}
                  <div
                    onClick={() => {
                      window.location.href = `tel:090-9854-6498`;
                    }}
                    className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-md hover:bg-white/95 dark:hover:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-200 sm:col-span-2"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-800 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-md border border-red-100 dark:border-red-900 w-fit">
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                          緊急連絡先
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                          <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                          24時間受付
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br from-red-500 to-rose-600 text-xs">
                          緊
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-primary leading-tight">ケガやトラブルの際の緊急ダイヤル</h4>
                          <div className="text-[11.5px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-mono font-bold">📞 090-9854-6498</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. 採用ネットワーク */}
            <Card className="shadow-sm border border-border bg-white dark:bg-zinc-900">
              <CardHeader className="bg-muted/15 pb-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-primary">
                  <UserPlus className="h-4.5 w-4.5 text-indigo-600" />
                  外部連携求人・採用ネットワーク
                </CardTitle>
                <CardDescription className="text-xs">
                  外国人採用を円滑に行うための、各種求人メディアおよび提携パートナー連携状況です。
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Partner 1 */}
                  <div className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-primary">MA WORK キャリア</h4>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        連携中
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      特定技能・技術人文知識国際業務の求人票をベトナム、ネパール、インドネシアの現地求職者へダイレクト配信。
                    </p>
                  </div>

                  {/* Partner 2 */}
                  <div className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-primary">Indeed 求人連携</h4>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        連携中
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Indeedの多言語検索エンジンに向けて、システムから外国人募集案件を自動インデックス連携。
                    </p>
                  </div>

                  {/* Partner 3 */}
                  <div className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-primary">マイナビ転職 (グローバル)</h4>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">
                        一時停止中
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      国内在住の転職・キャリアアップ希望者向けのイベントおよび求人広告掲載サービスとのAPI連携。
                    </p>
                  </div>

                  {/* Partner 4 */}
                  <div className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-primary">提携海外送り出し機関</h4>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        対応可能
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      ベトナム・ネパール・インドネシア・フィリピンの政府公認送り出し機関による現地事前研修プログラムとの提携。
                    </p>
                  </div>

                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      </div>
    );
  }



  const planType = company.plan_type || company.plan || "entry";
  const activeOptions = (company as any).active_options || [];
  const includedOptions = getIncludedOptions(planType);
  const optionsToDisplay = AVAILABLE_OPTIONS.filter(
    (opt) => !activeOptions.includes(opt.key) && !includedOptions.includes(opt.key)
  );

  const isVisaAllowed = ["basic", "standard", "advance", "pro", "premium"].includes(planType) || activeOptions.includes("visa_scanner");
  const isSafetyAllowed = ["pro", "premium"].includes(planType) || activeOptions.includes("safety_education");
  const isAiAuditAllowed = planType === "premium" || activeOptions.includes("ai_audit");
  const isExecutiveAllowed = ["advance", "pro", "premium"].includes(planType) || activeOptions.includes("expert_matching");

  const planInfo = getPlanDetails(planType);
  const indContent = getIndustryContent(company.industry);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          {user.role === "admin" && (
            <Button variant="outline" size="icon" asChild className="h-9 w-9">
              <Link href="/dashboard/companies">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-primary tracking-tight">{company.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${planInfo.badgeColor}`}>
                {planType.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              業種: {company.industry} | 住所: {company.address}
            </p>
          </div>
        </div>

        {user.role === "admin" && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setSelectedOptionKey("");
                setIsOptionConsentChecked(false);
                setIsOptionModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm h-9"
            >
              <Plus className="h-3.5 w-3.5" />
              オプション機能を追加する
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/companies/edit/${company.id}`}>
                企業情報を編集
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        {user.role === "admin" && (
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto p-1 gap-1.5 bg-muted/65 rounded-xl border">
            <TabsTrigger value="profile" className="font-bold text-xs py-2.5 rounded-lg transition-all">
              プロフィール
            </TabsTrigger>
            <TabsTrigger value="employees" className="font-bold text-xs py-2.5 rounded-lg transition-all">
              従業員一覧
            </TabsTrigger>
            <TabsTrigger
              value="visa"
              className="font-bold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1"
            >
              在留期限・更新予定
              {!isVisaAllowed && (
                <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="font-bold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1"
            >
              安全教育・テンプレート
              {!isSafetyAllowed && (
                <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="ai-audit"
              className="font-bold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1"
            >
              AIコンプライアンス
              {!isAiAuditAllowed && (
                <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="executive"
              className="font-bold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1"
            >
              エグゼクティブDB
              {!isExecutiveAllowed && (
                <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="profile" className="space-y-6 outline-none focus:ring-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 shadow-sm border border-border">
              <CardHeader className="bg-muted/15 pb-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-primary">
                  <Building className="h-4 w-4 text-[#1A3A7B]" />
                  企業情報
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-sm leading-relaxed">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">企業名</Label>
                  <p className="font-semibold text-primary">{company.name}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">業種</Label>
                  <p className="font-semibold text-primary">{company.industry}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    住所
                  </Label>
                  <p className="font-semibold text-primary">{company.address || "未設定"}</p>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">窓口担当者</Label>
                  <p className="font-semibold text-primary">{company.contactName}</p>
                  <div className="text-xs text-muted-foreground space-y-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {company.contactEmail}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {company.contactPhone}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`lg:col-span-2 shadow-sm border-2 ${planInfo.color}`}>
              <CardHeader className="border-b border-muted/80 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">現在のご契約プラン</span>
                    <CardTitle className="text-lg font-extrabold text-primary flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                      {planInfo.name}
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-indigo-900 dark:text-indigo-200">{planInfo.price}</p>
                    <p className="text-[10px] text-muted-foreground">※月額定額保守費用</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-xs font-bold text-primary flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-indigo-500" />
                  提供される主なサポート内容
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {planInfo.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-2.5 rounded-lg bg-white/70 dark:bg-zinc-950/60 border border-muted/50">
                      <div className="p-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 rounded-full shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary">
                          {typeof feature === "string" ? feature : feature.title}
                        </h4>
                        {feature.desc && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{feature.desc}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-sm border border-border">
              <CardHeader className="bg-muted/15 pb-4 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-primary">
                  <Landmark className="h-4.5 w-4.5 text-indigo-600" />
                  外部専門家・顧問ネットワーク（在留資格・労務・リーガル）
                </CardTitle>
                <CardDescription className="text-xs">
                  本企業を担当している士業専門家窓口です。各種手続きの代行や労務相談を行えます。
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* 1. Scrivener */}
                  <div
                    onClick={() => {
                      window.location.href = `mailto:${company.scrivenerEmail || "sato@legal-office.com"}`;
                    }}
                    className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-md hover:bg-white/95 dark:hover:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-900 w-fit">
                          <FileCheck className="h-3.5 w-3.5 shrink-0" />
                          担当行政書士
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          対応可能
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-xs">
                          行
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-primary truncate">{company.scrivenerName || "佐藤 護"}</h4>
                          <div className="text-[11px] text-muted-foreground break-all flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{company.scrivenerEmail || "sato@legal-office.com"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {user.role === "admin" && (company.scrivenerEmail || "sato@legal-office.com") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMailModal(company.scrivenerName || "佐藤 護", company.scrivenerEmail || "sato@legal-office.com", "visa");
                        }}
                        className="w-full text-xs font-bold text-[#1A3A7B] border-[#1A3A7B]/20 hover:bg-[#1A3A7B]/5"
                      >
                        ✉️ メールを送信
                      </Button>
                    )}
                  </div>

                  {/* 2. Labor Consultant */}
                  <div
                    onClick={() => {
                      window.location.href = `mailto:${company.laborConsultantEmail || "suzuki@sr-office.com"}`;
                    }}
                    className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-md hover:bg-white/95 dark:hover:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-900 w-fit">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          担当社労士
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                          オンライン
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br from-emerald-400 to-teal-600 text-xs">
                          労
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-primary truncate">{company.laborConsultantName || "鈴木 茂"}</h4>
                          <div className="text-[11px] text-muted-foreground break-all flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{company.laborConsultantEmail || "suzuki@sr-office.com"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {user.role === "admin" && (company.laborConsultantEmail || "suzuki@sr-office.com") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMailModal(company.laborConsultantName || "鈴木 茂", company.laborConsultantEmail || "suzuki@sr-office.com", "subsidy");
                        }}
                        className="w-full text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50/50"
                      >
                        ✉️ メールを送信
                      </Button>
                    )}
                  </div>

                  {/* 3. Attorney */}
                  <div
                    onClick={() => {
                      window.location.href = `mailto:${company.attorneyEmail || "tanaka@law-office.com"}`;
                    }}
                    className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-md hover:bg-white/95 dark:hover:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-100 dark:border-amber-900 w-fit">
                          <Scale className="h-3.5 w-3.5 shrink-0" />
                          担当弁護士
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          対応可能
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br from-amber-400 to-orange-600 text-xs">
                          弁
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-primary truncate">{company.attorneyName || "田中 誠"}</h4>
                          <div className="text-[11px] text-muted-foreground break-all flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{company.attorneyEmail || "tanaka@law-office.com"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {user.role === "admin" && (company.attorneyEmail || "tanaka@law-office.com") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMailModal(company.attorneyName || "田中 誠", company.attorneyEmail || "tanaka@law-office.com", "legal");
                        }}
                        className="w-full text-xs font-bold text-amber-700 border-amber-200 hover:bg-amber-50/50"
                      >
                        ✉️ メールを送信
                      </Button>
                    )}
                  </div>

                  {/* 4. Translator & Interpreter Advisor */}
                  <div
                    onClick={() => {
                      window.location.href = `mailto:info@mawork.jp`;
                    }}
                    className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-md hover:bg-white/95 dark:hover:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-800 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-md border border-purple-100 dark:border-purple-900 w-fit">
                          <Languages className="h-3.5 w-3.5 shrink-0" />
                          翻訳通訳顧問
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                          オンライン
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br from-purple-400 to-fuchsia-600 text-xs">
                          訳
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-primary truncate">MAWORKJP</h4>
                          <div className="text-[11px] text-muted-foreground break-all flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">info@mawork.jp</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {user.role === "admin" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMailModal("MAWORKJP", "info@mawork.jp", "translation");
                        }}
                        className="w-full text-xs font-bold text-purple-700 border-purple-200 hover:bg-purple-50/50"
                      >
                        ✉️ メールを送信
                      </Button>
                    )}
                  </div>

                  {/* 5. Emergency Contact */}
                  <div
                    onClick={() => {
                      window.location.href = `tel:090-9854-6498`;
                    }}
                    className="p-4 rounded-xl border bg-white/70 dark:bg-zinc-950/60 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-md hover:bg-white/95 dark:hover:bg-zinc-900/80 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-800 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-md border border-red-100 dark:border-red-900 w-fit">
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                          緊急連絡
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                          <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                          24時間受付
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br from-red-500 to-rose-600 text-xs">
                          緊
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-primary leading-tight">ケガやトラブルの際電話をする</h4>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-mono">📞 090-9854-6498</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {user.role === "admin" && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs font-bold text-red-700 border-red-200 hover:bg-red-50/50"
                      >
                        <a href="tel:090-9854-6498">📞 電話をかける</a>
                      </Button>
                    )}
                  </div>
                </div>

              {user.role !== "admin" && (
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border mt-4">
                  ※ 企業アカウントからは連絡先確認のみ行えます。メール送信は管理ポータル側へご依頼ください。
                </div>
              )}

              {/* Dialog for emailing experts */}
              <Dialog open={isMailModalOpen} onOpenChange={setIsMailModalOpen}>
                <DialogContent className="max-w-2xl bg-background border rounded-lg shadow-lg">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                      <Mail className="h-5 w-5 text-indigo-500" />
                      専門家へのメール作成
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      宛先：{recipientName} ({recipientEmail})
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSendManualEmail} className="space-y-4 py-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="template" className="text-xs font-bold text-muted-foreground">
                        クイックテンプレートを選択
                      </Label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                        <SelectTrigger id="template" className="h-10">
                          <SelectValue placeholder="テンプレートを選択して自動入力" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">指定なし（白紙から作成）</SelectItem>
                          <SelectItem value="visa">在留期限更新に関する書類送付（行政書士宛）</SelectItem>
                          <SelectItem value="legal">新規雇用契約のリーガルチェック依頼（弁護士宛）</SelectItem>
                          <SelectItem value="subsidy">助成金申請・労務管理のご相談（社労士宛）</SelectItem>
                          <SelectItem value="translation">通訳・翻訳の依頼・相談（通訳・翻訳者宛）</SelectItem>
                          <SelectItem value="tax">税務相談・決算申告に関するご相談（税理士宛）</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="subject" className="text-xs font-bold text-muted-foreground">
                        件名 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="subject"
                        required
                        value={mailSubject}
                        onChange={(e) => setMailSubject(e.target.value)}
                        placeholder="メールの件名を入力"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="message" className="text-xs font-bold text-muted-foreground">
                        本文 <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        required
                        value={mailMessage}
                        onChange={(e) => setMailMessage(e.target.value)}
                        placeholder="メール本文を入力してください"
                        className="min-h-[220px] leading-relaxed text-sm font-mono"
                      />
                    </div>

                    <DialogFooter className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsMailModalOpen(false);
                          setMailSubject("");
                          setMailMessage("");
                          setSelectedTemplate("none");
                        }}
                        disabled={isSendingMail}
                      >
                        キャンセル
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-semibold flex items-center gap-1.5"
                        disabled={isSendingMail}
                      >
                        {isSendingMail ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        送信する
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Dialog for adding option */}
              <Dialog open={isOptionModalOpen} onOpenChange={setIsOptionModalOpen}>
                <DialogContent className="max-w-md bg-background border rounded-lg shadow-lg">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                      <Plus className="h-5 w-5 text-indigo-500" />
                      オプション機能の追加
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      本企業（{company.name}）に個別料金のオプション機能を追加します。
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSaveOption} className="space-y-5 py-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="option-select" className="text-xs font-bold text-muted-foreground">
                        追加するオプションを選択
                      </Label>
                      <Select 
                        value={selectedOptionKey} 
                        onValueChange={(val) => {
                          setSelectedOptionKey(val);
                          setIsOptionConsentChecked(false);
                        }}
                      >
                        <SelectTrigger id="option-select" className="h-10 text-xs font-semibold">
                          <SelectValue placeholder="オプションを選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {optionsToDisplay.map((opt) => (
                            <SelectItem key={opt.key} value={opt.key} className="text-xs font-medium">
                              {opt.label}
                            </SelectItem>
                          ))}
                          {optionsToDisplay.length === 0 && (
                            <SelectItem value="none" disabled>
                              追加可能なオプションはありません
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dynamic Message Box */}
                    {(() => {
                      const selectedOpt = AVAILABLE_OPTIONS.find(o => o.key === selectedOptionKey);
                      if (!selectedOpt) return null;
                      return (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-lg text-xs leading-relaxed font-semibold">
                          お問い合わせいただいた {selectedOpt.name} を追加しますか？ 追加料金 {selectedOpt.amount} 円になりますので、同意する際は同意のチェックボタンの後に追加をクリックしてください。同意いただけない場合は追加できませんのでご了承ください。
                        </div>
                      );
                    })()}

                    {/* Consent checkbox */}
                    {selectedOptionKey && (
                      <div className="flex items-center gap-2.5 pt-1">
                        <input
                          id="option-consent"
                          type="checkbox"
                          checked={isOptionConsentChecked}
                          onChange={(e) => setIsOptionConsentChecked(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-gray-300 accent-[#1A3A7B] cursor-pointer"
                        />
                        <Label htmlFor="option-consent" className="text-xs font-bold text-primary select-none cursor-pointer">
                          上記内容に同意する
                        </Label>
                      </div>
                    )}

                    <DialogFooter className="pt-2 border-t mt-4 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsOptionModalOpen(false);
                          setSelectedOptionKey("");
                          setIsOptionConsentChecked(false);
                        }}
                        disabled={isSavingOption}
                        className="text-xs font-bold"
                      >
                        キャンセル
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold text-xs flex items-center gap-1.5"
                        disabled={!selectedOptionKey || !isOptionConsentChecked || isSavingOption}
                      >
                        {isSavingOption ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        追加
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* 追加の依頼履歴（サービス利用申請） */}
          <Card className="lg:col-span-2 shadow-sm border border-border">
            <CardHeader className="bg-muted/15 pb-4 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-primary">
                <History className="h-4.5 w-4.5 text-indigo-600" />
                追加の依頼履歴（サービス利用申請）
              </CardTitle>
              <CardDescription className="text-xs">
                これまでに申請された翻訳・通訳の依頼やオプション機能の追加などの履歴です。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {requestsLoading ? (
                <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  読み込み中...
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  追加の依頼履歴はありません。翻訳・通訳などのサービスは各メニューからご依頼いただけます。
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-muted-foreground">
                    <thead className="text-[10px] text-primary uppercase bg-muted/50 font-bold border-b">
                      <tr>
                        <th className="px-4 py-3">申請日</th>
                        <th className="px-4 py-3">申請者</th>
                        <th className="px-4 py-3">依頼内容</th>
                        <th className="px-4 py-3">ステータス</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {requests.map((req) => {
                        const dateStr = req.createdAt
                          ? new Date(req.createdAt).toLocaleDateString("ja-JP", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "不明";
                        
                        let typeLabel = req.details || req.item || "詳細不明";
                        if (req.type === "translation") typeLabel = req.details || "翻訳依頼";
                        if (req.type === "interpretation") typeLabel = req.details || "通訳対応";
                        if (req.type === "upgrade") typeLabel = req.details || "プラン変更";
                        if (req.type === "option") {
                          const opt = AVAILABLE_OPTIONS.find(o => o.key === req.item);
                          typeLabel = opt ? `オプション追加: ${opt.name}` : `オプション追加: ${req.item}`;
                        }

                        const sender = req.senderName || company.contactName || "企業担当者";

                        return (
                          <tr key={req.id} className="hover:bg-muted/20">
                            <td className="px-4 py-3.5 font-medium text-primary whitespace-nowrap">{dateStr}</td>
                            <td className="px-4 py-3.5 text-primary">{sender}</td>
                            <td className="px-4 py-3.5 text-primary max-w-[200px] truncate" title={typeLabel}>
                              {typeLabel}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                req.status === "completed" || req.status === "sent" || req.status === "applied"
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              }`}>
                                {req.status === "completed" ? "完了" : req.status === "sent" ? "送信済" : req.status === "applied" ? "申請済" : "処理中"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 緊急対応履歴 */}
          {(() => {
            const emergencyHistory = emailHistory.filter(h => 
              h.type === "auto_apply" || 
              h.subject?.includes("緊急") || 
              h.subject?.includes("アラート") || 
              h.message?.includes("緊急")
            );

            return (
              <Card className="lg:col-span-2 shadow-sm border border-border">
                <CardHeader className="bg-muted/15 pb-4 border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-primary">
                    <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
                    緊急対応履歴
                  </CardTitle>
                  <CardDescription className="text-xs">
                    在留期限アラート等の緊急対応や、専門家への緊急連絡履歴です。
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      読み込み中...
                    </div>
                  ) : emergencyHistory.length === 0 ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-300">
                      <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                      <div className="text-xs leading-relaxed font-semibold">
                        現在、緊急対応が必要な事項はありません。すべてのステータスは正常です。
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-muted-foreground">
                        <thead className="text-[10px] text-primary uppercase bg-muted/50 font-bold border-b">
                          <tr>
                            <th className="px-4 py-3">対応日時</th>
                            <th className="px-4 py-3">対象者 / 連絡先</th>
                            <th className="px-4 py-3">対応内容</th>
                            <th className="px-4 py-3">状況</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {emergencyHistory.map((h) => {
                            const dateStr = h.sentAt
                              ? new Date(h.sentAt).toLocaleDateString("ja-JP", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "不明";

                            return (
                              <tr key={h.id} className="hover:bg-muted/20">
                                <td className="px-4 py-3.5 font-medium text-primary whitespace-nowrap">{dateStr}</td>
                                <td className="px-4 py-3.5 text-primary">
                                  <div className="font-bold">{h.expertName}</div>
                                  <div className="text-[10px] text-muted-foreground">{h.expertEmail}</div>
                                </td>
                                <td className="px-4 py-3.5 text-primary max-w-[200px] truncate" title={h.subject}>
                                  {h.subject}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                                    対応済
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </TabsContent>

        {/* TAB 2: EMPLOYEE LIST (FULL FUNCTIONALITY TAB) */}
        <TabsContent value="employees" className="outline-none focus:ring-0">
          <Card className="shadow-sm border border-border">
            <CardHeader className="bg-muted/15 border-b pb-4 flex flex-row items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  所属従業員一覧
                </CardTitle>
                <CardDescription className="text-xs">
                  登録されているすべての所属外国人従業員の基本台帳です。
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={handlePdfDownload} 
                  variant="outline" 
                  size="sm" 
                  className="font-bold flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF出力
                </Button>

                {(user.role === "admin" || user.role === "company") && (
                  <div className="flex items-center gap-2">
                    {/* Trigger AI Scanner Modal */}
                    <Button 
                      onClick={() => {
                        setIsAiFilled(false);
                        setIsScannerModalOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      AIスキャンで新規登録
                    </Button>

                    {/* Trigger Manual Registration Modal */}
                    <Button 
                      onClick={handleOpenCreateEmpModal} 
                      variant="outline"
                      className="font-bold text-xs flex items-center gap-1 border-muted-foreground/20 hover:bg-muted/50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      手動で新規登録
                    </Button>

                    {/* 1. AI Scanner Popup Modal */}
                    <Dialog open={isScannerModalOpen} onOpenChange={setIsScannerModalOpen}>
                      <DialogContent className="max-w-xl bg-background border rounded-lg shadow-xl p-6">
                        <DialogHeader className="pb-3 border-b">
                          <DialogTitle className="text-lg font-black text-primary flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                            AI在留カードスキャナー
                          </DialogTitle>
                          <DialogDescription className="text-xs">
                            在留カードの正面画像を枠内にドラッグ＆ドロップまたは選択して、AIスキャンを行ってください。
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-2">
                          <ResidenceCardScanner 
                            onScanComplete={handleEmpScanComplete}
                            onScanStart={() => setIsAiFilled(false)}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* 2. Employee Registration Form Modal */}
                    <Dialog open={isEmpModalOpen} onOpenChange={setIsEmpModalOpen}>
                      <DialogContent className="max-w-2xl bg-background border rounded-lg shadow-xl overflow-y-auto max-h-[90vh]">
                        <DialogHeader className="pb-3 border-b">
                          <DialogTitle className="text-lg font-black text-primary flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <UserPlus className="h-5 w-5 text-indigo-500" />
                              {editingEmployee ? "従業員情報の編集" : "外国人従業員の新規登録"}
                            </span>
                            {isAiFilled && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-250 animate-pulse">
                                <Sparkles className="h-3 w-3" />
                                AI自動入力済
                              </span>
                            )}
                          </DialogTitle>
                          <DialogDescription className="text-xs">
                            {isAiFilled ? "AIの読み取り情報が入力されています。確認の上、残りの情報（電話番号、現住所、所属部署等）を入力して保存してください。" : "各項目を入力して従業員を登録します。"}
                          </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveEmployee} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium leading-relaxed py-4">
                          {/* Name */}
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="font-bold flex items-center justify-between">
                              氏名 <span className="text-destructive">*</span>
                              {isAiFilled && <span className="text-[10px] text-emerald-600 font-bold">AI読取反映</span>}
                            </Label>
                            <Input 
                              required 
                              value={empForm.name} 
                              onChange={(e) => setEmpForm({...empForm, name: e.target.value})} 
                              placeholder="例: SMITH JOHN"
                              className="h-10 text-xs font-semibold"
                            />
                          </div>

                          {/* Nationality & Gender */}
                          <div className="space-y-1">
                            <Label className="font-bold">国籍 <span className="text-destructive">*</span></Label>
                            <Input 
                              required 
                              value={empForm.nationality} 
                              onChange={(e) => setEmpForm({...empForm, nationality: e.target.value})} 
                              placeholder="例: ベトナム"
                              className="h-10 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-bold">性別 <span className="text-destructive">*</span></Label>
                            <Select 
                              value={empForm.gender} 
                              onValueChange={(val) => setEmpForm({...empForm, gender: val})}
                            >
                              <SelectTrigger className="h-10 text-xs">
                                <SelectValue placeholder="性別を選択" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="男性">男性</SelectItem>
                                <SelectItem value="女性">女性</SelectItem>
                                <SelectItem value="その他">その他</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* BirthDate & Address */}
                          <div className="space-y-1">
                            <Label className="font-bold">生年月日 <span className="text-destructive">*</span></Label>
                            <Input 
                              required 
                              type="date"
                              value={empForm.birthDate} 
                              onChange={(e) => setEmpForm({...empForm, birthDate: e.target.value})} 
                              className="h-10 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-bold">電話番号 <span className="text-destructive">*</span></Label>
                            <Input 
                              required 
                              value={empForm.phone} 
                              onChange={(e) => setEmpForm({...empForm, phone: e.target.value})} 
                              placeholder="例: 090-1234-5678"
                              className="h-10 text-xs"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <Label className="font-bold">現住所 <span className="text-destructive">*</span></Label>
                            <Input 
                              required 
                              value={empForm.address} 
                              onChange={(e) => setEmpForm({...empForm, address: e.target.value})} 
                              placeholder="例: 東京都新宿区大久保1-1"
                              className="h-10 text-xs"
                            />
                          </div>

                          {/* Email */}
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="font-bold">メールアドレス (任意)</Label>
                            <Input 
                              type="email"
                              value={empForm.email} 
                              onChange={(e) => setEmpForm({...empForm, email: e.target.value})} 
                              placeholder="例: john@example.com"
                              className="h-10 text-xs"
                            />
                          </div>

                          <Separator className="sm:col-span-2 my-1" />

                          {/* Status of Residence & Expiration */}
                          <div className="space-y-1">
                            <Label className="font-bold">在留資格 <span className="text-destructive">*</span></Label>
                            <Input 
                              required 
                              value={empForm.statusOfResidence} 
                              onChange={(e) => setEmpForm({...empForm, statusOfResidence: e.target.value})} 
                              placeholder="例: 特定技能"
                              className="h-10 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-bold">在留期限日 <span className="text-destructive">*</span></Label>
                            <Input 
                              required 
                              type="date"
                              value={empForm.expirationDate} 
                              onChange={(e) => setEmpForm({...empForm, expirationDate: e.target.value})} 
                              className="h-10 text-xs"
                            />
                          </div>

                          {/* Card Number & Contract period */}
                          <div className="space-y-1">
                            <Label className="font-bold">在留カード番号 <span className="text-destructive">*</span></Label>
                            <Input 
                              required 
                              value={empForm.cardNumber} 
                              onChange={(e) => setEmpForm({...empForm, cardNumber: e.target.value})} 
                              placeholder="例: AB12345678CD"
                              className="h-10 text-xs uppercase"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-bold">雇用契約期間 <span className="text-destructive">*</span></Label>
                            <Input 
                              required 
                              value={empForm.contractPeriod} 
                              onChange={(e) => setEmpForm({...empForm, contractPeriod: e.target.value})} 
                              placeholder="例: 2026-04-01 ~ 2027-03-31"
                              className="h-10 text-xs"
                            />
                          </div>

                          {/* Passport Info */}
                          <div className="space-y-1">
                            <Label className="font-bold">パスポート番号 <span className="text-destructive">*</span></Label>
                            <Input 
                              required 
                              value={empForm.passportNumber} 
                              onChange={(e) => setEmpForm({...empForm, passportNumber: e.target.value})} 
                              placeholder="例: TK1234567"
                              className="h-10 text-xs uppercase"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-bold">パスポート満了日 <span className="text-destructive">*</span></Label>
                            <Input 
                              required 
                              type="date"
                              value={empForm.passportExpirationDate} 
                              onChange={(e) => setEmpForm({...empForm, passportExpirationDate: e.target.value})} 
                              className="h-10 text-xs"
                            />
                          </div>

                          {/* Department & Status */}
                          <div className="space-y-1">
                            <Label className="font-bold">所属部署 (任意)</Label>
                            <Input 
                              value={empForm.department} 
                              onChange={(e) => setEmpForm({...empForm, department: e.target.value})} 
                              placeholder="例: 工事部 / 介護チーム"
                              className="h-10 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="font-bold">雇用・在留ステータス</Label>
                            <Select 
                              value={empForm.status} 
                              onValueChange={(val: any) => setEmpForm({...empForm, status: val})}
                            >
                              <SelectTrigger className="h-10 text-xs">
                                <SelectValue placeholder="ステータスを選択" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">有効（通常稼働中）</SelectItem>
                                <SelectItem value="expiring_soon">更新手続き中 / 満了間近</SelectItem>
                                <SelectItem value="expired">満了超過・期限切れ</SelectItem>
                                <SelectItem value="resigned">退職・帰国済</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="sm:col-span-2 flex justify-end gap-3 pt-3 border-t w-full">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsEmpModalOpen(false)}
                              disabled={isSavingEmployee}
                            >
                              キャンセル
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold animate-shimmer"
                              disabled={isSavingEmployee}
                            >
                              {isSavingEmployee ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                "保存する"
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(() => {
                const now = new Date();
                const threeMonthsLater = new Date();
                threeMonthsLater.setDate(now.getDate() + 90);

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

                const filteredEmployees = employees.filter(emp => {
                  if (!employeeFilter) return true;
                  if (employeeFilter === "visa") {
                    const expDate = parseDateStr(emp.expirationDate);
                    return expDate !== null && expDate >= now && expDate <= threeMonthsLater;
                  }
                  if (employeeFilter === "contract") {
                    const endDate = parseContractEndDate(emp.contractPeriod);
                    return endDate !== null && endDate >= now && endDate <= threeMonthsLater;
                  }
                  if (employeeFilter === "expired") {
                    const expDate = parseDateStr(emp.expirationDate);
                    const isVisaExpired = expDate !== null && expDate < now;
                    const endDate = parseContractEndDate(emp.contractPeriod);
                    const isContractExpired = endDate !== null && endDate < now;
                    return isVisaExpired || isContractExpired;
                  }
                  return true;
                });

                if (employees.length === 0) {
                  return (
                    <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                      <Users className="h-12 w-12 text-muted-foreground/50" />
                      <div>
                        <p className="font-bold text-sm">所属する外国人従業員が登録されていません。</p>
                        <p className="text-xs text-muted-foreground mt-0.5">本番の最初のデータを登録してください。</p>
                      </div>
                      {(user.role === "admin" || user.role === "company") && (
                        <Button onClick={handleOpenCreateEmpModal} className="mt-2 bg-[#1A3A7B] text-white text-xs font-bold">
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          従業員を追加する
                        </Button>
                      )}
                    </div>
                  );
                }

                if (filteredEmployees.length === 0) {
                  return (
                    <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                      <Users className="h-12 w-12 text-muted-foreground/50" />
                      <div>
                        <p className="font-bold text-sm">対象の従業員はいません。</p>
                        {employeeFilter && (
                          <Button 
                            variant="link" 
                            onClick={() => setEmployeeFilter(null)}
                            className="text-xs text-red-650 font-bold mt-1"
                          >
                            フィルターを解除してすべて表示する
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    {employeeFilter && (
                      <div className="p-4 bg-indigo-50/50 dark:bg-zinc-950 border-b flex items-center justify-between gap-4 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 bg-[#1A3A7B] rounded-full animate-ping" />
                          フィルター適用中: {
                            employeeFilter === "visa" ? "在留カード更新対象（3ヶ月以内）" :
                            employeeFilter === "contract" ? "契約更新対象（3ヶ月以内）" :
                            employeeFilter === "expired" ? "期限切れ・超過対象者" : ""
                          } ({filteredEmployees.length}名)
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEmployeeFilter(null)}
                          className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold px-2 py-1 rounded"
                        >
                          クリアする
                        </Button>
                      </div>
                    )}
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-muted/20 text-xs font-bold text-muted-foreground">
                          <th className="p-4">氏名</th>
                          <th className="p-4">国籍</th>
                          <th className="p-4">在留資格</th>
                          <th className="p-4">期限満了日</th>
                          <th className="p-4">ステータス</th>
                          {(user.role === "admin" || user.role === "company") && <th className="p-4 text-right">管理操作</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((emp) => {
                          let statusBadge = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200";
                          let statusText = "有効";

                          if (emp.status === "expiring_soon") {
                            statusBadge = "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200";
                            statusText = "更新手続き中";
                          } else if (emp.status === "expired") {
                            statusBadge = "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200";
                            statusText = "期限切れ警告";
                          } else if (emp.status === "resigned") {
                            statusBadge = "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200";
                            statusText = "退職・帰国";
                          }

                          return (
                            <tr key={emp.id} className="border-b hover:bg-muted/15 transition-colors font-medium">
                              <td className="p-4 font-bold text-primary">{emp.name}</td>
                              <td className="p-4 text-muted-foreground">{emp.nationality}</td>
                              <td className="p-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-secondary text-secondary-foreground border">
                                  {emp.statusOfResidence}
                                </span>
                              </td>
                              <td className="p-4 text-muted-foreground font-mono">{emp.expirationDate}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${statusBadge}`}>
                                  {statusText}
                                </span>
                              </td>
                              {(user.role === "admin" || user.role === "company") && (
                                <td className="p-4 text-right space-x-1.5">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleOpenEditEmpModal(emp)} 
                                    className="h-8 w-8 text-muted-foreground hover:text-primary border"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDeleteEmployee(emp.id, emp.name)} 
                                    className="h-8 w-8 text-destructive hover:text-destructive/80 border hover:bg-destructive/5"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: VISA RENEWAL / EMPLOYEES RENEWAL ACTIONS */}
        <TabsContent value="visa" className="outline-none focus:ring-0">
          {!isVisaAllowed && user.role !== "admin" ? (
            <Card className="shadow-md border border-border relative overflow-hidden bg-gradient-to-br from-indigo-50/20 to-violet-50/10 dark:from-zinc-950/50 dark:to-zinc-950/20 py-16 text-center">
              <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
              <CardHeader className="flex flex-col items-center justify-center space-y-4 relative z-10">
                <div className="p-4 bg-amber-500/10 rounded-full text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                  <Lock className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-extrabold text-primary flex items-center justify-center gap-2">
                    在留資格・在留カード管理
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-full">
                      BASIC以上
                    </span>
                  </CardTitle>
                  <CardDescription className="max-w-md mx-auto text-sm leading-relaxed">
                    外国人従業員の在留資格期限の追跡管理、提携行政書士へのワンクリック更新申請代行などの管理モジュールです。
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 relative z-10 max-w-sm mx-auto space-y-4">
                <div className="text-left text-xs bg-background/50 p-4 border rounded-lg space-y-2 text-muted-foreground font-semibold">
                  <p className="flex items-center gap-1.5 text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 在留期限切れの90日前からの自動アラート警告</p>
                  <p className="flex items-center gap-1.5 text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 在留カード画像AI読取りによる台帳自動入力</p>
                  <p className="flex items-center gap-1.5 text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 提携行政書士へのワンクリック申請連携機能</p>
                </div>
                <Button className="w-full bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold shadow-md" onClick={handleUpgradeConsult}>
                  プランのアップグレードを相談
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-muted/15 border-b">
                <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  在留期限・更新予定表
                </CardTitle>
                <CardDescription className="text-xs">
                  本企業の外国人従業員の在留資格期限管理および自動申請連携モジュールです。
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {employees.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p className="text-sm">登録されている従業員はいません。</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-muted/20 text-xs font-bold text-muted-foreground">
                          <th className="p-4">氏名</th>
                          <th className="p-4">国籍</th>
                          <th className="p-4">在留資格</th>
                          <th className="p-4">在留カード番号</th>
                          <th className="p-4">在留期限日</th>
                          <th className="p-4 text-right">アクション</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((emp) => {
                          const isExpired = new Date(emp.expirationDate) < new Date();
                          const isExpiringSoon = !isExpired && new Date(emp.expirationDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                          
                          return (
                            <tr key={emp.id} className="border-b hover:bg-muted/15 transition-colors font-medium">
                              <td className="p-4 font-bold text-primary">{emp.name}</td>
                              <td className="p-4 text-muted-foreground">{emp.nationality}</td>
                              <td className="p-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-secondary text-secondary-foreground border">
                                  {emp.statusOfResidence}
                                </span>
                              </td>
                              <td className="p-4 text-muted-foreground font-mono">{emp.cardNumber || "未設定"}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 font-bold ${
                                  isExpired ? "text-destructive" : isExpiringSoon ? "text-amber-600" : "text-primary"
                                }`}>
                                  {emp.expirationDate}
                                  {isExpiringSoon && <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded dark:bg-amber-950 dark:text-amber-200">間近</span>}
                                  {isExpired && <span className="text-[10px] bg-red-100 text-red-800 px-1 py-0.5 rounded dark:bg-red-950 dark:text-red-200">超過</span>}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {user.role === "admin" ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAutoApply(emp, "scrivener")}
                                    disabled={!company.scrivenerEmail || applyingEmployeeId === emp.id}
                                    className="h-8 bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-semibold text-xs shadow-sm"
                                  >
                                    {applyingEmployeeId === emp.id ? (
                                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <Sparkles className="h-3 w-3 mr-1" />
                                    )}
                                    専門家へ申請
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground font-normal italic">
                                    管理者のみ申請可能
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 4: SAFETY & TEMPLATES (INDUSTRY BASED) */}
        <TabsContent value="templates" className="outline-none focus:ring-0">
          {!isSafetyAllowed && user.role !== "admin" ? (
            <Card className="shadow-md border border-border relative overflow-hidden bg-gradient-to-br from-indigo-50/20 to-violet-50/10 dark:from-zinc-950/50 dark:to-zinc-950/20 py-16 text-center">
              <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
              <CardHeader className="flex flex-col items-center justify-center space-y-4 relative z-10">
                <div className="p-4 bg-amber-500/10 rounded-full text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                  <Lock className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-extrabold text-primary flex items-center justify-center gap-2">
                    安全教育・多言語テンプレート
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-full">
                      PRO以上
                    </span>
                  </CardTitle>
                  <CardDescription className="max-w-md mx-auto text-sm leading-relaxed">
                    外国人従業員向けの安全衛生教育多言語動画ライブラリ、および各業種（建設、製造、介護等）に応じた申請計画ひな形・管理書類です。
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 relative z-10 max-w-sm mx-auto space-y-4">
                <div className="text-left text-xs bg-background/50 p-4 border rounded-lg space-y-2 text-muted-foreground font-semibold">
                  <p className="flex items-center gap-1.5 text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 多言語（英・ベトナム・ネパール等）安全衛生教育ビデオ</p>
                  <p className="flex items-center gap-1.5 text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 従業員ごとの安全講習の受講ログ記録・保存機能</p>
                  <p className="flex items-center gap-1.5 text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 各業種別の入管・労働局提出用テンプレート取得</p>
                </div>
                <Button className="w-full bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold shadow-md" onClick={handleUpgradeConsult}>
                  プランのアップグレードを相談
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Safety Library */}
              <Card className="shadow-sm border border-border">
                <CardHeader className="bg-muted/15 border-b pb-4">
                  <CardTitle className="text-base font-extrabold text-primary flex items-center gap-1.5">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    安全教育ライブラリ
                  </CardTitle>
                  <CardDescription className="text-xs">
                    業種（{company.industry}）に対応した安全衛生教育ガイドです。
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {indContent.safetyLibrary.map((item, idx) => (
                    <div key={idx} className="flex gap-3.5 items-start p-3 bg-white/70 dark:bg-zinc-950/60 border border-muted/50 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="p-1 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 rounded-full shrink-0">
                        <Check className="h-4 w-4" />
                      </div>
                      <div className="space-y-1 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-[#1A3A7B] dark:text-[#5C85D3]">{item.title}</h4>
                          <span className="text-[10px] px-1.5 py-0.5 font-bold border border-emerald-200 bg-emerald-50 text-emerald-800 rounded dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900">
                            {item.level}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            ⏱ {item.duration}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                        
                        {/* Completed Employees Badges */}
                        {(() => {
                          const completedLogs = trainingLogs.filter(log => log.videoId === item.id);
                          if (completedLogs.length > 0) {
                            return (
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                {completedLogs.map(log => {
                                  const empObj = employees.find(e => e.id === log.employeeId);
                                  if (!empObj) return null;
                                  return (
                                    <span key={log.id} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 font-semibold dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
                                      <Check className="h-2.5 w-2.5" />
                                      {empObj.name}
                                    </span>
                                  );
                                })}
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Video Player Action Button */}
                        {item.videos && (
                          <div className="pt-2">
                            <Button 
                              onClick={() => openVideoPlayer(item)}
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs font-bold text-indigo-700 hover:text-indigo-800 border-indigo-200 hover:bg-indigo-50/50 flex items-center gap-1"
                            >
                              <Play className="h-3.5 w-3.5 fill-indigo-700" />
                              動画を視聴する
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Templates */}
              <Card className="shadow-sm border border-border">
                <CardHeader className="bg-muted/15 border-b pb-4">
                  <CardTitle className="text-base font-extrabold text-primary flex items-center gap-1.5">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    申請書類・計画テンプレート
                  </CardTitle>
                  <CardDescription className="text-xs">
                    業種（{company.industry}）向けの必要申請ひな形・管理書類です。
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {indContent.templates.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-white/70 dark:bg-zinc-950/60 border border-muted/50 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-primary">{item.name}</h4>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-800 border rounded dark:bg-zinc-800 dark:text-zinc-300 font-bold">
                            {item.format}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 font-semibold shrink-0" onClick={() => toast({title: "ダウンロード開始", description: `${item.name} をダウンロードしました。`})}>
                        取得
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* TAB 5: AI COMPLIANCE (PREMIUM LOCK / PREMIUM CONTENT) */}
        <TabsContent value="ai-audit" className="outline-none focus:ring-0">
          {!isAiAuditAllowed && user.role !== "admin" ? (
            <Card className="shadow-md border border-border relative overflow-hidden bg-gradient-to-br from-indigo-50/20 to-violet-50/10 dark:from-zinc-950/50 dark:to-zinc-950/20 py-16 text-center">
              <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
              <CardHeader className="flex flex-col items-center justify-center space-y-4 relative z-10">
                <div className="p-4 bg-amber-500/10 rounded-full text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                  <Lock className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-extrabold text-primary flex items-center justify-center gap-2">
                    AIコンプライアンス監査 (AI監査)
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-full">
                      PREMIUM限定
                    </span>
                  </CardTitle>
                  <CardDescription className="max-w-md mx-auto text-sm leading-relaxed">
                    雇用契約書や重要事項説明書に潜む労務リスク、法律不適合をAIが事前監査する機能です。労働時間や在留資格違反の未然防止チェックシートを出力します。
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 relative z-10 max-w-sm mx-auto space-y-4">
                <div className="text-left text-xs bg-background/50 p-4 border rounded-lg space-y-2 text-muted-foreground font-semibold">
                  <p className="flex items-center gap-1.5 text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 新規雇用契約のリーガルチェック自動化</p>
                  <p className="flex items-center gap-1.5 text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 在留資格外の不法就労防止スクリーニング</p>
                  <p className="flex items-center gap-1.5 text-primary"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 労働基準法違反（残業過多等）の検知・改善策提案</p>
                </div>
                <Button className="w-full bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold shadow-md" onClick={handleUpgradeConsult}>
                  プランのアップグレードを相談
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border border-border">
              <CardHeader className="bg-muted/15 border-b pb-4">
                <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                  <BookmarkCheck className="h-5 w-5 text-indigo-600" />
                  AIコンプライアンス監査ダッシュボード
                </CardTitle>
                <CardDescription className="text-xs">
                  AIによって雇用書類と外国人雇用ルールを定期自動監査した結果です。
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Score */}
                  <div className="flex flex-col items-center justify-center p-6 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-center">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">労務適合スコア</span>
                    <span className="text-4xl font-black text-emerald-700 dark:text-emerald-300 mt-2">A+</span>
                    <span className="text-[10px] text-muted-foreground mt-2 font-medium">最終監査: 本日 09:30</span>
                  </div>

                  {/* Metrics */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">監査チェック項目詳細</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                      <div className="p-3 border rounded-lg bg-background flex items-center justify-between">
                        <span>在留資格許容活動との適合性</span>
                        <span className="text-emerald-600 font-extrabold">適合 (100%)</span>
                      </div>
                      <div className="p-3 border rounded-lg bg-background flex items-center justify-between">
                        <span>雇用契約における重要事項説明</span>
                        <span className="text-emerald-600 font-extrabold">適合 (100%)</span>
                      </div>
                      <div className="p-3 border rounded-lg bg-background flex items-center justify-between">
                        <span>最低労働条件・賃金基準</span>
                        <span className="text-emerald-600 font-extrabold">適合 (100%)</span>
                      </div>
                      <div className="p-3 border rounded-lg bg-background flex items-center justify-between">
                        <span>時間外労働・残業管理状態</span>
                        <span className="text-amber-600 font-extrabold">一部確認推奨</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-primary flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
                    AI監査フィードバックアドバイス
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    現在、在留カードデータおよび雇用契約整合性には一切の違反の兆候は見られません。時間外労働に関して、建設現場での夏期超過勤務（時間外上限規制）に配慮し、勤怠ログの毎週チェックをおすすめします。
                  </p>
                  <div className="flex justify-end pt-2">
                    <Button size="sm" className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-semibold text-xs shadow-sm" onClick={handleAuditPdfDownload}>
                      PDF監査レポートをエクスポート
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 6: EXECUTIVE DASHBOARD (PREMIUM ONLY) */}
        <TabsContent value="executive" className="outline-none focus:ring-0">
          {!isExecutiveAllowed && user.role !== "admin" ? (
            <Card className="shadow-md border border-border relative overflow-hidden bg-gradient-to-br from-indigo-50/20 to-violet-50/10 dark:from-zinc-950/50 dark:to-zinc-950/20 py-16 text-center">
              <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
              <CardHeader className="flex flex-col items-center justify-center space-y-4 relative z-10">
                <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 animate-pulse">
                  <Lock className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-extrabold text-primary flex items-center justify-center gap-2">
                    エグゼクティブ・ダッシュボード
                    <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-900 px-2 py-0.5 rounded-full">
                      ADVANCE以上
                    </span>
                  </CardTitle>
                  <CardDescription className="max-w-md mx-auto text-sm leading-relaxed">
                    ESG経営の社会的取り組み（Social）評価スコアリング、および政府から受給可能な「雇用維持・研修助成金」の自動マッチングと直接申請相談を行える経営支援ツールです。
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 relative z-10 max-w-sm mx-auto space-y-4">
                <div className="text-left text-xs bg-background/50 p-4 border rounded-lg space-y-2 text-muted-foreground font-semibold">
                  <p className="flex items-center gap-1.5 text-primary"><TrendingUp className="h-4 w-4 text-indigo-500 shrink-0" /> ダイバーシティ・ESG活動スコアリング</p>
                  <p className="flex items-center gap-1.5 text-primary"><Landmark className="h-4 w-4 text-indigo-500 shrink-0" /> 受給可能な「雇用助成金」の自動リストアップ</p>
                  <p className="flex items-center gap-1.5 text-primary"><FileSymlink className="h-4 w-4 text-indigo-500 shrink-0" /> 担当社労士へのワンクリック申請連携機能</p>
                </div>
                <Button className="w-full bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold shadow-md" onClick={handleUpgradeConsult}>
                  プランのアップグレードを相談
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ESG Scoring Box */}
              <Card className="lg:col-span-1 shadow-sm border border-border">
                <CardHeader className="bg-muted/15 border-b pb-4">
                  <CardTitle className="text-base font-extrabold text-primary flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    ESG社会(S)スコア評価
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div className="flex flex-col items-center justify-center py-4 bg-[#1A3A7B]/5 border rounded-lg text-center">
                    <span className="text-xs font-bold text-muted-foreground">総合ダイバーシティスコア</span>
                    <span className="text-3xl font-black text-indigo-900 dark:text-indigo-200 mt-2">92 / 100</span>
                    <span className="text-[10px] text-muted-foreground mt-2 font-medium">業種平均: 68点 (大幅に超過)</span>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="flex justify-between font-bold">
                      <span className="text-muted-foreground">E (ペーパーレス化):</span>
                      <span className="text-primary">92% 完了</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-muted-foreground">S (多言語安全教育):</span>
                      <span className="text-primary">実施済 (月4回)</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-primary">G (コンプライアンス管理):</span>
                      <span className="text-primary">体制構築率 100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subsidy Proposal Box */}
              <Card className="lg:col-span-2 shadow-sm border border-border">
                <CardHeader className="bg-muted/15 border-b pb-4">
                  <CardTitle className="text-base font-extrabold text-primary flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-indigo-600" />
                    助成金・支援金 自動提案シート
                  </CardTitle>
                  <CardDescription className="text-xs">
                    現在の企業要件および雇用中の従業員（外国人スタッフ含む）データに基づき自動提案しています。
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Proposal 1 */}
                  <div className="p-4 bg-background border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-primary flex items-center gap-1.5">
                        人材開発支援助成金
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        外国人従業員への安全教育、日本語コミュニケーション研修に対する費用支援。
                      </p>
                      <div className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300">
                        推定受給額: ¥500,000 / 対象名
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="font-bold whitespace-nowrap shrink-0" onClick={() => {
                      if (!company.laborConsultantName || !company.laborConsultantEmail) {
                        toast({title: "エラー", description: "担当社会保険労務士が設定されていないため申請相談を行えません。", variant: "destructive"});
                        return;
                      }
                      handleAutoApply({
                        name: "人材開発支援助成金 (企業一括)",
                        nationality: "全従業員対象",
                        statusOfResidence: "研修・教育",
                        expirationDate: "助成金相談",
                        cardNumber: "N/A"
                      }, "laborConsultant");
                    }}>
                      社労士へ申請相談
                    </Button>
                  </div>

                  {/* Proposal 2 */}
                  <div className="p-4 bg-background border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-primary flex items-center gap-1.5">
                        キャリアアップ助成金（正社員化）
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        有期契約の特定技能従業員などを正社員（無期雇用）へ移行した際の一時支援。
                      </p>
                      <div className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300">
                        推定受給額: ¥570,000 / 対象名
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="font-bold whitespace-nowrap shrink-0" onClick={() => {
                      if (!company.laborConsultantName || !company.laborConsultantEmail) {
                        toast({title: "エラー", description: "担当社会保険労務士が設定されていないため申請相談を行えません。", variant: "destructive"});
                        return;
                      }
                      handleAutoApply({
                        name: "キャリアアップ助成金 (正社員移行)",
                        nationality: "特定技能含む従業員",
                        statusOfResidence: "正社員登用",
                        expirationDate: "助成金相談",
                        cardNumber: "N/A"
                      }, "laborConsultant");
                    }}>
                      社労士へ申請相談
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* TIMELINE HISTORY SECTION (ADMIN ONLY) */}
      {user.role === "admin" && (
        <Card className="shadow-sm border border-border mt-8">
          <CardHeader className="bg-muted/10 pb-4 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-primary">
              <History className="h-4.5 w-4.5 text-indigo-600" />
              専門家への連絡・申請履歴（タイムライン）
            </CardTitle>
            <CardDescription className="text-xs">
              本企業に関して担当専門家（社労士、行政書士、弁護士）宛てにポータルから送信したメールおよび自動申請の全履歴です。
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {historyLoading ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : emailHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                これまでの送信履歴はありません。
              </div>
            ) : (
              <div className="relative border-l border-muted pl-6 space-y-6">
                {emailHistory.map((item) => {
                  const isApply = item.type === "auto_apply";
                  return (
                    <div key={item.id} className="relative">
                      {/* Circle indicator */}
                      <span className={`absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full ring-4 ring-background border text-[8px] font-black text-white shrink-0 ${
                        isApply ? "bg-emerald-500 border-emerald-300" : "bg-indigo-500 border-indigo-300"
                      }`}>
                        {isApply ? "申" : "メ"}
                      </span>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                          <h4 className="font-extrabold text-sm text-primary">{item.subject}</h4>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            {new Date(item.sentAt).toLocaleString("ja-JP")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          送信先：<span className="font-semibold text-primary">{item.expertName}</span> ({item.expertEmail})
                          {' | '} 送信者：<span className="font-semibold text-primary">{item.senderName}</span>
                          {' | '} 状態：
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            isApply 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200" 
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200"
                          }`}>
                            {isApply ? "専門家へ申請済み" : "メール送信完了"}
                          </span>
                        </p>

                        <div className="p-3 bg-muted/30 border border-muted/40 rounded-lg text-xs leading-relaxed whitespace-pre-wrap font-mono text-muted-foreground">
                          {item.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Safety Education Video Player Modal */}
      <Dialog open={isPlayerModalOpen} onOpenChange={setIsPlayerModalOpen}>
        <DialogContent className="max-w-3xl md:max-w-5xl bg-background border rounded-lg shadow-xl overflow-hidden p-0 gap-0">
          {selectedVideo && (
            <>
              {/* Modal Header */}
              <div className="bg-muted/15 border-b p-4 flex flex-row items-center justify-between flex-wrap gap-2">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    <Video className="h-3 w-3" />
                    安全教育ビデオ
                  </span>
                  <h3 className="text-base font-black text-primary flex items-center gap-1.5 mt-1">
                    {selectedVideo.title}
                  </h3>
                </div>
                
                {/* Language Switcher Tabs */}
                {selectedVideo.videos && (
                  <div className="flex bg-muted/80 p-0.5 rounded-lg border text-xs font-bold shadow-inner flex-wrap gap-1">
                    <button 
                      type="button"
                      onClick={() => setSelectedLanguage("ja")}
                      className={`px-3 py-1 rounded-md transition-all ${
                        selectedLanguage === "ja" ? "bg-white text-indigo-900 shadow-sm" : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      日本語
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedLanguage("en")}
                      className={`px-3 py-1 rounded-md transition-all ${
                        selectedLanguage === "en" ? "bg-white text-indigo-900 shadow-sm" : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      English
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedLanguage("vi")}
                      className={`px-3 py-1 rounded-md transition-all ${
                        selectedLanguage === "vi" ? "bg-white text-indigo-900 shadow-sm" : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      Tiếng Việt
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedLanguage("es")}
                      className={`px-3 py-1 rounded-md transition-all ${
                        selectedLanguage === "es" ? "bg-white text-indigo-900 shadow-sm" : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      Español
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedLanguage("pt")}
                      className={`px-3 py-1 rounded-md transition-all ${
                        selectedLanguage === "pt" ? "bg-white text-indigo-900 shadow-sm" : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      Português
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedLanguage("id")}
                      className={`px-3 py-1 rounded-md transition-all ${
                        selectedLanguage === "id" ? "bg-white text-indigo-900 shadow-sm" : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      Bahasa Indonesia
                    </button>
                  </div>
                )}
              </div>

              {/* Video Player & Translation Script Panel (2-Column Layout) */}
              <div className="relative flex flex-col md:block md:pr-[30%] border-b bg-background">
                {/* Left Column: Video Player (70%) */}
                <div className="w-full bg-black aspect-video flex items-center justify-center relative md:border-r">
                  {selectedVideo.videos && selectedVideo.videos.ja ? (
                    <iframe
                      id="yt-player"
                      className="w-full h-full"
                      src={`${selectedVideo.videos.ja}?enablejsapi=1&autoplay=1`}
                      title={`${selectedVideo.title} (日本語版)`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="text-white text-xs font-semibold flex flex-col items-center gap-2 p-6">
                      <AlertCircle className="h-8 w-8 text-destructive animate-pulse" />
                      <span>教育動画（日本語版）が用意されていません。</span>
                    </div>
                  )}
                </div>

                {/* Right Column: Translation Script Panel (30%) */}
                <div className="w-full md:absolute md:top-0 md:bottom-0 md:right-0 md:w-[30%] bg-slate-50/70 dark:bg-slate-900/30 p-4 flex flex-col h-[280px] md:h-auto overflow-hidden">
                  <div className="text-[10px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-2 border-b pb-1.5 flex items-center justify-between">
                    <span>翻訳スクリプト</span>
                    <span className="bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded text-[9px] font-bold text-indigo-700 dark:text-indigo-400">
                      {selectedLanguage === "ja" ? "日本語" : 
                       selectedLanguage === "en" ? "English" : 
                       selectedLanguage === "vi" ? "Tiếng Việt" : 
                       selectedLanguage === "es" ? "Español" : 
                       selectedLanguage === "pt" ? "Português" : "Bahasa Indonesia"}
                    </span>
                  </div>
                  
                  <div 
                    ref={scriptContainerRef}
                    className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scroll-smooth"
                  >
                    {selectedVideo.scripts?.[selectedLanguage] ? (
                      selectedVideo.scripts[selectedLanguage].map((segment: any, idx: number) => {
                        const isActive = currentTime >= segment.start && currentTime < segment.end;
                        const formatTime = (sec: number) => {
                          const mins = Math.floor(sec / 60);
                          const secs = Math.floor(sec % 60);
                          return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
                        };

                        return (
                          <div
                            key={idx}
                            onClick={() => handleSegmentClick(segment.start)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                              isActive
                                ? "active-script-segment bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900 text-indigo-950 dark:text-indigo-200 font-bold shadow-sm"
                                : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            <span className={`text-[9px] font-mono tracking-wider font-bold ${
                              isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                            }`}>
                              {formatTime(segment.start)} - {formatTime(segment.end)}
                            </span>
                            <p className="text-[11px] md:text-xs leading-relaxed whitespace-normal break-words">
                              {segment.text}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-muted-foreground text-xs italic block p-2">
                        この言語の翻訳テキストは用意されていません。
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer (Controls & Recording) */}
              <div className="p-4 space-y-4 bg-muted/5">
                {/* Employee Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                  <div className="space-y-1 max-w-sm">
                    <Label htmlFor="train-emp-select" className="text-xs font-extrabold text-primary flex items-center gap-1">
                      受講する従業員を選択してください <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      動画を視聴する外国人従業員を選択してください。完了時にその従業員の受講履歴に保存されます。
                    </p>
                  </div>
                  <div className="w-full sm:w-[220px]">
                    <Select 
                      value={selectedEmployeeId} 
                      onValueChange={(val) => {
                        setSelectedEmployeeId(val);
                        setCountdown(10);
                        setIsCountdownComplete(false);
                      }}
                    >
                      <SelectTrigger id="train-emp-select" className="h-9 text-xs">
                        <SelectValue placeholder="従業員を選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} ({emp.nationality})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Training Completion Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    {!selectedEmployeeId ? (
                      <span className="text-destructive font-bold">※ 完了記録するには、まず受講する従業員を選択してください。</span>
                    ) : isCountdownComplete ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="h-4 w-4 bg-emerald-100 rounded-full p-0.5 animate-pulse" />
                        安全教育ビデオの一定時間視聴が完了しました。
                      </span>
                    ) : (
                      <span className="font-semibold text-indigo-700 dark:text-indigo-400 animate-pulse flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        受講完了の記録が可能になるまで、あと <span className="font-mono text-sm font-extrabold bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-900">{countdown}</span> 秒
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 shrink-0">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsPlayerModalOpen(false)}
                      disabled={isSavingLog}
                    >
                      閉じる
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!selectedEmployeeId || !isCountdownComplete || isSavingLog}
                      onClick={handleSaveTrainingLog}
                      className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold flex items-center gap-1.5"
                    >
                      {isSavingLog ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      受講完了を保存する
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
