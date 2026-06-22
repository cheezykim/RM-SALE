import { Building2, CalendarClock, FileText, Landmark, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PotentialCustomer } from "../types";
import { Button } from "./ui/Button";
import { LeadBadge, normalizeLeadLevel, StatusBadge } from "./ui/Badge";

const statuses = ["Interested", "Follow Up", "Proposal Sent", "Document Collection", "Negotiation", "Converted", "Lost"];
const levels = ["H", "M", "L"];
const products = ["SME Loan", "Housing Loan", "Auto Loan", "Working Capital Loan", "Other Products"];
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

  const selectedProducts = useMemo(
    () => form.Potential_Products.split(",").map((value) => value.trim()).filter(Boolean),
    [form.Potential_Products]
  );

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

  function toggleProduct(product: string) {
    const next = selectedProducts.includes(product)
      ? selectedProducts.filter((item) => item !== product)
      : [...selectedProducts, product];
    update("Potential_Products", next.join(", "));
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
              <div className="crm-card bg-white/90 p-4">
                <h3 className="mb-3 text-sm font-extrabold text-slate-950">Potential Products</h3>
                <div className="flex flex-wrap gap-2">
                  {products.map((product) => (
                    <button
                      key={product}
                      onClick={() => toggleProduct(product)}
                      className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${selectedProducts.includes(product) ? "bg-bank text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      {product}
                    </button>
                  ))}
                </div>
              </div>
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
            <div className="crm-card bg-white/90 p-4">
              <h3 className="mb-4 text-sm font-extrabold text-slate-950">Activity Timeline</h3>
              <div className="space-y-3">
                {(customer.Activities || "").split("\n").filter(Boolean).map((activity) => (
                  <div key={activity} className="rounded-md border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                    {activity}
                  </div>
                ))}
                {!safeText(customer.Activities) && <p className="text-sm text-muted">No activities recorded yet.</p>}
              </div>
            </div>
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
    Status: safeText(customer?.Status, "Interested"),
    Potential_Level: normalizeLeadLevel(customer?.Potential_Level),
    Next_Follow_Up: safeText(customer?.Next_Follow_Up),
    Potential_Products: safeText(customer?.Potential_Products, "SME Loan"),
    Remark: safeText(customer?.Remark),
    Notes: safeText(customer?.Notes)
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
        className="min-h-72 w-full rounded-md border border-border bg-white/90 px-4 py-3 text-sm leading-6 outline-none transition focus:border-bank focus:ring-2 focus:ring-bank/15"
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
