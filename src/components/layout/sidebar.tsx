"use client";

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeft, Users, Building, CalendarDays, Mail, FileText, BarChart3, BellRing, Stethoscope, ShieldCheck } from "lucide-react"

import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubButton, SidebarGroup, SidebarHeader, SidebarSeparator, SidebarGroupLabel, SidebarFooter } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import { useAuth } from "@/hooks/use-auth"
import { getCompanyById } from "@/app/actions/companies"
import { useToast } from "@/hooks/use-toast"
import { Lock } from "lucide-react"

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
  },
  {
    title: "従業員一覧",
    href: "/dashboard/companies?tab=employees",
    icon: Users,
  },
  {
    title: "在留資格ステータス",
    href: "/dashboard/companies?tab=visa",
    icon: ShieldCheck,
  },
  {
    title: "契約・プラン管理",
    href: "/dashboard/companies?tab=plan",
    icon: CalendarDays,
  },
  {
    title: "安全教育・書類",
    href: "/dashboard/companies?tab=templates",
    icon: Mail,
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

        {user?.role === "company" && (
          <SidebarGroup>
            <SidebarGroupLabel>企業用メニュー</SidebarGroupLabel>
            {companyNavItems.map((item) => {
              let targetHref = item.href;
              if (item.title === "自社プロフィール" && user.companyId) {
                targetHref = `/dashboard/companies/${user.companyId}`;
              } else if (item.title === "従業員一覧" && user.companyId) {
                targetHref = `/dashboard/companies/${user.companyId}?tab=employees`;
              } else if (item.title === "在留資格ステータス" && user.companyId) {
                targetHref = `/dashboard/companies/${user.companyId}?tab=visa`;
              } else if (item.title === "契約・プラン管理" && user.companyId) {
                targetHref = `/dashboard/companies/${user.companyId}?tab=profile`; // profile tab covers plan
              } else if (item.title === "安全教育・書類" && user.companyId) {
                targetHref = `/dashboard/companies/${user.companyId}?tab=templates`;
              }
              
              // Gating Logic
              const isVisaAllowed = ["basic", "standard", "advance", "pro", "premium"].includes(planType) || activeOptions.includes("visa_scanner");
              const isSafetyAllowed = ["pro", "premium"].includes(planType) || activeOptions.includes("safety_education");
              
              let isLocked = false;
              if (item.title === "在留資格ステータス" && !isVisaAllowed) {
                isLocked = true;
              } else if (item.title === "安全教育・書類" && !isSafetyAllowed) {
                isLocked = true;
              }

              const isActive = pathname === targetHref || pathname + window?.location?.search === targetHref || (targetHref.includes("?") && pathname === targetHref.split("?")[0]);

              const handleItemClick = (e: React.MouseEvent) => {
                if (isLocked) {
                  e.preventDefault();
                  toast({
                    title: "プラン制限",
                    description: `「${item.title}」機能はお使いのプラン（${planType.toUpperCase()}）または契約オプションではご利用いただけません。アップグレードをご検討ください。`,
                    variant: "destructive",
                  });
                }
              };

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={isActive}
                    tooltip={isLocked ? `${item.title} (ロック中)` : item.title}
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
        )}
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
