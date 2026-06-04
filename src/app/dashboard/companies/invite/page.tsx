"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createInvitation } from "@/app/actions/invitations";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Building, Mail, User, Send, ArrowLeft, Clipboard, Check, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function InviteCompanyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Role guard: Only admin can access this page
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "admin") {
        toast({
          title: "アクセス権限エラー",
          description: "このページは管理者専用です。",
          variant: "destructive",
        });
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactName || !email) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください。",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    setInviteUrl("");

    try {
      const res = await createInvitation(companyName, email, contactName);
      if (res.success) {
        toast({
          title: "招待状発行成功",
          description: "企業の招待登録が完了し、招待メールが送信されました。",
        });
        if (res.inviteUrl) {
          setInviteUrl(res.inviteUrl);
        }
        // Clear input form
        setCompanyName("");
        setContactName("");
        setEmail("");
      } else {
        toast({
          title: "招待状発行エラー",
          description: res.error || "招待状の作成に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "システムエラー",
        description: "接続エラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild className="h-8 gap-1">
          <Link href="/dashboard/companies">
            <ArrowLeft className="h-4 w-4" />
            企業一覧へ戻る
          </Link>
        </Button>
      </div>

      <Card className="shadow-md border border-border bg-gradient-to-br from-white to-slate-50/50 dark:from-zinc-950 dark:to-zinc-950/50">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="text-xl font-extrabold text-primary flex items-center gap-2">
            <Send className="h-5 w-5 text-[#1A3A7B]" />
            新規企業の招待登録
          </CardTitle>
          <CardDescription className="text-xs">
            新しい取引先企業にメールアドレス（ログインID）を発行し、本登録用URLを送付します。
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            {/* Company Name */}
            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Building className="h-3.5 w-3.5" />
                企業名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例: 株式会社 小畑組"
                disabled={submitting}
                className="h-10"
                required
              />
            </div>

            {/* Contact Name */}
            <div className="space-y-1.5">
              <Label htmlFor="contactName" className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                担当者名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="例: 小畑 太郎"
                disabled={submitting}
                className="h-10"
                required
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                メールアドレス（ログインIDになります） <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com"
                disabled={submitting}
                className="h-10"
                required
              />
            </div>

            {/* URL Copy box for local testing fallback */}
            {inviteUrl && (
              <div className="mt-6 p-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs font-extrabold text-[#1A3A7B] flex items-center gap-1">
                  💡 本登録用URL（テスト・デモ用）
                </p>
                <div className="flex gap-2 items-center">
                  <Input readOnly value={inviteUrl} className="h-9 bg-background font-mono text-[11px]" />
                  <Button type="button" size="sm" onClick={handleCopy} className="whitespace-nowrap flex gap-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    URLコピー
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  ※実環境でのメール送信制限やデモ環境のテストを容易にするため、生成されたURLをこちらから直接コピーできます。このURLを開くことでパスワード設定（本登録）へ進めます。
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-muted/5 border-t px-6 py-4 flex justify-end gap-3">
            <Button variant="outline" type="button" asChild disabled={submitting}>
              <Link href="/dashboard/companies">キャンセル</Link>
            </Button>
            <Button type="submit" disabled={submitting} className="bg-[#1A3A7B] hover:bg-[#1A3A7B]/95 font-bold text-white shadow-sm flex items-center gap-1.5">
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              招待メールを送信する
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
