import type { DashboardData } from "../types";
import { money } from "../lib/utils";
import { DataTable } from "../components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Activity, AlertTriangle, Banknote, CalendarClock, TrendingUp, UserRoundCheck } from "lucide-react";
import type { ElementType } from "react";

export function Dashboard({ dashboard }: { dashboard: DashboardData }) {
  const metrics: Array<[string, string, ElementType]> = [
    ["Total Visits This Month", dashboard.metrics.totalVisitsThisMonth.toLocaleString(), Activity],
    ["Potential Customers", dashboard.metrics.potentialCustomers.toLocaleString(), UserRoundCheck],
    ["Follow Ups Due", dashboard.metrics.followUpsDue.toLocaleString(), CalendarClock],
    ["Converted Customers", dashboard.metrics.convertedCustomers.toLocaleString(), TrendingUp],
    ["Expected Loan Amount", money(dashboard.metrics.expectedLoanAmount), Banknote]
  ];

  const columns: ColumnDef<Record<string, unknown>>[] = [
    { accessorKey: "Name", header: "Customer" },
    { accessorKey: "Next_Follow_Up", header: "Date" },
    { accessorKey: "Status", header: "Status" }
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="page-title">Relationship Dashboard</h2>
          <p className="section-note">Customer activity, portfolio movement, and follow-up priorities.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-xs font-extrabold text-amber-700 shadow-sm backdrop-blur dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          Compliance review ready
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value, Icon]) => (
          <div key={label} className="crm-card p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted dark:text-slate-400">{label}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bank-soft text-bank-dark dark:bg-emerald-400/10 dark:text-emerald-200">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{value}</p>
            <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-bank dark:bg-emerald-400" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        <div className="crm-card p-5">
          <h3 className="mb-4 text-lg font-extrabold text-slate-950 dark:text-white">Recent Interactions</h3>
          <div className="space-y-3 text-sm">
            {dashboard.recentActivities.length ? dashboard.recentActivities.map((activity) => (
              <div key={activity} className="flex gap-3 rounded-xl border border-border/70 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5">
                <span className="mt-1 h-2 w-2 rounded-full bg-bank dark:bg-emerald-400" />
                <p className="font-medium text-slate-700 dark:text-slate-300">{activity}</p>
              </div>
            )) : <p className="text-muted">No recent CRM activity yet.</p>}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-extrabold text-slate-950 dark:text-white">Upcoming Follow Ups</h3>
          <DataTable data={dashboard.upcomingFollowUps as unknown as Record<string, unknown>[]} columns={columns} pageSize={8} />
        </div>
      </div>
    </section>
  );
}
