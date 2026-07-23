import { Plus, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { VisitCustomer } from "../types";
import { Button } from "./ui/Button";
import { LeadBadge } from "./ui/Badge";

const tabs = ["Overview", "Remark", "Notes", "Activities"] as const;

export function VisitCustomerDrawer({
  customer,
  onClose,
  onAddPotential,
  saving,
  initialTab = "Overview"
}: {
  customer: VisitCustomer | null;
  onClose: () => void;
  onAddPotential: (customer: VisitCustomer) => Promise<void>;
  saving?: boolean;
  initialTab?: "Overview" | "Remark" | "Notes" | "Activities";
}) {
  const [tab, setTab] = useState(initialTab);
  useEffect(() => {
    setTab(initialTab);
  }, [customer, initialTab]);
  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/10" onClick={onClose}>
      <aside
        className="ml-auto h-full w-full max-w-[620px] animate-slide-in-right border-l border-border bg-white shadow-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3 p-4 sm:p-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white sm:h-12 sm:w-12">
                <UserRound className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="truncate text-lg font-extrabold sm:text-xl">{customer.Name || "Customer"}</h2>
                  <LeadBadge level={String(customer.Potential_Level || "Hot")} />
                </div>
                <p className="mt-1 text-sm text-muted">{customer.Sender_Name || "Market Visit"}</p>
              </div>
            </div>
            <Button variant="ghost" className="h-9 w-9 p-0" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="border-b border-border px-4 sm:px-6">
            <div className="flex gap-5 overflow-x-auto sm:gap-6">
              {tabs.map((item) => (
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

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {tab === "Overview" && (
              <div className="space-y-4">
                <InfoCard title="Business Information" rows={[
                  ["Business", customer.Business],
                  ["Phone", customer.Tel],
                  ["Brand", customer.Sender_Name],
                  ["Bank", customer.Bank],
                  ["Source Channel", customer.Source_Channel]
                ]} />
                <InfoCard title="Loan Information" rows={[
                  ["Expected Amount", customer.Amount],
                  ["Expected Interest", customer.Interest],
                  ["Loan Type", customer.Loan_Type],
                  ["Tenure", customer.Tenure],
                  ["Maturity Year", customer.Maturity]
                ]} />
              </div>
            )}
            {tab === "Remark" && <InfoPanel text={String(customer.Remark || "No remark recorded.")} />}
            {tab === "Notes" && <InfoPanel text={String(customer.Notes || "Customer notes will be stored after this customer is added as potential.")} />}
            {tab === "Activities" && <InfoPanel text={String(customer.Activities || "No activities recorded yet.")} />}
          </div>

          <div className="mobile-safe-bottom border-t border-border p-4 sm:p-6">
            <Button className="w-full" onClick={() => onAddPotential(customer)} disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? "Adding..." : "Add Potential"}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function InfoPanel({ text }: { text: string }) {
  return <div className="crm-card p-4 text-sm leading-6 text-slate-700">{text}</div>;
}

function InfoCard({ title, rows }: { title: string; rows: Array<[string, unknown]> }) {
  return (
    <div className="crm-card p-4">
      <h3 className="mb-3 text-sm font-extrabold">{title}</h3>
      <div className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-2 text-sm min-[420px]:grid-cols-2 min-[420px]:gap-4">
            <span className="text-muted">{label}</span>
            <strong>{String(value || "-")}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
