import type { ColumnDef } from "@tanstack/react-table";
import { BadgeDollarSign, CalendarDays, Phone, Search, Store, UserRoundCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import type { MerchantRecord } from "../types";

type MerchantView = MerchantRecord & {
  merchantId: string;
  ownerName: string;
  merchantPhone: string;
  status: string;
  usdAccountStatus: string;
  dateRegister: string;
  messageDate: string;
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

  const activeCount = records.filter((merchant) => isActiveStatus(merchant.status)).length;
  const usdAccountCount = records.filter((merchant) => isActiveStatus(merchant.usdAccountStatus)).length;
  const ownerCount = new Set(records.map((merchant) => merchant.ownerName).filter(Boolean)).size;
  const usdAccountRate = records.length ? Math.round((usdAccountCount / records.length) * 100) : 0;
  const activeMerchantRate = records.length ? Math.round((activeCount / records.length) * 100) : 0;

  const columns: ColumnDef<MerchantView>[] = [
    {
      accessorKey: "merchantId",
      header: "Merchant ID",
      cell: ({ row }) => (
        <div className="flex min-w-[190px] items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-sm font-black text-white shadow-sm ring-2 ring-emerald-100">
            <Store className="h-5 w-5" />
          </div>
          <p className="font-extrabold text-slate-950 dark:text-white">{row.original.merchantId || "No merchant ID"}</p>
        </div>
      )
    },
    {
      accessorKey: "ownerName",
      header: "Owner Name",
      cell: ({ row }) => <div className="min-w-[180px] font-bold text-slate-700 dark:text-slate-200">{row.original.ownerName || "No owner name"}</div>
    },
    {
      accessorKey: "merchantPhone",
      header: "Merchant Phone",
      cell: ({ row }) => <div className="flex min-w-[165px] items-center gap-2 font-semibold text-slate-700 dark:text-slate-200"><Phone className="h-4 w-4 text-emerald-600" />{row.original.merchantPhone || "No phone"}</div>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusPill value={row.original.status || "Unspecified"} />
    },
    {
      accessorKey: "dateRegister",
      header: "Date Register",
      cell: ({ row }) => (
        <div className="inline-flex min-w-[155px] items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-800 ring-1 ring-emerald-200">
          <CalendarDays className="h-4 w-4" />
          {row.original.dateRegister || "Not registered"}
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
        <MetricCard icon={BadgeDollarSign} label="Active USD Accounts" value={usdAccountCount} tone="amber" />
        <MetricCard icon={Users} label="Merchant Owners" value={ownerCount} tone="violet" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <CoverageCard label="Merchant Activity" value={activeCount} total={records.length} percentage={activeMerchantRate} color="emerald" />
        <CoverageCard label="USD Account Activation" value={usdAccountCount} total={records.length} percentage={usdAccountRate} color="amber" />
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
    merchantId: field(row, "MERCHANT ID"),
    ownerName: field(row, "OWNER NAME"),
    merchantPhone: field(row, "MERCHANT_PHONE"),
    status: field(row, "STATUS"),
    usdAccountStatus: field(row, "STATUS USD ACCOUNT", "USD ACCOUNT STATUS", "STATUS_USD_ACCOUNT", "USD_STATUS", "STATUS USD"),
    dateRegister: field(row, "DATE REGISTER", "REGISTER DATE", "DATE_REGISTER", "REGISTRATION DATE"),
    messageDate: field(row, "Message_Date", "Date_Added", "Created_At", "Created_Date", "Date")
  };
}

function field(row: MerchantRecord, ...keys: string[]) {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeHeader(key), value] as const);
  for (const requestedKey of keys) {
    const match = normalizedEntries.find(([key]) => key === normalizeHeader(requestedKey));
    const value = String(match?.[1] ?? "").trim();
    if (value && value.toLowerCase() !== "nan") return value;
  }
  return "";
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim().toUpperCase().replace(/[_\s-]+/g, " ");
}

function compareNewest(a: MerchantView, b: MerchantView) {
  const time = Date.parse(b.messageDate) - Date.parse(a.messageDate);
  if (Number.isFinite(time) && time) return time;
  return Number(b._row_number || 0) - Number(a._row_number || 0);
}

function isActiveStatus(value: string) {
  const status = value.trim().toLowerCase();
  if (!status || status.includes("inactive") || status.includes("closed") || status === "no" || status === "0") return false;
  return status.includes("active") || status.includes("open") || status === "yes" || status === "1" || status.includes("available");
}

function PageHeader() {
  return <div className="crm-card p-5"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-bank-dark"><Store className="h-7 w-7" /></div><div><h2 className="page-title">MyMerchant</h2><p className="section-note">Live merchant records from the My_Merchant Google Sheet.</p></div></div></div>;
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof Store; label: string; value: number; tone: "emerald" | "blue" | "amber" | "violet" }) {
  const colors = { emerald: "bg-emerald-100 text-emerald-700", blue: "bg-sky-100 text-sky-700", amber: "bg-amber-100 text-amber-700", violet: "bg-violet-100 text-violet-700" };
  return <div className="crm-card p-4"><div className="flex items-center gap-3"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5" /></div><div><p className="label mb-1">{label}</p><p className="text-2xl font-extrabold text-slate-950 dark:text-white">{value.toLocaleString()}</p></div></div></div>;
}

function CoverageCard({ label, value, total, percentage, color }: { label: string; value: number; total: number; percentage: number; color: "emerald" | "amber" }) {
  const colors = color === "emerald"
    ? { text: "text-emerald-700", track: "bg-emerald-100", bar: "bg-gradient-to-r from-emerald-600 to-teal-500" }
    : { text: "text-amber-700", track: "bg-amber-100", bar: "bg-gradient-to-r from-amber-500 to-orange-500" };
  return (
    <div className="crm-card p-4">
      <div className="flex items-end justify-between gap-3">
        <div><p className="label">{label}</p><p className="mt-1 text-sm font-bold text-slate-600">{value.toLocaleString()} of {total.toLocaleString()} merchants</p></div>
        <p className={`text-2xl font-black ${colors.text}`}>{percentage}%</p>
      </div>
      <div className={`mt-3 h-2.5 overflow-hidden rounded-full ${colors.track}`}><div className={`h-full rounded-full transition-all ${colors.bar}`} style={{ width: `${percentage}%` }} /></div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const text = value.toLowerCase();
  const color = isActiveStatus(value) ? "border-emerald-300 bg-emerald-100 text-emerald-800" : text.includes("monitor") || text.includes("follow") ? "border-amber-300 bg-amber-100 text-amber-800" : "border-slate-300 bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${color}`}>{value}</span>;
}
