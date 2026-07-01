import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  UserRound,
  UserRoundCheck,
  Users,
  X
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useSessionStore } from "../store/sessionStore";
import type { User } from "../types";
import { Button } from "../components/ui/Button";

const icons: Record<string, ElementType> = {
  "Daily Planning": CalendarDays,
  "Market Visit Customers": Users,
  "My Potential Customers": UserRoundCheck
};

const paths: Record<string, string> = {
  "Daily Planning": "/daily-planning",
  "Market Visit Customers": "/market-visit-customers",
  "My Potential Customers": "/potential-customers"
};

export function AppLayout({ user, active, children }: { user: User; active: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigation = useSessionStore((state) => state.navigation);
  const logout = useSessionStore((state) => state.logout);
  const navigate = useNavigate();

  function go(item: string) {
    navigate(paths[item] ?? "/daily-planning");
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-white transition-[width] duration-200 lg:flex lg:flex-col", sidebarCollapsed ? "w-20" : "w-72")}>
        <SidebarContent active={active} navigation={navigation} onNavigate={go} onLogout={logout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="h-full w-72 bg-white shadow-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-end p-3">
              <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent active={active} navigation={navigation} onNavigate={go} onLogout={logout} />
          </aside>
        </div>
      )}

      <main className={cn("transition-[padding] duration-200", sidebarCollapsed ? "lg:pl-20" : "lg:pl-72")}>
        <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="h-10 w-10 p-0 lg:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-extrabold text-bank sm:text-2xl">Customer Data Management and Analysis</h1>
                <p className="mt-1 text-xs font-medium text-bank-dark">Performance & Execution Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white px-2 py-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-extrabold">{user.username}</p>
                <p className="text-xs text-muted">{user.role === "rm" ? "Sales Officer" : user.role}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-700 sm:block" />
            </div>
          </div>
        </header>
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

function SidebarContent({
  active,
  navigation,
  onNavigate,
  onLogout,
  collapsed = false,
  onToggle
}: {
  active: string;
  navigation: string[];
  onNavigate: (item: string) => void;
  onLogout: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex min-h-24 items-center border-b border-border", collapsed ? "justify-center px-2" : "justify-between px-6")}>
        {!collapsed && <img src="/api/logo" className="h-16 w-36 object-contain" alt="Chip Mong Bank" />}
        {onToggle && (
          <Button variant="ghost" className="h-9 w-9 shrink-0 p-0" onClick={onToggle} title={collapsed ? "Open sidebar" : "Close sidebar"} aria-label={collapsed ? "Open sidebar" : "Close sidebar"}>
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = icons[item] || CalendarDays;
          return (
            <button
              key={item}
              onClick={() => onNavigate(item)}
              className={cn(
                "flex h-12 w-full items-center rounded-lg text-left text-sm font-semibold transition",
                collapsed ? "justify-center px-2" : "gap-3 px-4",
                active === item ? "bg-bank-soft text-bank-dark" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              title={collapsed ? item : undefined}
              aria-label={item}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item}</span>}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <Button variant="ghost" className={cn("w-full", collapsed ? "justify-center px-0" : "justify-start")} onClick={onLogout} title={collapsed ? "Logout" : undefined} aria-label="Logout">
          <LogOut className="h-4 w-4" />
          {!collapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
}
