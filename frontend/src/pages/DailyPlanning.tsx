import { Plus } from "lucide-react";
import { useState } from "react";
import type { DailyTask, User } from "../types";
import { todayISO } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { useSaveDailyPlan } from "../hooks/useCrmData";

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
      <div>
        <h2 className="page-title">Daily Planning</h2>
        <p className="section-note">Plan customer coverage, market activity, and relationship manager execution.</p>
      </div>
      <div className="crm-card p-5">
        <label className="label">Plan Date</label>
        <input className="input-control max-w-xs" type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} />
      </div>
      {tasks.map((task, index) => (
        <div key={index} className="crm-card p-5">
          <h3 className="mb-4 text-lg font-extrabold text-slate-950 dark:text-white">Activity {index + 1}</h3>
          <div className="grid gap-4 md:grid-cols-5">
            <Field label="Start" value={task.start_time} type="time" onChange={(value) => updateTask(index, { start_time: value })} />
            <Field label="End" value={task.end_time} type="time" onChange={(value) => updateTask(index, { end_time: value })} />
            <Field label="Activity" value={task.activity} onChange={(value) => updateTask(index, { activity: value })} />
            <Field label="Location" value={task.location} onChange={(value) => updateTask(index, { location: value })} />
            <Field label="Customers" value={task.num_customers} onChange={(value) => syncCustomers(index, value)} />
          </div>
          {task.customers.length > 0 && (
            <div className="mt-5 space-y-3">
              {task.customers.map((customer, customerIndex) => (
                <div key={customerIndex} className="grid gap-3 md:grid-cols-3">
                  <Field label="Customer Name" value={customer.name} onChange={(value) => updateCustomer(index, customerIndex, "name", value)} />
                  <Field label="Phone" value={customer.contact} onChange={(value) => updateCustomer(index, customerIndex, "contact", value)} />
                  <Field label="Business" value={customer.biz} onChange={(value) => updateCustomer(index, customerIndex, "biz", value)} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-3">
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

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input-control" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
