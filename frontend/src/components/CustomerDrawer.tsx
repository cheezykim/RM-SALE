import { Activity, Building2, CalendarClock, CheckCircle2, Clock3, FileText, Landmark, MessageSquareText, PhoneCall, Save, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { PotentialCustomer } from "../types";
import { Button } from "./ui/Button";
import { LeadBadge, normalizeLeadLevel, StatusBadge } from "./ui/Badge";

const statuses = ["Not interested / Need", "Open to more information", "Interested-need appointment", "Study initiated"];
const levels = ["H", "M", "L"];
const tabs = ["Overview", "Remark", "Notes", "Activities"] as const;

type DrawerTab = (typeof tabs)[number];

type CustomerForm = {
  Name: string;
  Tel: string;
  Business: string;
  Purpose: string;
  Bank: string;
  Amount: string;
  Interest: string;
  Loan_Type: string;
  Tenure: string;
  Maturity: string;
  Source_Type: string;
  Source_Channel: string;
  Status: string;
  Potential_Level: string;
  Next_Follow_Up: string;
  Potential_Products: string;
  Remark: string;
  Notes: string;
  Activities: string;
};

export function CustomerDrawer({
  customer,
  onClose,
  onSave,
  initialTab = "Overview"
}: {
  customer: PotentialCustomer | null;
  onClose: () => void;
  onSave: (updates: Record<string, unknown>) => Promise<void>;
  initialTab?: DrawerTab;
}) {
  const [tab, setTab] = useState<DrawerTab>(initialTab);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CustomerForm>(() => buildForm(customer));

  useEffect(() => {
    setTab(initialTab);
    setForm(buildForm(customer));
  }, [customer, initialTab]);

  if (!customer) return null;

  async function save() {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof CustomerForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const source = safeText(form.Source_Type, form.Source_Channel || customer.Sender_Name || "Market Visit");

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="ml-auto flex h-full w-full max-w-[780px] animate-slide-in-right flex-col border-l border-border bg-white/95 shadow-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-border bg-white/90 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bank text-lg font-extrabold text-white shadow-sm">
                {safeText(form.Name, "C").slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-extrabold text-slate-950">{safeText(form.Name, "Customer Profile")}</h2>
                  <StatusBadge status={form.Status} />
                  <LeadBadge level={form.Potential_Level} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-md bg-bank-soft px-2.5 py-1 text-bank-dark">Source: {source}</span>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-slate-600">Owner: {safeText(customer.Salesperson_Name, "Sales")}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" className="h-9 w-9 shrink-0 p-0" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="border-b border-border bg-white/80 px-6">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`whitespace-nowrap border-b-2 py-4 text-sm font-bold ${tab === item ? "border-bank text-bank" : "border-transparent text-slate-500 hover:text-slate-900"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-6">
          {tab === "Overview" && (
            <div className="space-y-5">
              <SummaryStrip form={form} />
              <EditableSection icon={Building2} title="Customer & Business">
                <TextField label="Name" value={form.Name} onChange={(value) => update("Name", value)} />
                <TextField label="Tel" value={form.Tel} onChange={(value) => update("Tel", value)} />
                <TextField label="Business" value={form.Business} onChange={(value) => update("Business", value)} />
                <TextField label="Purpose" value={form.Purpose} onChange={(value) => update("Purpose", value)} />
                <TextField label="Bank" value={form.Bank} onChange={(value) => update("Bank", value)} />
                <TextField label="Source Type" value={form.Source_Type} onChange={(value) => update("Source_Type", value)} />
              </EditableSection>
              <EditableSection icon={Landmark} title="Facility Information">
                <TextField label="Amount" value={form.Amount} onChange={(value) => update("Amount", value)} />
                <TextField label="Interest" value={form.Interest} onChange={(value) => update("Interest", value)} />
                <TextField label="Loan Type" value={form.Loan_Type} onChange={(value) => update("Loan_Type", value)} />
                <TextField label="Tenure" value={form.Tenure} onChange={(value) => update("Tenure", value)} />
                <TextField label="Maturity" value={form.Maturity} onChange={(value) => update("Maturity", value)} />
                <TextField label="Source Channel" value={form.Source_Channel} onChange={(value) => update("Source_Channel", value)} />
              </EditableSection>
              <EditableSection icon={CalendarClock} title="Pipeline Controls">
                <SelectField label="Status" value={form.Status} options={statuses} onChange={(value) => update("Status", value)} />
                <SelectField label="Potential Level" value={form.Potential_Level} options={levels} onChange={(value) => update("Potential_Level", value)} />
                <TextField label="Next Follow Up" value={form.Next_Follow_Up} type="date" onChange={(value) => update("Next_Follow_Up", value)} />
              </EditableSection>
            </div>
          )}

          {tab === "Remark" && (
            <TextAreaPanel
              icon={FileText}
              title="Customer Remark"
              value={form.Remark}
              onChange={(value) => update("Remark", value)}
              placeholder="Record sales context, relationship notes, urgency, collateral, concerns, or next recommended action."
            />
          )}

          {tab === "Notes" && (
            <TextAreaPanel
              icon={FileText}
              title="Internal Notes"
              value={form.Notes}
              onChange={(value) => update("Notes", value)}
              placeholder="Add internal follow-up notes for this customer."
            />
          )}

          {tab === "Activities" && (
            <ActivityTimeline
              value={form.Activities}
              onChange={(value) => update("Activities", value)}
            />
          )}
        </div>

        <div className="border-t border-border bg-white/95 p-6">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ActivityTimeline({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const events = parseActivities(value).reverse();

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-700 to-teal-700 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15"><Activity className="h-5 w-5" /></div>
            <div>
              <h3 className="text-sm font-extrabold">Customer Interaction Timeline</h3>
              <p className="mt-0.5 text-xs font-medium text-emerald-50">Sales follow-ups and customer movements</p>
            </div>
          </div>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-extrabold">{events.length} events</span>
        </div>

        <div className="p-5">
          {events.length ? (
            <div className="space-y-0">
              {events.map((event, index) => {
                const Icon = activityIcon(event.description);
                return (
                  <div key={`${event.date}-${event.description}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
                    {index < events.length - 1 && <div className="absolute left-[17px] top-9 h-[calc(100%-20px)] w-0.5 bg-emerald-200" />}
                    <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-white shadow-sm">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-50/50">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-extrabold text-slate-900">{activityTitle(event.description)}</p>
                        {event.date && <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200"><Clock3 className="h-3 w-3" />{event.date}</span>}
                      </div>
                      <p className="mt-1.5 text-sm leading-5 text-slate-600">{event.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 px-5 py-8 text-center">
              <MessageSquareText className="mx-auto h-7 w-7 text-emerald-500" />
              <p className="mt-2 text-sm font-extrabold text-slate-800">No customer interactions recorded</p>
              <p className="mt-1 text-xs text-slate-500">Add the first follow-up activity below.</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-bank" />
          <label className="text-sm font-extrabold text-slate-900">Update Activity Log</label>
        </div>
        <textarea
          className="min-h-36 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Example: 17 Jul 2026 - Called customer to discuss loan requirements"
        />
        <p className="mt-2 text-xs text-slate-500">Enter one interaction per line using “date - activity”. Newest events appear first in the timeline.</p>
      </div>
    </div>
  );
}

function parseActivities(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const separator = line.indexOf(" - ");
    return separator >= 0
      ? { date: line.slice(0, separator).trim(), description: line.slice(separator + 3).trim() }
      : { date: "", description: line };
  });
}

function activityTitle(description: string) {
  const text = description.toLowerCase();
  if (text.includes("status changed")) return "Pipeline Updated";
  if (text.includes("added to potential") || text.includes("lead")) return "Lead Created";
  if (text.includes("call") || text.includes("phone")) return "Customer Call";
  if (text.includes("meeting") || text.includes("visit") || text.includes("appointment")) return "Customer Meeting";
  return "Follow-up Activity";
}

function activityIcon(description: string) {
  const text = description.toLowerCase();
  if (text.includes("status changed")) return CheckCircle2;
  if (text.includes("added to potential") || text.includes("lead")) return UserPlus;
  if (text.includes("call") || text.includes("phone")) return PhoneCall;
  return MessageSquareText;
}

function buildForm(customer: PotentialCustomer | null): CustomerForm {
  return {
    Name: safeText(customer?.Name),
    Tel: safeText(customer?.Tel),
    Business: safeText(customer?.Business),
    Purpose: safeText(customer?.Purpose),
    Bank: safeText(customer?.Bank),
    Amount: safeText(customer?.Amount),
    Interest: safeText(customer?.Interest),
    Loan_Type: safeText(customer?.Loan_Type),
    Tenure: safeText(customer?.Tenure),
    Maturity: safeText(customer?.Maturity),
    Source_Type: safeText(customer?.Source_Type),
    Source_Channel: safeText(customer?.Source_Channel),
    Status: safeText(customer?.Status, "Not interested / Need"),
    Potential_Level: normalizeLeadLevel(customer?.Potential_Level),
    Next_Follow_Up: safeText(customer?.Next_Follow_Up),
    Potential_Products: safeText(customer?.Potential_Products, "SME Loan"),
    Remark: safeText(customer?.Remark),
    Notes: safeText(customer?.Notes),
    Activities: safeText(customer?.Activities)
  };
}

function SummaryStrip({ form }: { form: CustomerForm }) {
  const metrics = [
    ["Facility", safeText(form.Amount, "-")],
    ["Loan Type", safeText(form.Loan_Type, "-")],
    ["Interest", safeText(form.Interest, "-")],
    ["Maturity", safeText(form.Maturity, "-")]
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {metrics.map(([label, value]) => (
        <div key={label} className="rounded-md border border-border bg-white/90 px-4 py-3 shadow-sm">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-1 truncate text-sm font-extrabold text-slate-950">{value}</p>
        </div>
      ))}
    </div>
  );
}

function EditableSection({
  icon: Icon,
  title,
  children
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="crm-card bg-white/90 p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-bank-soft text-bank-dark">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-extrabold text-slate-950">{title}</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input-control bg-white/90" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input-control bg-white/90" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

function TextAreaPanel({
  icon: Icon,
  title,
  value,
  onChange,
  placeholder
}: {
  icon: typeof FileText;
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="crm-card bg-white/90 p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-bank-soft text-bank-dark">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-extrabold text-slate-950">{title}</h3>
      </div>
      <textarea
        className="min-h-72 w-full rounded-md border border-border bg-white/90 px-4 py-3 text-sm leading-6 outline-none transition focus:border-bank focus:ring-2 focus:ring-bank/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function safeText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text && text.toLowerCase() !== "nan" ? text : fallback;
}
