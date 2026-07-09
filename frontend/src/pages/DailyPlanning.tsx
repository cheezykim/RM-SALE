import { Building2, CalendarDays, ClipboardList, Landmark, MapPin, PhoneCall, Plus, Users } from "lucide-react";
import { useState } from "react";
import type { DailyTask, User } from "../types";
import { todayISO } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { useSaveDailyPlan } from "../hooks/useCrmData";

const timelineStyles = [
  {
    dot: "border-emerald-100 bg-emerald-500",
    time: "border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
    Icon: Users
  },
  {
    dot: "border-sky-100 bg-sky-500",
    time: "border-sky-100 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200",
    icon: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200",
    Icon: Landmark
  },
  {
    dot: "border-violet-100 bg-violet-500",
    time: "border-violet-100 bg-violet-50 text-violet-800 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200",
    icon: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200",
    Icon: MapPin
  },
  {
    dot: "border-amber-100 bg-amber-500",
    time: "border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200",
    icon: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
    Icon: PhoneCall
  },
  {
    dot: "border-teal-100 bg-teal-500",
    time: "border-teal-100 bg-teal-50 text-teal-800 dark:border-teal-400/20 dark:bg-teal-500/10 dark:text-teal-200",
    icon: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-200",
    Icon: ClipboardList
  }
];

export function DailyPlanning({ user, initialTasks }: { user: User; initialTasks: DailyTask[] }) {
  const [planDate, setPlanDate] = useState(todayISO());
  const [tasks, setTasks] = useState<DailyTask[]>(initialTasks);
  const [submittedTasks, setSubmittedTasks] = useState<DailyTask[]>([]);
  const [submittedDate, setSubmittedDate] = useState("");
  const [message, setMessage] = useState("");
  const savePlan = useSaveDailyPlan();

  function updateTask(index: number, patch: Partial<DailyTask>) {
    setTasks((current) => current.map((task, i) => (i === index ? { ...task, ...patch } : task)));
  }

  function syncCustomers(index: number, countText: string) {
    const count = Number(countText) || 0;
    const customers = [...(tasks[index].customers || [])];
    while (customers.length < count) customers.push({ name: "", contact: "", biz: "" });
    updateTask(index, { num_customers: countText, customers: customers.slice(0, count) });
  }

  async function submit() {
    const result = await savePlan.mutateAsync({ user, planDate, tasks });
    setMessage(result.message);
    setSubmittedDate(planDate);
    setSubmittedTasks(tasks.map((task) => ({ ...task, customers: task.customers.map((customer) => ({ ...customer })) })));
  }

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/10 dark:bg-slate-950">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-bank-dark shadow-sm dark:bg-emerald-500/10 dark:text-emerald-200">
              <CalendarDays className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-bank dark:text-emerald-300">Commercial Banking CRM</p>
              <h2 className="page-title">Daily Planning</h2>
              <p className="section-note">Plan customer coverage, market activity, and relationship manager execution.</p>
            </div>
          </div>
          <div className="hidden min-h-20 w-56 rounded-l-full bg-emerald-50/90 md:block dark:bg-emerald-500/10" />
        </div>
      </div>

      <div className="crm-card p-5">
        <div className="max-w-xs">
          <label className="label">Plan Date</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input-control pr-10" type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} />
          </div>
        </div>
      </div>

      <div className="crm-card overflow-hidden">
        <div className="hidden grid-cols-[170px_72px_1fr_1fr_180px] gap-5 border-b border-border/70 px-5 py-4 text-xs font-extrabold uppercase text-slate-500 dark:border-white/10 dark:text-slate-400 lg:grid">
          <span className="pl-14">Time</span>
          <span />
          <span>Activity</span>
          <span>Location</span>
          <span>Customers</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/10">
          {tasks.map((task, index) => {
            const style = timelineStyles[index % timelineStyles.length];
            const ActivityIcon = style.Icon;

            return (
              <div key={index} className="grid gap-4 p-5 lg:grid-cols-[170px_72px_1fr_1fr_180px] lg:items-start lg:gap-5">
                <div className="relative flex items-center gap-4 lg:min-h-24">
                  <div className="relative flex w-8 justify-center self-stretch">
                    <span className="absolute bottom-0 top-0 w-px bg-slate-200 dark:bg-white/10" />
                    <span className={`relative mt-4 h-5 w-5 rounded-full border-4 shadow-sm ${style.dot}`} />
                  </div>
                  <div className={`grid w-28 gap-2 rounded-xl border p-3 text-center text-xs font-extrabold shadow-sm ${style.time}`}>
                    <input className="w-full bg-transparent text-center outline-none" type="time" value={task.start_time} onChange={(event) => updateTask(index, { start_time: event.target.value })} />
                    <span className="text-slate-400">to</span>
                    <input className="w-full bg-transparent text-center outline-none" type="time" value={task.end_time} onChange={(event) => updateTask(index, { end_time: event.target.value })} />
                  </div>
                </div>

                <div className={`hidden h-12 w-12 items-center justify-center rounded-xl lg:flex ${style.icon}`}>
                  <ActivityIcon className="h-6 w-6" />
                </div>

                <Field label="Activity" value={task.activity} placeholder="e.g. Market Visit" onChange={(value) => updateTask(index, { activity: value })} />
                <Field label="Location" value={task.location} placeholder="e.g. Phnom Penh" onChange={(value) => updateTask(index, { location: value })} />
                <Field label="Customers" value={task.num_customers} placeholder="e.g. 5" onChange={(value) => syncCustomers(index, value)} />

                {task.customers.length > 0 && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03] lg:col-start-3 lg:col-end-6">
                    <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400">
                      <Building2 className="h-4 w-4" />
                      Customer Details
                    </div>
                    <div className="grid gap-3 xl:grid-cols-3">
                      {task.customers.map((customer, customerIndex) => (
                        <div key={customerIndex} className="grid gap-3 rounded-xl border border-white bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-950/50">
                          <Field label="Customer Name" value={customer.name} placeholder="Customer name" onChange={(value) => updateCustomer(index, customerIndex, "name", value)} />
                          <Field label="Phone" value={customer.contact} placeholder="Phone number" onChange={(value) => updateCustomer(index, customerIndex, "contact", value)} />
                          <Field label="Business" value={customer.biz} placeholder="Business type" onChange={(value) => updateCustomer(index, customerIndex, "biz", value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={() => setTasks([...tasks, { start_time: "09:00", end_time: "10:00", activity: "", location: "", num_customers: "", customers: [] }])}>
          <Plus className="h-4 w-4" />
          Add Activity
        </Button>
        <Button onClick={submit} disabled={savePlan.isPending}>{savePlan.isPending ? "Submitting..." : "Submit Daily Plan"}</Button>
      </div>
      {message && <p className="rounded-xl border border-bank/20 bg-bank-soft/80 px-4 py-3 text-sm font-bold text-bank-dark shadow-sm backdrop-blur dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">{message}</p>}
      {submittedTasks.length > 0 && <SubmittedPlanTable planDate={submittedDate} tasks={submittedTasks} />}
    </section>
  );

  function updateCustomer(taskIndex: number, customerIndex: number, field: "name" | "contact" | "biz", value: string) {
    const next = [...tasks];
    next[taskIndex].customers[customerIndex] = { ...next[taskIndex].customers[customerIndex], [field]: value };
    setTasks(next);
  }
}

function SubmittedPlanTable({ planDate, tasks }: { planDate: string; tasks: DailyTask[] }) {
  return (
    <section className="crm-card overflow-hidden">
      <div className="border-b border-border/70 p-5 dark:border-white/10">
        <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Submitted Plan</h3>
        <p className="section-note mt-1">{planDate}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-bank text-xs uppercase text-white">
            <tr>
              <th className="px-4 py-3 font-bold">No.</th>
              <th className="px-4 py-3 font-bold">Time</th>
              <th className="px-4 py-3 font-bold">Activity</th>
              <th className="px-4 py-3 font-bold">Location</th>
              <th className="px-4 py-3 font-bold">Customers</th>
              <th className="px-4 py-3 font-bold">Customer Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10">
            {tasks.map((task, index) => (
              <tr key={`${task.start_time}-${task.end_time}-${index}`} className="bg-white/70 dark:bg-white/[0.03]">
                <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{index + 1}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  {task.start_time || "-"} - {task.end_time || "-"}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{task.activity || "-"}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{task.location || "-"}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{task.num_customers || "0"}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  {task.customers.length ? (
                    <div className="space-y-2">
                      {task.customers.map((customer, customerIndex) => (
                        <div key={`${customer.name}-${customerIndex}`} className="leading-5">
                          <span className="font-semibold text-slate-900 dark:text-white">{customer.name || `Customer ${customerIndex + 1}`}</span>
                          <span className="text-muted"> / {customer.contact || "No phone"} / {customer.biz || "No business"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; type?: string; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input-control" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
