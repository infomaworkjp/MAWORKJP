"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Languages, ArrowLeft, Mail, Plus, Loader2, CheckCircle2, 
  Clock, AlertCircle, MessageSquare, Calendar, Zap, FileText,
  PhoneCall, Building2, Check, ExternalLink, HelpCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getCompanyById } from "@/app/actions/companies";
import { useToast } from "@/hooks/use-toast";
import {
  getRequestsByCompanyId,
  submitTranslationRequest,
  submitInterpretationRequest,
  submitConsultationRequest,
  submitEmergencyRequest
} from "@/app/actions/requests";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

const PLAN_CONFIGS: Record<string, any> = {
  entry: {
    name: "エントリー",
    translationLimit: "1枚/月",
    interpretationLimit: "未対応 (スポット可)",
    consultationLimit: "LINE月3回",
  },
  basic: {
    name: "ベーシック",
    translationLimit: "2枚/月",
    interpretationLimit: "1時間/月",
    consultationLimit: "LINE月5回",
  },
  standard: {
    name: "スタンダード",
    translationLimit: "3枚/月",
    interpretationLimit: "2時間/月",
    consultationLimit: "無制限 (常時受付)",
  },
  advance: {
    name: "アドバンス",
    translationLimit: "5枚/月",
    interpretationLimit: "3時間/月",
    consultationLimit: "無制限 (常時受付)",
  },
  pro: {
    name: "プロ",
    translationLimit: "8枚/月",
    interpretationLimit: "5時間/月",
    consultationLimit: "無制限 (常時受付)",
  },
  premium: {
    name: "プレミアム",
    translationLimit: "無制限",
    interpretationLimit: "8時間/月",
    consultationLimit: "専属担当",
  },
};

export default function ConsultationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [company, setCompany] = useState<any | null>(null);
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("translation");

  // Form States
  const [requestType, setRequestType] = useState<"translation" | "interpretation" | "consultation" | "emergency">("translation");
  
  // Translation fields
  const [transText, setTransText] = useState("");
  const [transPages, setTransPages] = useState(1);
  const [transLang, setTransLang] = useState("ベトナム語");
  const [transDate, setTransDate] = useState("");
  
  // Interpretation fields
  const [interDate, setInterDate] = useState("");
  const [interHours, setInterHours] = useState(1);
  const [interDesc, setInterDesc] = useState("");
  
  // Consultation fields
  const [consultMethod, setConsultMethod] = useState("LINE");
  const [consultDesc, setConsultDesc] = useState("");
  
  // Emergency fields
  const [emergDesc, setEmergDesc] = useState("");

  // Email Integration States
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [mailTab, setMailTab] = useState("form");

  const supportEmail = "support@mawork.jp";

  const loadData = async () => {
    if (!user || user.role !== "company" || !user.companyId) return;
    try {
      const [compRes, reqRes] = await Promise.all([
        getCompanyById(user.companyId),
        getRequestsByCompanyId(user.companyId)
      ]);
      
      if (compRes.success && compRes.data) {
        setCompany(compRes.data);
      }
      if (reqRes.success && reqRes.data) {
        setRequestsList(reqRes.data);
      }
    } catch (err) {
      console.error("Error loading consultation data:", err);
      toast({
        title: "データ取得エラー",
        description: "履歴および企業情報の読み込みに失敗しました。",
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

  // Generate Email Templates based on selected Request Type
  useEffect(() => {
    if (!company) return;
    
    let subject = "";
    let body = "";
    
    if (requestType === "translation") {
      subject = `【翻訳依頼】${company.name}`;
      body = `マワークJP サポート担当者様\n\nいつもお世話になっております。${company.name}の〇〇です。\n\n以下の通り、文書の翻訳を依頼いたします。\n\n【翻訳対象言語】: ベトナム語\n【ページ数】: 1枚\n【希望納期】: 2026年〇月〇日\n【詳細内容】:\n(ここに翻訳したい内容や目的を記入してください)\n\nよろしくお願い申し上げます。`;
    } else if (requestType === "interpretation") {
      subject = `【通訳手配依頼】${company.name}`;
      body = `マワークJP サポート担当者様\n\nいつもお世話になっております。${company.name}の〇〇です。\n\n以下の通り、通訳スタッフの手配を依頼いたします。\n\n【希望日時】: 2026年〇月〇日 〇:〇〜〇:〇\n【所要時間】: 〇時間\n【通訳内容】:\n(例: 宿舎の生活ルール説明、面談、現場安全講習など)\n\nよろしくお願い申し上げます。`;
    } else if (requestType === "consultation") {
      subject = `【相談依頼】${company.name}`;
      body = `マワークJP サポート担当者様\n\nいつもお世話になっております。${company.name}の〇〇です。\n\n以下の件について相談を希望いたします。\n\n【相談方法】: LINE / 窓口面談 / 電話\n【相談内容】:\n(例: 特定技能の更新手続き、労務対応、生活指導について)\n\nよろしくお願い申し上げます。`;
    } else if (requestType === "emergency") {
      subject = `【緊急対応依頼】${company.name}`;
      body = `マワークJP サポート担当者様\n\nいつもお世話になっております。${company.name}の〇〇です。\n\n緊急のトラブル対応を依頼いたします。\n\n【発生状況・内容】:\n(ここにトラブルの具体的な状況を記述してください。体調不良、事故、警察等への対応など)\n\nよろしくお願い申し上げます。`;
    }
    
    setEmailSubject(subject);
    setEmailBody(body);
  }, [requestType, company]);

  const handleLaunchEmailClient = () => {
    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(emailBody);
    window.location.href = `mailto:${supportEmail}?subject=${encodedSubject}&body=${encodedBody}`;
    
    toast({
      title: "メールソフトを起動しました",
      description: "お使いのメールソフトが起動しない場合は、記載されているテンプレートをコピーして送信してください。",
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setIsSubmitting(true);

    try {
      let res;
      if (requestType === "translation") {
        res = await submitTranslationRequest(company.id, {
          text: transText,
          pages: transPages,
          targetLanguage: transLang,
          scheduledDate: transDate || new Date().toISOString().split("T")[0],
          basePrice: 0,
          surcharge: 0,
          totalPrice: 0
        });
      } else if (requestType === "interpretation") {
        res = await submitInterpretationRequest(company.id, {
          scheduledDate: interDate || new Date().toISOString().split("T")[0],
          hours: interHours,
          description: interDesc,
          basePrice: 0,
          surcharge: 0,
          totalPrice: 0
        });
      } else if (requestType === "consultation") {
        res = await submitConsultationRequest(company.id, {
          description: consultDesc,
          method: consultMethod
        });
      } else {
        res = await submitEmergencyRequest(company.id, {
          description: emergDesc
        });
      }

      if (res.success) {
        toast({
          title: "ご依頼を受け付けました",
          description: "システムに依頼履歴を登録しました。サポート担当者より追ってご連絡いたします。",
        });
        
        // Clear forms
        setTransText("");
        setTransPages(1);
        setTransDate("");
        setInterDate("");
        setInterHours(1);
        setInterDesc("");
        setConsultDesc("");
        setEmergDesc("");
        
        setIsModalOpen(false);
        setLoading(true);
        await loadData();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        title: "エラーが発生しました",
        description: err.message || "ご依頼の登録に失敗しました。時間をおいて再度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

  const planType = (company?.plan_type || company?.plan || "entry").toLowerCase();
  const planConfig = PLAN_CONFIGS[planType] || PLAN_CONFIGS.entry;

  // Filter lists based on request types
  const translationLogs = requestsList.filter(r => r.type === "translation");
  const interpretationLogs = requestsList.filter(r => r.type === "interpretation");
  const consultationLogs = requestsList.filter(r => r.type === "consultation");
  const emergencyLogs = requestsList.filter(r => r.type === "emergency");

  // Render Status Badge helper
  const renderStatusBadge = (status: string) => {
    if (status === "completed") {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
          <Check className="h-3 w-3 mr-1" />
          完了
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold animate-pulse">
        <Clock className="h-3 w-3 mr-1" />
        進行中
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      
      {/* Header and Back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-9 w-9 border-slate-200 shadow-sm hover:bg-slate-50">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 text-slate-700" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-[#1A3A7B] tracking-tight">翻訳・通訳・相談サポート</h1>
            <p className="text-xs text-muted-foreground mt-0.5">外国人スタッフとのコミュニケーション・労務課題を迅速に解決します</p>
          </div>
        </div>
        
        {/* Request Trigger Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#1A3A7B] to-[#2B54A7] hover:from-[#1A3A7B]/95 hover:to-[#2B54A7]/95 text-white font-semibold shadow-md gap-2 h-10 px-5 transition-all">
              <Mail className="h-4 w-4" />
              新しく依頼する（メール）
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-background border rounded-xl shadow-xl overflow-hidden p-0">
            <DialogHeader className="p-6 bg-gradient-to-b from-[#1A3A7B]/5 to-transparent pb-4">
              <div className="flex items-center gap-2 text-[#1A3A7B] mb-1">
                <Languages className="h-5 w-5" />
                <DialogTitle className="text-lg font-black">サポート新規依頼</DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                翻訳、通訳、日常相談、緊急対応に関するご依頼を受け付けます。
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-2">
              {/* Type Select */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="req-type" className="text-xs font-bold text-slate-700">ご依頼カテゴリー</Label>
                <Select 
                  value={requestType} 
                  onValueChange={(val: any) => setRequestType(val)}
                >
                  <SelectTrigger id="req-type" className="h-10 bg-white">
                    <SelectValue placeholder="カテゴリーを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="translation">📝 翻訳依頼 (文書・資料等)</SelectItem>
                    <SelectItem value="interpretation">🗣️ 通訳依頼 (同行・面談等)</SelectItem>
                    <SelectItem value="consultation">💬 相談依頼 (LINE・窓口・労務相談)</SelectItem>
                    <SelectItem value="emergency">🚨 緊急対応 (夜間・事故・緊急対応)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mode Tabs */}
              <Tabs value={mailTab} onValueChange={setMailTab} className="w-full">
                <TabsList className="grid grid-cols-2 w-full mb-4 bg-slate-100 p-1 rounded-lg h-9">
                  <TabsTrigger value="form" className="text-xs font-bold rounded-md py-1.5">
                    システムフォームで送信
                  </TabsTrigger>
                  <TabsTrigger value="mailto" className="text-xs font-bold rounded-md py-1.5">
                    メールソフトを起動
                  </TabsTrigger>
                </TabsList>
                
                {/* 1. Form Mode */}
                <TabsContent value="form">
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    
                    {/* CONDITIONAL FORM FIELDS */}
                    {requestType === "translation" && (
                      <div className="space-y-3 bg-slate-50/50 p-4 border rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="trans-lang" className="text-xs font-bold">翻訳言語</Label>
                            <Select value={transLang} onValueChange={setTransLang}>
                              <SelectTrigger id="trans-lang" className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ベトナム語">ベトナム語</SelectItem>
                                <SelectItem value="英語">英語</SelectItem>
                                <SelectItem value="中国語">中国語</SelectItem>
                                <SelectItem value="ミャンマー語">ミャンマー語</SelectItem>
                                <SelectItem value="ネパール語">ネパール語</SelectItem>
                                <SelectItem value="その他">その他</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="trans-pages" className="text-xs font-bold">ページ数 (A4換算)</Label>
                            <Input 
                              id="trans-pages" 
                              type="number" 
                              min={1} 
                              value={transPages} 
                              onChange={(e) => setTransPages(Number(e.target.value))}
                              className="bg-white"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="trans-date" className="text-xs font-bold">希望納期</Label>
                          <Input 
                            id="trans-date" 
                            type="date" 
                            value={transDate} 
                            onChange={(e) => setTransDate(e.target.value)}
                            className="bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="trans-text" className="text-xs font-bold">翻訳内容・概要</Label>
                          <Textarea 
                            id="trans-text" 
                            placeholder="（例: 外国人従業員用の社内宿舎利用規約の翻訳をお願いします。）" 
                            value={transText} 
                            onChange={(e) => setTransText(e.target.value)}
                            className="h-20 bg-white"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {requestType === "interpretation" && (
                      <div className="space-y-3 bg-slate-50/50 p-4 border rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="inter-date" className="text-xs font-bold">希望日時</Label>
                            <Input 
                              id="inter-date" 
                              type="datetime-local" 
                              value={interDate} 
                              onChange={(e) => setInterDate(e.target.value)}
                              className="bg-white"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="inter-hours" className="text-xs font-bold">所要時間 (時間)</Label>
                            <Input 
                              id="inter-hours" 
                              type="number" 
                              step={0.5} 
                              min={0.5} 
                              value={interHours} 
                              onChange={(e) => setInterHours(Number(e.target.value))}
                              className="bg-white"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="inter-desc" className="text-xs font-bold">通訳内容の詳細</Label>
                          <Textarea 
                            id="inter-desc" 
                            placeholder="（例: 新規特定技能スタッフの配属初日における安全教育および生活ルールの説明に立ち会って通訳をお願いします。）" 
                            value={interDesc} 
                            onChange={(e) => setInterDesc(e.target.value)}
                            className="h-24 bg-white"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {requestType === "consultation" && (
                      <div className="space-y-3 bg-slate-50/50 p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label htmlFor="consult-method" className="text-xs font-bold">希望する相談方法</Label>
                          <Select value={consultMethod} onValueChange={setConsultMethod}>
                            <SelectTrigger id="consult-method" className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LINE">💬 LINE相談 (手軽・即日回答)</SelectItem>
                              <SelectItem value="窓口面談">🏢 窓口面談 (しっかり対面で相談)</SelectItem>
                              <SelectItem value="電話">📞 電話相談 (お急ぎ・口頭相談)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="consult-desc" className="text-xs font-bold">ご相談内容</Label>
                          <Textarea 
                            id="consult-desc" 
                            placeholder="（例: 外国人従業員の在留資格期限が迫っており、更新にあたり会社で準備すべき書類一式について相談させてください。）" 
                            value={consultDesc} 
                            onChange={(e) => setConsultDesc(e.target.value)}
                            className="h-28 bg-white"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {requestType === "emergency" && (
                      <div className="space-y-3 bg-slate-50/50 p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label htmlFor="emerg-desc" className="text-xs font-bold text-rose-700">発生状況・トラブル内容 (緊急)</Label>
                          <Textarea 
                            id="emerg-desc" 
                            placeholder="（例: 本日夜間、宿舎に滞在中の特定技能従業員が急病（高熱）を訴えたため、救急搬送の同行と医療通訳の手配をお願いします。）" 
                            value={emergDesc} 
                            onChange={(e) => setEmergDesc(e.target.value)}
                            className="h-32 border-rose-200 focus-visible:ring-rose-500 bg-white"
                            required
                          />
                        </div>
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-800 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                          <div>
                            <span className="font-bold">【夜間・即時対応について】</span><br />
                            深夜の事故や重大トラブル等での緊急対応は、お電話でも並行してご連絡ください。(緊急連絡先: {company?.scrivenerPhone || "担当者宛"})
                          </div>
                        </div>
                      </div>
                    )}

                    <DialogFooter className="pt-2 px-0 border-t mt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsModalOpen(false)}
                        className="h-10 text-xs font-bold"
                      >
                        キャンセル
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 h-10 text-xs font-bold"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            送信中...
                          </>
                        ) : (
                          "ご依頼を送信"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </TabsContent>

                {/* 2. Mailto Mode */}
                <TabsContent value="mailto">
                  <div className="space-y-4">
                    <div className="p-3.5 bg-slate-50 border rounded-lg text-xs space-y-3">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px]">宛先</span>
                        <div className="bg-white border p-2 rounded text-[11px] font-mono text-slate-800 flex items-center justify-between">
                          <span>{supportEmail}</span>
                          <Badge variant="secondary" className="text-[9px]">公式サポート窓口</Badge>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px]">件名</span>
                        <Input 
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="bg-white text-[11px] h-9 font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px]">本文プレビュー</span>
                        <Textarea 
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          className="bg-white text-[11px] h-48 font-mono leading-relaxed"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#1A3A7B]/5 rounded-lg border border-[#1A3A7B]/10">
                      <div className="text-[10px] text-slate-600 max-w-sm">
                        <span className="font-bold text-[#1A3A7B]">※ メールソフト起動の注意</span><br />
                        クリックすると、標準のメールクライアント（Outlook、Mail、Gmail等）が自動入力された状態で起動します。
                      </div>
                      <Button 
                        onClick={handleLaunchEmailClient}
                        className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 h-10 text-xs font-bold gap-1.5 shadow"
                      >
                        <ExternalLink className="h-4 w-4" />
                        メールソフトを起動
                      </Button>
                    </div>
                    
                    <DialogFooter className="pt-2 px-0 border-t">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsModalOpen(false)}
                        className="w-full sm:w-auto h-10 text-xs font-bold"
                      >
                        閉じる
                      </Button>
                    </DialogFooter>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plan and Usage Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Document Translation Card */}
        <Card className="border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">書類翻訳</span>
              <FileText className="h-5 w-5 text-slate-400 group-hover:scale-110 transition-transform" />
            </div>
            <CardTitle className="text-base font-bold mt-2">文書翻訳サポート</CardTitle>
            <CardDescription className="text-[10px]">雇用契約書・社内規則・お知らせ資料の翻訳</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            <div className="flex items-baseline justify-between border-b pb-2">
              <span className="text-xs font-bold text-slate-500">ご契約プラン上限:</span>
              <span className="text-sm font-bold text-slate-800">{planConfig.translationLimit}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-500">今月の利用実績:</span>
              <span className="text-lg font-black text-[#1A3A7B]">{company?.usage_translation || 0} <span className="text-xs font-semibold text-slate-500">件</span></span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed pt-1 border-t">
              ※ A4サイズ（1〜1,500文字程度）を1枚として換算。期限超過による緊急依頼は追加手数料が発生する場合があります。
            </p>
          </CardContent>
        </Card>

        {/* On-site Interpretation Card */}
        <Card className="border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-indigo-500 to-purple-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">現場通訳</span>
              <Languages className="h-5 w-5 text-slate-400 group-hover:scale-110 transition-transform" />
            </div>
            <CardTitle className="text-base font-bold mt-2">同行・面談通訳</CardTitle>
            <CardDescription className="text-[10px]">配属初日のガイダンス、宿舎ルール、個別面談通訳</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            <div className="flex items-baseline justify-between border-b pb-2">
              <span className="text-xs font-bold text-slate-500">ご契約プラン上限:</span>
              <span className="text-sm font-bold text-slate-800">{planConfig.interpretationLimit}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-500">今月の利用実績:</span>
              <span className="text-lg font-black text-[#1A3A7B]">{company?.usage_interpretation || 0} <span className="text-xs font-semibold text-slate-500">時間</span></span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed pt-1 border-t">
              ※ 現場訪問またはオンラインにて対応します。1週間前までに事前のスケジュール調整のご連絡をお願いします。
            </p>
          </CardContent>
        </Card>

        {/* General Consultation Helpdesk Card */}
        <Card className="border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">相談窓口</span>
              <MessageSquare className="h-5 w-5 text-slate-400 group-hover:scale-110 transition-transform" />
            </div>
            <CardTitle className="text-base font-bold mt-2">日常相談サポート (LINE)</CardTitle>
            <CardDescription className="text-[10px]">在留手続きの疑問、宿舎でのトラブル相談、雇用確認</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            <div className="flex items-baseline justify-between border-b pb-2">
              <span className="text-xs font-bold text-slate-500">ご契約プラン制限:</span>
              <span className="text-sm font-bold text-slate-800">{planConfig.consultationLimit}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-500">LINE利用実績:</span>
              <span className="text-lg font-black text-[#1A3A7B]">{company?.usage_line || 0} <span className="text-xs font-semibold text-slate-500">回</span></span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed pt-1 border-t">
              ※ 従業員用LINEグループを通じたメンタルケア、生活指導、及びご担当者様からの問い合わせに順次回答します。
            </p>
          </CardContent>
        </Card>
      </div>

      {/* History Tabs Section */}
      <Card className="border border-slate-100 shadow-md">
        <CardHeader className="pb-3 border-b bg-slate-50/40">
          <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#1A3A7B]" />
            サポート対応・依頼履歴
          </CardTitle>
          <CardDescription className="text-[11px]">
            ご依頼いただいた翻訳、手配した通訳、個別相談、夜間緊急対応の履歴一覧です。
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-4 py-1.5 bg-slate-50/20">
              <TabsList className="bg-transparent border-0 flex space-x-1 justify-start overflow-x-auto h-auto p-0 scrollbar-none">
                <TabsTrigger 
                  value="translation" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 rounded-md text-xs font-bold px-4 py-2 text-slate-600 data-[state=active]:text-[#1A3A7B]"
                >
                  📝 翻訳履歴 ({translationLogs.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="interpretation"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 rounded-md text-xs font-bold px-4 py-2 text-slate-600 data-[state=active]:text-[#1A3A7B]"
                >
                  🗣️ 通訳履歴 ({interpretationLogs.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="consultation"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 rounded-md text-xs font-bold px-4 py-2 text-slate-600 data-[state=active]:text-[#1A3A7B]"
                >
                  💬 相談履歴 ({consultationLogs.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="emergency"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 rounded-md text-xs font-bold px-4 py-2 text-slate-600 data-[state=active]:text-[#1A3A7B]"
                >
                  🚨 緊急対応履歴 ({emergencyLogs.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Translation Tab Content */}
            <TabsContent value="translation" className="m-0 focus-visible:outline-none">
              {translationLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-sm font-semibold">登録されている翻訳履歴はありません。</p>
                  <p className="text-xs text-slate-400 mt-1">上の「新しく依頼する」ボタンからご依頼いただけます。</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="w-[120px] font-bold text-slate-700">依頼受付日</TableHead>
                        <TableHead className="font-bold text-slate-700">翻訳内容・詳細</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-slate-700">ページ数</TableHead>
                        <TableHead className="w-[120px] text-right font-bold text-slate-700">見積料金</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-slate-700">ステータス</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {translationLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-slate-50/40">
                          <TableCell className="font-semibold text-slate-600 text-xs">
                            {new Date(log.createdAt).toLocaleDateString("ja-JP")}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-800">
                            {log.details}
                          </TableCell>
                          <TableCell className="text-center text-xs font-semibold text-slate-600">
                            {log.pages ? `${log.pages} 枚` : "-"}
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold text-indigo-600">
                            {log.totalPrice !== undefined ? `${log.totalPrice.toLocaleString()} 円` : "0 円"}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderStatusBadge(log.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Interpretation Tab Content */}
            <TabsContent value="interpretation" className="m-0 focus-visible:outline-none">
              {interpretationLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Languages className="h-12 w-12 mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-sm font-semibold">登録されている通訳手配履歴はありません。</p>
                  <p className="text-xs text-slate-400 mt-1">上の「新しく依頼する」ボタンからご依頼いただけます。</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="w-[120px] font-bold text-slate-700">対応日時</TableHead>
                        <TableHead className="font-bold text-slate-700">通訳内容・同行詳細</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-slate-700">対応時間</TableHead>
                        <TableHead className="w-[120px] text-right font-bold text-slate-700">見積料金</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-slate-700">ステータス</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interpretationLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-slate-50/40">
                          <TableCell className="font-semibold text-slate-600 text-xs">
                            {log.scheduledDate ? log.scheduledDate : new Date(log.createdAt).toLocaleDateString("ja-JP")}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-800">
                            {log.details}
                          </TableCell>
                          <TableCell className="text-center text-xs font-semibold text-slate-600">
                            {log.hours ? `${log.hours} 時間` : "-"}
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold text-indigo-600">
                            {log.totalPrice !== undefined ? `${log.totalPrice.toLocaleString()} 円` : "0 円"}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderStatusBadge(log.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Consultation Tab Content */}
            <TabsContent value="consultation" className="m-0 focus-visible:outline-none">
              {consultationLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-sm font-semibold">登録されている個別相談履歴はありません。</p>
                  <p className="text-xs text-slate-400 mt-1">上の「新しく依頼する」ボタンからご相談を送信いただけます。</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="w-[140px] font-bold text-slate-700">受付日時</TableHead>
                        <TableHead className="font-bold text-slate-700">ご相談・対応内容</TableHead>
                        <TableHead className="w-[140px] text-center font-bold text-slate-700">ステータス</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultationLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-slate-50/40">
                          <TableCell className="font-semibold text-slate-600 text-xs">
                            {new Date(log.createdAt).toLocaleString("ja-JP", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-800 leading-relaxed">
                            {log.details}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderStatusBadge(log.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Emergency Tab Content */}
            <TabsContent value="emergency" className="m-0 focus-visible:outline-none">
              {emergencyLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <PhoneCall className="h-12 w-12 mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-sm font-semibold">登録されている緊急対応の履歴はありません。</p>
                  <p className="text-xs text-slate-400 mt-1">事件、急病等のトラブル発生時は速やかにご報告ください。</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="w-[140px] font-bold text-slate-700">発生・報告日時</TableHead>
                        <TableHead className="font-bold text-slate-700">トラブル発生状況・対応結果</TableHead>
                        <TableHead className="w-[140px] text-center font-bold text-slate-700">ステータス</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emergencyLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-slate-50/40">
                          <TableCell className="font-semibold text-slate-600 text-xs">
                            {new Date(log.createdAt).toLocaleString("ja-JP", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-rose-950 dark:text-rose-200 bg-rose-500/5 p-2 rounded border border-rose-100/50 leading-relaxed">
                            <span className="flex items-start gap-1.5">
                              <Zap className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span>{log.details}</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {renderStatusBadge(log.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
