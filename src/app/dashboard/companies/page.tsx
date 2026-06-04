"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building, Plus, Search, Edit2, Trash2, ShieldAlert, RefreshCw, Phone, Mail, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getCompanies, deleteCompany, CompanyData, resendInvitation, updateCompanyStatus } from "@/app/actions/companies";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface CompanyWithId extends Omit<CompanyData, "plan_type" | "active_options" | "status" | "plan"> {
  id: string;
  createdAt: string;
  plan_type?: "entry" | "basic" | "standard" | "advance" | "pro" | "premium" | null;
  active_options?: string[] | null;
  status?: "active" | "suspended" | "invited" | null;
  plan?: "light" | "standard" | "premium" | null;
}

export default function CompaniesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [companies, setCompanies] = useState<CompanyWithId[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Guard: Protect route for admin only
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      toast({
        title: "権限エラー",
        description: "企業一覧ページにはアクセスできません。",
        variant: "destructive",
      });
      router.push("/dashboard");
    }
  }, [user, authLoading, router, toast]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await getCompanies();
      if (response.success && response.data) {
        setCompanies(response.data as CompanyWithId[]);
      } else {
        toast({
          title: "取得エラー",
          description: response.error || "データ取得に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "システムエラー",
        description: "企業情報の取得中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      loadCompaniesState();
    }
  };

  const loadCompaniesState = () => {
    setLoading(false);
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      loadCompanies();
    }
  }, [user]);

  const handleDelete = async (id: string, name: string) => {
    if (!user) return;
    if (!confirm(`「${name}」を削除してもよろしいですか？関連するデータも利用できなくなります。`)) {
      return;
    }

    try {
      const result = await deleteCompany(user.uid, id);
      if (result.success) {
        toast({
          title: "削除完了",
          description: `「${name}」を削除しました。`,
        });
        loadCompanies();
      } else {
        toast({
          title: "削除エラー",
          description: result.error || "削除に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "システムエラー",
        description: "削除中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  const handleResendInvite = async (companyId: string) => {
    if (!user) return;
    try {
      const res = await resendInvitation(user.uid, companyId);
      if (res.success) {
        toast({
          title: "招待状再送成功",
          description: "登録用招待メールを再送信しました。",
        });
        if (res.inviteUrl) {
          // Fallback UI to copy the registration URL for easy local testing
          navigator.clipboard.writeText(res.inviteUrl);
          toast({
            title: "URLコピー完了",
            description: "登録用URLをクリップボードにコピーしました（テスト・デモ用）。",
          });
        }
      } else {
        toast({
          title: "再送失敗",
          description: res.error || "招待状の再送信に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "システムエラー",
        description: "招待状再送信中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (companyId: string, newStatus: "active" | "suspended") => {
    if (!user) return;
    const actionLabel = newStatus === "suspended" ? "ログイン停止" : "ログイン再開";
    if (!confirm(`この企業アカウントを「${actionLabel}」状態にしますか？`)) {
      return;
    }

    try {
      const res = await updateCompanyStatus(user.uid, companyId, newStatus);
      if (res.success) {
        toast({
          title: `${actionLabel}完了`,
          description: "企業のステータスを更新しました。",
        });
        loadCompanies();
      } else {
        toast({
          title: "ステータス更新失敗",
          description: res.error || "ステータス更新に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "システムエラー",
        description: "ステータス変更中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  };

  // Filter companies based on search
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanBadgeClass = (plan: string) => {
    switch (plan) {
      case "premium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900";
      case "pro":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";
      case "advance":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900";
      case "standard":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900";
      case "basic":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900";
      case "entry":
      default:
        return "bg-slate-100 text-slate-800 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800";
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "suspended":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900">停止中</span>;
      case "invited":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">招待中</span>;
      case "active":
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border border-green-200 dark:border-green-900">契約中</span>;
    }
  };

  if (authLoading || (loading && companies.length === 0)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h2 className="text-xl font-bold">アクセス権限がありません</h2>
        <p className="text-muted-foreground text-sm">
          企業一覧は管理者（MA WORK JP）のみ閲覧可能です。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">企業管理</h1>
          <p className="text-sm text-muted-foreground">
            MA WORK JPが雇用代行するクライアント企業一覧。新規登録や招待、編集が可能です。
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-indigo-200 dark:border-indigo-900 text-indigo-700 hover:text-indigo-800 dark:text-indigo-400 h-11 px-5 shadow-sm font-semibold flex items-center gap-2">
            <Link href="/dashboard/companies/invite">
              <Send className="h-4 w-4" />
              新規企業を招待
            </Link>
          </Button>
          <Button asChild className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 h-11 px-5 shadow-sm font-semibold flex items-center gap-2">
            <Link href="/dashboard/companies/new">
              <Plus className="h-4 w-4" />
              新規企業を直接登録
            </Link>
          </Button>
        </div>
      </div>

      {/* Main card */}
      <Card className="border border-border/80 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                <Building className="h-5 w-5" />
                登録企業リスト ({filteredCompanies.length}社)
              </CardTitle>
              <CardDescription>
                契約プラン、業種、および主要窓口担当者を管理します。
              </CardDescription>
            </div>
            {/* Search filter */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="企業名・業種・担当者名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 border-t border-muted">
          {filteredCompanies.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              {searchTerm ? "検索条件に一致する企業が見つかりません。" : "登録されている企業はありません。"}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/15">
                <TableRow>
                  <TableHead className="font-bold text-primary pl-6">企業名</TableHead>
                  <TableHead className="font-bold text-primary">業種</TableHead>
                  <TableHead className="font-bold text-primary text-center">プラン</TableHead>
                  <TableHead className="font-bold text-primary text-center">ステータス</TableHead>
                  <TableHead className="font-bold text-primary">担当者名</TableHead>
                  <TableHead className="font-bold text-primary">連絡先</TableHead>
                  <TableHead className="font-bold text-primary text-right pr-6">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="hover:bg-muted/5 transition-colors">
                    {/* Name */}
                    <TableCell className="font-bold text-[#1A3A7B] pl-6 py-4">
                      <Link href={`/dashboard/companies/${company.id}`} className="hover:underline hover:text-indigo-600 transition-colors">
                        {company.name}
                      </Link>
                    </TableCell>
                    {/* Industry */}
                    <TableCell className="text-sm font-medium">{company.industry}</TableCell>
                    {/* Plan */}
                    <TableCell className="text-center py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPlanBadgeClass(company.plan_type || company.plan || "entry")}`}>
                        {(company.plan_type || company.plan || "entry").toUpperCase()}
                      </span>
                    </TableCell>
                    {/* Status */}
                    <TableCell className="text-center py-4">
                      {getStatusBadge(company.status || undefined)}
                    </TableCell>
                    {/* Contact Name */}
                    <TableCell className="text-sm font-medium">{company.contactName}</TableCell>
                    {/* Contacts */}
                    <TableCell className="text-xs text-muted-foreground space-y-1 py-4">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground/75" />
                        {company.contactEmail}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground/75" />
                        {company.contactPhone}
                      </div>
                    </TableCell>
                    {/* Actions */}
                    <TableCell className="text-right pr-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {company.status === "invited" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendInvite(company.id)}
                            className="h-8 px-2 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs font-bold"
                          >
                            招待再送
                          </Button>
                        )}
                        {company.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(company.id, "suspended")}
                            className="h-8 px-2 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-700 dark:text-red-400 text-xs font-bold"
                          >
                            停止
                          </Button>
                        )}
                        {company.status === "suspended" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(company.id, "active")}
                            className="h-8 px-2 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/20 text-green-700 dark:text-green-400 text-xs font-bold"
                          >
                            再開
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted"
                          title="編集"
                          asChild
                        >
                          <Link href={`/dashboard/companies/edit/${company.id}`}>
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(company.id, company.name)}
                          className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                          title="削除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
