import type { ColumnDef } from "@tanstack/react-table";
import { Banknote, BriefcaseBusiness, CalendarDays, Download, Filter, Landmark, MapPin, Phone, Search, Store, Target, TrendingUp, Users } from "lucide-react";
import type { ElementType } from "react";
import { useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import { VisitCustomerDrawer } from "../components/VisitCustomerDrawer";
import { LeadBadge, normalizeLeadLevel } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAddPotential } from "../hooks/useCrmData";
import type { User, VisitCustomer } from "../types";

const exportColumns = ["Sender_Name", "Name", "Tel", "Rank", "Business", "Purpose", "Amount", "Interest", "Loan_Type", "Tenure", "Maturity", "Remark", "Source_Channel", "Message_Date"];

export function MarketVisit({ user, visits }: { user: User; visits: VisitCustomer[] }) {
  const [query, setQuery] = useState("");
  const [potential, setPotential] = useState("All");
  const [source, setSource] = useState("All");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<VisitCustomer | null>(null);
  const [detailTab, setDetailTab] = useState<"Overview" | "Remark" | "Notes" | "Activities">("Overview");
  const addPotential = useAddPotential(user);

  const potentialOptions = ["All", "H", "M", "L"];
  const normalizedSources = unique(visits.map((item) => normalizeSourceChannel(item.Source_Channel)));
  const sourceOptions = [
    "All",
    ...["Market", "Eco-list"].filter((option) => normalizedSources.includes(option)),
    ...normalizedSources.filter((option) => option !== "Market" && option !== "Eco-list")
  ];

  const filtered = useMemo(() => {
    return visits.filter((row) => {
      if (potential !== "All" && normalizeLeadLevel(row.Potential_Level) !== potential) return false;
      if (source !== "All" && normalizeSourceChannel(row.Source_Channel) !== source) return false;
      if (dateFilter === "Today" && row.Message_Date && !String(row.Message_Date).startsWith(new Date().toISOString().slice(0, 10))) return false;
      if (dateFilter === "Custom Range" && row.Message_Date) {
        const date = String(row.Message_Date).slice(0, 10);
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
      }
      if (query) return Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase());
      return true;
    }).sort(compareNewestVisit);
  }, [visits, potential, source, dateFilter, startDate, endDate, query]);
  const hotCount = filtered.filter((row) => normalizeLeadLevel(row.Potential_Level) === "H").length;
  const sourceCount = sourceOptions.length > 1 ? sourceOptions.length - 1 : 0;
  const todayCount = filtered.filter((row) => row.Message_Date && String(row.Message_Date).startsWith(new Date().toISOString().slice(0, 10))).length;

  const columns: ColumnDef<VisitCustomer>[] = [
    {
      accessorKey: "Name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="min-w-[210px]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-bank dark:bg-emerald-500/10 dark:text-emerald-200">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-950">{safeText(row.original.Name, "Unnamed customer")}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted">
                <Phone className="h-3.5 w-3.5" />
                {safeText(row.original.Tel, "No phone")}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                <Target className="h-3.5 w-3.5" />
                Sale: {safeText(row.original.Sender_Name, "Market Visit")}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      accessorKey: "Business",
      header: "Business Profile",
      cell: ({ row }) => (
        <div className="min-w-[190px]">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <BriefcaseBusiness className="h-4 w-4 text-bank" />
            {safeText(row.original.Business, "-")}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <Landmark className="h-3.5 w-3.5" />
            Bank: {safeText(row.original.Bank, "-")}
          </div>
          <div className="mt-1 max-w-[220px] truncate text-xs text-muted">{safeText(row.original.Purpose, "No purpose recorded")}</div>
        </div>
      )
    },
    {
      accessorKey: "Amount",
      header: "Facility Request",
      cell: ({ row }) => (
        <div className="min-w-[170px]">
          <div className="flex items-center gap-2 font-extrabold text-bank-dark">
            <Banknote className="h-4 w-4" />
            {safeText(row.original.Amount, "-")}
          </div>
          <div className="mt-1 text-xs font-medium text-slate-700">{safeText(row.original.Loan_Type, "Loan type not set")}</div>
          <div className="mt-1 text-xs text-muted">Interest: {safeText(row.original.Interest, "-")}</div>
        </div>
      )
    },
    {
      accessorKey: "Tenure",
      header: "Timeline",
      cell: ({ row }) => (
        <div className="min-w-[130px] text-sm">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <CalendarDays className="h-4 w-4 text-bank" />
            {safeText(row.original.Tenure, "-")}
          </div>
          <div className="mt-1 text-xs text-muted">Maturity: {safeText(row.original.Maturity, "-")}</div>
        </div>
      )
    },
    {
      accessorKey: "Potential_Level",
      header: "Signal",
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <LeadBadge level={String(row.original.Potential_Level || "Hot")} />
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5" />
            {safeText(row.original.Source_Channel, "Market Visit")}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(row.original.Message_Date)}
          </div>
        </div>
      )
    },
    {
      accessorKey: "Remark",
      header: "Remark",
      cell: ({ row }) => (
        <div className="max-w-[260px]">
          <div className="line-clamp-2 text-sm leading-5 text-slate-700">{safeText(row.original.Remark, "No remark recorded.")}</div>
        </div>
      )
    }
  ];

  async function addSelected(customer: VisitCustomer) {
    const result = await addPotential.mutateAsync(customer);
    setMessage(result.message);
  }

  return (
    <section className="space-y-5">
      <div className="crm-card overflow-hidden p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-bank-dark shadow-sm dark:bg-emerald-500/10 dark:text-emerald-200">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h2 className="page-title">Market Visit Customer</h2>
              <p className="section-note">Click any row to review customer details and mark as potential.</p>
            </div>
          </div>
          <MarketVisitVisual />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Visible Customers" value={filtered.length.toLocaleString()} tone="emerald" />
        <MetricCard icon={TrendingUp} label="High Potential" value={hotCount.toLocaleString()} tone="red" />
        <MetricCard icon={MapPin} label="Source Channels" value={sourceCount.toLocaleString()} tone="blue" />
        <MetricCard icon={CalendarDays} label="Today" value={todayCount.toLocaleString()} tone="amber" />
      </div>

      <div className="crm-card p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.5fr_1.5fr_auto]">
          <Select icon={TrendingUp} label="Potential Level" value={potential} options={potentialOptions} onChange={setPotential} />
          <Select icon={MapPin} label="Source Channel" value={source} options={sourceOptions} onChange={setSource} />
          <Select icon={CalendarDays} label="Date Filter" value={dateFilter} options={["All Dates", "Today", "Custom Range"]} onChange={setDateFilter} />
          <div>
            <label className="label inline-flex items-center gap-1.5"><Search className="h-3.5 w-3.5" />Search Customer</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input className="input-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer..." />
            </div>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => exportCsv(filtered, "market_visit_customers.csv")}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        {dateFilter === "Custom Range" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <DateField label="From" value={startDate} onChange={setStartDate} />
            <DateField label="To" value={endDate} onChange={setEndDate} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-blue-200/70 bg-blue-50/80 px-4 py-3 text-sm font-bold text-blue-700 shadow-sm backdrop-blur dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">
        <Filter className="h-4 w-4" />
        Showing {filtered.length.toLocaleString()} customers
      </div>
      {message && <div className="rounded-xl border border-bank/20 bg-bank-soft/80 px-4 py-3 text-sm font-bold text-bank-dark shadow-sm backdrop-blur dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">{message}</div>}
      <DataTable tone="emerald" data={filtered} columns={columns} search={query} onRowClick={(customer) => { setDetailTab("Overview"); setSelected(customer); }} />
      <VisitCustomerDrawer customer={selected} initialTab={detailTab} onClose={() => setSelected(null)} onAddPotential={addSelected} saving={addPotential.isPending} />
    </section>
  );
}

function Select({ icon: Icon, label: text, value, options, onChange }: { icon: ElementType; label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {text}
      </label>
      <select className="input-control" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

function MarketVisitVisual() {
  return (
    <div className="relative hidden h-28 w-72 shrink-0 overflow-hidden rounded-2xl bg-emerald-50/90 md:block dark:bg-emerald-500/10" aria-hidden="true">
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-emerald-100/70 dark:bg-emerald-400/10" />
      <div className="absolute bottom-5 left-8 flex h-14 w-16 items-center justify-center rounded-xl border border-emerald-200 bg-white text-bank shadow-sm dark:border-emerald-400/20 dark:bg-slate-900 dark:text-emerald-200">
        <Store className="h-8 w-8" />
      </div>
      <div className="absolute bottom-6 left-32 flex h-12 w-12 items-center justify-center rounded-full bg-white text-sky-600 shadow-sm dark:bg-slate-900 dark:text-sky-200">
        <MapPin className="h-6 w-6" />
      </div>
      <div className="absolute right-8 top-5 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-sm dark:border-emerald-400/20 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-extrabold text-bank dark:text-emerald-200">
          <Users className="h-4 w-4" />
          Visit List
        </div>
        <div className="mt-2 grid gap-1">
          <span className="h-1.5 w-24 rounded-full bg-emerald-200 dark:bg-emerald-400/30" />
          <span className="h-1.5 w-16 rounded-full bg-sky-200 dark:bg-sky-400/30" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: ElementType; label: string; value: string; tone: "emerald" | "red" | "blue" | "amber" }) {
  const colors = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
    red: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-200",
    blue: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
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

function DateField({ label: text, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label">{text}</label>
      <input className="input-control" type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter((value) => value && value !== "nan"))).sort();
}

function normalizeSourceChannel(value: unknown) {
  const source = safeText(value);
  const normalized = source.toLowerCase();
  if (normalized.includes("sales photo report") || normalized.includes("market")) return "Market";
  if (normalized.includes("eco")) return "Eco-list";
  return source;
}

function safeText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text && text.toLowerCase() !== "nan" ? text : fallback;
}

function formatDate(value: unknown) {
  const text = safeText(value);
  return text ? text.slice(0, 10) : "No date";
}

function compareNewestVisit(a: VisitCustomer, b: VisitCustomer) {
  const timeDifference = timestampValue(b.Message_Date) - timestampValue(a.Message_Date);
  if (timeDifference) return timeDifference;
  return rowNumberValue(b._row_number) - rowNumberValue(a._row_number);
}

function timestampValue(value: unknown) {
  const timestamp = safeText(value);
  if (!timestamp) return 0;
  const parsed = new Date(timestamp.includes("T") ? timestamp : timestamp.replace(" ", "T")).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function rowNumberValue(value: unknown) {
  const rowNumber = Number(value);
  return Number.isFinite(rowNumber) ? rowNumber : 0;
}

function exportCsv(rows: VisitCustomer[], filename: string) {
  const csv = [exportColumns.join(","), ...rows.map((row) => exportColumns.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
