"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validateInvitationToken, completeRegistration, selfRegisterCompany } from "@/app/actions/invitations";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Lock, CheckCircle2, AlertTriangle, RefreshCw, Eye, EyeOff, 
  ShieldCheck, Check, X, Building2, ChevronRight, Info, Phone, Mail
} from "lucide-react";
import Link from "next/link";

const PLANS_DATA = [
  {
    key: "entry",
    name: "エントリー",
    price: "39,800",
    headcount: "1〜5名",
    overage: "3,000",
    features: [
      { text: "在留カード管理・アラート通知", status: true },
      { text: "就労資格チェック・管理フォーマット", status: true },
      { text: "LINE相談（月3回）", status: true },
      { text: "翻訳（文書）: 月1回", status: true },
      { text: "通訳対応: 非対応", status: false },
      { text: "雇用契約サポート・安全教育", status: false },
      { text: "現場・労務対応（現場訪問等）", status: false },
      { text: "上位プラン専用分析・高度レポート", status: false },
    ]
  },
  {
    key: "basic",
    name: "ベーシック",
    price: "69,800",
    headcount: "6〜15名",
    overage: "3,000",
    features: [
      { text: "在留カードAI読取スキャナー", status: true },
      { text: "在留期限アラート通知・就労チェック", status: true },
      { text: "LINE相談（月5回）", status: true },
      { text: "翻訳（文書）: 月2回", status: true },
      { text: "通訳対応: 月1回", status: true },
      { text: "雇用契約サポート・安全教育", status: false },
      { text: "現場・労務対応（現場訪問等）", status: false },
      { text: "上位プラン専用分析・高度レポート", status: false },
    ]
  },
  {
    key: "standard",
    name: "スタンダード",
    price: "98,000",
    headcount: "16〜30名",
    overage: "2,500",
    features: [
      { text: "在留カードAI読取・期限カレンダー", status: true },
      { text: "相談窓口（メール・電話常時受付）", status: true },
      { text: "翻訳（月3回） / 通訳（月2回）", status: true },
      { text: "雇用契約サポート（給与説明、理解確認）", status: true },
      { text: "安全教育（動画、月1回、修了証発行）", status: true },
      { text: "現場・労務対応（現場訪問等）", status: false },
      { text: "上位プラン専用分析・高度レポート", status: false },
    ]
  },
  {
    key: "advance",
    name: "アドバンス",
    price: "148,000",
    headcount: "31〜50名",
    overage: "2,500",
    features: [
      { text: "在留資格管理（強化版）", status: true },
      { text: "相談窓口（常時） / 月次レポート", status: true },
      { text: "翻訳（月5回） / 通訳（月3回）", status: true },
      { text: "安全教育（多言語、月2回）", status: true },
      { text: "現場訪問サポート（月1回）", status: true },
      { text: "労災時ヒアリング・通訳", status: true },
      { text: "上位プラン専用分析・高度レポート", status: false },
    ]
  },
  {
    key: "pro",
    name: "プロ",
    price: "198,000",
    headcount: "51〜80名",
    overage: "2,000",
    features: [
      { text: "翻訳（月8回） / 通訳（月5回）", status: true },
      { text: "現場訪問サポート（月2回）", status: true },
      { text: "安全教育（多言語、月3回）", status: true },
      { text: "未払い残業リスク分析", status: true },
      { text: "労務紛争予防設計・契約説明フロー", status: true },
      { text: "離職率・リスク指標管理", status: true },
      { text: "プレミアム専用機能", status: false },
    ]
  },
  {
    key: "premium",
    name: "プレミアム",
    price: "298,000",
    headcount: "81名以上",
    overage: "2,000",
    features: [
      { text: "翻訳無制限（※7日前事前予約要）", status: true },
      { text: "通訳（月8回） / 相談窓口（専属担当）", status: true },
      { text: "現場訪問（月2回） / 安全教育（月4回）", status: true },
      { text: "AIコンプライアンス監査", status: true },
      { text: "全上位分析（残業・リスク・離職率）", status: true },
      { text: "外国人満足度アンケート実施", status: true },
      { text: "年間雇用戦略ロードマップ構築", status: true },
      { text: "重大トラブル初動支援・専属担当", status: true },
    ]
  }
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();

  const [verifying, setVerifying] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);

  // Invitation register state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Self-register state
  const [selectedPlan, setSelectedPlan] = useState<string>("standard");
  const [selfCompanyName, setSelfCompanyName] = useState("");
  const [selfAddress, setSelfAddress] = useState("");
  const [selfIndustry, setSelfIndustry] = useState("");
  const [selfContactName, setSelfContactName] = useState("");
  const [selfEmail, setSelfEmail] = useState("");
  const [selfPhone, setSelfPhone] = useState("");

  // Validate token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        return;
      }

      try {
        const res = await validateInvitationToken(token);
        if (res.success && res.invitation) {
          setInvitation(res.invitation);
        } else {
          setErrorMsg(res.error || "無効な招待URLであるか、有効期限が切れています。");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("サーバーとの接続中にエラーが発生しました。");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  // Handle invitation register submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 6) {
      toast({
        title: "セキュリティ警告",
        description: "パスワードは6文字以上で入力してください。",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "入力エラー",
        description: "パスワードと確認用パスワードが一致しません。",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await completeRegistration(token, password);
      if (res.success) {
        setSuccess(true);
        toast({
          title: "本登録完了",
          description: "アカウントの本登録が完了しました。ログインできます。",
        });
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        toast({
          title: "本登録エラー",
          description: res.error || "本登録処理に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "システムエラー",
        description: "本登録処理中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle self registration submission
  const handleSelfRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token) return;

    if (!selfCompanyName || !selfAddress || !selfIndustry || !selfContactName || !selfEmail || !selfPhone || !password) {
      toast({
        title: "入力エラー",
        description: "すべての必須項目を入力してください。",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "セキュリティ警告",
        description: "パスワードは6文字以上で入力してください。",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "入力エラー",
        description: "パスワードと確認用パスワードが一致しません。",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await selfRegisterCompany({
        name: selfCompanyName,
        address: selfAddress,
        industry: selfIndustry,
        plan_type: selectedPlan as any,
        contactName: selfContactName,
        contactEmail: selfEmail,
        contactPhone: selfPhone,
        passwordSecret: password,
      });

      if (res.success) {
        setSuccess(true);
        toast({
          title: "企業自己登録完了",
          description: `${selfCompanyName} 様の登録が完了しました。ログイン可能です。`,
        });
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        toast({
          title: "登録エラー",
          description: res.error || "自己登録処理に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "システムエラー",
        description: "登録処理中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="h-10 w-10 animate-spin text-[#1A3A7B]" />
          <p className="text-sm font-semibold text-muted-foreground">ロード中...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
        <Card className="max-w-md w-full border border-border shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto p-3 bg-red-50 dark:bg-red-950/20 rounded-full w-fit mb-2 text-destructive">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <CardTitle className="text-lg font-bold text-destructive">招待URLの検証に失敗しました</CardTitle>
            <CardDescription className="text-xs pt-1">
              招待コードが無効であるか、有効期限が切れています。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-xs text-muted-foreground leading-relaxed px-6 pb-6">
            <p className="bg-muted/50 p-3.5 rounded-lg border font-medium text-primary">
              {errorMsg}
            </p>
          </CardContent>
          <CardFooter className="bg-muted/5 border-t py-4 justify-center">
            <Button asChild variant="outline" className="text-xs font-bold">
              <Link href="/login">ログイン画面へ移動</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
        <Card className="max-w-md w-full border border-border shadow-lg animate-in fade-in zoom-in duration-300">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-full w-fit mb-2 text-emerald-600">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <CardTitle className="text-xl font-black text-emerald-600">登録が完了しました！</CardTitle>
            <CardDescription className="text-xs">
              アカウントのセットアップがすべて完了しました。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-xs text-muted-foreground leading-relaxed px-6 pb-6 space-y-2">
            <p>ご登録いただいたメールアドレスでログインできます。</p>
            <p className="font-bold text-primary bg-muted p-2 rounded border">{token ? invitation?.email : selfEmail}</p>
            <p className="text-[10px] text-muted-foreground pt-3">※3秒後にログイン画面へ自動遷移します。</p>
          </CardContent>
          <CardFooter className="bg-muted/5 border-t py-4 justify-center">
            <Button asChild className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold text-xs">
              <Link href="/login">ログインする</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- RENDERING IF NO INVITATION TOKEN: Plan Comparison & Self Registration ---
  if (!token) {
    const currentPlanDetails = PLANS_DATA.find((p) => p.key === selectedPlan) || PLANS_DATA[2];

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-6 sm:p-8 md:p-12 flex flex-col items-center justify-center">
        <div className="max-w-6xl w-full space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100">
              <ShieldCheck className="h-10 w-10 text-[#1A3A7B]" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              M-A WORK JP 企業新規登録
            </h1>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              外国人雇用管理・ビザサポートを一元管理するポータル。プランを比較選択し、その場でご登録いただけます。
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 7 Columns: Plan comparison grid */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="border border-border shadow-md">
                <CardHeader className="bg-muted/15 border-b pb-4">
                  <CardTitle className="text-sm font-bold text-primary flex items-center gap-1.5">
                    <Building2 className="h-4.5 w-4.5 text-[#1A3A7B]" />
                    契約プランの選択
                  </CardTitle>
                  <CardDescription className="text-xs">
                    企業の規模や雇用者数に合わせて最適なプランをお選びください。
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  {/* Plan Tabs Selection Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PLANS_DATA.map((plan) => {
                      const isSelected = selectedPlan === plan.key;
                      return (
                        <div
                          key={plan.key}
                          onClick={() => setSelectedPlan(plan.key)}
                          className={`p-3.5 rounded-xl border-2 text-center cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                            isSelected
                              ? "border-[#1A3A7B] bg-[#1A3A7B]/5 shadow-sm"
                              : "border-slate-200 bg-white/70 dark:bg-zinc-900 hover:border-slate-300"
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                              {plan.headcount}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                              {plan.name}
                            </h4>
                          </div>
                          <div className="mt-3">
                            <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                              {plan.price}
                            </span>
                            <span className="text-[9px] text-slate-400 block">円/月(税別)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Plan Spec Display */}
                  <div className="border rounded-xl bg-slate-50/50 dark:bg-zinc-900/40 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
                      <div>
                        <h4 className="font-black text-base text-slate-800 dark:text-white">
                          {currentPlanDetails.name}プラン詳細
                        </h4>
                        <span className="text-xs text-slate-400">
                          対象人数: <strong className="text-slate-700 dark:text-slate-300">{currentPlanDetails.headcount}</strong> (超過 {currentPlanDetails.overage}円/人)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-[#1A3A7B] dark:text-[#5C85D3]">
                          {currentPlanDetails.price} 円
                        </span>
                        <span className="text-xs text-slate-400"> / 月</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-slate-400">提供されるサポートと利用制限</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {currentPlanDetails.features.map((feature, idx) => (
                          <div key={idx} className="flex gap-2 items-start py-1">
                            {feature.status ? (
                              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-4 w-4 text-slate-350 shrink-0 mt-0.5" />
                            )}
                            <span className={feature.status ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-400 line-through"}>
                              {feature.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Right 5 Columns: Self Registration Form */}
            <div className="lg:col-span-5">
              <Card className="border border-border shadow-md">
                <CardHeader className="bg-muted/10 border-b pb-4 text-center">
                  <CardTitle className="text-base font-bold text-primary">企業基本情報・担当アカウント登録</CardTitle>
                  <CardDescription className="text-xs">
                    プラン: <strong className="text-[#1A3A7B]">{currentPlanDetails.name}</strong> で登録します。
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSelfRegister}>
                  <CardContent className="p-5 space-y-4 text-xs">
                    
                    {/* Company info section */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="selfCompanyName" className="font-bold text-slate-500">企業名 <span className="text-destructive">*</span></Label>
                        <Input
                          id="selfCompanyName"
                          placeholder="株式会社〇〇"
                          value={selfCompanyName}
                          onChange={(e) => setSelfCompanyName(e.target.value)}
                          className="h-10"
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="selfIndustry" className="font-bold text-slate-500">業種 <span className="text-destructive">*</span></Label>
                          <Input
                            id="selfIndustry"
                            placeholder="建設、食品製造、ITなど"
                            value={selfIndustry}
                            onChange={(e) => setSelfIndustry(e.target.value)}
                            className="h-10"
                            required
                            disabled={submitting}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="selfPhone" className="font-bold text-slate-500">電話番号 <span className="text-destructive">*</span></Label>
                          <Input
                            id="selfPhone"
                            type="tel"
                            placeholder="03-1234-5678"
                            value={selfPhone}
                            onChange={(e) => setSelfPhone(e.target.value)}
                            className="h-10"
                            required
                            disabled={submitting}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="selfAddress" className="font-bold text-slate-500">本店住所 <span className="text-destructive">*</span></Label>
                        <Input
                          id="selfAddress"
                          placeholder="東京都千代田区麹町1-1"
                          value={selfAddress}
                          onChange={(e) => setSelfAddress(e.target.value)}
                          className="h-10"
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Contact person & Login info */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="selfContactName" className="font-bold text-slate-500">窓口担当者名 <span className="text-destructive">*</span></Label>
                          <Input
                            id="selfContactName"
                            placeholder="山田 太郎"
                            value={selfContactName}
                            onChange={(e) => setSelfContactName(e.target.value)}
                            className="h-10"
                            required
                            disabled={submitting}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="selfEmail" className="font-bold text-slate-500">メール（ログインID） <span className="text-destructive">*</span></Label>
                          <Input
                            id="selfEmail"
                            type="email"
                            placeholder="yamada@example.com"
                            value={selfEmail}
                            onChange={(e) => setSelfEmail(e.target.value)}
                            className="h-10"
                            required
                            disabled={submitting}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="selfPassword" className="font-bold text-slate-500">ログインパスワード設定 <span className="text-destructive">*</span></Label>
                        <div className="relative">
                          <Input
                            id="selfPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="6文字以上のパスワード"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-10 pr-10"
                            required
                            disabled={submitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-primary"
                          >
                            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="selfConfirmPassword" className="font-bold text-slate-500">確認用パスワード <span className="text-destructive">*</span></Label>
                        <Input
                          id="selfConfirmPassword"
                          type="password"
                          placeholder="パスワードを再入力"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-10"
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>

                  </CardContent>
                  <CardFooter className="bg-muted/5 border-t p-4 flex flex-col gap-3">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#1A3A7B] hover:bg-[#1A3A7B]/95 text-white font-bold h-11 text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      この内容で登録して利用開始する
                    </Button>
                    <div className="text-center w-full">
                      <Link href="/login" className="text-xs text-slate-400 hover:text-primary font-bold transition-colors">
                        既にアカウントをお持ちですか？ ログインへ
                      </Link>
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // --- RENDERING IF INVITATION TOKEN IS PRESENT: Invited User Set Password ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4">
      <Card className="max-w-md w-full border border-border shadow-lg">
        <CardHeader className="bg-muted/10 border-b pb-4 text-center">
          <div className="mx-auto p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-700 w-fit mb-2 border border-indigo-100 dark:border-indigo-900">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold text-primary">アカウント本登録・初期設定</CardTitle>
          <CardDescription className="text-xs">
            {invitation?.companyName} 様のアカウントへパスワードを設定し、登録を有効化します。
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="p-3.5 rounded-lg border bg-muted/40 text-xs space-y-2 font-medium">
              <div className="flex justify-between">
                <span className="text-muted-foreground">企業名:</span>
                <span className="text-primary font-bold">{invitation?.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">担当者名:</span>
                <span className="text-primary font-bold">{invitation?.contactName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ログインID (メール):</span>
                <span className="text-primary font-bold">{invitation?.email}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="passwordSecret" className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" />
                ログインパスワードを設定 <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="passwordSecret"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6文字以上のパスワード"
                  disabled={submitting}
                  className="h-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary shrink-0"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPasswordSecret" className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" />
                確認用パスワード <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPasswordSecret"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="パスワードを再入力"
                disabled={submitting}
                className="h-10"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="bg-muted/5 border-t px-6 py-4 flex justify-end gap-3">
            <Button type="submit" disabled={submitting} className="w-full bg-[#1A3A7B] hover:bg-[#1A3A7B]/95 font-bold text-white shadow-sm flex items-center justify-center gap-1.5 h-10">
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              本登録を完了する
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
