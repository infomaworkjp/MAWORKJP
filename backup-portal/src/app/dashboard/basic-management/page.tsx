"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, Save, User, FileText, CheckCircle, AlertTriangle, 
  ArrowRight, ShieldCheck, RefreshCw, Plus, FileDown, Printer, 
  Trash2, UserCheck, HelpCircle, Eye, AlertCircle, ArrowLeft, Loader2,
  Building2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getCompanyById } from "@/app/actions/companies";
import { useToast } from "@/hooks/use-toast";
import { 
  getEmployeesByCompanyId, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee, 
  EmployeeData 
} from "@/app/actions/employees";
import { ResidenceCardScanner } from "@/components/residence-card/scanner-card";
import { ResidenceCardData } from "@/app/actions/scan-residence-card";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Master data for working eligibility check
const ELIGIBILITY_RULES: Record<string, any> = {
  gijinkoku: {
    title: "技術・人文知識・国際業務 (Gijinkoku)",
    type: "就労制限あり（在留資格の職務範囲内のみ）",
    typeColor: "text-indigo-600 bg-indigo-50 border-indigo-200",
    scope: "ホワイトカラーの専門職（エンジニア、IT技術者、言語教師、通訳翻訳、海外取引業務、企画マーケティング、デザイナーなど）。",
    hours: "時間制限なし（フルタイム・正社員等の勤務が可能）",
    restrictions: "工場の製造ライン作業、建設現場の作業員、飲食店の接客・厨房、小売店のレジなどのいわゆる「単純労働」は一切認められません。違反した場合は「資格外活動」となり、不法就労になります。",
    compliance: "本人の大学での専攻（学部・学科）または10年以上の実務経験が、雇用契約における職務内容と学術的・実務的に関連しているか確認してください。",
    penalties: "不法就労助長罪に問われた場合、雇用主に対して「3年以下の懲役もしくは300万円以下の罰金（またはその両方）」が科されます。"
  },
  tokuteiginou: {
    title: "特定技能 (Specified Skilled Worker)",
    type: "就労制限あり（指定された産業分野の職務のみ）",
    typeColor: "text-blue-600 bg-blue-50 border-blue-200",
    scope: "指定された特定産業分野（建設、介護、ビルクリーニング、素形材・産業機械・電気電子情報関連産業、自動車整備、航空、宿泊、農業、漁業、飲食料品製造、外食など）での現業および作業労働。",
    hours: "時間制限なし（雇用契約に基づく）",
    restrictions: "指定された特定産業分野（在留カード裏面の指定書に記載）以外の他職種での就労は不可。他企業への派遣や出向は建設や農業の一部例外を除き原則不可。",
    compliance: "受入れにあたって「支援計画」の適正な作成・実施、または登録支援機関への委託手続きが必要です。また定期的な入管への届出が義務付けられています。",
    penalties: "支援計画の懈怠や、虚偽報告、未届出の場合、特定技能外国人受け入れ停止処分や改善命令の対象となります。"
  },
  ginoujisshuu: {
    title: "技能実習 (Technical Intern Training)",
    type: "就労制限あり（認定された実習計画の職務のみ）",
    typeColor: "text-amber-600 bg-amber-50 border-amber-200",
    scope: "認定された技能実習計画（職種・作業内容）に基づき、指導員のもとで行う実習・労働。労働力確保の代替手段としての就労は不可。",
    hours: "時間制限なし（認定実習計画に基づく範囲）",
    restrictions: "転籍・転職は原則として不可（やむを得ない事情による転籍等を除く）。他社でのアルバイトや派遣就労は完全に禁止。",
    compliance: "監理団体による定期巡回・指導が行われているか、技能実習指導員・生活指導員が適切に配置されているか確認してください。",
    penalties: "労働基準法違反や、不適正な実習、実習生の失踪放置の場合、受入れ資格剥奪（5年間受入れ不可）となります。"
  },
  ryugaku: {
    title: "留学 (Student)",
    type: "原則就労不可（資格外活動許可が必要）",
    typeColor: "text-rose-600 bg-rose-50 border-rose-200",
    scope: "資格外活動許可を得ている場合、アルバイト就労が可能（ただし、風俗営業関連職種への従事は厳禁）。",
    hours: "週28時間以内 (学校の長期休業期間中は1日8時間以内まで緩和されます)",
    restrictions: "風俗店での接客、清掃、ビラ配り等の「風俗営業」に係る就労は禁止。他のアルバイトと掛け持ちしている場合、合計時間が週28時間以内でなければなりません。",
    compliance: "在留カード裏面下部の「資格外活動許可欄」に「許可（原則週28時間以内・風俗営業等の従事を除く）」の印字があること、および学校に在籍中（休学・退学でないこと）を確認してください。",
    penalties: "週28時間を超えて就労させた（オーバーワーク）場合、従業員は退去強制、雇用主は不法就労助長罪で厳罰対象となります。"
  },
  kazokutaizai: {
    title: "家族滞在 (Dependent)",
    type: "原則就労不可（資格外活動許可が必要）",
    typeColor: "text-rose-600 bg-rose-50 border-rose-200",
    scope: "資格外活動許可を得ている場合、アルバイト就労が可能（留学と同様に風俗営業関連職種は厳禁）。",
    hours: "週28時間以内",
    restrictions: "風俗営業に従事すること、および週28時間を超過した労働は完全に禁止されます。",
    compliance: "在留カード裏面の「資格外活動許可欄」を確認してください。また、扶養者（配偶者等）の在留資格（期限）が有効であるか連動して注意する必要があります。",
    penalties: "資格外活動許可のない就労や制限時間を超過した就労は、不法就労およびその助長罪になります。"
  },
  eijuusha: {
    title: "永住者 / 配偶者等 / 定住者 (Eijuusha etc.)",
    type: "就労制限なし",
    typeColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
    scope: "日本人と同様に、あらゆる職種・業務（事務、技術、現業、風俗営業、自営業等）および労働形態（正社員、派遣、パート）で就労可能です。",
    hours: "時間制限なし（労働基準法に則る）",
    restrictions: "就労における在留資格上の制限は一切ありません。",
    compliance: "在留カードの有効期限が切れていないことを確認してください（永住者のカード有効期間は7年、配偶者や定住者は設定された期限ごと）。",
    penalties: "雇用面での入管法違反はありませんが、在留カードの更新漏れによる不法残留とならないよう管理してください。"
  }
};

// Helper interface for cross-referenced eligibility results
interface EligibilityResult {
  allowed: "allowed" | "conditional" | "forbidden";
  badgeText: string;
  badgeColor: string;
  resultTitle: string;
  notes: string;
  penalties: string;
}

// Logic to determine working eligibility based on Visa status, assigned job role, and company industry
const getEligibilityResult = (visa: string, role: string, industry: string): EligibilityResult => {
  if (visa === "eijuusha") {
    return {
      allowed: "allowed",
      badgeText: "判定：可能（就労制限なし）",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      resultTitle: "この資格・職種での就労は：【可能】です",
      notes: "永住者、日本人の配偶者等、定住者の在留資格は、職種や勤務時間の制限なく日本人と同様にどのような業務にも従事できます。カード有効期限の更新管理のみ注意してください。",
      penalties: "就労面での入管法上のリスクや罰則はありません。ただし、在留カード自体の有効期限切れによる不法残留とならないよう、定期的な有効期限チェックは必要です。"
    };
  }

  if (visa === "ryugaku" || visa === "kazokutaizai") {
    const isStudent = visa === "ryugaku";
    const visaName = isStudent ? "留学" : "家族滞在";
    if (role === "field_labor") {
      return {
        allowed: "conditional",
        badgeText: "判定：条件付きで可能",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
        resultTitle: `この資格・職種での就労は：【条件付きで可能】です`,
        notes: `現場作業も可能ですが、週28時間以内の就労時間を厳守してください。学校の長期休業期間中（留学ビザのみ）は1日8時間まで緩和されます。風俗営業店での就労（清掃やビラ配り等を含む）は完全に禁止されています。`,
        penalties: "【資格外活動制限違反】他社との掛け持ちも含め、週28時間を1分でも超えて就労させた（オーバーワーク）場合、本人は退去強制（強制送還）の対象となり、雇用主には不法就労助長罪（3年以下の懲役もしくは300万円以下の罰金、またはその両方）が科されます。週次シフトの徹底的な労働時間合算管理が不可欠です。"
      };
    } else {
      return {
        allowed: "conditional",
        badgeText: "判定：条件付きで可能",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
        resultTitle: `この資格・職種での就労は：【条件付きで可能】です`,
        notes: `オフィスワークや翻訳通訳、軽作業も可能ですが、週28時間以内の就労制限が厳密に適用されます。掛け持ちでの労働時間超過に十分注意し、風俗営業店での勤務は行わないでください。`,
        penalties: "【アルバイト時間管理超過違反】週28時間を超過した場合、雇用主は不法就労助長罪で処罰されます。従業員の自己申告のみに頼らず、タイムカードでの実労働時間および他社シフト時間の管理を確実に行ってください。"
      };
    }
  }

  if (visa === "gijinkoku") {
    if (role === "field_labor") {
      return {
        allowed: "forbidden",
        badgeText: "判定：就労不可（高リスク）",
        badgeColor: "bg-rose-100 text-rose-850 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
        resultTitle: "この資格・職種での就労は：【不可】です",
        notes: "「技術・人文知識・国際業務」の在留資格はオフィスワーク（施工管理、CADオペレーター、通訳翻訳、技術的設計、一般事務職など）が前提です。建設現場での単純労働・作業員（資材運搬、塗装、足場組立、現場清掃等）の現業・肉体労働作業に従事させることは一切認められません。",
        penalties: "【不法就労助長罪】オフィスワーク（施工管理等）の名目で入管に登録し、実態として現場の単純肉体作業に従事させた場合、入管法第73条の2に基づき、雇用主に対して「3年以下の懲役もしくは300万円以下の罰金（またはその両方）」が科されます。本罪は「知らなかった」という過失であっても処罰対象となります。また、本人の在留資格取消・強制送還になります。"
      };
    } else {
      return {
        allowed: "allowed",
        badgeText: "判定：可能（オフィスワークのみ）",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
        resultTitle: "この資格・職種での就労は：【可能】です",
        notes: "施工管理、設計、営業、総務事務、通訳翻訳などの技術的・専門的オフィス業務での就労が可能です。学歴（専攻分野）または一定年数の実務経験と、従事する職務の明確な関連性が求められます。",
        penalties: "就労範囲自体は適正ですが、本人が現場作業を手伝うなど「単純労働」に従事している実態があると判断された場合、ビザ更新申請時に不許可となり、不法就労助長罪の対象となるリスクがあります。本来の職務の専従を徹底してください。"
      };
    }
  }

  if (visa === "tokuteiginou") {
    if (role === "field_labor") {
      return {
        allowed: "allowed",
        badgeText: "判定：可能（登録分野のみ）",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
        resultTitle: "この資格・職種での就労は：【可能】です",
        notes: "特定技能（建設分野）として、登録された特定産業分野の職務（型枠施工、左官、コンクリート圧送、土工などの現業労働・作業）への従事が可能です。受け入れにあたり「特定技能外国人支援計画」の適正実施が前提です。",
        penalties: "【支援計画不履行リスク】支援計画の実施懈怠（義務的支援の未実施）、入管への虚偽報告、定期報告の不履行等が発生した場合、指導対象となり、最悪の場合「受け入れ機関適合性」を取り消され、今後5年間特定技能外国人の新規受入れができなくなります。"
      };
    } else {
      return {
        allowed: "forbidden",
        badgeText: "判定：就労不可",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
        resultTitle: "この資格・職種での就労は：【不可】です",
        notes: "特定技能は現場・技能現業作業を行うための在留資格であり、一般事務職や専従の翻訳通訳、専従 of 営業職などのオフィスワークに専属して就労することは法律上認められていません（軽微な付随事務作業を除く）。",
        penalties: "【資格外活動・ビザ違反】就労可能な職務の範囲（現場の作業）を超えた専従事務への配置はビザ不適合となり、入管の査察等で発覚した場合、虚偽申告や不当雇用とみなされ、受け入れ停止処分やビザ不許可処分となる重大なリスクがあります。"
      };
    }
  }

  if (visa === "ginoujisshuu") {
    if (role === "field_labor") {
      return {
        allowed: "allowed",
        badgeText: "判定：可能（実習計画範囲）",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
        resultTitle: "この資格・職種での就労は：【可能】です",
        notes: "認定された技能実習計画の職種・作業内容の範囲に基づき、現場での実習（就労）が可能です。実習実施者としての労基法遵守および適切な実習指導員の配置が前提となります。",
        penalties: "【実習計画・基準違反】計画外の職種（例: 土工計画なのに足場組立に専従させる等）に従事させた場合、技能実習適正化法に基づき改善命令や実習認定取消処分が下されます。認定取り消し後は5年間新たな実習生の受け入れは完全に停止されます。"
      };
    } else {
      return {
        allowed: "forbidden",
        badgeText: "判定：就労不可",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
        resultTitle: "この資格・職種での就労は：【不可】です",
        notes: "技能実習計画において認定された職種以外の職務（例: オフィス内での事務作業、他部署での軽作業、専属の通訳業務など）に従事することはできません。",
        penalties: "【計画外労働違反】実習計画外のデスクワークや一般事務に従事させた場合、実習生の失踪や不適正実習の引き金になり、実習認定取消および行政処分の対象となる重大な違法行為に該当します。"
      };
    }
  }

  return {
    allowed: "forbidden",
    badgeText: "判定：判定不可",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    resultTitle: "判定できません",
    notes: "組み合わせが未定義です。詳細情報をご自身でご確認ください。",
    penalties: "未定義 of 違反リスクが存在する可能性があります。"
  };
};

export default function BasicManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [company, setCompany] = useState<any | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("card-mgmt");

  // Modal State
  const [isAiScanOpen, setIsAiScanOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanFilled, setIsScanFilled] = useState(false);

  // Form Field State (For creating a new employee)
  const [formData, setFormData] = useState<Partial<EmployeeData>>({
    name: "",
    nationality: "",
    birthDate: "",
    gender: "男性",
    address: "",
    phone: "",
    email: "",
    statusOfResidence: "特定技能",
    cardNumber: "",
    expirationDate: "",
    passportNumber: "",
    passportExpirationDate: "",
    contractPeriod: "1年",
    status: "active",
    department: ""
  });

  // Spreadsheet state for inline edits
  const [spreadsheetData, setSpreadsheetData] = useState<any[]>([]);
  const [isSavingSpreadsheet, setIsSavingSpreadsheet] = useState(false);

  // Alert Settings state
  const [alertSettings, setAlertSettings] = useState({
    alert6Months: true,
    alert3Months: true,
    alert1Month: true,
    alertExpired: true,
    notifyEmail: ""
  });

  // Working eligibility checker state
  const [selectedVisaCheck, setSelectedVisaCheck] = useState("gijinkoku");
  const [selectedJobRole, setSelectedJobRole] = useState("field_labor");

  // Ledger select employee state
  const [selectedLedgerEmpId, setSelectedLedgerEmpId] = useState("");

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

  const loadData = async () => {
    if (!user || user.role !== "company" || !user.companyId) return;
    try {
      const [compRes, empRes] = await Promise.all([
        getCompanyById(user.companyId),
        getEmployeesByCompanyId(user.companyId)
      ]);

      if (compRes.success && compRes.data) {
        setCompany(compRes.data);
      }
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
        setSpreadsheetData(JSON.parse(JSON.stringify(empRes.data))); // deep copy for editing
        if (empRes.data.length > 0) {
          setSelectedLedgerEmpId(empRes.data[0].id);
        }
      }

      // Load alert settings from localStorage
      const stored = localStorage.getItem(`alert_settings_${user.companyId}`);
      if (stored) {
        setAlertSettings(JSON.parse(stored));
      } else {
        setAlertSettings({
          alert6Months: true,
          alert3Months: true,
          alert1Month: true,
          alertExpired: true,
          notifyEmail: compRes.data?.contactEmail || ""
        });
      }
    } catch (err) {
      console.error("Error loading basic management data:", err);
      toast({
        title: "データ取得エラー",
        description: "従業員情報および企業情報の取得に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "company") {
        router.push("/dashboard");
      } else {
        loadData();
      }
    }
  }, [user, authLoading]);

  // Form input changes
  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // AI Scan handler
  const handleScanComplete = (data: ResidenceCardData) => {
    setFormData(prev => ({
      ...prev,
      name: data.name || "",
      statusOfResidence: data.statusOfResidence || "特定技能",
      expirationDate: data.expirationDate || "",
      cardNumber: data.cardNumber || "",
      nationality: data.nationality || "",
      birthDate: data.birthDate || "",
    }));
    setIsScanFilled(true);
    toast({
      title: "AIスキャン完了",
      description: "在留カード情報を自動入力しました。不足項目を確認の上、登録してください。",
    });
  };

  const handleCreateEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    // Check required fields
    if (!formData.name || !formData.nationality || !formData.statusOfResidence || !formData.expirationDate) {
      toast({
        title: "入力エラー",
        description: "氏名、国籍、在留資格、満了日は必須項目です。",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const fullData: EmployeeData = {
        companyId: user.companyId,
        name: formData.name || "",
        nationality: formData.nationality || "",
        birthDate: formData.birthDate || "1995-01-01",
        gender: formData.gender || "男性",
        address: formData.address || "未登録",
        phone: formData.phone || "000-0000-0000",
        email: formData.email || "",
        statusOfResidence: formData.statusOfResidence || "特定技能",
        cardNumber: formData.cardNumber || "未登録",
        expirationDate: formData.expirationDate || "",
        passportNumber: formData.passportNumber || "未登録",
        passportExpirationDate: formData.passportExpirationDate || "2030-01-01",
        contractPeriod: formData.contractPeriod || "1年",
        status: (formData.status as any) || "active",
        department: formData.department || ""
      };

      const res = await createEmployee(fullData);
      if (res.success) {
        toast({
          title: "登録成功",
          description: `${fullData.name} さんの情報を新規登録しました。`,
        });

        // Reset form
        setFormData({
          name: "",
          nationality: "",
          birthDate: "",
          gender: "男性",
          address: "",
          phone: "",
          email: "",
          statusOfResidence: "特定技能",
          cardNumber: "",
          expirationDate: "",
          passportNumber: "",
          passportExpirationDate: "",
          contractPeriod: "1年",
          status: "active",
          department: ""
        });
        setIsScanFilled(false);
        setIsAiScanOpen(false);
        setIsManualOpen(false);
        setLoading(true);
        await loadData();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        title: "登録失敗",
        description: err.message || "従業員の登録処理に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // PDF report export for Residence Cards list
  const handleExportResidenceCardsPdf = async () => {
    toast({
      title: "PDF出力中",
      description: "在留カード管理リストを出力しています...",
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
      doc.text("MA WORK JP - Basic Management Report", 210 - margin, 15, { align: "right" });

      doc.setFontSize(18);
      doc.setTextColor(26, 58, 123);
      doc.text("外国人従業員 在留資格・期限一覧", margin, 25);

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`企業名: ${company?.name || "小畑組"}  |  出力日時: ${new Date().toLocaleString("ja-JP")}`, margin, 32);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, 210 - margin, 35);

      const tableHeaders = [["氏名", "国籍", "在留資格", "在留カード番号", "満了日", "ステータス"]];
      const tableRows = employees.map(emp => {
        let statusText = "有効";
        if (emp.status === "expired") statusText = "期限超過";
        if (emp.status === "expiring_soon") statusText = "期限間近";
        if (emp.status === "resigned") statusText = "退職";

        return [
          emp.name || "",
          emp.nationality || "",
          emp.statusOfResidence || "",
          emp.cardNumber || "",
          emp.expirationDate || "",
          statusText
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

      doc.save(`${company?.name || "企業"}_在留カード管理リスト.pdf`);
      toast({
        title: "出力完了",
        description: "在留カード管理リストPDFをダウンロードしました。",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "出力エラー",
        description: "PDF出力中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  // Spreadsheet Cell modification handler
  const handleSpreadsheetCellChange = (id: string, field: string, value: string) => {
    setSpreadsheetData(prev => 
      prev.map(emp => emp.id === id ? { ...emp, [field]: value } : emp)
    );
  };

  // Save Spreadsheet inline edits
  const handleSaveSpreadsheet = async () => {
    setIsSavingSpreadsheet(true);
    try {
      // Find modified records
      const modifiedList = spreadsheetData.filter(edited => {
        const original = employees.find(o => o.id === edited.id);
        if (!original) return false;
        return (
          edited.name !== original.name ||
          edited.nationality !== original.nationality ||
          edited.statusOfResidence !== original.statusOfResidence ||
          edited.cardNumber !== original.cardNumber ||
          edited.expirationDate !== original.expirationDate
        );
      });

      if (modifiedList.length === 0) {
        toast({
          title: "更新なし",
          description: "変更された項目はありませんでした。",
        });
        setIsSavingSpreadsheet(false);
        return;
      }

      const promises = modifiedList.map(edited => {
        return updateEmployee(edited.id, {
          name: edited.name,
          nationality: edited.nationality,
          statusOfResidence: edited.statusOfResidence,
          cardNumber: edited.cardNumber,
          expirationDate: edited.expirationDate
        });
      });

      const results = await Promise.all(promises);
      const errors = results.filter(r => !r.success);

      if (errors.length === 0) {
        toast({
          title: "一括保存成功",
          description: `${modifiedList.length} 件の従業員情報を更新しました。`,
        });
        setLoading(true);
        await loadData();
      } else {
        throw new Error("一部の情報の更新に失敗しました。");
      }
    } catch (err: any) {
      toast({
        title: "保存エラー",
        description: err.message || "スプレッドシートの保存処理に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsSavingSpreadsheet(false);
    }
  };

  // Save Alert Settings
  const handleSaveAlertSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    localStorage.setItem(`alert_settings_${user.companyId}`, JSON.stringify(alertSettings));
    toast({
      title: "設定保存完了",
      description: "更新アラートおよびメール通知の設定を保存しました。",
    });
  };

  // Delete employee action
  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!window.confirm(`${name} さんの従業員情報を削除しますか？\n（この操作は取り消せません）`)) return;
    
    try {
      const res = await deleteEmployee(id);
      if (res.success) {
        toast({
          title: "削除完了",
          description: `${name} さんの情報を削除しました。`,
        });
        setLoading(true);
        await loadData();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        title: "削除失敗",
        description: err.message || "削除処理中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  // LEDGER PDF EXPORT
  const handleExportLedgerPdf = async () => {
    const activeLedgerEmp = employees.find(e => e.id === selectedLedgerEmpId);
    if (!activeLedgerEmp) return;

    toast({
      title: "台帳PDF出力中",
      description: `${activeLedgerEmp.name} さんの労働者名簿を出力しています...`,
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
      
      // Document border
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.7);
      doc.rect(margin, margin, 210 - (margin * 2), 297 - (margin * 2));

      // Title
      doc.setFontSize(16);
      doc.setFont(fontName, "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("外 国 人 従 業 員 台 帳 (労働者名簿)", 105, margin + 12, { align: "center" });

      // Divider line
      doc.setLineWidth(0.4);
      doc.line(margin + 5, margin + 18, 205 - 5, margin + 18);

      // Section 1: Corporate Name
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("事業主名 / 企業名: ", margin + 8, margin + 25);
      doc.setTextColor(15, 23, 42);
      doc.setFont(fontName, "normal");
      doc.text(company?.name || "小畑組", margin + 38, margin + 25);

      // Ledger Table details
      const ledgerHeaders = [["基本管理項目", "登録内容詳細"]];
      const ledgerRows = [
        ["氏名 (アルファベット)", activeLedgerEmp.name || "未登録"],
        ["国籍・地域", activeLedgerEmp.nationality || "未登録"],
        ["生年月日", activeLedgerEmp.birthDate || "未登録"],
        ["性別", activeLedgerEmp.gender || "未登録"],
        ["現住所", activeLedgerEmp.address || "未登録"],
        ["連絡先電話番号", activeLedgerEmp.phone || "未登録"],
        ["メールアドレス", activeLedgerEmp.email || "未登録"],
        ["在留資格", activeLedgerEmp.statusOfResidence || "未登録"],
        ["在留カード番号", activeLedgerEmp.cardNumber || "未登録"],
        ["在留期間満了日", activeLedgerEmp.expirationDate || "未登録"],
        ["パスポート番号", activeLedgerEmp.passportNumber || "未登録"],
        ["パスポート有効期限", activeLedgerEmp.passportExpirationDate || "未登録"],
        ["雇用契約期間", activeLedgerEmp.contractPeriod || "未登録"],
        ["配属先部署・役職", activeLedgerEmp.department || "指定なし"],
        ["ステータス", activeLedgerEmp.status === "active" ? "在籍 (就労中)" : "その他"],
        ["台帳登録日", new Date(activeLedgerEmp.createdAt || new Date()).toLocaleDateString("ja-JP")]
      ];

      autoTable(doc, {
        startY: margin + 30,
        head: ledgerHeaders,
        body: ledgerRows,
        styles: { font: fontName, fontSize: 9.5, cellPadding: 4.5 },
        headStyles: { fillColor: [71, 85, 105], font: fontName },
        margin: { left: margin + 8, right: margin + 8 },
        theme: "grid"
      });

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("※本台帳は労働基準法第107条及び出入国管理法に基づき作成管理される簡易台帳です。", margin + 10, 297 - margin - 8);

      doc.save(`${activeLedgerEmp.name}_外国人労働者台帳.pdf`);
      toast({
        title: "出力完了",
        description: "台帳PDFのダウンロードが完了しました。",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "出力エラー",
        description: "台帳PDF出力中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[500px] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#1A3A7B]" />
        <p className="text-sm text-slate-500 font-semibold">データを読み込んでいます...</p>
      </div>
    );
  }

  // Find active ledger employee
  const activeLedgerEmp = employees.find(e => e.id === selectedLedgerEmpId);

  // Helper: calculate remaining visa days
  const getRemainingDays = (dateStr: string) => {
    if (!dateStr) return 999;
    const expDate = new Date(dateStr.replace(/\//g, "-"));
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper: render warning badges
  const renderAlertBadge = (dateStr: string) => {
    const days = getRemainingDays(dateStr);
    if (days < 0) {
      return <Badge className="bg-rose-100 text-rose-800 border-rose-200">🚨 期限超過 ({Math.abs(days)}日超過)</Badge>;
    } else if (days < 30) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200 animate-pulse">⚠️ 1ヶ月未満 (残り{days}日)</Badge>;
    } else if (days < 90) {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">⚠️ 3ヶ月未満 (残り{days}日)</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">✓ 正常 (残り{days}日)</Badge>;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-9 w-9 border-slate-200 shadow-sm hover:bg-slate-50">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 text-slate-700" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-[#1A3A7B] tracking-tight">基本管理ダッシュボード</h1>
            <p className="text-xs text-muted-foreground mt-0.5">在留カードの登録、期限アラート、就労チェック、従業員台帳を一元管理します</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full print:shadow-none">
        
        {/* Tab triggers */}
        <div className="border-b bg-white dark:bg-zinc-950 p-1.5 rounded-lg border shadow-sm print:hidden">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full bg-slate-100/50 p-1 rounded-md h-auto gap-1">
            <TabsTrigger value="card-mgmt" className="text-xs font-bold py-2 rounded-md">
              🪪 在留カード管理
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs font-bold py-2 rounded-md">
              🔔 更新アラート
            </TabsTrigger>
            <TabsTrigger value="eligibility" className="text-xs font-bold py-2 rounded-md">
              ⚖️ 就労資格チェック
            </TabsTrigger>
            <TabsTrigger value="spreadsheet" className="text-xs font-bold py-2 rounded-md">
              📊 期限管理フォーマット
            </TabsTrigger>
            <TabsTrigger value="ledger" className="text-xs font-bold py-2 rounded-md">
              📋 簡易台帳
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: RESIDENCE CARD MANAGEMENT */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="card-mgmt" className="focus-visible:outline-none print:hidden">
          <Card className="border border-slate-100 shadow-md">
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b bg-slate-50/40">
              <div>
                <CardTitle className="text-base font-black text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="h-5 w-5 text-[#1A3A7B]" />
                  在留カード登録・管理
                </CardTitle>
                <CardDescription className="text-xs">
                  外国人従業員の在留カード情報を登録し、PDFとしてエクスポートできます。
                </CardDescription>
              </div>

              {/* Registration and Export actions */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* AI Scan Trigger */}
                <Dialog open={isAiScanOpen} onOpenChange={setIsAiScanOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-semibold text-xs h-9 px-4 shadow">
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-yellow-300 animate-pulse" />
                      AIスキャンで新規登録
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border rounded-xl shadow-xl p-0">
                    <DialogHeader className="p-6 bg-gradient-to-b from-indigo-50/50 to-transparent border-b">
                      <DialogTitle className="text-lg font-black text-[#1A3A7B] flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500 animate-spin" />
                        AI 在留カードスキャン登録
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        在留カードの画像を読み込むと、Gemini AIが主要項目を自動で読み取り入力します。
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                      {/* Left: AI Scanner upload component */}
                      <ResidenceCardScanner 
                        onScanComplete={handleScanComplete}
                        onScanStart={() => setIsScanFilled(false)}
                      />

                      {/* Right: Form fields filled by AI */}
                      <form onSubmit={handleCreateEmployeeSubmit} className="space-y-4">
                        <div className="p-4 border rounded-xl bg-slate-50/50 space-y-3.5">
                          <h3 className="text-xs font-bold text-slate-800 border-b pb-1.5 flex items-center justify-between">
                            <span>スキャン結果確認フォーム</span>
                            {isScanFilled && (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">AI読込完了</Badge>
                            )}
                          </h3>
                          
                          <div className="space-y-1">
                            <Label htmlFor="scan-name" className="text-[11px] font-bold">氏名 <span className="text-rose-500">*</span></Label>
                            <Input id="scan-name" name="name" value={formData.name} onChange={handleFormInputChange} className="h-9 bg-white" required />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="scan-nationality" className="text-[11px] font-bold">国籍 <span className="text-rose-500">*</span></Label>
                              <Input id="scan-nationality" name="nationality" value={formData.nationality} onChange={handleFormInputChange} className="h-9 bg-white" required />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="scan-residence" className="text-[11px] font-bold">在留資格 <span className="text-rose-500">*</span></Label>
                              <Input id="scan-residence" name="statusOfResidence" value={formData.statusOfResidence} onChange={handleFormInputChange} className="h-9 bg-white" required />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="scan-card" className="text-[11px] font-bold">在留カード番号</Label>
                              <Input id="scan-card" name="cardNumber" value={formData.cardNumber} onChange={handleFormInputChange} className="h-9 bg-white uppercase" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="scan-expiry" className="text-[11px] font-bold">在留期間満了日 <span className="text-rose-500">*</span></Label>
                              <Input id="scan-expiry" name="expirationDate" type="date" value={formData.expirationDate} onChange={handleFormInputChange} className="h-9 bg-white" required />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="scan-birth" className="text-[11px] font-bold">生年月日</Label>
                              <Input id="scan-birth" name="birthDate" type="date" value={formData.birthDate} onChange={handleFormInputChange} className="h-9 bg-white" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="scan-gender" className="text-[11px] font-bold">性別</Label>
                              <Select value={formData.gender} onValueChange={(val) => handleSelectChange("gender", val)}>
                                <SelectTrigger id="scan-gender" className="h-9 bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="男性">男性</SelectItem>
                                  <SelectItem value="女性">女性</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                            <div className="space-y-1">
                              <Label htmlFor="scan-passport" className="text-[11px] font-bold">パスポート番号</Label>
                              <Input id="scan-passport" name="passportNumber" value={formData.passportNumber} onChange={handleFormInputChange} className="h-9 bg-white" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="scan-passport-exp" className="text-[11px] font-bold">パスポート満了日</Label>
                              <Input id="scan-passport-exp" name="passportExpirationDate" type="date" value={formData.passportExpirationDate} onChange={handleFormInputChange} className="h-9 bg-white" />
                            </div>
                          </div>
                        </div>

                        <DialogFooter className="p-4 border-t bg-slate-50/50">
                          <Button type="button" variant="outline" onClick={() => setIsAiScanOpen(false)} className="h-9 text-xs font-bold">
                            キャンセル
                          </Button>
                          <Button type="submit" disabled={isSaving} className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 h-9 text-xs font-bold gap-1 shadow">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            従業員情報として登録
                          </Button>
                        </DialogFooter>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Manual Registration Trigger */}
                <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-slate-200 hover:bg-slate-50 font-semibold text-xs h-9 px-4 shadow-sm">
                      <Plus className="h-3.5 w-3.5 mr-1 text-slate-600" />
                      手動で新規登録
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-background border rounded-xl shadow-xl p-0">
                    <DialogHeader className="p-6 bg-slate-50/50 border-b">
                      <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                        <User className="h-5 w-5 text-indigo-500" />
                        手動従業員登録
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        新しい外国人従業員情報のすべての管理フィールドを手動で登録します。
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateEmployeeSubmit} className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="m-name" className="text-xs font-bold">氏名 <span className="text-rose-500">*</span></Label>
                          <Input id="m-name" name="name" value={formData.name} onChange={handleFormInputChange} placeholder="SMITH JOHN" required />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="m-nationality" className="text-xs font-bold">国籍・地域 <span className="text-rose-500">*</span></Label>
                          <Input id="m-nationality" name="nationality" value={formData.nationality} onChange={handleFormInputChange} placeholder="ベトナム" required />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="m-birth" className="text-xs font-bold">生年月日 <span className="text-rose-500">*</span></Label>
                          <Input id="m-birth" name="birthDate" type="date" value={formData.birthDate} onChange={handleFormInputChange} required />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="m-gender" className="text-xs font-bold">性別 <span className="text-rose-500">*</span></Label>
                          <Select value={formData.gender} onValueChange={(val) => handleSelectChange("gender", val)}>
                            <SelectTrigger id="m-gender" className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="男性">男性</SelectItem>
                              <SelectItem value="女性">女性</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <Label htmlFor="m-address" className="text-xs font-bold">現住所 <span className="text-rose-500">*</span></Label>
                          <Input id="m-address" name="address" value={formData.address} onChange={handleFormInputChange} placeholder="東京都新宿区西新宿1-1" required />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="m-phone" className="text-xs font-bold">電話番号 <span className="text-rose-500">*</span></Label>
                          <Input id="m-phone" name="phone" value={formData.phone} onChange={handleFormInputChange} placeholder="090-1234-5678" required />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="m-email" className="text-xs font-bold">メールアドレス</Label>
                          <Input id="m-email" name="email" type="email" value={formData.email} onChange={handleFormInputChange} placeholder="john@example.com" />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="m-residence" className="text-xs font-bold">在留資格 <span className="text-rose-500">*</span></Label>
                          <Input id="m-residence" name="statusOfResidence" value={formData.statusOfResidence} onChange={handleFormInputChange} placeholder="特定技能" required />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="m-card" className="text-xs font-bold">在留カード番号 <span className="text-rose-500">*</span></Label>
                          <Input id="m-card" name="cardNumber" value={formData.cardNumber} onChange={handleFormInputChange} placeholder="AB12345678CD" className="uppercase" required />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="m-expiry" className="text-xs font-bold">在留期間満了日 <span className="text-rose-500">*</span></Label>
                          <Input id="m-expiry" name="expirationDate" type="date" value={formData.expirationDate} onChange={handleFormInputChange} required />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="m-contract" className="text-xs font-bold">雇用契約期間 <span className="text-rose-500">*</span></Label>
                          <Input id="m-contract" name="contractPeriod" value={formData.contractPeriod} onChange={handleFormInputChange} placeholder="1年" required />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="m-passport" className="text-xs font-bold">パスポート番号 <span className="text-rose-500">*</span></Label>
                          <Input id="m-passport" name="passportNumber" value={formData.passportNumber} onChange={handleFormInputChange} placeholder="TK1234567" required />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="m-passport-exp" className="text-xs font-bold">パスポート満了日 <span className="text-rose-500">*</span></Label>
                          <Input id="m-passport-exp" name="passportExpirationDate" type="date" value={formData.passportExpirationDate} onChange={handleFormInputChange} required />
                        </div>
                      </div>

                      <DialogFooter className="pt-4 border-t mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsManualOpen(false)} className="h-10 text-xs font-bold">
                          キャンセル
                        </Button>
                        <Button type="submit" disabled={isSaving} className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 h-10 text-xs font-bold gap-1 shadow">
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          従業員を新規登録
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* PDF Export trigger */}
                <Button 
                  onClick={handleExportResidenceCardsPdf}
                  variant="outline" 
                  className="border-slate-200 hover:bg-slate-50 font-semibold text-xs h-9 px-4 shadow-sm"
                >
                  <FileDown className="h-3.5 w-3.5 mr-1 text-slate-600" />
                  PDF出力
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {employees.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-sm font-semibold">登録されている外国人従業員はいません。</p>
                  <p className="text-xs text-slate-400 mt-1">「AIスキャンで新規登録」または「手動で新規登録」から従業員を追加してください。</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="font-bold text-slate-700">氏名</TableHead>
                        <TableHead className="font-bold text-slate-700">国籍</TableHead>
                        <TableHead className="font-bold text-slate-700">在留資格</TableHead>
                        <TableHead className="font-bold text-slate-700">在留カード番号</TableHead>
                        <TableHead className="font-bold text-slate-700">在留期間満了日</TableHead>
                        <TableHead className="w-[180px] text-center font-bold text-slate-700">在留状況</TableHead>
                        <TableHead className="w-[80px] text-center font-bold text-slate-700">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map(emp => (
                        <TableRow key={emp.id} className="hover:bg-slate-50/40">
                          <TableCell className="font-black text-slate-800 text-xs">{emp.name}</TableCell>
                          <TableCell className="text-xs font-semibold text-slate-600">{emp.nationality}</TableCell>
                          <TableCell className="text-xs font-bold text-indigo-950">{emp.statusOfResidence}</TableCell>
                          <TableCell className="text-xs font-mono font-bold text-slate-700 uppercase">{emp.cardNumber}</TableCell>
                          <TableCell className="text-xs font-semibold text-slate-600">{emp.expirationDate}</TableCell>
                          <TableCell className="text-center">
                            {renderAlertBadge(emp.expirationDate)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-md"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* TAB 2: EXPIRY ALERTS */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="alerts" className="focus-visible:outline-none print:hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Alerts threshold settings */}
            <form onSubmit={handleSaveAlertSettings} className="lg:col-span-4 space-y-6">
              <Card className="border border-slate-100 shadow-md">
                <CardHeader className="pb-3 border-b bg-slate-50/30">
                  <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" />
                    更新通知アラート設定
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    在留期限の満了日が近付いた際の、通知タイミングと配信先を指定します。
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <Label htmlFor="set-6m" className="text-xs font-bold text-slate-700">在留期限 6ヶ月前通知</Label>
                      <Switch 
                        id="set-6m" 
                        checked={alertSettings.alert6Months} 
                        onCheckedChange={(checked) => setAlertSettings(prev => ({ ...prev, alert6Months: checked }))} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pb-2 border-b">
                      <Label htmlFor="set-3m" className="text-xs font-bold text-slate-700">在留期限 3ヶ月前通知</Label>
                      <Switch 
                        id="set-3m" 
                        checked={alertSettings.alert3Months} 
                        onCheckedChange={(checked) => setAlertSettings(prev => ({ ...prev, alert3Months: checked }))} 
                      />
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b">
                      <Label htmlFor="set-1m" className="text-xs font-bold text-slate-700">在留期限 1ヶ月前通知</Label>
                      <Switch 
                        id="set-1m" 
                        checked={alertSettings.alert1Month} 
                        onCheckedChange={(checked) => setAlertSettings(prev => ({ ...prev, alert1Month: checked }))} 
                      />
                    </div>

                    <div className="flex items-center justify-between pb-2">
                      <Label htmlFor="set-exp" className="text-xs font-bold text-slate-700">期限超過（警告）通知</Label>
                      <Switch 
                        id="set-exp" 
                        checked={alertSettings.alertExpired} 
                        onCheckedChange={(checked) => setAlertSettings(prev => ({ ...prev, alertExpired: checked }))} 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t">
                    <Label htmlFor="notify-email" className="text-xs font-bold text-slate-700">通知先メールアドレス</Label>
                    <Input 
                      id="notify-email"
                      type="email"
                      value={alertSettings.notifyEmail}
                      onChange={(e) => setAlertSettings(prev => ({ ...prev, notifyEmail: e.target.value }))}
                      placeholder="alerts@company.com"
                      className="bg-white h-9 text-xs"
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/20 border-t p-3.5 flex justify-end">
                  <Button type="submit" className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 h-9 text-xs font-bold gap-1 shadow">
                    <Save className="h-3.5 w-3.5" />
                    設定を保存
                  </Button>
                </CardFooter>
              </Card>
            </form>

            {/* Right: Expiry Warning List */}
            <Card className="lg:col-span-8 border border-slate-100 shadow-md">
              <CardHeader className="pb-3 border-b bg-slate-50/30">
                <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                  期限間近・期限超過メンバー
                </CardTitle>
                <CardDescription className="text-[10px]">
                  在留期限が90日未満、またはすでに超過している従業員の一覧です。
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {employees.filter(e => getRemainingDays(e.expirationDate) < 90).length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500 opacity-60" />
                    <p className="text-sm font-semibold">現在、更新期限の迫っている従業員はいません。</p>
                    <p className="text-xs text-slate-400 mt-1">すべての在留外国人従業員は安全に就労可能な有効期間内です。</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="font-bold text-slate-700">氏名</TableHead>
                          <TableHead className="font-bold text-slate-700">在留資格</TableHead>
                          <TableHead className="font-bold text-slate-700">満了日</TableHead>
                          <TableHead className="w-[100px] text-right font-bold text-slate-700">残り日数</TableHead>
                          <TableHead className="w-[160px] text-center font-bold text-slate-700">警告区分</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees
                          .filter(e => getRemainingDays(e.expirationDate) < 90)
                          .sort((a, b) => getRemainingDays(a.expirationDate) - getRemainingDays(b.expirationDate))
                          .map(emp => {
                            const days = getRemainingDays(emp.expirationDate);
                            const isExpired = days < 0;
                            const isCritical = days >= 0 && days < 30;
                            
                            return (
                              <TableRow key={emp.id} className="hover:bg-slate-50/40">
                                <TableCell className="font-black text-slate-800 text-xs">{emp.name}</TableCell>
                                <TableCell className="text-xs font-semibold text-indigo-950">{emp.statusOfResidence}</TableCell>
                                <TableCell className="text-xs font-semibold text-slate-600">{emp.expirationDate}</TableCell>
                                <TableCell className={`text-xs text-right font-black ${isExpired ? "text-rose-600" : isCritical ? "text-orange-600" : "text-amber-600"}`}>
                                  {isExpired ? `超過 ${Math.abs(days)}` : `${days}`} 日
                                </TableCell>
                                <TableCell className="text-center">
                                  {isExpired ? (
                                    <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-bold hover:bg-rose-100">🚨 不法残留リスク</Badge>
                                  ) : isCritical ? (
                                    <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-bold animate-pulse hover:bg-orange-100">🚨 即時更新申請</Badge>
                                  ) : (
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-bold hover:bg-amber-100">⚠️ 書類準備開始</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="eligibility" className="focus-visible:outline-none print:hidden">
          <Card className="border border-slate-100 shadow-md">
            <CardHeader className="pb-3 border-b bg-slate-50/30">
              <CardTitle className="text-base font-black text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-indigo-500" />
                就労可能資格判定・チェッカー (業種職種連動版)
              </CardTitle>
              <CardDescription className="text-xs">
                自社の登録業種と外国人従業員の在留資格・予定職種を掛け合わせて、安全に就労可能かを自動判定します。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Top Banner: Company Industry Info */}
              <div className="flex items-center gap-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs">
                <Building2 className="h-4 w-4 text-[#1A3A7B]" />
                <div>
                  <span className="font-bold text-slate-500">自社の登録業種: </span>
                  <span className="font-black text-[#1A3A7B] bg-white border px-2 py-0.5 rounded">{company?.industry || "建設・土木"}</span>
                </div>
              </div>

              {/* Selectors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Visa */}
                <div className="space-y-2">
                  <Label htmlFor="visa-select" className="text-xs font-bold text-slate-700">1. 在留資格の選択</Label>
                  <Select value={selectedVisaCheck} onValueChange={setSelectedVisaCheck}>
                    <SelectTrigger id="visa-select" className="h-10 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gijinkoku">💻 技術・人文知識・国際業務 (専門職ビザ)</SelectItem>
                      <SelectItem value="tokuteiginou">🛠️ 特定技能1号・2号 (現場・作業労働分野)</SelectItem>
                      <SelectItem value="ginoujisshuu">🎓 技能実習 (実習計画に基づく労働)</SelectItem>
                      <SelectItem value="ryugaku">✏️ 留学 (資格外活動許可でのアルバイト)</SelectItem>
                      <SelectItem value="kazokutaizai">👨‍👩‍👧 家族滞在 (資格外活動許可でのアルバイト)</SelectItem>
                      <SelectItem value="eijuusha">🟢 永住者・配偶者等・定住者 (就労制限なし)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Select Job Role */}
                <div className="space-y-2">
                  <Label htmlFor="role-select" className="text-xs font-bold text-slate-700">2. 従事予定の職種</Label>
                  <Select value={selectedJobRole} onValueChange={setSelectedJobRole}>
                    <SelectTrigger id="role-select" className="h-10 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="field_labor">🧱 現場作業・単純労働 (屋外作業、現場現業作業等)</SelectItem>
                      <SelectItem value="office_work">📁 事務・技術・通訳 (施工管理、設計、オフィス内作業等)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dynamic rule card output */}
              {(() => {
                const rule = ELIGIBILITY_RULES[selectedVisaCheck];
                if (!rule) return null;

                const industry = company?.industry || "建設・土木";
                const result = getEligibilityResult(selectedVisaCheck, selectedJobRole, industry);
                
                const roleLabel = selectedJobRole === "field_labor" ? "現場作業・単純労働" : "事務・技術・通訳";

                return (
                  <div className="space-y-6 pt-4 border-t">
                    
                    {/* Super Large Results Badge */}
                    <div className="flex flex-col items-center justify-center p-6 border rounded-2xl bg-slate-50/40 text-center space-y-3.5 shadow-inner">
                      <span className="text-xs font-bold text-slate-500">
                        【{company?.name || "自社"}】({industry}) × 予定職種: {roleLabel}
                      </span>
                      
                      <div className={`px-8 py-3.5 rounded-full text-base sm:text-lg font-black border-2 shadow-sm animate-fade-in ${result.badgeColor}`}>
                        {result.badgeText}
                      </div>
                      
                      <h4 className="text-sm sm:text-base font-black text-slate-800 leading-tight">
                        {result.resultTitle}
                      </h4>
                    </div>

                    {/* Columns Detail Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="space-y-4">
                        {/* Visa Base Scope */}
                        <div className="bg-slate-50 p-4 border rounded-xl space-y-2">
                          <span className="text-[10px] font-black text-slate-500 block uppercase">在留資格の本来の活動範囲</span>
                          <h5 className="text-xs font-black text-slate-800">{rule.title}</h5>
                          <p className="text-xs text-slate-600 leading-relaxed font-semibold">{rule.scope}</p>
                        </div>

                        {/* Working Limits & Hours */}
                        <div className="bg-slate-50 p-4 border rounded-xl space-y-1.5">
                          <span className="text-[10px] font-black text-slate-500 block uppercase">就労条件・労働上限時間</span>
                          <p className="text-xs text-slate-800 leading-relaxed font-bold">{rule.hours}</p>
                        </div>

                        {/* Specific Notes */}
                        <div className="bg-amber-500/5 p-4 border border-amber-200/60 rounded-xl space-y-2">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                            本組み合わせにおける注意制限・就労条件
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed font-bold">{result.notes}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Employer Compliance */}
                        <div className="bg-emerald-500/5 p-4 border border-emerald-200/60 rounded-xl space-y-2">
                          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                            雇用主としての確認・届出義務
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed font-semibold">{rule.compliance}</p>
                        </div>

                        {/* Specific Legal Penalties / Risks */}
                        <div className="bg-rose-500/5 p-4 border border-rose-300 rounded-xl space-y-2.5 shadow-sm">
                          <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                            違反時の罰則・固有法的リスク
                          </span>
                          <p className="text-xs text-rose-900 leading-relaxed font-bold bg-rose-100/40 p-3 rounded border border-rose-200/60 shadow-inner">
                            {result.penalties}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}

            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* TAB 4: SPREADSHEET INLINE EDITING */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="spreadsheet" className="focus-visible:outline-none print:hidden">
          <Card className="border border-slate-100 shadow-md">
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b bg-slate-50/40">
              <div>
                <CardTitle className="text-base font-black text-slate-800 flex items-center gap-1.5">
                  <FileText className="h-5 w-5 text-[#1A3A7B]" />
                  在留期限管理フォーマット（スプレッドシート風編集）
                </CardTitle>
                <CardDescription className="text-xs">
                  すべてのセルを直接インラインで編集できます。編集後、右上の「変更を一括保存」ボタンをクリックしてください。
                </CardDescription>
              </div>
              <div>
                <Button 
                  onClick={handleSaveSpreadsheet} 
                  disabled={isSavingSpreadsheet}
                  className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-semibold text-xs h-9 px-5 shadow gap-1.5"
                >
                  {isSavingSpreadsheet ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      変更を一括保存
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {spreadsheetData.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <p className="text-sm font-semibold">データがありません。</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="p-3 font-bold text-slate-700 border-r w-[20%]">氏名</th>
                        <th className="p-3 font-bold text-slate-700 border-r w-[15%]">国籍</th>
                        <th className="p-3 font-bold text-slate-700 border-r w-[20%]">在留資格</th>
                        <th className="p-3 font-bold text-slate-700 border-r w-[20%]">在留カード番号</th>
                        <th className="p-3 font-bold text-slate-700 w-[25%]">在留期間の満了日</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {spreadsheetData.map(emp => (
                        <tr key={emp.id} className="hover:bg-slate-50/30">
                          <td className="p-1 border-r">
                            <Input 
                              value={emp.name || ""} 
                              onChange={(e) => handleSpreadsheetCellChange(emp.id, "name", e.target.value)}
                              className="border-transparent bg-transparent focus:bg-white hover:border-slate-300 h-8 text-xs font-black shadow-none"
                            />
                          </td>
                          <td className="p-1 border-r">
                            <Input 
                              value={emp.nationality || ""} 
                              onChange={(e) => handleSpreadsheetCellChange(emp.id, "nationality", e.target.value)}
                              className="border-transparent bg-transparent focus:bg-white hover:border-slate-300 h-8 text-xs font-semibold shadow-none"
                            />
                          </td>
                          <td className="p-1 border-r">
                            <Input 
                              value={emp.statusOfResidence || ""} 
                              onChange={(e) => handleSpreadsheetCellChange(emp.id, "statusOfResidence", e.target.value)}
                              className="border-transparent bg-transparent focus:bg-white hover:border-slate-300 h-8 text-xs font-bold text-indigo-950 shadow-none"
                            />
                          </td>
                          <td className="p-1 border-r">
                            <Input 
                              value={emp.cardNumber || ""} 
                              onChange={(e) => handleSpreadsheetCellChange(emp.id, "cardNumber", e.target.value)}
                              className="border-transparent bg-transparent focus:bg-white hover:border-slate-300 h-8 text-xs font-mono uppercase shadow-none"
                            />
                          </td>
                          <td className="p-1">
                            <Input 
                              type="date"
                              value={emp.expirationDate || ""} 
                              onChange={(e) => handleSpreadsheetCellChange(emp.id, "expirationDate", e.target.value)}
                              className="border-transparent bg-transparent focus:bg-white hover:border-slate-300 h-8 text-xs shadow-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* TAB 5: SIMPLE LEDGER (PRINT-READY) */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="ledger" className="focus-visible:outline-none">
          <div className="space-y-6">
            
            {/* Control panel for choosing employee and printing */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 bg-white dark:bg-zinc-950 border rounded-xl shadow-sm print:hidden">
              <div className="flex items-center gap-3 w-full max-w-sm">
                <Label htmlFor="ledger-emp-select" className="text-xs font-bold shrink-0 text-slate-700">表示する従業員:</Label>
                <Select value={selectedLedgerEmpId} onValueChange={setSelectedLedgerEmpId}>
                  <SelectTrigger id="ledger-emp-select" className="h-10 bg-white">
                    <SelectValue placeholder="従業員を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name} ({e.nationality})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => window.print()}
                  variant="outline" 
                  className="border-slate-200 hover:bg-slate-50 font-semibold text-xs h-9 px-4 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5 mr-1 text-slate-600" />
                  印刷画面を表示
                </Button>
                <Button 
                  onClick={handleExportLedgerPdf}
                  className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-semibold text-xs h-9 px-4 shadow"
                >
                  <FileDown className="h-3.5 w-3.5 mr-1" />
                  台帳PDF出力
                </Button>
              </div>
            </div>

            {/* Print Area Layout */}
            {activeLedgerEmp ? (
              <div className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl shadow-md p-8 max-w-3xl mx-auto print:border-0 print:shadow-none print:p-0 print:max-w-full">
                
                {/* Print layout document border */}
                <div className="border-[2px] border-slate-800 p-6 space-y-6 bg-white dark:bg-zinc-900 print:border-[3px]">
                  
                  {/* Ledger Header */}
                  <div className="text-center pb-4 border-b-[1.5px] border-slate-700">
                    <h2 className="text-xl font-bold tracking-widest text-slate-900 dark:text-white uppercase">外国人従業員管理台帳 (労働者名簿)</h2>
                    <p className="text-[10px] text-slate-500 mt-1">※労働基準法第107条及び出入国管理法準拠項目</p>
                  </div>

                  {/* Corporate outline details */}
                  <div className="grid grid-cols-2 gap-4 text-xs pb-2 border-b">
                    <div className="flex gap-2">
                      <span className="font-bold text-slate-500">事業主名:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{company?.name || "小畑組"}</span>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <span className="font-bold text-slate-500">台帳出力日時:</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-350">{new Date().toLocaleDateString("ja-JP")}</span>
                    </div>
                  </div>

                  {/* Two column grid table of employee ledger fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                    
                    {/* Basic details */}
                    <div className="space-y-3.5">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b pb-1 flex items-center gap-1 text-[11px] uppercase">
                        <User className="h-3.5 w-3.5 text-indigo-500" />
                        基本プロフィール情報
                      </h3>
                      
                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500">氏名 (英字)</span>
                        <span className="col-span-2 font-black text-slate-800 dark:text-white">{activeLedgerEmp.name || "未設定"}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500">国籍・地域</span>
                        <span className="col-span-2 font-bold text-slate-700 dark:text-slate-200">{activeLedgerEmp.nationality || "未設定"}</span>
                      </div>

                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500">生年月日</span>
                        <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-200">{activeLedgerEmp.birthDate || "未設定"}</span>
                      </div>

                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500">性別</span>
                        <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-200">{activeLedgerEmp.gender || "未設定"}</span>
                      </div>

                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500">現住所</span>
                        <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-200">{activeLedgerEmp.address || "未設定"}</span>
                      </div>

                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500">連絡電話番号</span>
                        <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-200">{activeLedgerEmp.phone || "未設定"}</span>
                      </div>

                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500">メールアドレス</span>
                        <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-200">{activeLedgerEmp.email || "未設定"}</span>
                      </div>
                    </div>

                    {/* Visa and card details */}
                    <div className="space-y-3.5">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 border-b pb-1 flex items-center gap-1 text-[11px] uppercase">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        在留資格・労働許可情報
                      </h3>
                      
                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500 text-indigo-900">在留資格</span>
                        <span className="col-span-2 font-black text-indigo-950 dark:text-indigo-200">{activeLedgerEmp.statusOfResidence || "未設定"}</span>
                      </div>

                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500">在留カード番号</span>
                        <span className="col-span-2 font-mono font-bold text-slate-700 dark:text-slate-200 uppercase">{activeLedgerEmp.cardNumber || "未設定"}</span>
                      </div>

                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500 text-rose-800">在留期間満了日</span>
                        <span className="col-span-2 font-bold text-rose-950 dark:text-rose-200">{activeLedgerEmp.expirationDate || "未設定"}</span>
                      </div>

                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500">パスポート番号</span>
                        <span className="col-span-2 font-mono font-bold text-slate-700 dark:text-slate-200 uppercase">{activeLedgerEmp.passportNumber || "未設定"}</span>
                      </div>

                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500">パスポート期限</span>
                        <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-200">{activeLedgerEmp.passportExpirationDate || "未設定"}</span>
                      </div>

                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500">雇用契約期間</span>
                        <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-200">{activeLedgerEmp.contractPeriod || "未設定"}</span>
                      </div>

                      <div className="grid grid-cols-3 border-b pb-2">
                        <span className="font-bold text-slate-500">所属部署・役職</span>
                        <span className="col-span-2 font-semibold text-slate-700 dark:text-slate-200">{activeLedgerEmp.department || "指定なし"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footnotes */}
                  <div className="pt-4 border-t text-[10px] text-slate-500 space-y-1">
                    <p>【雇用主への重要注意事項】</p>
                    <p>・外国人従業員を雇い入れ、または離職した際は、労働施策総合推進法に基づき、ハローワークへ外国人雇用状況の届出を行う義務があります。</p>
                    <p>・在留期限を超過した就労は、本人が不法就労となるだけでなく、事業主も不法就労助長罪に問われます。在留期間満了日までに更新手続きを完了させてください。</p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <p className="text-sm font-semibold">表示する従業員がいません。</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
