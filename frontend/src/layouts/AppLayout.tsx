import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Landmark,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Store,
  Sun,
  UserRound,
  UserRoundCheck,
  Users,
  X
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useSessionStore } from "../store/sessionStore";
import type { User } from "../types";
import { Button } from "../components/ui/Button";

const icons: Record<string, ElementType> = {
  "Daily Planning": CalendarDays,
  "MyMerchant": Store,
  "Existing Customers": Users,
  "Market Visit Customers": Users,
  "My Followup": UserRoundCheck
};

const paths: Record<string, string> = {
  "Daily Planning": "/daily-planning",
  "MyMerchant": "/my-merchant",
  "Existing Customers": "/existing-customers",
  "Market Visit Customers": "/market-visit-customers",
  "My Followup": "/potential-customers"
};

export function AppLayout({ user, active, children }: { user: User; active: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigation = useSessionStore((state) => state.navigation);
  const logout = useSessionStore((state) => state.logout);
  const navigate = useNavigate();

  function go(item: string) {
    navigate(paths[item] ?? "/daily-planning");
    setMobileOpen(false);
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className={cn("min-h-screen overflow-hidden bg-background text-foreground dark:bg-slate-950 dark:text-slate-100", darkMode && "dark")}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,132,61,0.12),transparent_30%),linear-gradient(135deg,#f8fcff_0%,#eef8f4_42%,#f4f7fb_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),linear-gradient(135deg,#020617_0%,#082015_48%,#071827_100%)]" />
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden border-r border-white/10 bg-bank-navy text-white shadow-2xl transition-[width] duration-200 lg:flex lg:flex-col", sidebarCollapsed ? "w-20" : "w-72")}>
        <SidebarContent active={active} navigation={navigation} onNavigate={go} onLogout={logout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="h-full w-72 bg-bank-navy text-white shadow-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-end p-3">
              <Button variant="ghost" className="h-9 w-9 p-0 text-white hover:bg-white/10" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent active={active} navigation={navigation} onNavigate={go} onLogout={logout} />
          </aside>
        </div>
      )}

      <main className={cn("relative transition-[padding] duration-200", sidebarCollapsed ? "lg:pl-20" : "lg:pl-72")}>
        <header className="sticky top-0 z-20 border-b border-white/70 bg-white/75 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="h-10 w-10 p-0 lg:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-bank dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Commercial Banking CRM</span>
                </div>
                <h1 className="mt-1 text-lg font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-2xl">Customer Relationship Center</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="outline" className="h-10 w-10 p-0" onClick={() => setDarkMode((value) => !value)} title={darkMode ? "Light Mode" : "Dark Mode"} aria-label={darkMode ? "Light Mode" : "Dark Mode"}>
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/70 px-2 py-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-bank-soft text-bank-dark ring-1 ring-bank/10 dark:bg-emerald-400/10 dark:text-emerald-200">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-extrabold text-slate-950 dark:text-white">{user.username}</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{user.staff_id}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
              </div>
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
      <div className={cn("flex min-h-24 items-center border-b border-white/10", collapsed ? "justify-center px-2" : "justify-between px-6")}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
              <img src="/api/logo" className="h-full w-full object-contain" alt="Chip Mong Bank" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-wide">Chip Mong Bank</p>
            </div>
          </div>
        )}
        {onToggle && (
          <Button variant="ghost" className="h-9 w-9 shrink-0 p-0 text-white hover:bg-white/10" onClick={onToggle} title={collapsed ? "Open sidebar" : "Close sidebar"} aria-label={collapsed ? "Open sidebar" : "Close sidebar"}>
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
      </div>
      <div className={cn("px-4 pt-4", collapsed && "hidden")}>
        <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-200">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-100/70">Portfolio</p>
            </div>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = icons[item] || CalendarDays;
          return (
            <button
              key={item}
              onClick={() => onNavigate(item)}
              className={cn(
                "flex h-12 w-full items-center rounded-xl text-left text-sm font-bold transition duration-200",
                collapsed ? "justify-center px-2" : "gap-3 px-4",
                active === item ? "bg-white text-bank-navy shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"
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
      <div className="border-t border-white/10 p-4">
        <Button variant="ghost" className={cn("w-full text-slate-200 hover:bg-white/10 hover:text-white", collapsed ? "justify-center px-0" : "justify-start")} onClick={onLogout} title={collapsed ? "Logout" : undefined} aria-label="Logout">
          <LogOut className="h-4 w-4" />
          {!collapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
}
