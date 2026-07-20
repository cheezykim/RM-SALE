import type { ColumnDef } from "@tanstack/react-table";
import { BriefcaseBusiness, CalendarClock, CalendarDays, MapPin, Phone, Search, Store, UserRoundCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import type { MerchantRecord } from "../types";

type MerchantView = MerchantRecord & {
  name: string;
  owner: string;
  business: string;
  phone: string;
  source: string;
  status: string;
  nextAction: string;
  messageDate: string;
  location: string;
};

export function MyMerchant({ merchants }: { merchants: MerchantRecord[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const records = useMemo(() => merchants.map(normalizeMerchant).sort(compareNewest), [merchants]);
  const statusOptions = ["All", ...Array.from(new Set(records.map((merchant) => merchant.status))).filter(Boolean)];
  const filtered = useMemo(() => records.filter((merchant) => {
    if (status !== "All" && merchant.status !== status) return false;
    return !query || Object.values(merchant).join(" ").toLowerCase().includes(query.toLowerCase());
  }), [records, query, status]);

  const activeCount = records.filter((merchant) => merchant.status.toLowerCase() === "active").length;
  const followUpCount = records.filter((merchant) => Boolean(merchant.nextAction)).length;
  const newThisMonth = records.filter((merchant) => isThisMonth(merchant.messageDate)).length;

  const columns: ColumnDef<MerchantView>[] = [
    {
      accessorKey: "name",
      header: "Merchant",
      cell: ({ row }) => (
        <div className="flex min-w-[220px] items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-sm font-black text-white shadow-sm ring-2 ring-emerald-100">
            {initials(row.original.name)}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-slate-950 dark:text-white">{row.original.name || "Unnamed merchant"}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Phone className="h-3.5 w-3.5" />{row.original.phone || "No phone"}</p>
            <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">{row.original.source || "My Merchant"}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "business",
      header: "Business Profile",
      cell: ({ row }) => (
        <div className="min-w-[190px] space-y-1.5">
          <p className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><BriefcaseBusiness className="h-4 w-4 text-emerald-600" />{row.original.business || "Not specified"}</p>
          <p className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{row.original.location || "No location"}</p>
        </div>
      )
    },
    {
      accessorKey: "owner",
      header: "Relationship Owner",
      cell: ({ row }) => <div className="min-w-[150px] font-bold text-slate-700 dark:text-slate-200">{row.original.owner || "Not assigned"}</div>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusPill value={row.original.status || "Unspecified"} />
    },
    {
      accessorKey: "nextAction",
      header: "Next Action",
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <p className="font-bold text-slate-800 dark:text-slate-200">{row.original.nextAction || "No action scheduled"}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{row.original.messageDate || "No date"}</p>
        </div>
      )
    }
  ];

  return (
    <section className="space-y-5">
      <PageHeader />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Store} label="Assigned Merchants" value={records.length} tone="emerald" />
        <MetricCard icon={UserRoundCheck} label="Active" value={activeCount} tone="blue" />
        <MetricCard icon={CalendarClock} label="Needs Follow Up" value={followUpCount} tone="amber" />
        <MetricCard icon={Users} label="New This Month" value={newThisMonth} tone="violet" />
      </div>
      <div className="crm-card p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div><label className="label">Search Merchant</label><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><input className="input-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search merchant, owner, phone..." /></div></div>
          <div><label className="label">Status</label><select className="input-control" value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></div>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
        <span>Showing {filtered.length.toLocaleString()} merchants from My_Merchant</span>
        <span className="text-xs">Newest records first</span>
      </div>
      <DataTable tone="emerald" data={filtered} columns={columns} search={query} />
    </section>
  );
}

function normalizeMerchant(row: MerchantRecord): MerchantView {
  return {
    ...row,
    name: field(row, "Merchant_Name", "Merchant", "Name", "Shop_Name"),
    owner: field(row, "SALE INCHARGE", "Owner", "Owner_Name", "Merchant_Owner", "Salesperson_Name", "Sender_Name"),
    business: field(row, "Business", "Business_Type", "Category", "Merchant_Type"),
    phone: field(row, "Tel", "Phone", "Phone_Number", "Contact", "Mobile"),
    source: field(row, "Source_Channel", "Source", "Source_Type"),
    status: field(row, "Status", "Merchant_Status"),
    nextAction: field(row, "Next_Action", "Next_Follow_Up", "Follow_Up", "Action"),
    messageDate: field(row, "Message_Date", "Date_Added", "Created_At", "Created_Date", "Date"),
    location: field(row, "Location", "Address", "Province", "Branch")
  };
}

function field(row: MerchantRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = String(row[key] ?? "").trim();
    if (value && value.toLowerCase() !== "nan") return value;
  }
  return "";
}

function compareNewest(a: MerchantView, b: MerchantView) {
  const time = Date.parse(b.messageDate) - Date.parse(a.messageDate);
  if (Number.isFinite(time) && time) return time;
  return Number(b._row_number || 0) - Number(a._row_number || 0);
}

function initials(name: string) { return (name || "M").split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase(); }

function isThisMonth(value: string) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return Number.isFinite(date.getTime()) && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

function PageHeader() {
  return <div className="crm-card p-5"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-bank-dark"><Store className="h-7 w-7" /></div><div><h2 className="page-title">MyMerchant</h2><p className="section-note">Live merchant records from the My_Merchant Google Sheet.</p></div></div></div>;
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof Store; label: string; value: number; tone: "emerald" | "blue" | "amber" | "violet" }) {
  const colors = { emerald: "bg-emerald-100 text-emerald-700", blue: "bg-sky-100 text-sky-700", amber: "bg-amber-100 text-amber-700", violet: "bg-violet-100 text-violet-700" };
  return <div className="crm-card p-4"><div className="flex items-center gap-3"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5" /></div><div><p className="label mb-1">{label}</p><p className="text-2xl font-extrabold text-slate-950 dark:text-white">{value.toLocaleString()}</p></div></div></div>;
}

function StatusPill({ value }: { value: string }) {
  const text = value.toLowerCase();
  const color = text === "active" ? "border-emerald-300 bg-emerald-100 text-emerald-800" : text.includes("monitor") || text.includes("follow") ? "border-amber-300 bg-amber-100 text-amber-800" : "border-slate-300 bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${color}`}>{value}</span>;
}
