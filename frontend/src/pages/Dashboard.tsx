import type { DashboardData } from "../types";
import { money } from "../lib/utils";
import { DataTable } from "../components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

export function Dashboard({ dashboard }: { dashboard: DashboardData }) {
  const metrics = [
    ["Total Visits This Month", dashboard.metrics.totalVisitsThisMonth.toLocaleString()],
    ["Potential Customers", dashboard.metrics.potentialCustomers.toLocaleString()],
    ["Follow Ups Due", dashboard.metrics.followUpsDue.toLocaleString()],
    ["Converted Customers", dashboard.metrics.convertedCustomers.toLocaleString()],
    ["Expected Loan Amount", money(dashboard.metrics.expectedLoanAmount)]
  ];

  const columns: ColumnDef<Record<string, unknown>>[] = [
    { accessorKey: "Name", header: "Customer" },
    { accessorKey: "Next_Follow_Up", header: "Date" },
    { accessorKey: "Status", header: "Status" }
  ];

  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-extrabold">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value]) => (
          <div key={label} className="crm-card p-5">
            <p className="text-xs font-bold text-muted">{label}</p>
            <p className="mt-2 text-2xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        <div className="crm-card p-5">
          <h3 className="mb-4 text-lg font-extrabold">Recent Activities</h3>
          <div className="space-y-3 text-sm">
            {dashboard.recentActivities.length ? dashboard.recentActivities.map((activity) => <p key={activity}>- {activity}</p>) : <p className="text-muted">No recent CRM activity yet.</p>}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-extrabold">Upcoming Follow Ups</h3>
          <DataTable data={dashboard.upcomingFollowUps as unknown as Record<string, unknown>[]} columns={columns} pageSize={8} />
        </div>
      </div>
    </section>
  );
}
