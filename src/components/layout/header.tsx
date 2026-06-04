"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Building, Users, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get user initial for avatar fallback
  const userInitial = user?.displayName
    ? user.displayName.substring(0, 2).toUpperCase()
    : "CN";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:justify-between sm:px-6 md:px-8">
      <div className="flex items-center gap-4">
        {/* Page Title */}
        <h1 className="text-xl font-bold text-primary">ダッシュボード</h1>

        {/* Search Bar - Visible on larger screens */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="検索..."
            className="h-9 w-[200px] rounded-lg bg-background pl-8 md:w-[300px] lg:w-[400px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Menu (+新規登録) Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-[#1A3A7B] text-white hover:bg-[#1A3A7B]/95 font-bold flex items-center gap-1.5 shadow-sm text-xs h-9 px-3">
              <Plus className="h-4 w-4" />
              新規登録
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background border border-border shadow-md">
            {user?.role === "admin" && (
              <>
                <DropdownMenuItem asChild className="font-semibold text-xs cursor-pointer hover:bg-muted/50 p-2.5">
                  <Link href="/dashboard/companies/invite" className="flex items-center gap-2 w-full">
                    <Send className="h-4 w-4 text-indigo-600" />
                    新規企業を招待
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="font-semibold text-xs cursor-pointer hover:bg-muted/50 p-2.5">
                  <Link href="/dashboard/companies/new" className="flex items-center gap-2 w-full">
                    <Building className="h-4 w-4 text-[#1A3A7B]" />
                    新規企業を直接登録
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem asChild className="font-semibold text-xs cursor-pointer hover:bg-muted/50 p-2.5">
              <Link href={user?.role === "admin" ? "/dashboard/companies" : `/dashboard/companies/${user?.companyId}`} className="flex items-center gap-2 w-full">
                <Users className="h-4 w-4 text-emerald-600" />
                新規従業員を登録
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Dropdown */}
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative h-8 w-8 rounded-full"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/01.png" alt={user?.displayName || "User"} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xs">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">ユーザーメニューを開く</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">プロフィール</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">設定</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive font-semibold cursor-pointer"
            onClick={handleLogout}
          >
            ログアウト
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
