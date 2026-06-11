import { Plus } from "lucide-react";
import { useState } from "react";
import type { DailyTask, User } from "../types";
import { todayISO } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { useSaveDailyPlan } from "../hooks/useCrmData";

export function DailyPlanning({ user, initialTasks }: { user: User; initialTasks: DailyTask[] }) {
  const [planDate, setPlanDate] = useState(todayISO());
  const [tasks, setTasks] = useState<DailyTask[]>(initialTasks);
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
  }

  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-extrabold">Daily Planning</h2>
      <div className="crm-card p-5">
        <label className="label">Plan Date</label>
        <input className="input-control max-w-xs" type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} />
      </div>
      {tasks.map((task, index) => (
        <div key={index} className="crm-card p-5">
          <h3 className="mb-4 text-lg font-extrabold">Activity {index + 1}</h3>
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
      {message && <p className="rounded-md bg-bank-soft px-4 py-3 text-sm font-bold text-bank-dark">{message}</p>}
    </section>
  );

  function updateCustomer(taskIndex: number, customerIndex: number, field: "name" | "contact" | "biz", value: string) {
    const next = [...tasks];
    next[taskIndex].customers[customerIndex] = { ...next[taskIndex].customers[customerIndex], [field]: value };
    setTasks(next);
  }
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input-control" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
