"use client";

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeft, Users, Building, CalendarDays, Mail, FileText, BarChart3, BellRing, Stethoscope, ShieldCheck, Languages, HeartHandshake, Gem, Calculator } from "lucide-react"

import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubButton, SidebarGroup, SidebarHeader, SidebarSeparator, SidebarGroupLabel, SidebarFooter } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import { useAuth } from "@/hooks/use-auth"
import { getCompanyById } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"
import { Lock } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Placeholder for navigation items
const adminNavItems = [
  {
    title: "ダッシュボード",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "在留資格スキャナー",
    href: "/dashboard/residence-card",
    icon: ShieldCheck,
  },
  {
    title: "企業管理",
    href: "/dashboard/companies",
    icon: Building,
  },
  {
    title: "従業員管理",
    href: "/dashboard/employees",
    icon: Users,
  },
  {
    title: "アラート一覧",
    href: "/dashboard/alerts",
    icon: BellRing,
  },
  {
    title: "提携士業管理",
    href: "/dashboard/legal-professionals",
    icon: Stethoscope,
  },
  {
    title: "レポート出力",
    href: "/dashboard/reports",
    icon: FileText,
  },
]

const companyNavItems = [
  {
    title: "自社プロフィール",
    href: "/dashboard/companies",
    icon: Building,
    minLevel: 1,
  },
  {
    title: "従業員一覧",
    href: "/dashboard/companies?tab=employees",
    icon: Users,
    minLevel: 1,
  },
  {
    title: "基本管理",
    href: "/dashboard/companies?tab=visa",
    icon: CalendarDays,
    minLevel: 1,
  },
  {
    title: "翻訳通訳相談",
    href: "/dashboard/consultation",
    icon: Languages,
    minLevel: 1,
  },
  {
    title: "雇用契約サポート",
    href: "/dashboard",
    icon: FileText,
    minLevel: 3,
  },
  {
    title: "法令・安全教育",
    href: "/dashboard/companies?tab=templates",
    icon: ShieldCheck,
    minLevel: 3,
  },
  {
    title: "現場労務対応",
    href: "/dashboard",
    icon: HeartHandshake,
    minLevel: 4,
  },
  {
    title: "上位プラン専用",
    href: "/dashboard/companies?tab=executive",
    icon: Gem,
    minLevel: 5,
  },
  {
    title: "オプション料金一覧",
    href: "#options-pricing",
    icon: Calculator,
    minLevel: 1,
  },
]

export function SidebarNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const [planType, setPlanType] = React.useState<string>("entry")
  const [activeOptions, setActiveOptions] = React.useState<string[]>([])

  React.useEffect(() => {
    if (user?.role === "company" && user.companyId) {
      getCompanyById(user.companyId).then((res) => {
        if (res.success && res.data) {
          setPlanType(res.data.plan_type || res.data.plan || "entry")
          setActiveOptions(res.data.active_options || [])
        }
      })
    }
  }, [user])

  return (
    <Sidebar
      collapsible="offcanvas"
      className={cn(className, isCollapsed && "group-data-[collapsible=icon]:w-16")}
      data-state={isCollapsed ? "collapsed" : "expanded"}
    >
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <SidebarMenuButton
            asChild
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2"
          >
            <Link href="/dashboard">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">MA WORK JP Portal</span>
            </Link>
          </SidebarMenuButton>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <img src="/mawork-logo.jpg" alt="M-A WORK JP Logo" className="h-8 w-8 rounded object-contain border border-slate-800" />
              <div className="flex flex-col">
                <span className="text-sm font-black text-white leading-tight">M-A WORK JP</span>
                <span className="text-[10px] text-slate-400 leading-none">管理ポータル</span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarMenu>
        {user?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>管理者メニュー</SidebarGroupLabel>
            {adminNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>
        )}

        {user?.role === "company" && (() => {
          const currentUser = {
            ...user,
            planLevel: (() => {
              const p = (planType || "entry").toLowerCase();
              if (p === "premium") return 6;
              if (p === "pro") return 5;
              if (p === "advance") return 4;
              if (p === "standard") return 3;
              if (p === "basic") return 2;
              return 1;
            })()
          };

          const visibleItems = companyNavItems.filter((item) => currentUser.planLevel >= item.minLevel);

          return (
            <SidebarGroup>
              <SidebarGroupLabel>企業用メニュー</SidebarGroupLabel>
              {visibleItems.map((item) => {
                let targetHref = item.href;
                if (item.title === "自社プロフィール" && user.companyId) {
                  targetHref = `/dashboard/companies/${user.companyId}?tab=profile`;
                } else if (item.title === "従業員一覧" && user.companyId) {
                  targetHref = `/dashboard/companies/${user.companyId}?tab=employees`;
                } else if (item.title === "基本管理" && user.companyId) {
                  targetHref = `/dashboard/companies/${user.companyId}?tab=visa`;
                } else if (item.title === "法令・安全教育" && user.companyId) {
                  targetHref = `/dashboard/companies/${user.companyId}?tab=templates`;
                } else if (item.title === "上位プラン専用" && user.companyId) {
                  targetHref = `/dashboard/companies/${user.companyId}?tab=executive`;
                }

                // Gating Logic
                const isVisaAllowed = ["basic", "standard", "advance", "pro", "premium"].includes(planType) || activeOptions.includes("visa_scanner");
                const isSafetyAllowed = ["pro", "premium"].includes(planType) || activeOptions.includes("safety_education");
                
                let isLocked = false;
                if (item.title === "基本管理" && !isVisaAllowed) {
                  isLocked = true;
                } else if (item.title === "法令・安全教育" && !isSafetyAllowed) {
                  isLocked = true;
                }

                const isActive = pathname === targetHref || pathname + (typeof window !== "undefined" ? window.location.search : "") === targetHref || (targetHref.includes("?") && pathname === targetHref.split("?")[0]);

                const handleItemClick = (e: React.MouseEvent) => {
                  if (isLocked) {
                    e.preventDefault();
                    toast({
                      title: "プラン制限",
                      description: `「${item.title}」機能はお使いのプラン（${planType.toUpperCase()}）ではご利用いただけません。アップグレードが必要です。`,
                      variant: "destructive",
                    });
                  }
                };

                // Options Pricing Modal dialog wrapper
                if (item.title === "オプション料金一覧") {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Dialog>
                        <DialogTrigger asChild>
                          <SidebarMenuButton
                            size="lg"
                            tooltip={item.title}
                            className="w-full text-left"
                          >
                            <item.icon className="h-5 w-5" />
                            {!isCollapsed && <span>{item.title}</span>}
                          </SidebarMenuButton>
                        </DialogTrigger>
                        <DialogContent className="max-w-md bg-background border rounded-lg shadow-lg">
                          <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
                              <Calculator className="h-5 w-5 text-indigo-500" />
                              オプション料金・追加費用一覧
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                              基本プランに含まれない、個別にご依頼可能なオプションサービスの一覧です。
                            </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-[350px] overflow-y-auto pr-1 text-xs">
                            <table className="w-full text-left border-collapse text-slate-700 dark:text-slate-350">
                              <thead>
                                <tr className="border-b bg-muted/50 font-bold">
                                  <th className="p-2">サービス名</th>
                                  <th className="p-2 text-right">料金 (税別)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                <tr className="hover:bg-muted/10">
                                  <td className="p-2 font-semibold">多言語安全教育（講習申請）</td>
                                  <td className="p-2 text-right text-indigo-600 font-bold">15,000円</td>
                                </tr>
                                <tr className="hover:bg-muted/10">
                                  <td className="p-2 font-semibold">現場訪問サポート</td>
                                  <td className="p-2 text-right text-indigo-600 font-bold">20,000円</td>
                                </tr>
                                <tr className="hover:bg-muted/10">
                                  <td className="p-2 font-semibold">緊急通訳手配 (24時間)</td>
                                  <td className="p-2 text-right text-indigo-600 font-bold">15,000円</td>
                                </tr>
                                <tr className="hover:bg-muted/10">
                                  <td className="p-2 font-semibold">スポット労務相談</td>
                                  <td className="p-2 text-right text-indigo-600 font-bold">5,000円</td>
                                </tr>
                                <tr className="hover:bg-muted/10">
                                  <td className="p-2 font-semibold">翻訳追加 (A4 1ページ)</td>
                                  <td className="p-2 text-right text-indigo-600 font-bold">8,000円</td>
                                </tr>
                                <tr className="hover:bg-muted/10">
                                  <td className="p-2 font-semibold">通訳追加 (1時間)</td>
                                  <td className="p-2 text-right text-indigo-600 font-bold">10,000円</td>
                                </tr>
                                <tr className="hover:bg-muted/10">
                                  <td className="p-2 font-semibold">修了証PDF発行のみ</td>
                                  <td className="p-2 text-right text-indigo-600 font-bold">5,000円</td>
                                </tr>
                                <tr className="hover:bg-muted/10">
                                  <td className="p-2 font-semibold">案内文作成代行</td>
                                  <td className="p-2 text-right text-indigo-600 font-bold">3,000円</td>
                                </tr>
                                <tr className="hover:bg-muted/10">
                                  <td className="p-2 font-semibold">雇用契約書作成依頼</td>
                                  <td className="p-2 text-right text-indigo-600 font-bold">10,000円</td>
                                </tr>
                                <tr className="hover:bg-muted/10">
                                  <td className="p-2 font-semibold">労働条件通知書作成依頼</td>
                                  <td className="p-2 text-right text-indigo-600 font-bold">8,000円</td>
                                </tr>
                                <tr className="hover:bg-muted/10">
                                  <td className="p-2 font-semibold">契約内容整合性確認依頼</td>
                                  <td className="p-2 text-right text-indigo-600 font-bold">5,000円</td>
                                </tr>
                                <tr className="hover:bg-muted/10">
                                  <td className="p-2 font-semibold">ヒアリング報告書作成依頼</td>
                                  <td className="p-2 text-right text-indigo-600 font-bold">5,000円</td>
                                </tr>
                              </tbody>
                            </table>
                            <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed font-semibold">
                              ※ 翻訳は1週間前（7日前）までにご依頼ください。期限未満の場合は緊急対応料金（3日以内: +30%, 翌日: +50%, 当日: +100%）が発生します。
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      size="lg"
                      isActive={isActive}
                      tooltip={isLocked ? `${item.title} (アップグレードが必要です)` : item.title}
                      className={cn(isLocked && "opacity-50")}
                    >
                      <Link href={targetHref} onClick={handleItemClick}>
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && (
                          <span className="flex items-center justify-between w-full">
                            <span>{item.title}</span>
                            {isLocked && <Lock className="h-3 w-3 text-muted-foreground ml-2 shrink-0" />}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarGroup>
          );
        })()}
      </SidebarMenu>

      <SidebarSeparator />


      <SidebarFooter className="mt-auto">
        {/* Add user profile or settings here */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild size="lg" tooltip="設定">
            <Link href="/settings">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12.22 20v-5.17" />
                <path d="M12.22 6.83V4" />
                <path d="M6.73 14.73l1.71-1.71" />
                <path d="M17.57 7.23l-1.71-1.71" />
                <path d="M12.78 12.22a2 2 0 1 1-2.56 0" />
                <path d="M4 13h2.22" />
                <path d="M17.78 17.78h2.22" />
                <path d="M15.51 19.1l1.71 1.71" />
                <path d="M4.72 4.72l1.71 1.71" />
                <path d="M6.73 9.27l-1.71 1.71" />
                <path d="M17.57 16.77l-1.71 1.71" />
              </svg>
              {!isCollapsed && <span>設定</span>}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  )
}

// Use this in your main layout file (e.g., src/app/layout.tsx)
// Wrap your app with the SidebarProvider
// import { SidebarProvider } from '@/components/ui/sidebar'; // Assuming SidebarProvider is exported from sidebar.tsx
// <SidebarProvider> {children} </SidebarProvider>
