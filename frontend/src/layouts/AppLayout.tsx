import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
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
  Dashboard: LayoutDashboard,
  "Daily Planning": CalendarDays,
  "Market Visit Customers": Users,
  "My Potential Customers": UserRoundCheck,
  "Performance Analytics": BarChart3,
  Reports: FileText,
  Settings
};

const paths: Record<string, string> = {
  Dashboard: "/",
  "Daily Planning": "/daily-planning",
  "Market Visit Customers": "/market-visit-customers",
  "My Potential Customers": "/potential-customers",
  "Performance Analytics": "/performance-analytics",
  Reports: "/reports",
  Settings: "/settings"
};

export function AppLayout({ user, active, children }: { user: User; active: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigation = useSessionStore((state) => state.navigation);
  const logout = useSessionStore((state) => state.logout);
  const navigate = useNavigate();

  function go(item: string) {
    navigate(paths[item] ?? "/");
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-white lg:flex lg:flex-col">
        <SidebarContent active={active} navigation={navigation} onNavigate={go} onLogout={logout} />
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

      <main className="lg:pl-72">
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
  onLogout
}: {
  active: string;
  navigation: string[];
  onNavigate: (item: string) => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <img src="/api/logo" className="h-16 w-36 object-contain" alt="Chip Mong Bank" />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = icons[item] || LayoutDashboard;
          return (
            <button
              key={item}
              onClick={() => onNavigate(item)}
              className={cn(
                "flex h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-sm font-semibold transition",
                active === item ? "bg-bank-soft text-bank-dark" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

