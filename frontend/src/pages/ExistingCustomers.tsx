import { CalendarDays, ClipboardList, Eye, FileText, Filter, Landmark, NotebookPen, Search, UserRound, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/Badge";

type ExistingCustomerSample = {
  name: string;
  phone: string;
  relationship: string;
  product: string;
  branch: string;
  lastContact: string;
  status: string;
};

const sampleExistingCustomers: ExistingCustomerSample[] = [
  {
    name: "Chan Sophea",
    phone: "012 901 778",
    relationship: "Payroll and SME owner",
    product: "SME Loan",
    branch: "Phnom Penh Main",
    lastContact: "2026-07-08",
    status: "Follow Up"
  },
  {
    name: "Lim Vicheka",
    phone: "096 441 2099",
    relationship: "Deposit customer",
    product: "Fixed Deposit",
    branch: "Sen Sok",
    lastContact: "2026-07-04",
    status: "Interested"
  },
  {
    name: "Heng Dara Trading",
    phone: "015 660 452",
    relationship: "Business facility customer",
    product: "Working Capital Loan",
    branch: "Chroy Changvar",
    lastContact: "2026-06-29",
    status: "Document Collection"
  },
  {
    name: "Srey Mom Boutique",
    phone: "017 205 331",
    relationship: "Long-term retail customer",
    product: "Merchant Account",
    branch: "Toul Kork",
    lastContact: "2026-06-22",
    status: "Converted"
  },
  {
    name: "Kosal Construction",
    phone: "093 780 114",
    relationship: "Existing loan customer",
    product: "Equipment Loan",
    branch: "Kandal",
    lastContact: "2026-07-01",
    status: "Negotiation"
  }
];

export function ExistingCustomers() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const records = sampleExistingCustomers;
  const statusOptions = ["All", ...Array.from(new Set(records.map((record) => record.status))).filter(Boolean)];
  const filtered = useMemo(() => {
    return records.filter((record) => {
      if (status !== "All" && record.status !== status) return false;
      if (!query) return true;
      return Object.values(record).join(" ").toLowerCase().includes(query.toLowerCase());
    });
  }, [query, status]);

  const activeLoans = records.filter((record) => record.product.toLowerCase().includes("loan")).length;
  const deposits = records.filter((record) => record.product.toLowerCase().includes("deposit")).length;
  const reviewDue = records.filter((record) => record.status !== "Converted").length;

  return (
    <section className="space-y-5">
      <PageHeader title="Existing Customers" subtitle="Old and current customer relationships for review, retention, and product follow up." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Existing Customers" value={records.length.toLocaleString()} tone="emerald" />
        <MetricCard icon={Landmark} label="Active Loans" value={activeLoans.toLocaleString()} tone="blue" />
        <MetricCard icon={FileText} label="Deposits" value={deposits.toLocaleString()} tone="violet" />
        <MetricCard icon={CalendarDays} label="Review Due" value={reviewDue.toLocaleString()} tone="amber" />
      </div>

      <div className="crm-card p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px_auto] lg:items-end">
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input className="input-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, product, branch..." />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input-control" value={status} onChange={(event) => setStatus(event.target.value)}>
              {statusOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <section className="crm-card overflow-hidden">
        <div className="border-b border-border/70 px-5 py-4 dark:border-white/10">
          <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Customer Portfolio</h3>
          <p className="section-note">Showing {filtered.length.toLocaleString()} existing customers</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-extrabold">Customer</th>
                <th className="px-5 py-3 font-extrabold">Relationship</th>
                <th className="px-5 py-3 font-extrabold">Product</th>
                <th className="px-5 py-3 font-extrabold">Branch</th>
                <th className="px-5 py-3 font-extrabold">Last Contact</th>
                <th className="px-5 py-3 font-extrabold">Status</th>
                <th className="px-5 py-3 font-extrabold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {filtered.map((customer, index) => (
                <tr key={`${customer.name}-${customer.phone}-${index}`} className="bg-white/70 dark:bg-white/[0.03]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-bank dark:bg-emerald-500/10 dark:text-emerald-200">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-950 dark:text-white">{customer.name}</div>
                        <div className="text-xs text-muted">{customer.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">{customer.relationship}</td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{customer.product}</td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{customer.branch}</td>
                  <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">{customer.lastContact}</td>
                  <td className="px-5 py-4"><StatusBadge status={customer.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <IconButton title="Profile" icon={Eye} />
                      <IconButton title="Notes" icon={NotebookPen} />
                      <IconButton title="Review date" icon={CalendarDays} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="crm-card p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-bank-dark dark:bg-emerald-500/10 dark:text-emerald-200">
          <Users className="h-7 w-7" />
        </div>
        <div>
          <h2 className="page-title">{title}</h2>
          <p className="section-note">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: string; tone: "emerald" | "blue" | "amber" | "violet" }) {
  const colors = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
    blue: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200"
  };

  return (
    <div className="crm-card p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="label mb-1">{label}</p>
          <p className="text-2xl font-extrabold text-slate-950 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function IconButton({ title, icon: Icon }: { title: string; icon: typeof Users }) {
  return (
    <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-slate-600 transition hover:border-bank/30 hover:bg-bank-soft hover:text-bank dark:border-white/10 dark:bg-white/5 dark:text-slate-300" title={title} aria-label={title}>
      <Icon className="h-4 w-4" />
    </button>
  );
}
