"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Building, ArrowLeft, Save, ShieldAlert, RefreshCw, Landmark, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getCompanyById, updateCompany, updateCompanySettings, uploadContractPdf, CompanyData } from "@/app/actions/companies";
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

export default function EditCompanyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [formData, setFormData] = useState<CompanyData>({
    name: "",
    address: "",
    industry: "",
    plan_type: "standard",
    active_options: [],
    status: "active",
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
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractFileBase64, setContractFileBase64] = useState<string | null>(null);
  const [contractFileName, setContractFileName] = useState<string>("");

  const prevPlanRef = useRef<string>(formData.plan_type);

  // Synchronize options based on plan_type
  useEffect(() => {
    const oldPlan = prevPlanRef.current;
    const newPlan = formData.plan_type;
    const newIncluded = getIncludedOptions(newPlan);

    setFormData((prev) => {
      const currentOptions = prev.active_options || [];

      // Initial load / no plan change: make sure all standard options are included
      if (oldPlan === newPlan) {
        const missingIncluded = newIncluded.filter(opt => !currentOptions.includes(opt));
        if (missingIncluded.length > 0) {
          return {
            ...prev,
            active_options: [...currentOptions, ...missingIncluded],
          };
        }
        return prev;
      }

      // Plan has changed:
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

  // Load company data on mount
  useEffect(() => {
    const loadCompany = async () => {
      if (!id) return;
      try {
        const response = await getCompanyById(id);
        if (response.success && response.data) {
          const data = response.data;
          const loadedPlan = data.plan_type || data.plan || "standard";
          prevPlanRef.current = loadedPlan;
          setFormData({
            name: data.name || "",
            address: data.address || "",
            industry: data.industry || "",
            plan_type: loadedPlan,
            active_options: data.active_options || [],
            status: data.status || "active",
            contactName: data.contactName || "",
            contactEmail: data.contactEmail || "",
            contactPhone: data.contactPhone || "",
            scrivenerName: data.scrivenerName || "",
            scrivenerEmail: data.scrivenerEmail || "",
            laborConsultantName: data.laborConsultantName || "",
            laborConsultantEmail: data.laborConsultantEmail || "",
            attorneyName: data.attorneyName || "",
            attorneyEmail: data.attorneyEmail || "",
            contractPdfUrl: data.contractPdfUrl || null,
            contractExpirationDate: data.contractExpirationDate || null,
          });
        } else {
          toast({
            title: "取得失敗",
            description: response.error || "データが見つかりません。",
            variant: "destructive",
          });
          router.push("/dashboard/companies");
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "エラー",
          description: "会社情報の読み込み中にエラーが発生しました。",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === "admin") {
      loadCompany();
    }
  }, [id, user]);

  if (authLoading || loading) {
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
          企業情報の編集は管理者のみ実行可能です。
        </p>
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      toast({
        title: "ファイル形式エラー",
        description: "PDFファイルのみアップロード可能です。",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setContractFileBase64(base64);
      setContractFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Update basic information
      const resultInfo = await updateCompany(user.uid, id, {
        name: formData.name,
        address: formData.address,
        industry: formData.industry,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        scrivenerName: formData.scrivenerName,
        scrivenerEmail: formData.scrivenerEmail,
        laborConsultantName: formData.laborConsultantName,
        laborConsultantEmail: formData.laborConsultantEmail,
        attorneyName: formData.attorneyName,
        attorneyEmail: formData.attorneyEmail,
        status: formData.status,
        contractExpirationDate: formData.contractExpirationDate,
      });

      if (!resultInfo.success) {
        throw new Error(resultInfo.error || "基本情報の更新に失敗しました");
      }

      // 1.5. Upload contract PDF if selected
      if (contractFileBase64) {
        const uploadResult = await uploadContractPdf(user.uid, id, contractFileBase64, contractFileName);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "契約書PDFのアップロードに失敗しました");
        }
      }

      // 2. Update plan settings and options
      const resultSettings = await updateCompanySettings(user.uid, id, formData.plan_type, formData.active_options);
      
      if (resultSettings.success) {
        toast({
          title: "更新完了",
          description: `「${formData.name}」の情報を更新しました。`,
        });
        router.push("/dashboard/companies");
      } else {
        toast({
          title: "更新エラー",
          description: resultSettings.error || "プラン設定の更新に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "エラー",
        description: err.message || "通信エラーが発生しました。",
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
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild className="h-9 w-9">
          <Link href="/dashboard/companies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">企業情報の編集</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            登録されている企業情報および契約プラン・オプションを修正します。
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        <Card className="border border-border/80 shadow-md">
          <CardHeader className="bg-muted/15 pb-4 border-b border-muted">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Building className="h-5 w-5 text-indigo-500" />
              企業プロフィールの修正
            </CardTitle>
            <CardDescription>
              変更が必要な項目を修正し、保存ボタンを押してください。保存すると即座に企業ポータル側に反映されます。
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold text-sm">
                企業名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="h-11"
                required
                disabled={isSubmitting}
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
                placeholder="例: 東京都千代田区大手町1-1-1"
                className="h-11"
                required
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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

            {/* Contract Management Section */}
            <div className="border-t border-muted my-6 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-indigo-500" />
                契約書管理（MA WORK JP 契約情報）
              </h3>
              <p className="text-xs text-muted-foreground">
                この企業との契約書PDFのアップロードと、契約満了日の設定を行います。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Contract Expiration Date */}
                <div className="space-y-2">
                  <Label htmlFor="contractExpirationDate" className="font-semibold text-xs text-[#1A3A7B]">
                    契約満了日
                  </Label>
                  <Input
                    id="contractExpirationDate"
                    name="contractExpirationDate"
                    type="date"
                    value={formData.contractExpirationDate || ""}
                    onChange={handleInputChange}
                    className="h-10 text-xs font-semibold"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Contract PDF Upload */}
                <div className="space-y-2">
                  <Label className="font-semibold text-xs text-[#1A3A7B]">
                    契約書PDFファイル
                  </Label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="h-10 text-xs"
                      disabled={isSubmitting}
                    />
                    {contractFileName && (
                      <p className="text-[10px] text-indigo-600 font-bold">
                        選択中: {contractFileName} (保存時にアップロードされます)
                      </p>
                    )}
                    {formData.contractPdfUrl && (
                      <div className="flex items-center gap-2 text-xs pt-1">
                        <span className="text-muted-foreground">現在のアップロード済契約書:</span>
                        <a
                          href={formData.contractPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 underline font-bold"
                        >
                          契約書を表示・ダウンロード
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Options Management Checkboxes */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="font-semibold text-sm">
                契約オプション（個別ON/OFF）
              </Label>
              <p className="text-xs text-muted-foreground">
                チェックを入れたオプションは、基本プランに関わらず企業側に有効化されて反映されます。
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
                        disabled={isSubmitting || isIncluded}
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
                各役割の担当専門家情報を直接登録・編集します。メールアドレスを登録すると、ポータル内から直接連絡が可能になります。
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
                      disabled={isSubmitting}
                      className="h-10 text-xs"
                    />
                    <Input
                      type="email"
                      placeholder="メールアドレス"
                      name="scrivenerEmail"
                      value={formData.scrivenerEmail || ""}
                      onChange={(e) => setFormData({...formData, scrivenerEmail: e.target.value})}
                      disabled={isSubmitting}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Labor Consultant */}
                <div className="space-y-2 border p-4 rounded-xl bg-muted/5 border-muted">
                  <Label className="font-bold text-xs text-[#1A3A7B]">2. 担当社会保険労務士 (労務・助成金等)</Label>
                  <div className="space-y-2.5 mt-2">
                    <Input
                      placeholder="社会保険労務士 of 氏名"
                      name="laborConsultantName"
                      value={formData.laborConsultantName || ""}
                      onChange={(e) => setFormData({...formData, laborConsultantName: e.target.value})}
                      disabled={isSubmitting}
                      className="h-10 text-xs"
                    />
                    <Input
                      type="email"
                      placeholder="メールアドレス"
                      name="laborConsultantEmail"
                      value={formData.laborConsultantEmail || ""}
                      onChange={(e) => setFormData({...formData, laborConsultantEmail: e.target.value})}
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                      className="h-10 text-xs"
                    />
                    <Input
                      type="email"
                      placeholder="メールアドレス"
                      name="attorneyEmail"
                      value={formData.attorneyEmail || ""}
                      onChange={(e) => setFormData({...formData, attorneyEmail: e.target.value})}
                      disabled={isSubmitting}
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
                    className="h-11"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="font-semibold text-sm">
                      メールアドレス <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="h-11"
                      required
                      disabled={isSubmitting}
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
                      className="h-11"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>
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
              変更を保存
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
