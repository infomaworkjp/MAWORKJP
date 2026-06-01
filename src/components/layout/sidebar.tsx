use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeft, Users, Building, CalendarDays, Mail, FileText, BarChart3, BellRing, Stethoscope, ShieldCheck } from "lucide-react"

import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubButton, SidebarGroup, SidebarHeader, SidebarSeparator } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

// Placeholder for navigation items
const adminNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Companies",
    href: "/companies",
    icon: Building,
  },
  {
    title: "Employees",
    href: "/employees",
    icon: Users,
  },
  {
    title: "Alerts",
    href: "/alerts",
    icon: BellRing,
  },
  {
    title: "Legal Professionals",
    href: "/legal-professionals",
    icon: Stethoscope,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
  },
]

const companyNavItems = [
  {
    title: "My Company",
    href: "/company/profile",
    icon: Building,
  },
  {
    title: "Employees",
    href: "/company/employees",
    icon: Users,
  },
  {
    title: "Visa Status",
    href: "/company/visa-status",
    icon: ShieldCheck,
  },
  {
    title: "Contracts",
    href: "/company/contracts",
    icon: CalendarDays,
  },
  {
    title: "Documents",
    href: "/company/documents",
    icon: Mail,
  },
]

export function SidebarNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false) // Example state, would typically be managed by context

  return (
    <Sidebar
      collapsible="offcanvas" // or "icon" or "none"
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
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary">MA WORK JP</span>
              <span className="text-xs text-muted-foreground">Management Portal</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarMenu>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Menu</SidebarGroupLabel>
          {adminNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                variant="ghost"
                size="lg"
                isActive={pathname.startsWith(item.href)}
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Company Menu</SidebarGroupLabel>
          {companyNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                variant="ghost"
                size="lg"
                isActive={pathname.startsWith(item.href)}
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
      </SidebarMenu>

      <SidebarSeparator />

      <SidebarFooter className="mt-auto">
        {/* Add user profile or settings here */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild variant="ghost" size="lg" tooltip="Settings">
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
              {!isCollapsed && <span>Settings</span>}
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
