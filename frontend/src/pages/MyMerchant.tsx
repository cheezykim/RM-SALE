import { CalendarClock, Eye, Filter, MapPin, Phone, Search, Store, UserRoundCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/ui/Button";

type MerchantSample = {
  name: string;
  owner: string;
  business: string;
  phone: string;
  source: string;
  status: string;
  nextAction: string;
  messageDate: string;
};

const sampleMerchants: MerchantSample[] = [
  {
    name: "Sokha Mini Mart",
    owner: "Kang Phengkheang",
    business: "Grocery and household retail",
    phone: "012 458 901",
    source: "Assigned Merchant",
    status: "Active",
    nextAction: "Call merchant",
    messageDate: "2026-07-06"
  },
  {
    name: "Malis Coffee & Bakery",
    owner: "Kang Phengkheang",
    business: "Cafe and bakery",
    phone: "015 772 118",
    source: "Portfolio Transfer",
    status: "Monitor",
    nextAction: "Schedule follow up",
    messageDate: "2026-07-02"
  },
  {
    name: "Vattanac Mobile Shop",
    owner: "Kang Phengkheang",
    business: "Phone and accessory sales",
    phone: "096 334 2210",
    source: "Assigned Merchant",
    status: "Active",
    nextAction: "Collect updated documents",
    messageDate: "2026-06-28"
  },
  {
    name: "Borei Furniture Center",
    owner: "Kang Phengkheang",
    business: "Furniture showroom",
    phone: "017 889 450",
    source: "Existing Coverage",
    status: "Low Priority",
    nextAction: "Review profile",
    messageDate: "2026-06-10"
  },
  {
    name: "Kandal Fresh Market Stall",
    owner: "Kang Phengkheang",
    business: "Fresh produce wholesaler",
    phone: "093 512 786",
    source: "Assigned Merchant",
    status: "Active",
    nextAction: "Visit merchant",
    messageDate: "2026-07-08"
  }
];

export function MyMerchant() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const merchants = sampleMerchants;
  const statusOptions = ["All", ...Array.from(new Set(merchants.map((merchant) => merchant.status))).filter(Boolean)];
  const filtered = useMemo(() => {
    return merchants.filter((merchant) => {
      if (status !== "All" && merchant.status !== status) return false;
      if (!query) return true;
      return Object.values(merchant).join(" ").toLowerCase().includes(query.toLowerCase());
    });
  }, [query, status]);

  const activeCount = merchants.filter((merchant) => merchant.status !== "Low Priority").length;
  const followUpCount = merchants.filter((merchant) => merchant.nextAction !== "Review profile").length;
  const newThisMonth = merchants.filter((merchant) => isThisMonth(merchant.messageDate)).length;

  return (
    <section className="space-y-5">
      <PageHeader icon={Store} title="MyMerchant" subtitle="Merchant customers assigned to your coverage and daily relationship workflow." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Store} label="Assigned Merchants" value={merchants.length.toLocaleString()} tone="emerald" />
        <MetricCard icon={UserRoundCheck} label="Active" value={activeCount.toLocaleString()} tone="blue" />
        <MetricCard icon={CalendarClock} label="Needs Follow Up" value={followUpCount.toLocaleString()} tone="amber" />
        <MetricCard icon={Users} label="New This Month" value={newThisMonth.toLocaleString()} tone="violet" />
      </div>

      <div className="crm-card p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px_auto] lg:items-end">
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input className="input-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search merchant, owner, phone..." />
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
          <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Merchant Coverage</h3>
          <p className="section-note">Showing {filtered.length.toLocaleString()} assigned merchants</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-extrabold">Merchant</th>
                <th className="px-5 py-3 font-extrabold">Owner</th>
                <th className="px-5 py-3 font-extrabold">Business</th>
                <th className="px-5 py-3 font-extrabold">Phone</th>
                <th className="px-5 py-3 font-extrabold">Status</th>
                <th className="px-5 py-3 font-extrabold">Next Action</th>
                <th className="px-5 py-3 font-extrabold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {filtered.map((merchant, index) => (
                <tr key={`${merchant.name}-${merchant.phone}-${index}`} className="bg-white/70 dark:bg-white/[0.03]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-bank dark:bg-emerald-500/10 dark:text-emerald-200">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-950 dark:text-white">{merchant.name}</div>
                        <div className="text-xs text-muted">{merchant.source}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">{merchant.owner}</td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{merchant.business}</td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-200">{merchant.phone}</td>
                  <td className="px-5 py-4"><StatusPill value={merchant.status} /></td>
                  <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">{merchant.nextAction}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <IconButton title="View profile" icon={Eye} />
                      <IconButton title="Call" icon={Phone} />
                      <IconButton title="Follow up" icon={CalendarClock} />
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

function isThisMonth(value: string) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

function PageHeader({ icon: Icon, title, subtitle }: { icon: typeof Store; title: string; subtitle: string }) {
  return (
    <div className="crm-card p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-bank-dark dark:bg-emerald-500/10 dark:text-emerald-200">
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h2 className="page-title">{title}</h2>
          <p className="section-note">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof Store; label: string; value: string; tone: "emerald" | "blue" | "amber" | "violet" }) {
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

function IconButton({ title, icon: Icon }: { title: string; icon: typeof Store }) {
  return (
    <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-slate-600 transition hover:border-bank/30 hover:bg-bank-soft hover:text-bank dark:border-white/10 dark:bg-white/5 dark:text-slate-300" title={title} aria-label={title}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

function StatusPill({ value }: { value: string }) {
  const color = value === "Active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : value === "Monitor" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-extrabold ${color}`}>{value}</span>;
}
