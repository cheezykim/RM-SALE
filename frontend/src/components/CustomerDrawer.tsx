import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PotentialCustomer } from "../types";
import { Button } from "./ui/Button";
import { LeadBadge, StatusBadge } from "./ui/Badge";

const statuses = ["Interested", "Follow Up", "Proposal Sent", "Document Collection", "Negotiation", "Converted", "Lost"];
const levels = ["Hot", "Warm", "Cold"];
const products = ["SME Loan", "Housing Loan", "Auto Loan", "Working Capital Loan", "Other Products"];

export function CustomerDrawer({
  customer,
  onClose,
  onSave
}: {
  customer: PotentialCustomer | null;
  onClose: () => void;
  onSave: (updates: Record<string, unknown>) => Promise<void>;
}) {
  const [tab, setTab] = useState("Overview");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    Status: customer?.Status || "Interested",
    Potential_Level: customer?.Potential_Level || "Hot",
    Next_Follow_Up: customer?.Next_Follow_Up || "",
    Potential_Products: customer?.Potential_Products || "SME Loan",
    Notes: customer?.Notes || "",
    Documents: customer?.Documents || ""
  });

  useEffect(() => {
    setForm({
      Status: customer?.Status || "Interested",
      Potential_Level: customer?.Potential_Level || "Hot",
      Next_Follow_Up: customer?.Next_Follow_Up || "",
      Potential_Products: customer?.Potential_Products || "SME Loan",
      Notes: customer?.Notes || "",
      Documents: customer?.Documents || ""
    });
  }, [customer]);

  const selectedProducts = useMemo(() => form.Potential_Products.split(",").map((value) => value.trim()).filter(Boolean), [form.Potential_Products]);

  if (!customer) return null;

  async function save() {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  function toggleProduct(product: string) {
    const next = selectedProducts.includes(product)
      ? selectedProducts.filter((item) => item !== product)
      : [...selectedProducts, product];
    setForm({ ...form, Potential_Products: next.join(", ") });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/10" onClick={onClose}>
      <div className="ml-auto h-full w-full max-w-[620px] animate-slide-in-right border-l border-border bg-white shadow-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-border p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
              {customer.Name?.slice(0, 1) || "C"}
            </div>
            <div>
              <h2 className="text-xl font-extrabold">{customer.Name}</h2>
              <div className="mt-2 flex gap-2">
                <StatusBadge status={form.Status} />
                <LeadBadge level={form.Potential_Level} />
              </div>
            </div>
          </div>
          <Button variant="ghost" className="h-9 w-9 p-0" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="border-b border-border px-6">
          <div className="flex gap-6">
            {["Overview", "Notes", "Activities", "Documents"].map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`border-b-2 py-4 text-sm font-bold ${tab === item ? "border-bank text-bank" : "border-transparent text-slate-500"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "Overview" && (
            <div className="space-y-4">
              <InfoCard title="Business Information" rows={[
                ["Business", customer.Business],
                ["Phone", customer.Tel],
                ["Rank", customer.Rank],
                ["Source Channel", customer.Source_Channel]
              ]} />
              <InfoCard title="Loan Information" rows={[
                ["Expected Amount", customer.Amount],
                ["Expected Interest", customer.Interest],
                ["Loan Type", customer.Loan_Type],
                ["Tenure", customer.Tenure],
                ["Maturity Year", customer.Maturity]
              ]} />
              <div className="crm-card p-4">
                <h3 className="mb-3 text-sm font-extrabold">Potential Products</h3>
                <div className="flex flex-wrap gap-2">
                  {products.map((product) => (
                    <button
                      key={product}
                      onClick={() => toggleProduct(product)}
                      className={`rounded-md px-3 py-1.5 text-xs font-bold ${selectedProducts.includes(product) ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}
                    >
                      {product}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === "Notes" && (
            <textarea
              className="min-h-60 w-full rounded-lg border border-border p-4 text-sm outline-none focus:border-bank focus:ring-2 focus:ring-bank/15"
              value={form.Notes}
              onChange={(event) => setForm({ ...form, Notes: event.target.value })}
            />
          )}
          {tab === "Activities" && (
            <div className="space-y-3">
              {(customer.Activities || "").split("\n").filter(Boolean).map((activity) => (
                <div key={activity} className="border-l-2 border-bank-soft pl-4 text-sm font-medium text-slate-700">
                  {activity}
                </div>
              ))}
            </div>
          )}
          {tab === "Documents" && (
            <div className="space-y-3">
              <label className="label">Document names</label>
              <input
                className="input-control"
                value={form.Documents}
                onChange={(event) => setForm({ ...form, Documents: event.target.value })}
                placeholder="Business License, Financial Statement"
              />
              <p className="text-xs text-muted">Matches the current Streamlit behavior by storing document names in Google Sheets.</p>
            </div>
          )}
        </div>

        <div className="border-t border-border p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Next Follow Up</label>
              <input className="input-control" type="date" value={form.Next_Follow_Up} onChange={(event) => setForm({ ...form, Next_Follow_Up: event.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-control" value={form.Status} onChange={(event) => setForm({ ...form, Status: event.target.value })}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Potential Level</label>
              <select className="input-control" value={form.Potential_Level} onChange={(event) => setForm({ ...form, Potential_Level: event.target.value })}>
                {levels.map((level) => <option key={level}>{level}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function InfoCard({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="crm-card p-4">
      <h3 className="mb-3 text-sm font-extrabold">{title}</h3>
      <div className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-2 gap-4 py-2 text-sm">
            <span className="text-muted">{label}</span>
            <strong>{value || "-"}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
