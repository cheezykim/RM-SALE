import { CalendarDays, CheckCircle2, Download, FileText, Send, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useGenerateDailyReport, useSubmitDailyReport } from "../hooks/useCrmData";
import { todayISO } from "../lib/utils";
import type { PotentialCustomer, User, VisitCustomer } from "../types";
import { Button } from "../components/ui/Button";
import { LeadBadge, normalizeLeadLevel, StatusBadge } from "../components/ui/Badge";

export function Reports({
  user,
  visits,
  potentials
}: {
  user: User;
  visits: VisitCustomer[];
  potentials: PotentialCustomer[];
}) {
  const [reportDate, setReportDate] = useState(todayISO());
  const [message, setMessage] = useState("");
  const generateReport = useGenerateDailyReport();
  const submitReport = useSubmitDailyReport();

  const report = useMemo(() => buildPreview(reportDate, visits, potentials), [reportDate, visits, potentials]);

  async function generate() {
    setMessage("");
    const blob = await generateReport.mutateAsync({ user, reportDate });
    downloadBlob(blob, `rm_daily_activity_report_${reportDate}.pdf`);
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
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-bank text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-950">RM Activity Reporting</h2>
              <p className="mt-1 text-sm text-muted">Generate and submit a daily activity report for management review.</p>
            </div>
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

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <section className="crm-card p-5">
          <h3 className="text-sm font-extrabold uppercase text-slate-500">RM Information</h3>
          <div className="mt-4 space-y-3">
            <Info label="RM Name" value={user.username} />
            <Info label="Branch" value={user.branch || "-"} />
            <Info label="Position" value={roleLabel(user.role)} />
            <Info label="Staff ID" value={user.staff_id} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Users} label="Total Visits" value={report.totalVisits} />
          <Metric icon={CalendarDays} label="Follow Ups" value={report.followUps} />
          <Metric icon={TrendingUp} label="New Leads" value={report.newLeads.length} />
          <Metric icon={CheckCircle2} label="HOT Leads" value={report.hotLeads} />
        </section>
      </div>

      <section className="crm-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-extrabold text-slate-950">Customer Activity Timeline</h3>
          <p className="mt-1 text-sm text-muted">Preview of activities that will appear in the report for the selected date.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Activity Type</th>
                <th className="px-5 py-3">Remark</th>
                <th className="px-5 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.timeline.map((item, index) => (
                <tr key={`${item.customer}-${index}`} className="bg-white">
                  <td className="px-5 py-4 font-bold text-slate-900">{item.time || "-"}</td>
                  <td className="px-5 py-4">{item.customer || "-"}</td>
                  <td className="px-5 py-4">{item.type}</td>
                  <td className="px-5 py-4 text-slate-600">{item.remark || "-"}</td>
                  <td className="px-5 py-4">{item.outcome || "-"}</td>
                </tr>
              ))}
              {!report.timeline.length && (
                <tr>
                  <td className="px-5 py-10 text-center text-muted" colSpan={5}>No activity found for this reporting date.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="crm-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-extrabold text-slate-950">New Potential Customers</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {report.newLeads.slice(0, 8).map((customer) => (
              <div key={String(customer.Customer_Key || customer.Name)} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-slate-950">{customer.Name || "Customer"}</p>
                  <p className="mt-1 text-sm text-muted">{customer.Potential_Products || customer.Source_Channel || "-"}</p>
                </div>
                <LeadBadge level={customer.Potential_Level} />
              </div>
            ))}
            {!report.newLeads.length && <p className="px-5 py-8 text-center text-sm text-muted">No new potential customers for this date.</p>}
          </div>
        </section>

        <section className="crm-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-extrabold text-slate-950">Next Action Plan</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {report.nextActions.slice(0, 8).map((customer) => (
              <div key={`${customer.Customer_Key}-${customer.Next_Follow_Up}`} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-slate-950">{customer.Name || "Customer"}</p>
                  <p className="mt-1 text-sm text-muted">Follow up: {customer.Next_Follow_Up || "-"}</p>
                </div>
                <StatusBadge status={customer.Status} />
              </div>
            ))}
            {!report.nextActions.length && <p className="px-5 py-8 text-center text-sm text-muted">No upcoming follow-ups recorded.</p>}
          </div>
        </section>
      </div>
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

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="crm-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase text-muted">{label}</p>
        <Icon className="h-4 w-4 text-bank" />
      </div>
      <p className="mt-4 text-3xl font-extrabold text-slate-950">{value.toLocaleString()}</p>
    </div>
  );
}

function buildPreview(reportDate: string, visits: VisitCustomer[], potentials: PotentialCustomer[]) {
  const dailyVisits = visits.filter((row) => sameDate(row.Message_Date, reportDate));
  const newLeads = potentials.filter((row) => sameDate(row.Date_Added, reportDate));
  const updatedToday = potentials.filter((row) => sameDate(row.Last_Updated, reportDate));
  const nextActions = potentials
    .filter((row) => row.Next_Follow_Up && String(row.Next_Follow_Up) >= reportDate)
    .sort((a, b) => String(a.Next_Follow_Up).localeCompare(String(b.Next_Follow_Up)));

  const timeline = [
    ...dailyVisits.map((row) => ({
      time: cleanText(row.Message_Date),
      customer: cleanText(row.Name, "Customer"),
      type: "Market Visit",
      remark: cleanText(row.Remark || row.Purpose),
      outcome: cleanText(row.Potential_Level, "Visited")
    })),
    ...updatedToday.map((row) => ({
      time: cleanText(row.Last_Updated),
      customer: cleanText(row.Name, "Customer"),
      type: "Opportunity Update",
      remark: cleanText(row.Remark || row.Notes),
      outcome: cleanText(row.Status, "Updated")
    }))
  ].sort((a, b) => a.time.localeCompare(b.time));

  return {
    totalVisits: dailyVisits.length,
    followUps: updatedToday.filter((row) => String(row.Activities || "").toLowerCase().includes("follow")).length,
    hotLeads: newLeads.filter((row) => normalizeLeadLevel(row.Potential_Level) === "H").length,
    newLeads,
    nextActions,
    timeline
  };
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

function roleLabel(value: string) {
  if (!value) return "Relationship Manager";
  return value.toLowerCase() === "rm" ? "Relationship Manager" : value;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
