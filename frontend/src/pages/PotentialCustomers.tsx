import type { ColumnDef } from "@tanstack/react-table";
import { Bell, Download, Eye, Plus, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import { CustomerDrawer } from "../components/CustomerDrawer";
import { LeadBadge, normalizeLeadLevel, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAddPotential } from "../hooks/useCrmData";
import type { PotentialCustomer, User, VisitCustomer } from "../types";

const exportColumns = ["Name", "Tel", "Business", "Purpose", "Bank", "Amount", "Interest", "Loan_Type", "Tenure", "Maturity", "Status", "Potential_Level", "Potential_Products", "Next_Follow_Up", "Date_Added", "Source_Type", "Source_Channel", "Remark", "Notes"];
type DetailTab = "Overview" | "Remark" | "Notes" | "Activities";

export function PotentialCustomers({
  user,
  potentials,
  onSave
}: {
  user: User;
  potentials: PotentialCustomer[];
  onSave: (customer: PotentialCustomer, updates: Record<string, unknown>) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [level, setLevel] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [selected, setSelected] = useState<PotentialCustomer | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("Overview");
  const [addOpen, setAddOpen] = useState(false);
  const [message, setMessage] = useState("");
  const addPotential = useAddPotential(user);

  const filtered = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    return potentials.filter((row) => {
      if (status !== "All" && row.Status !== status) return false;
      if (level !== "All" && normalizeLeadLevel(row.Potential_Level) !== level) return false;
      const added = row.Date_Added ? new Date(row.Date_Added) : null;
      if (dateFilter === "Today" && row.Date_Added !== today.toISOString().slice(0, 10)) return false;
      if (dateFilter === "Last 7 Days" && (!added || added < sevenDaysAgo)) return false;
      if (dateFilter === "This Month" && (!added || added.getMonth() !== today.getMonth() || added.getFullYear() !== today.getFullYear())) return false;
      if (query) return Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase());
      return true;
    });
  }, [potentials, query, status, level, dateFilter]);

  const columns: ColumnDef<PotentialCustomer>[] = [
    {
      accessorKey: "Name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="min-w-[210px]">
          <div className="font-extrabold text-slate-950">{safeText(row.original.Name, "Unnamed customer")}</div>
          <div className="mt-1 text-xs font-medium text-muted">{safeText(row.original.Tel, "No phone")}</div>
          <div className="mt-2 inline-flex rounded-md bg-bank-soft px-2 py-1 text-[11px] font-bold text-bank-dark">
            Source: {safeText(row.original.Source_Type, row.original.Source_Channel || row.original.Sender_Name || "Market Visit")}
          </div>
        </div>
      )
    },
    {
      accessorKey: "Business",
      header: "Business Profile",
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <div className="font-bold text-slate-900">{safeText(row.original.Business, "-")}</div>
          <div className="mt-1 text-xs text-muted">Bank: {safeText(row.original.Bank, "-")}</div>
          <div className="mt-1 max-w-[260px] truncate text-xs text-muted">{safeText(row.original.Purpose, "No purpose recorded")}</div>
        </div>
      )
    },
    {
      accessorKey: "Amount",
      header: "Facility",
      cell: ({ row }) => (
        <div className="min-w-[170px]">
          <div className="font-extrabold text-bank-dark">{safeText(row.original.Amount, "-")}</div>
          <div className="mt-1 text-xs font-medium text-slate-700">{safeText(row.original.Loan_Type, "Loan type not set")}</div>
          <div className="mt-1 text-xs text-muted">Interest: {safeText(row.original.Interest, "-")}</div>
        </div>
      )
    },
    {
      accessorKey: "Status",
      header: "Pipeline",
      cell: ({ row }) => (
        <div className="min-w-[150px] space-y-2">
          <StatusBadge status={row.original.Status} />
        </div>
      )
    },
    {
      accessorKey: "Potential_Level",
      header: "Signal",
      cell: ({ row }) => <LeadBadge level={row.original.Potential_Level} />
    },
    {
      accessorKey: "Next_Follow_Up",
      header: "Next Action",
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <div className="font-bold text-slate-900">{formatDate(row.original.Next_Follow_Up, "No follow up")}</div>
          <div className="mt-1 text-xs text-muted">Added {formatDate(row.original.Date_Added, "-")}</div>
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
        <Button
          variant="outline"
          className="h-9 rounded-md border-bank/20 bg-white/70 px-3 text-bank-dark shadow-sm backdrop-blur hover:border-bank/35 hover:bg-bank-soft"
          onClick={(event) => {
            event.stopPropagation();
            setDetailTab("Remark");
            setSelected(row.original);
          }}
        >
          <Eye className="h-4 w-4" />
          View Remark
        </Button>
      )
    }
  ];

  return (
    <section className="space-y-5">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">My Potential Customers</h2>
            <p className="mt-1 text-sm text-muted">List of customers you have marked as potential.</p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>
      {message && (
        <div className="flex items-start gap-3 rounded-md border border-bank/20 bg-bank-soft px-4 py-3 text-sm font-bold text-bank-dark">
          <Bell className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      <div className="crm-card p-4">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input className="input-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer..." />
            </div>
          </div>
          <Select label="Status" value={status} options={["All", ...Array.from(new Set(potentials.map((row) => row.Status).filter(Boolean)))]} onChange={setStatus} />
          <Select label="Signal" value={level} options={["All", "H", "M", "L"]} onChange={setLevel} />
          <Select label="Date Added" value={dateFilter} options={["All", "Today", "Last 7 Days", "This Month"]} onChange={setDateFilter} />
          <div className="flex items-end">
            <Button variant="outline" onClick={() => exportCsv(filtered, "potential_customers.csv")}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>
      <div className="rounded-md bg-bank-soft px-4 py-3 text-sm font-bold text-bank-dark">Showing {filtered.length.toLocaleString()} potential customers</div>
      <DataTable data={filtered} columns={columns} search={query} onRowClick={(customer) => { setDetailTab("Overview"); setSelected(customer); }} />
      <CustomerDrawer
        customer={selected}
        initialTab={detailTab}
        onClose={() => setSelected(null)}
        onSave={async (updates) => {
          if (!selected) return;
          await onSave(selected, updates);
          setSelected(null);
        }}
      />
      <AddCustomerDrawer
        open={addOpen}
        saving={addPotential.isPending}
        onClose={() => setAddOpen(false)}
        onSubmit={async (customer) => {
          const result = await addPotential.mutateAsync(customer);
          setMessage(`${result.message} Source recorded as ${safeText(customer.Source_Type, "Manual Entry")}.`);
          if (result.ok) setAddOpen(false);
        }}
      />
    </section>
  );
}

const initialManualCustomer: VisitCustomer = {
  Name: "",
  Tel: "",
  Business: "",
  Purpose: "",
  Bank: "",
  Amount: "",
  Interest: "",
  Loan_Type: "",
  Tenure: "",
  Maturity: "",
  Potential_Level: "H",
  Potential_Product: "SME Loan",
  Remark: "",
  Source_Type: "",
  Source_Channel: "",
  Sender_Name: "Manual Entry"
};

function AddCustomerDrawer({
  open,
  saving,
  onClose,
  onSubmit
}: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (customer: VisitCustomer) => Promise<void>;
}) {
  const [form, setForm] = useState<VisitCustomer>(initialManualCustomer);
  const canSubmit = Boolean(safeText(form.Name) && safeText(form.Tel) && safeText(form.Source_Type));

  if (!open) return null;

  function update(key: keyof VisitCustomer, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    const source = safeText(form.Source_Type, "Manual Entry");
    await onSubmit({
      ...form,
      Source_Type: source,
      Source_Channel: source,
      Sender_Name: "Manual Entry"
    });
    setForm(initialManualCustomer);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="ml-auto flex h-full w-full max-w-[760px] animate-slide-in-right flex-col border-l border-border bg-white/95 shadow-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bank-soft text-bank-dark">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">Add Customer</h2>
                <p className="mt-1 text-sm text-muted">Create a clean banking CRM record with source visibility for follow up.</p>
              </div>
            </div>
            <Button variant="ghost" className="h-9 w-9 p-0" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-5 rounded-md border border-bank/20 bg-bank-soft px-4 py-3 text-sm font-semibold text-bank-dark">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Sales source is required so the team can identify where this customer came from.</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Name" value={form.Name} onChange={(value) => update("Name", value)} required />
            <TextField label="Tel" value={form.Tel} onChange={(value) => update("Tel", value)} required />
            <TextField label="Business" value={form.Business} onChange={(value) => update("Business", value)} />
            <TextField label="Purpose" value={form.Purpose} onChange={(value) => update("Purpose", value)} />
            <TextField label="Bank" value={form.Bank} onChange={(value) => update("Bank", value)} />
            <TextField label="Amount" value={form.Amount} onChange={(value) => update("Amount", value)} placeholder="USD 50,000" />
            <TextField label="Interest" value={form.Interest} onChange={(value) => update("Interest", value)} placeholder="8.5%" />
            <TextField label="Loan Type" value={form.Loan_Type} onChange={(value) => update("Loan_Type", value)} placeholder="Working Capital Loan" />
            <TextField label="Tenure" value={form.Tenure} onChange={(value) => update("Tenure", value)} placeholder="36 months" />
            <TextField label="Maturity" value={form.Maturity} onChange={(value) => update("Maturity", value)} placeholder="2029" />
            <Select label="Potential H/M/L" value={safeText(form.Potential_Level, "H")} options={["H", "M", "L"]} onChange={(value) => update("Potential_Level", value)} />
            <TextField label="Potential Product" value={form.Potential_Product} onChange={(value) => update("Potential_Product", value)} placeholder="SME Loan" />
            <TextField label="Source Type" value={form.Source_Type} onChange={(value) => update("Source_Type", value)} placeholder="Referral, branch walk-in, event..." required />
            <div className="rounded-md border border-dashed border-bank/30 bg-white p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-bank-dark">Source Notice</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                This customer will be saved as coming from {safeText(form.Source_Type, "the source you type")}.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="label">Remark</label>
            <textarea
              className="min-h-28 w-full rounded-md border border-border bg-white px-3 py-3 text-sm outline-none transition focus:border-bank focus:ring-2 focus:ring-bank/15"
              value={safeText(form.Remark)}
              onChange={(event) => update("Remark", event.target.value)}
              placeholder="Add customer background, collateral notes, urgency, or relationship context."
            />
          </div>
        </div>

        <div className="border-t border-border bg-white p-6">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={!canSubmit || saving}>
              <Plus className="h-4 w-4" />
              {saving ? "Adding..." : "Add Customer"}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required
}: {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}{required ? " *" : ""}</label>
      <input className="input-control" value={safeText(value)} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input-control" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

function safeText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text && text.toLowerCase() !== "nan" ? text : fallback;
}

function formatDate(value: unknown, fallback: string) {
  const text = safeText(value);
  return text ? text.slice(0, 10) : fallback;
}

function exportCsv(rows: PotentialCustomer[], filename: string) {
  const csv = [exportColumns.join(","), ...rows.map((row) => exportColumns.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
