"use client";

import React, { useState } from "react";
import { Sparkles, Save, User, FileText, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { ResidenceCardScanner } from "@/components/residence-card/scanner-card";
import { ResidenceCardData } from "@/app/actions/scan-residence-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ResidenceCardDemoPage() {
  const [formData, setFormData] = useState<ResidenceCardData>({
    name: "",
    statusOfResidence: "",
    expirationDate: "",
    cardNumber: "",
    nationality: "",
    birthDate: "",
  });
  const [isAiFilled, setIsAiFilled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleScanComplete = (data: ResidenceCardData) => {
    setFormData({
      name: data.name || "",
      statusOfResidence: data.statusOfResidence || "",
      expirationDate: data.expirationDate || "",
      cardNumber: data.cardNumber || "",
      nationality: data.nationality || "",
      birthDate: data.birthDate || "",
    });
    setIsAiFilled(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.statusOfResidence || !formData.expirationDate) {
      toast({
        title: "入力エラー",
        description: "氏名、在留資格、満了日は必須項目です。",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Simulate saving data to Database (Firebase/Firestore)
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "登録成功",
        description: `${formData.name} さんの情報を従業員として仮登録しました。`,
      });
      // Optionally reset form
      // setFormData({ name: "", statusOfResidence: "", expirationDate: "", cardNumber: "", nationality: "", birthDate: "" });
      // setIsAiFilled(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">在留カード自動入力デモ</h1>
          <p className="text-muted-foreground mt-1">
            在留カードをカメラやファイルから読み取り、GeminiマルチモーダルAIが自動で高精度に項目を抽出・入力します。
          </p>
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Scanner Component */}
        <div className="lg:col-span-5 space-y-6">
          <ResidenceCardScanner
            onScanComplete={handleScanComplete}
            onScanStart={() => {
              setIsAiFilled(false);
            }}
          />

          {/* Guidelines Card */}
          <Card className="border-indigo-100 bg-indigo-50/20 dark:bg-indigo-950/10">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                スキャン時のアドバイス
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-indigo-950/85 dark:text-indigo-200/90 leading-relaxed space-y-2 pb-4">
              <p>・在留カードの正面画像が枠内に収まるように撮影・アップロードしてください。</p>
              <p>・反射やブレが少なく、文字が鮮明に読める状態の画像が適しています。</p>
              <p>・AIは文字認識だけでなく、レイアウトから各項目の位置を自動で特定します。</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Filled Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <Card className="border-border/80 shadow-md">
            <CardHeader className="border-b border-muted pb-4 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  従業員登録情報
                </CardTitle>
                <CardDescription>
                  AIのスキャン結果がこちらに反映されます。必要に応じて手動で調整してください。
                </CardDescription>
              </div>
              {isAiFilled && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse">
                  <Sparkles className="h-3 w-3" />
                  AI自動入力済
                </span>
              )}
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="name" className="font-semibold text-sm">
                    氏名 <span className="text-destructive">*</span>
                  </Label>
                  {isAiFilled && formData.name && (
                    <span className="text-[10px] text-emerald-600 font-medium">AI読取済</span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="例: 山田 太郎 / SMITH JOHN"
                    className={`h-11 transition-all ${isAiFilled && formData.name ? "border-emerald-300 bg-emerald-50/10 dark:border-emerald-800 focus-visible:ring-emerald-500" : ""}`}
                    required
                  />
                </div>
              </div>

              {/* Status of Residence */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="statusOfResidence" className="font-semibold text-sm">
                    在留資格 <span className="text-destructive">*</span>
                  </Label>
                  {isAiFilled && formData.statusOfResidence && (
                    <span className="text-[10px] text-emerald-600 font-medium">AI読取済</span>
                  )}
                </div>
                <Input
                  id="statusOfResidence"
                  name="statusOfResidence"
                  value={formData.statusOfResidence}
                  onChange={handleInputChange}
                  placeholder="例: 技術・人文知識・国際業務"
                  className={`h-11 transition-all ${isAiFilled && formData.statusOfResidence ? "border-emerald-300 bg-emerald-50/10 dark:border-emerald-800 focus-visible:ring-emerald-500" : ""}`}
                  required
                />
              </div>

              {/* Expiration Date */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="expirationDate" className="font-semibold text-sm">
                    在留期間の満了日 <span className="text-destructive">*</span>
                  </Label>
                  {isAiFilled && formData.expirationDate && (
                    <span className="text-[10px] text-emerald-600 font-medium">AI読取済</span>
                  )}
                </div>
                <Input
                  id="expirationDate"
                  name="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={handleInputChange}
                  className={`h-11 transition-all ${isAiFilled && formData.expirationDate ? "border-emerald-300 bg-emerald-50/10 dark:border-emerald-800 focus-visible:ring-emerald-500" : ""}`}
                  required
                />
              </div>

              {/* Card Number */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="cardNumber" className="font-semibold text-sm">
                    在留カード番号
                  </Label>
                  {isAiFilled && formData.cardNumber && (
                    <span className="text-[10px] text-emerald-600 font-medium">AI読取済</span>
                  )}
                </div>
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="例: AB12345678CD"
                  className={`h-11 uppercase transition-all ${isAiFilled && formData.cardNumber ? "border-emerald-300 bg-emerald-50/10 dark:border-emerald-800 focus-visible:ring-emerald-500" : ""}`}
                />
              </div>

              {/* Nationality */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="nationality" className="font-semibold text-sm">
                    国籍・地域
                  </Label>
                  {isAiFilled && formData.nationality && (
                    <span className="text-[10px] text-emerald-600 font-medium">AI読取済</span>
                  )}
                </div>
                <Input
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder="例: ベトナム"
                  className={`h-11 transition-all ${isAiFilled && formData.nationality ? "border-emerald-300 bg-emerald-50/10 dark:border-emerald-800 focus-visible:ring-emerald-500" : ""}`}
                />
              </div>

              {/* Birth Date */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="birthDate" className="font-semibold text-sm">
                    生年月日
                  </Label>
                  {isAiFilled && formData.birthDate && (
                    <span className="text-[10px] text-emerald-600 font-medium">AI読取済</span>
                  )}
                </div>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={`h-11 transition-all ${isAiFilled && formData.birthDate ? "border-emerald-300 bg-emerald-50/10 dark:border-emerald-800 focus-visible:ring-emerald-500" : ""}`}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t border-muted p-4 flex justify-end gap-3">
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 px-6 bg-primary text-primary-foreground font-semibold shadow-sm flex items-center gap-2"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                従業員情報として保存
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
