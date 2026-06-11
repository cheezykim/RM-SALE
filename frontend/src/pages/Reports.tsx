import { Download } from "lucide-react";
import { Button } from "../components/ui/Button";
import type { PotentialCustomer, VisitCustomer } from "../types";

export function Reports({ visits, potentials }: { visits: VisitCustomer[]; potentials: PotentialCustomer[] }) {
  const reports = [
    ["Market Visit Report", visits],
    ["Potential Customer Report", potentials],
    ["Follow Up Report", potentials.filter((row) => row.Next_Follow_Up)],
    ["Conversion Report", potentials.filter((row) => row.Status?.toLowerCase() === "converted")]
  ] as const;

  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-extrabold">Reports</h2>
      <div className="crm-card divide-y divide-slate-100 p-5">
        {reports.map(([name, rows]) => (
          <div key={name} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-extrabold">{name}</p>
              <p className="text-sm text-muted">{rows.length.toLocaleString()} rows</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportCsv(rows as Array<Record<string, unknown>>, `${slug(name)}.csv`)}>
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => exportCsv(rows as Array<Record<string, unknown>>, `${slug(name)}.xls`)}>
                <Download className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function slug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "_");
}

function exportCsv(rows: Array<Record<string, unknown>>, filename: string) {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
