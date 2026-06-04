"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, AlertCircle, RefreshCw, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { user, signIn, loading, isMock } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login failure:", err);
      setError(err.message || "ログインに失敗しました。メールアドレスとパスワードを確認してください。");
    }
  };

  const fillMockCredentials = (mockEmail: string) => {
    setEmail(mockEmail);
    setPassword("password");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F0F4FA] dark:bg-zinc-950 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Portal Logo/Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-indigo-50/50">
            <ShieldCheck className="h-10 w-10 text-[#1A3A7B]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1A3A7B] dark:text-[#5C85D3] tracking-tight">
            MA WORK JP Portal
          </h2>
          <p className="text-sm text-muted-foreground">外国人雇用・ビザ管理ポータル</p>
        </div>

        {/* Login Card */}
        <Card className="border border-border/60 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">ログイン</CardTitle>
            <CardDescription>
              登録済みのメールアドレスとパスワードを入力してください。
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="p-3.5 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-sm flex items-start gap-2 animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-11"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 font-semibold text-white bg-[#1A3A7B] hover:bg-[#1A3A7B]/90 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "サインイン"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Mock Accounts Guide Card */}
        {isMock && (
          <Card className="border-indigo-100 bg-indigo-50/20 dark:bg-indigo-950/15 border-dashed">
            <CardHeader className="py-3">
              <CardTitle className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-indigo-500" />
                デモ環境用アカウント
              </CardTitle>
              <CardDescription className="text-[10px]">
                Firebase未設定のローカル環境向けにモックログインが有効です。クリックして自動入力できます。
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fillMockCredentials("admin@mawork.jp")}
                  className="flex-1 text-[11px] h-8 bg-white dark:bg-zinc-900 hover:bg-indigo-50 border-indigo-100 text-indigo-950"
                  disabled={loading}
                >
                  管理者（MA WORK JP）
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fillMockCredentials("company@abc.com")}
                  className="flex-1 text-[11px] h-8 bg-white dark:bg-zinc-900 hover:bg-indigo-50 border-indigo-100 text-indigo-950"
                  disabled={loading}
                >
                  企業担当者（ABC商事）
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
