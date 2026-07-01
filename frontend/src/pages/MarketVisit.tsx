import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye, Plus, Search, Users } from "lucide-react";
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
  const sourceOptions = ["All", ...unique(visits.map((item) => item.Source_Channel as string))];

  const filtered = useMemo(() => {
    return visits.filter((row) => {
      if (potential !== "All" && normalizeLeadLevel(row.Potential_Level) !== potential) return false;
      if (source !== "All" && row.Source_Channel !== source) return false;
      if (dateFilter === "Today" && row.Message_Date && !String(row.Message_Date).startsWith(new Date().toISOString().slice(0, 10))) return false;
      if (dateFilter === "Custom Range" && row.Message_Date) {
        const date = String(row.Message_Date).slice(0, 10);
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
      }
      if (query) return Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase());
      return true;
    });
  }, [visits, potential, source, dateFilter, startDate, endDate, query]);

  const columns: ColumnDef<VisitCustomer>[] = [
    {
      accessorKey: "Name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="min-w-[210px]">
          <div className="font-extrabold text-slate-950">{safeText(row.original.Name, "Unnamed customer")}</div>
          <div className="mt-1 text-xs font-medium text-muted">{safeText(row.original.Tel, "No phone")}</div>
          <div className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">Branch: {safeText(row.original.Sender_Name, "Market Visit")}</div>
        </div>
      )
    },
    {
      accessorKey: "Business",
      header: "Business Profile",
      cell: ({ row }) => (
        <div className="min-w-[190px]">
          <div className="font-bold text-slate-900">{safeText(row.original.Business, "-")}</div>
          <div className="mt-1 text-xs text-muted">Bank: {safeText(row.original.Bank, "-")}</div>
          <div className="mt-1 max-w-[220px] truncate text-xs text-muted">{safeText(row.original.Purpose, "No purpose recorded")}</div>
        </div>
      )
    },
    {
      accessorKey: "Amount",
      header: "Facility Request",
      cell: ({ row }) => (
        <div className="min-w-[170px]">
          <div className="font-extrabold text-bank-dark">{safeText(row.original.Amount, "-")}</div>
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
          <div className="font-bold text-slate-900">{safeText(row.original.Tenure, "-")}</div>
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
          <div className="mt-2 text-xs text-muted">{safeText(row.original.Source_Channel, "Market Visit")}</div>
          <div className="mt-1 text-xs text-muted">{formatDate(row.original.Message_Date)}</div>
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
    },
    {
      id: "Action",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex min-w-[170px] gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-md border-bank/20 bg-white/75 px-3 font-extrabold text-bank-dark shadow-sm backdrop-blur transition hover:border-bank/40 hover:bg-bank-soft hover:shadow-md"
            onClick={(event) => { event.stopPropagation(); setDetailTab("Remark"); setSelected(row.original); }}
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
          <Button
            variant="outline"
            className="h-8 px-3 text-bank"
            onClick={async (event) => {
              event.stopPropagation();
              const result = await addPotential.mutateAsync(row.original);
              setMessage(result.message);
            }}
            disabled={addPotential.isPending}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
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
      <div>
        <h2 className="flex items-center gap-3 text-2xl font-extrabold">
          <Users className="h-7 w-7 text-blue-700" />
          Market Visit Customer
        </h2>
        <p className="mt-1 text-sm text-muted">List of customers visited in market. Click on a row to view details and mark as potential.</p>
      </div>

      <div className="crm-card p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.5fr_1.5fr_auto]">
          <Select label="Potential Level" value={potential} options={potentialOptions} onChange={setPotential} />
          <Select label="Source Channel" value={source} options={sourceOptions} onChange={setSource} />
          <Select label="Date Filter" value={dateFilter} options={["All Dates", "Today", "Custom Range"]} onChange={setDateFilter} />
          <div>
            <label className="label">Search Customer</label>
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

      <div className="rounded-md bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">Showing {filtered.length.toLocaleString()} customers</div>
      {message && <div className="rounded-md bg-bank-soft px-4 py-3 text-sm font-bold text-bank-dark">{message}</div>}
      <DataTable data={filtered} columns={columns} search={query} onRowClick={(customer) => { setDetailTab("Overview"); setSelected(customer); }} />
      <VisitCustomerDrawer customer={selected} initialTab={detailTab} onClose={() => setSelected(null)} onAddPotential={addSelected} saving={addPotential.isPending} />
    </section>
  );
}

function Select({ label: text, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label">{text}</label>
      <select className="input-control" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
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

function safeText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text && text.toLowerCase() !== "nan" ? text : fallback;
}

function formatDate(value: unknown) {
  const text = safeText(value);
  return text ? text.slice(0, 10) : "No date";
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
