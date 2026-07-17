import type { ColumnDef } from "@tanstack/react-table";
import {
  Banknote,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  Landmark,
  MessageSquareText,
  Phone,
  PhoneCall,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  UserRoundCheck,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import salespersonFollowup from "../assets/salesperson-followup.svg";
import { DataTable } from "../components/DataTable";
import { CustomerDrawer } from "../components/CustomerDrawer";
import { LeadBadge, normalizeLeadLevel, shortStatusLabel, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAddPotential } from "../hooks/useCrmData";
import type { PotentialCustomer, User, VisitCustomer } from "../types";

const exportColumns = ["Name", "Tel", "Business", "Purpose", "Bank", "Amount", "Interest", "Loan_Type", "Tenure", "Maturity", "Status", "Potential_Level", "Potential_Products", "Next_Follow_Up", "Date_Added", "Source_Type", "Source_Channel", "Remark", "Notes"];
type DetailTab = "Overview" | "Remark" | "Notes" | "Activities";
type PipelineUpdate = {
  Status?: string;
  Last_Updated: string;
};
const pipelineStatuses = ["Not interested / Need", "Open to more information", "Interested-need appointment", "Study initiated"];
const sourceOptions = ["All", "Market", "Eco-list"];

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
  const [source, setSource] = useState("All");
  const [level, setLevel] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [selected, setSelected] = useState<PotentialCustomer | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("Overview");
  const [addOpen, setAddOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pipelineUpdates, setPipelineUpdates] = useState<Record<string, PipelineUpdate>>({});
  const [recentPipelineRow, setRecentPipelineRow] = useState("");
  const addPotential = useAddPotential(user);

  const displayedPotentials = useMemo(() => {
    return potentials.map((row) => {
      const key = rowKey(row);
      const update = pipelineUpdates[key];
      return update ? { ...row, ...update } : row;
    });
  }, [potentials, pipelineUpdates]);

  const filtered = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    return displayedPotentials.filter((row) => {
      if (status !== "All" && row.Status !== status) return false;
      if (source !== "All" && normalizeSource(row) !== source) return false;
      if (level !== "All" && normalizeLeadLevel(row.Potential_Level) !== level) return false;
      const added = row.Date_Added ? new Date(row.Date_Added) : null;
      if (dateFilter === "Today" && row.Date_Added !== today.toISOString().slice(0, 10)) return false;
      if (dateFilter === "Last 7 Days" && (!added || added < sevenDaysAgo)) return false;
      if (dateFilter === "This Month" && (!added || added.getMonth() !== today.getMonth() || added.getFullYear() !== today.getFullYear())) return false;
      if (query) return Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase());
      return true;
    }).sort(compareNewestPotential);
  }, [displayedPotentials, query, status, source, level, dateFilter]);

  const followupInsights = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const dueToday = displayedPotentials.filter((row) => safeText(row.Next_Follow_Up).slice(0, 10) === todayKey).length;
    const highPotential = displayedPotentials.filter((row) => normalizeLeadLevel(row.Potential_Level) === "H").length;
    const appointmentReady = displayedPotentials.filter((row) => row.Status === "Interested-need appointment").length;
    const studyInitiated = displayedPotentials.filter((row) => row.Status === "Study initiated").length;
    return { dueToday, highPotential, appointmentReady, studyInitiated };
  }, [displayedPotentials]);

  const quickActions = [
    {
      label: "Call Today",
      detail: `${followupInsights.dueToday.toLocaleString()} due`,
      icon: PhoneCall,
      active: dateFilter === "Today",
      onClick: () => setDateFilter("Today"),
      tone: "emerald"
    },
    {
      label: "Book Appointment",
      detail: `${followupInsights.appointmentReady.toLocaleString()} ready`,
      icon: CalendarCheck,
      active: status === "Interested-need appointment",
      onClick: () => setStatus("Interested-need appointment"),
      tone: "blue"
    },
    {
      label: "Prepare Study",
      detail: `${followupInsights.studyInitiated.toLocaleString()} active`,
      icon: FileText,
      active: status === "Study initiated",
      onClick: () => setStatus("Study initiated"),
      tone: "amber"
    },
    {
      label: "Add Lead",
      detail: "New customer",
      icon: UserPlus,
      active: false,
      onClick: () => setAddOpen(true),
      tone: "slate"
    }
  ];

  const columns: ColumnDef<PotentialCustomer>[] = [
    {
      accessorKey: "Name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 text-sm font-black uppercase text-bank ring-2 ring-white shadow-sm dark:from-emerald-500/20 dark:to-sky-500/20 dark:text-emerald-200 dark:ring-slate-900">
              {customerInitials(row.original.Name)}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-slate-950 dark:text-white">{safeText(row.original.Name, "Unnamed customer")}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Phone className="h-3.5 w-3.5" />
                {safeText(row.original.Tel, "No phone")}
              </div>
              <div className="mt-2 inline-flex max-w-[190px] items-center gap-1.5 truncate rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                {safeText(row.original.Source_Channel, "Market")}
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
        <div className="min-w-[210px] space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100"><BriefcaseBusiness className="h-4 w-4 shrink-0 text-bank" />{safeText(row.original.Business, "Not specified")}</div>
          <div className="flex items-center gap-2 text-xs text-muted"><Landmark className="h-3.5 w-3.5 shrink-0" />{safeText(row.original.Bank, "No bank recorded")}</div>
          <div className="max-w-[230px] truncate pl-5.5 text-xs text-muted" title={safeText(row.original.Purpose)}>{safeText(row.original.Purpose, "No purpose recorded")}</div>
        </div>
      )
    },
    {
      accessorKey: "Amount",
      header: "Facility",
      cell: ({ row }) => (
        <div className="min-w-[165px]">
          <div className="flex items-center gap-2 text-base font-extrabold text-bank-dark dark:text-emerald-200"><Banknote className="h-4 w-4" />{safeText(row.original.Amount, "Not set")}</div>
          <div className="mt-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">{safeText(row.original.Loan_Type, "Loan type not set")}</div>
          <div className="mt-1 text-[11px] text-muted">{safeText(row.original.Interest, "-")} interest</div>
        </div>
      )
    },
    {
      accessorKey: "Status",
      header: "Pipeline",
      cell: ({ row }) => (
        <div className="min-w-[135px] space-y-2">
          <div className="flex items-center gap-2"><StatusBadge status={row.original.Status} /><LeadBadge level={row.original.Potential_Level} /></div>
          <div className="text-[11px] font-semibold text-muted">Updated {formatDate(row.original.Last_Updated, "-")}</div>
        </div>
      )
    },
    {
      accessorKey: "Next_Follow_Up",
      header: "Follow-up",
      cell: ({ row }) => (
        <div className="min-w-[145px]">
          <div className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${followUpDateClass(row.original.Next_Follow_Up)}`}><CalendarDays className="h-3.5 w-3.5" />{formatDate(row.original.Next_Follow_Up, "Not scheduled")}</div>
          <div className="mt-2 text-[11px] text-muted">Added {formatDate(row.original.Date_Added, "-")}</div>
        </div>
      )
    },
    {
      accessorKey: "Remark",
      header: "Latest Note",
      cell: ({ row }) => (
        <div className="flex min-w-[190px] max-w-[250px] items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/5">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <div className="line-clamp-2 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">{safeText(row.original.Remark, "No note recorded")}</div>
        </div>
      )
    }
  ];

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-white/70 bg-white/80 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <div className="p-5 sm:p-6 lg:p-7">
            <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-bank/15 bg-bank-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-bank-dark dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <Target className="h-3.5 w-3.5" />
                  Sales follow-up cockpit
                </div>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">My Followup</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-muted dark:text-slate-400">
                  See who to call, which customers need appointments, and where each opportunity sits in the pipeline.
                </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InsightTile icon={Clock3} label="Due Today" value={followupInsights.dueToday} tone="emerald" />
              <InsightTile icon={TrendingUp} label="High Signal" value={followupInsights.highPotential} tone="red" />
              <InsightTile icon={CalendarCheck} label="Appointments" value={followupInsights.appointmentReady} tone="blue" />
              <InsightTile icon={FileText} label="Study Initiated" value={followupInsights.studyInitiated} tone="amber" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={`group flex h-20 items-center gap-3 rounded-lg border px-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lift ${
                    action.active
                      ? "border-bank/40 bg-bank-soft text-bank-dark dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100"
                      : "border-slate-200/80 bg-white/75 text-slate-800 hover:border-bank/25 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  }`}
                >
                  <span className={quickActionIconClass(action.tone)}>
                    <action.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold">{action.label}</span>
                    <span className="mt-1 block truncate text-xs font-semibold text-muted dark:text-slate-400">{action.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="relative hidden min-h-[320px] items-end justify-center overflow-hidden border-l border-slate-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/60 lg:flex">
            <img src={salespersonFollowup} alt="Salesperson reviewing customer follow ups" className="h-full max-h-[310px] w-full object-contain drop-shadow-xl" />
            <div className="absolute bottom-6 left-6 right-6 rounded-lg border border-white/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/75">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bank text-white">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-950 dark:text-white">Next best action</p>
                  <p className="mt-0.5 text-xs font-semibold text-muted dark:text-slate-400">Prioritize calls and appointments from one screen.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-bank/20 bg-bank-soft/80 px-4 py-3 text-sm font-bold text-bank-dark shadow-sm backdrop-blur dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          <Bell className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      <div className="crm-card p-4">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]">
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input className="input-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer..." />
            </div>
          </div>
          <Select label="Status" value={status} options={["All", ...pipelineStatuses]} onChange={setStatus} optionLabel={(option) => option === "All" ? option : shortStatusLabel(option)} />
          <Select label="Source" value={source} options={sourceOptions} onChange={setSource} />
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
      <div className="flex flex-col gap-3 rounded-xl border border-bank/20 bg-bank-soft/80 px-4 py-3 text-sm font-bold text-bank-dark shadow-sm backdrop-blur dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200 sm:flex-row sm:items-center sm:justify-between">
        <span>Showing {filtered.length.toLocaleString()} follow-up customers</span>
        <button
          type="button"
          onClick={() => {
            setStatus("All");
            setSource("All");
            setLevel("All");
            setDateFilter("All");
            setQuery("");
          }}
          className="inline-flex items-center gap-2 self-start rounded-md bg-white/80 px-3 py-1.5 text-xs font-extrabold text-bank-dark shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-emerald-100 sm:self-auto"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </button>
      </div>
      <DataTable
        tone="blue"
        data={filtered}
        columns={columns}
        search={query}
        onRowClick={(customer) => { setDetailTab("Overview"); setSelected(customer); }}
        getRowClassName={(customer) =>
          rowKey(customer) === recentPipelineRow
            ? "!border-emerald-200 !bg-emerald-50/90 ring-1 ring-inset ring-emerald-200/80 hover:!bg-emerald-100/70 dark:!bg-emerald-500/10 dark:!border-emerald-400/20 dark:ring-emerald-400/20"
            : ""
        }
      />
      <CustomerDrawer
        customer={selected}
        initialTab={detailTab}
        onClose={() => setSelected(null)}
        onSave={async (updates) => {
          if (!selected) return;
          const statusChanged = typeof updates.Status === "string" && updates.Status !== selected.Status;
          await onSave(selected, updates);
          if (statusChanged) {
            const key = rowKey(selected);
            const lastUpdated = new Date().toISOString();
            setPipelineUpdates((current) => ({ ...current, [key]: { Status: updates.Status as string, Last_Updated: lastUpdated } }));
            setRecentPipelineRow(key);
            setMessage(`${safeText(selected.Name, "Customer")} pipeline updated to ${updates.Status}.`);
          }
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

function InsightTile({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
  tone: "emerald" | "red" | "blue" | "amber";
}) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/20",
    red: "bg-red-50 text-red-700 ring-red-200/80 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-400/20",
    blue: "bg-blue-50 text-blue-700 ring-blue-200/80 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-400/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-200/80 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20"
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-muted dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">{value.toLocaleString()}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function quickActionIconClass(tone: string) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/20",
    blue: "bg-blue-50 text-blue-700 ring-blue-200/80 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-400/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-200/80 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20",
    slate: "bg-slate-100 text-slate-700 ring-slate-200/80 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10"
  };
  return `flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${tones[tone] ?? tones.slate}`;
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
  Sender_Name: "Manual Entry",
  Entry_Type: "Manual"
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
      Sender_Name: "Manual Entry",
      Entry_Type: "Manual"
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
              className="min-h-28 w-full rounded-md border border-border bg-white px-3 py-3 text-sm outline-none transition focus:border-bank focus:ring-2 focus:ring-bank/20"
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

function Select({ label, value, options, onChange, optionLabel = (option) => option }: { label: string; value: string; options: string[]; onChange: (value: string) => void; optionLabel?: (option: string) => string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input-control" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{optionLabel(option)}</option>)}
      </select>
    </div>
  );
}

function safeText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text && text.toLowerCase() !== "nan" ? text : fallback;
}

function customerInitials(name: unknown) {
  const words = safeText(name, "Customer").split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join("");
}

function followUpDateClass(value: unknown) {
  const date = safeText(value).slice(0, 10);
  if (!date) return "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400";
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return "bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-400/20";
  if (date === today) return "bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20";
  return "bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-400/20";
}

function formatDate(value: unknown, fallback: string) {
  const text = safeText(value);
  return text ? text.slice(0, 10) : fallback;
}

function rowKey(customer: PotentialCustomer) {
  return String(customer._row_number || customer.Customer_Key || `${customer.Name}-${customer.Tel}`);
}

function latestUpdateTime(customer: PotentialCustomer) {
  const timestamp = safeText(customer.Last_Updated, customer.Date_Added);
  if (!timestamp) return 0;
  const normalized = timestamp.includes("T") ? timestamp : timestamp.replace(" ", "T");
  const time = new Date(normalized).getTime();
  return Number.isFinite(time) ? time : 0;
}

function compareNewestPotential(a: PotentialCustomer, b: PotentialCustomer) {
  const timeDifference = latestUpdateTime(b) - latestUpdateTime(a);
  if (timeDifference) return timeDifference;
  return rowNumberValue(b._row_number) - rowNumberValue(a._row_number);
}

function rowNumberValue(value: unknown) {
  const rowNumber = Number(value);
  return Number.isFinite(rowNumber) ? rowNumber : 0;
}

function normalizeSource(customer: PotentialCustomer) {
  const source = `${safeText(customer.Source_Channel)} ${safeText(customer.Source_Type)}`.trim().toLowerCase();
  if (source.includes("sales photo report")) return "Market";
  if (source.includes("eco")) return "Eco-list";
  if (source.includes("market")) return "Market";
  return source ? source : "Market";
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
