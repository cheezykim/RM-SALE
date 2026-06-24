import { Download, Eye, FileText, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { CustomerDrawer } from "../components/CustomerDrawer";
import { useGenerateDailyReport, useSubmitDailyReport } from "../hooks/useCrmData";
import { todayISO } from "../lib/utils";
import type { PotentialCustomer, User, VisitCustomer } from "../types";
import { Button } from "../components/ui/Button";
import { LeadBadge } from "../components/ui/Badge";

export function Reports({
  user,
  potentials,
  onSave
}: {
  user: User;
  visits: VisitCustomer[];
  potentials: PotentialCustomer[];
  onSave: (customer: PotentialCustomer, updates: Record<string, unknown>) => Promise<void>;
}) {
  const [reportDate, setReportDate] = useState(todayISO());
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<PotentialCustomer | null>(null);
  const generateReport = useGenerateDailyReport();
  const submitReport = useSubmitDailyReport();

  const newLeads = useMemo(
    () => potentials.filter((row) => sameDate(row.Date_Added, reportDate)),
    [potentials, reportDate]
  );

  async function generate() {
    setMessage("");
    const blob = await generateReport.mutateAsync({ user, reportDate });
    downloadBlob(blob, `rm_new_potential_report_${reportDate}.pdf`);
    setMessage("Daily report generated.");
  }

  async function submit() {
    setMessage("");
    const result = await submitReport.mutateAsync({ user, reportDate });
    setMessage(`${result.message} Report ID: ${result.report_id}`);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-bank text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-950">RM Daily Report</h2>
            <p className="mt-1 text-sm text-muted">Generate a focused report for RM information and new potential customers.</p>
          </div>
        </div>

        <div className="crm-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div>
            <label className="label">Reporting Date</label>
            <input className="input-control w-full sm:w-52" type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} />
          </div>
          <Button variant="outline" onClick={generate} disabled={generateReport.isPending || submitReport.isPending}>
            <Download className="h-4 w-4" />
            {generateReport.isPending ? "Generating..." : "Generate Daily Report"}
          </Button>
          <Button onClick={submit} disabled={generateReport.isPending || submitReport.isPending}>
            <Send className="h-4 w-4" />
            {submitReport.isPending ? "Submitting..." : "Generate & Submit Report"}
          </Button>
        </div>
      </div>

      {message && <p className="rounded-md bg-bank-soft px-4 py-3 text-sm font-bold text-bank-dark">{message}</p>}
      {(generateReport.error || submitReport.error) && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {(generateReport.error || submitReport.error)?.message}
        </p>
      )}

      <section className="crm-card p-5">
        <h3 className="text-sm font-extrabold uppercase text-slate-500">RM Information</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Info label="RM Name" value={user.username} />
          <Info label="Branch" value={user.branch || "-"} />
          <Info label="Staff ID" value={user.staff_id} />
        </div>
      </section>

      <section className="crm-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-extrabold text-slate-950">New Potential Customers</h3>
          <p className="mt-1 text-sm text-muted">Activity comes from each customer's View Detail record.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-bank text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Potential</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {newLeads.map((customer) => {
                const key = customerKey(customer);
                return (
                  <tr key={key} className="bg-white">
                    <td className="px-4 py-4 font-bold text-slate-950">{customer.Name || "Customer"}</td>
                    <td className="px-4 py-4">{customer.Potential_Products || "-"}</td>
                    <td className="px-4 py-4">{customer.Amount || "-"}</td>
                    <td className="px-4 py-4"><LeadBadge level={customer.Potential_Level} /></td>
                    <td className="px-4 py-4">{customer.Source_Channel || customer.Source_Type || "-"}</td>
                    <td className="px-4 py-4 max-w-[280px]">
                      <div className="line-clamp-3 whitespace-pre-line text-slate-700">{cleanText(customer.Activities, "No activity recorded.")}</div>
                    </td>
                    <td className="px-4 py-4">
                      <Button variant="outline" className="h-9 px-3" onClick={() => setSelected(customer)}>
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {!newLeads.length && (
                <tr>
                  <td className="px-5 py-10 text-center text-muted" colSpan={7}>No new potential customers for this reporting date.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <CustomerDrawer
        customer={selected}
        initialTab="Activities"
        onClose={() => setSelected(null)}
        onSave={async (updates) => {
          if (!selected) return;
          await onSave(selected, updates);
          setSelected(null);
        }}
      />
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-extrabold uppercase text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-extrabold text-slate-950">{value}</p>
    </div>
  );
}

function sameDate(value: unknown, target: string) {
  const text = cleanText(value);
  if (!text) return false;
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10) === target;
  return text.slice(0, 10) === target;
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text && text.toLowerCase() !== "nan" ? text : fallback;
}

function customerKey(customer: PotentialCustomer) {
  return String(customer.Customer_Key || `${customer.Name}-${customer.Tel}-${customer.Date_Added}`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
