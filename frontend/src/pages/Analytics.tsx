import type { PotentialCustomer, VisitCustomer } from "../types";
import { money } from "../lib/utils";

export function Analytics({ visits, potentials }: { visits: VisitCustomer[]; potentials: PotentialCustomer[] }) {
  const converted = potentials.filter((row) => row.Status?.toLowerCase() === "converted").length;
  const followUps = potentials.filter((row) => ["follow up", "proposal sent", "document collection", "negotiation", "converted"].includes(row.Status?.toLowerCase())).length;
  const expected = potentials.reduce((sum, row) => sum + parseAmount(row.Amount), 0);
  const conversion = potentials.length ? ((converted / potentials.length) * 100).toFixed(1) : "0.0";
  const sources = topCounts(visits, "Source_Channel");
  const businesses = topCounts(visits, "Business");

  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-extrabold">Performance Analytics</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total Visits", visits.length.toLocaleString()],
          ["Potential Customers", potentials.length.toLocaleString()],
          ["Follow Ups Completed", followUps.toLocaleString()],
          ["Converted Customers", converted.toLocaleString()],
          ["Conversion Rate", `${conversion}%`]
        ].map(([label, value]) => (
          <div key={label} className="crm-card p-5">
            <p className="text-xs font-bold text-muted">{label}</p>
            <p className="mt-2 text-2xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-md bg-bank-soft px-4 py-3 text-sm font-bold text-bank-dark">Expected Loan Amount: {money(expected)}</div>
      <div className="grid gap-5 xl:grid-cols-2">
        <BarList title="Top Source Channels" rows={sources} />
        <BarList title="Top Business Sectors" rows={businesses} />
      </div>
    </section>
  );
}

function BarList({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  const max = Math.max(...rows.map(([, count]) => count), 1);
  return (
    <div className="crm-card p-5">
      <h3 className="mb-4 text-lg font-extrabold">{title}</h3>
      <div className="space-y-3">
        {rows.map(([label, count]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-xs font-bold">
              <span>{label}</span>
              <span>{count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-bank" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function topCounts(rows: VisitCustomer[], key: string): Array<[string, number]> {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const value = String(row[key] || "").trim();
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function parseAmount(value: string) {
  const raw = String(value || "").toUpperCase().replace("$", "").replace(",", "").replace("USD", "").trim();
  if (!raw) return 0;
  if (raw.endsWith("K")) return Number(raw.slice(0, -1)) * 1000 || 0;
  if (raw.endsWith("M")) return Number(raw.slice(0, -1)) * 1000000 || 0;
  return Number(raw) || 0;
}
