import { Building2, CalendarDays, CheckCircle2, ClipboardList, Clock3, ListTodo, MapPin, Plus, Send, Trash2, Users } from "lucide-react";
import { useState } from "react";
import type { DailyTask, User } from "../types";
import { todayISO } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { useSaveDailyPlan } from "../hooks/useCrmData";

const activityStyles = [
  {
    row: "border-emerald-100 bg-emerald-50/60 dark:border-emerald-400/10 dark:bg-emerald-500/5",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
  },
  {
    row: "border-sky-100 bg-sky-50/60 dark:border-sky-400/10 dark:bg-sky-500/5",
    icon: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200",
  },
  {
    row: "border-violet-100 bg-violet-50/60 dark:border-violet-400/10 dark:bg-violet-500/5",
    icon: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200",
  },
  {
    row: "border-amber-100 bg-amber-50/60 dark:border-amber-400/10 dark:bg-amber-500/5",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
  },
  {
    row: "border-teal-100 bg-teal-50/60 dark:border-teal-400/10 dark:bg-teal-500/5",
    icon: "bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-200"
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

  function removeTask(index: number) {
    setTasks((current) => current.filter((_, i) => i !== index));
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
              <h2 className="page-title">Daily Planning</h2>
            </div>
          </div>
          <HeaderCalendarArt />
        </div>
      </div>

      <div className="crm-card p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,320px)_1fr] lg:items-end">
          <div>
            <label className="label">Plan Date</label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="input-control pr-10" type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <WorkflowChip icon={CalendarDays} label="Select date" />
            <WorkflowChip icon={Clock3} label="Plan activities" />
            <WorkflowChip icon={CheckCircle2} label="Submit plan" />
          </div>
        </div>
      </div>

      <div className="crm-card overflow-hidden">
        <div className="grid gap-2 border-b border-border/70 bg-slate-50/70 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03] lg:grid-cols-[72px_210px_1fr_1fr_170px_44px]">
          <div className="hidden text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 lg:block">Type</div>
          <div className="hidden items-center gap-2 text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 lg:flex">
            <Clock3 className="h-4 w-4" />
            Time
          </div>
          <div className="hidden items-center gap-2 text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 lg:flex">
            <ClipboardList className="h-4 w-4" />
            Activity
          </div>
          <div className="hidden items-center gap-2 text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 lg:flex">
            <MapPin className="h-4 w-4" />
            Location
          </div>
          <div className="hidden items-center gap-2 text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 lg:flex">
            <Users className="h-4 w-4" />
            Customers
          </div>
          <div className="hidden text-center text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 lg:block">Remove</div>
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white lg:hidden">
            <ClipboardList className="h-5 w-5 text-bank dark:text-emerald-300" />
            Activity Schedule
          </div>
        </div>
        <div className="space-y-3 p-4">
          {tasks.map((task, index) => {
            const style = activityStyles[index % activityStyles.length];
            return (
              <div key={index} className={`rounded-2xl border p-4 shadow-sm ${style.row}`}>
                <div className="grid gap-4 lg:grid-cols-[52px_210px_1fr_1fr_170px_44px] lg:items-end">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${style.icon}`}>
                    <ListTodo className="h-6 w-6" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start" value={task.start_time} type="time" onChange={(value) => updateTask(index, { start_time: value })} />
                    <Field label="End" value={task.end_time} type="time" onChange={(value) => updateTask(index, { end_time: value })} />
                  </div>

                  <Field label="Activity" value={task.activity} placeholder="e.g. Market Visit" onChange={(value) => updateTask(index, { activity: value })} />
                  <Field label="Location" value={task.location} placeholder="e.g. Phnom Penh" onChange={(value) => updateTask(index, { location: value })} />
                  <Field label="Customers" value={task.num_customers} placeholder="e.g. 5" onChange={(value) => syncCustomers(index, value)} />
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-red-200 bg-white/80 text-red-600 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:border-red-400/20 dark:bg-slate-950/40 dark:text-red-300 dark:hover:bg-red-500/10 lg:w-11"
                    onClick={() => removeTask(index)}
                    aria-label={`Remove activity ${index + 1}`}
                    title="Remove activity"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-2 text-sm font-bold lg:hidden">Remove Activity</span>
                  </button>
                </div>

                {task.customers.length > 0 && (
                  <div className="mt-4 rounded-xl border border-white/80 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/40">
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
        <Button onClick={submit} disabled={savePlan.isPending}>
          <Send className="h-4 w-4" />
          {savePlan.isPending ? "Submitting..." : "Submit Daily Plan"}
        </Button>
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

function HeaderCalendarArt() {
  return (
    <div className="relative hidden h-24 w-64 shrink-0 overflow-hidden rounded-l-full bg-emerald-50/90 md:block dark:bg-emerald-500/10" aria-hidden="true">
      <div className="absolute right-7 top-4 h-16 w-24 rotate-3 rounded-xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-400/20 dark:bg-slate-900">
        <div className="flex h-5 items-center gap-2 rounded-t-xl bg-emerald-500 px-3">
          <span className="h-2 w-2 rounded-full bg-white/90" />
          <span className="h-2 w-2 rounded-full bg-white/90" />
          <span className="h-2 w-2 rounded-full bg-white/90" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <span key={index} className="flex h-4 items-center justify-center rounded bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10">
              <CheckCircle2 className="h-3 w-3" />
            </span>
          ))}
        </div>
      </div>
      <div className="absolute bottom-3 right-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-emerald-100 text-bank shadow-sm dark:border-slate-950 dark:bg-emerald-500/20 dark:text-emerald-200">
        <CalendarDays className="h-7 w-7" />
      </div>
      <div className="absolute bottom-2 left-11 h-12 w-20 rounded-t-full bg-emerald-100/80 dark:bg-emerald-500/10" />
      <div className="absolute bottom-2 left-4 h-8 w-14 rounded-t-full bg-emerald-200/60 dark:bg-emerald-400/10" />
    </div>
  );
}

function WorkflowChip({ icon: Icon, label }: { icon: typeof CalendarDays; label: string }) {
  return (
    <div className="flex h-11 items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 text-sm font-bold text-bank-dark dark:border-emerald-400/10 dark:bg-emerald-500/10 dark:text-emerald-100">
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
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
