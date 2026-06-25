"use client";

import React from "react";
import { Users, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EmployeesPlaceholderPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild className="h-9 w-9">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-primary tracking-tight">従業員管理</h1>
      </div>

      <Card className="border border-indigo-100 bg-indigo-50/10 shadow-md text-center py-12">
        <CardHeader className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-600 dark:text-indigo-400">
            <Users className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold text-indigo-950 dark:text-indigo-200">
              従業員管理機能（準備中）
            </CardTitle>
            <CardDescription className="max-w-md mx-auto text-sm">
              外国人従業員の詳細情報、在留カードスキャン（OCR機能統合）、パスポート管理などの登録・編集を行うモジュールです。現在開発準備中です。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Button asChild className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-semibold">
            <Link href="/dashboard">ダッシュボードへ戻る</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
