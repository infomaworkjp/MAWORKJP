"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building, ArrowLeft, Save, ShieldAlert, RefreshCw, Landmark, Check, Clipboard, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createCompany, CompanyData } from "@/app/actions/companies";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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

export default function NewCompanyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<CompanyData>({
    name: "",
    address: "",
    industry: "製造",
    plan_type: "standard",
    active_options: [],
    status: "invited",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    scrivenerName: "",
    scrivenerEmail: "",
    laborConsultantName: "",
    laborConsultantEmail: "",
    attorneyName: "",
    attorneyEmail: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const prevPlanRef = useRef<string>(formData.plan_type);

  // Synchronize options based on plan_type
  useEffect(() => {
    const oldPlan = prevPlanRef.current;
    const newPlan = formData.plan_type;
    const newIncluded = getIncludedOptions(newPlan);

    setFormData((prev) => {
      const currentOptions = prev.active_options || [];

      // Initialize on first mount or empty options
      if (currentOptions.length === 0) {
        return {
          ...prev,
          active_options: newIncluded,
        };
      }

      const oldIncluded = getIncludedOptions(oldPlan);
      const manualOptions = currentOptions.filter((opt) => !oldIncluded.includes(opt));
      const merged = Array.from(new Set([...newIncluded, ...manualOptions]));
      return {
        ...prev,
        active_options: merged,
      };
    });

    prevPlanRef.current = newPlan;
  }, [formData.plan_type]);

  // Guard: Protect route for admin only
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      toast({
        title: "権限エラー",
        description: "このページにアクセスする権限がありません。",
        variant: "destructive",
      });
      router.push("/dashboard");
    }
  }, [user, authLoading, router, toast]);

  if (authLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Double check role protection
  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h2 className="text-xl font-bold">アクセス権限がありません</h2>
        <p className="text-muted-foreground text-sm">
          企業登録は管理者（MA WORK JP）アカウントのみ実行可能です。
        </p>
        <Button asChild>
          <Link href="/dashboard">ダッシュボードへ戻る</Link>
        </Button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlanChange = (value: "entry" | "basic" | "standard" | "advance" | "pro" | "premium") => {
    setFormData((prev) => ({
      ...prev,
      plan_type: value,
    }));
  };

  const handleSelectIndustry = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      industry: value,
    }));
  };

  const handleOptionToggle = (option: string) => {
    setFormData((prev) => {
      const options = prev.active_options || [];
      const updatedOptions = options.includes(option)
        ? options.filter((o) => o !== option)
        : [...options, option];
      return {
        ...prev,
        active_options: updatedOptions,
      };
    });
  };

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast({
      title: "コピー完了",
      description: "本登録用URLをクリップボードにコピーしました。",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setInviteUrl("");

    try {
      const result = await createCompany(user.uid, formData);
      if (result.success) {
        toast({
          title: "企業招待登録成功",
          description: `「${formData.name}」を登録し、招待メールを送信しました。`,
        });
        if (result.inviteUrl) {
          setInviteUrl(result.inviteUrl);
        } else {
          router.push("/dashboard/companies");
        }
      } else {
        toast({
          title: "登録エラー",
          description: result.error || "登録処理に失敗しました。",
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
      setIsSubmitting(false);
    }
  };

  const optionsList = [
    { key: "safety_education", label: "安全教育 (e-learning動画・ログ)" },
    { key: "translation", label: "資料翻訳 (重要書類の多言語翻訳)" },
    { key: "interpretation", label: "現場通訳 (月2回現場訪問通訳)" },
    { key: "ai_audit", label: "AI監査レポート (労働法監査PDF)" },
    { key: "expert_matching", label: "専門家相談・士業連携 (ダイレクト相談)" },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-sans">
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-9 w-9">
            <Link href="/dashboard/companies">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">新規企業招待登録</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              MA WORK JPの新規取引先企業を登録し、本登録用のアカウント招待メールを送信します。
            </p>
          </div>
        </div>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit}>
        <Card className="border border-border/80 shadow-md">
          <CardHeader className="bg-muted/15 pb-4 border-b border-muted">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Building className="h-5 w-5 text-indigo-500" />
              企業・契約プラン情報の入力
            </CardTitle>
            <CardDescription>
              以下の項目を入力し、企業招待を発行してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Row 1: Company Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold text-sm">
                企業名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="例: 株式会社ABC"
                className="h-11"
                required
                disabled={isSubmitting || inviteUrl !== ""}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="font-semibold text-sm">
                住所 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="例: 東京都千代田区大手町1-1-1"
                className="h-11"
                required
                disabled={isSubmitting || inviteUrl !== ""}
              />
            </div>

            {/* Row 2: Industry & Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="industry" className="font-semibold text-sm">
                  業種 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.industry}
                  onValueChange={handleSelectIndustry}
                  disabled={isSubmitting || inviteUrl !== ""}
                >
                  <SelectTrigger id="industry" className="h-11">
                    <SelectValue placeholder="業種を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="製造">製造</SelectItem>
                    <SelectItem value="建設">建設</SelectItem>
                    <SelectItem value="運送">運送</SelectItem>
                    <SelectItem value="介護">介護</SelectItem>
                    <SelectItem value="派遣">派遣</SelectItem>
                    <SelectItem value="その他">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan" className="font-semibold text-sm">
                  契約プラン <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.plan_type}
                  onValueChange={handlePlanChange}
                  disabled={isSubmitting || inviteUrl !== ""}
                >
                  <SelectTrigger id="plan" className="h-11">
                    <SelectValue placeholder="プランを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">エントリープラン (Entry)</SelectItem>
                    <SelectItem value="basic">ベーシックプラン (Basic)</SelectItem>
                    <SelectItem value="standard">スタンダードプラン (Standard)</SelectItem>
                    <SelectItem value="advance">アドバンスプラン (Advance)</SelectItem>
                    <SelectItem value="pro">プロプラン (Pro)</SelectItem>
                    <SelectItem value="premium">プレミアムプラン (Premium)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Options Management Checkboxes */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="font-semibold text-sm">
                契約オプション（個別ON/OFF）
              </Label>
              <p className="text-xs text-muted-foreground">
                プランに含まれていない機能を個別に有効化したい場合、こちらでチェックを入れてください。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2 bg-muted/20 p-4 rounded-xl border">
                {optionsList.map((opt) => {
                  const isIncluded = getIncludedOptions(formData.plan_type).includes(opt.key);
                  const isChecked = formData.active_options.includes(opt.key) || isIncluded;
                  return (
                    <label
                      key={opt.key}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-muted font-medium text-xs text-primary"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleOptionToggle(opt.key)}
                        disabled={isSubmitting || inviteUrl !== "" || isIncluded}
                        className="h-4.5 w-4.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-[#1A3A7B] disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                      <span className="flex items-center gap-1.5 flex-wrap">
                        {opt.label}
                        {isIncluded && (
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-250 shrink-0">
                            （プランに含まれています）
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Direct Expert Inputs */}
            <div className="border-t border-muted my-6 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-1">
                <Landmark className="h-4 w-4 text-indigo-500" />
                外部専門家・顧問ネットワーク（直接入力）
              </h3>
              <p className="text-xs text-muted-foreground">
                各役割の担当専門家情報を直接登録します。メールアドレスを登録すると、ポータル内から直接連絡が可能になります。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Scrivener */}
                <div className="space-y-2 border p-4 rounded-xl bg-muted/5 border-muted">
                  <Label className="font-bold text-xs text-[#1A3A7B]">1. 担当行政書士 (在留資格・ビザ等)</Label>
                  <div className="space-y-2.5 mt-2">
                    <Input
                      placeholder="行政書士の氏名"
                      name="scrivenerName"
                      value={formData.scrivenerName || ""}
                      onChange={(e) => setFormData({...formData, scrivenerName: e.target.value})}
                      disabled={isSubmitting || inviteUrl !== ""}
                      className="h-10 text-xs"
                    />
                    <Input
                      type="email"
                      placeholder="メールアドレス"
                      name="scrivenerEmail"
                      value={formData.scrivenerEmail || ""}
                      onChange={(e) => setFormData({...formData, scrivenerEmail: e.target.value})}
                      disabled={isSubmitting || inviteUrl !== ""}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Labor Consultant */}
                <div className="space-y-2 border p-4 rounded-xl bg-muted/5 border-muted">
                  <Label className="font-bold text-xs text-[#1A3A7B]">2. 担当社会保険労務士 (労務・助成金等)</Label>
                  <div className="space-y-2.5 mt-2">
                    <Input
                      placeholder="社会保険労務士の氏名"
                      name="laborConsultantName"
                      value={formData.laborConsultantName || ""}
                      onChange={(e) => setFormData({...formData, laborConsultantName: e.target.value})}
                      disabled={isSubmitting || inviteUrl !== ""}
                      className="h-10 text-xs"
                    />
                    <Input
                      type="email"
                      placeholder="メールアドレス"
                      name="laborConsultantEmail"
                      value={formData.laborConsultantEmail || ""}
                      onChange={(e) => setFormData({...formData, laborConsultantEmail: e.target.value})}
                      disabled={isSubmitting || inviteUrl !== ""}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Attorney */}
                <div className="space-y-2 border p-4 rounded-xl bg-muted/5 border-muted md:col-span-2">
                  <Label className="font-bold text-xs text-[#1A3A7B]">3. 担当弁護士 (リーガルリスク等)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <Input
                      placeholder="弁護士の氏名"
                      name="attorneyName"
                      value={formData.attorneyName || ""}
                      onChange={(e) => setFormData({...formData, attorneyName: e.target.value})}
                      disabled={isSubmitting || inviteUrl !== ""}
                      className="h-10 text-xs"
                    />
                    <Input
                      type="email"
                      placeholder="メールアドレス"
                      name="attorneyEmail"
                      value={formData.attorneyEmail || ""}
                      onChange={(e) => setFormData({...formData, attorneyEmail: e.target.value})}
                      disabled={isSubmitting || inviteUrl !== ""}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-muted my-6 pt-6">
              <h3 className="text-sm font-bold text-muted-foreground mb-4">企業窓口・担当者情報</h3>
              
              <div className="space-y-5">
                {/* Contact Name */}
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="font-semibold text-sm">
                    担当者名 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    placeholder="例: 鈴木 一郎"
                    className="h-11"
                    required
                    disabled={isSubmitting || inviteUrl !== ""}
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="font-semibold text-sm">
                      メールアドレス（ログインID） <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      placeholder="例: suzuki@company.com"
                      className="h-11"
                      required
                      disabled={isSubmitting || inviteUrl !== ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="font-semibold text-sm">
                      電話番号 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      placeholder="例: 03-1234-5678"
                      className="h-11"
                      required
                      disabled={isSubmitting || inviteUrl !== ""}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Invitation URL Copy Box Fallback for Local Testing */}
            {inviteUrl && (
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs font-extrabold text-[#1A3A7B] dark:text-indigo-400 flex items-center gap-1">
                  💡 本登録用URL（テスト・デモ用）
                </p>
                <div className="flex gap-2 items-center">
                  <Input readOnly value={inviteUrl} className="h-10 bg-background font-mono text-[11px]" />
                  <Button type="button" size="sm" onClick={handleCopy} className="whitespace-nowrap flex gap-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 text-xs">
                    {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    URLコピー
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  ※契約企業のメール受信制限などがある場合や、ローカルで本登録フロー（パスワード設定）をテスト・検証する場合は、上記のURLをコピーして別のブラウザ等でアクセスしてください。
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-muted p-4 flex justify-between gap-3">
            <Button
              variant="outline"
              type="button"
              asChild
              disabled={isSubmitting}
              className="h-11"
            >
              <Link href="/dashboard/companies">キャンセル</Link>
            </Button>
            {inviteUrl ? (
              <Button
                type="button"
                asChild
                className="h-11 px-6 bg-green-700 hover:bg-green-800 text-white font-bold shadow-sm"
              >
                <Link href="/dashboard/companies">確認完了（企業一覧へ）</Link>
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-6 bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-semibold shadow-sm flex items-center gap-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                企業を登録し招待
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
