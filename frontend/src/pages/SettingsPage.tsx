import type { User } from "../types";

export function SettingsPage({ user }: { user: User }) {
  const isManager = ["manager", "admin", "management", "head", "supervisor"].includes(user.role.toLowerCase());
  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-extrabold">Settings</h2>
      <div className="crm-card max-w-2xl p-5">
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <Info label="User" value={user.username} />
          <Info label="Role" value={user.role} />
          <Info label="Branch" value={user.branch || "-"} />
          <Info label="Access" value={isManager ? "All team customers" : "Own potential customers and follow ups only"} />
          <Info label="Potential worksheet" value="potential_customers" />
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="mt-1 font-extrabold">{value}</p>
    </div>
  );
}
