import type { ColumnDef } from "@tanstack/react-table";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import { CustomerDrawer } from "../components/CustomerDrawer";
import { LeadBadge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import type { PotentialCustomer } from "../types";

const columnsList = ["Name", "Tel", "Business", "Purpose", "Amount", "Interest", "Loan_Type", "Status", "Potential_Level", "Next_Follow_Up", "Date_Added"];

export function PotentialCustomers({
  potentials,
  onSave
}: {
  potentials: PotentialCustomer[];
  onSave: (customer: PotentialCustomer, updates: Record<string, unknown>) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [level, setLevel] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [selected, setSelected] = useState<PotentialCustomer | null>(null);

  const filtered = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    return potentials.filter((row) => {
      if (status !== "All" && row.Status !== status) return false;
      if (level !== "All" && row.Potential_Level !== level) return false;
      const added = row.Date_Added ? new Date(row.Date_Added) : null;
      if (dateFilter === "Today" && row.Date_Added !== today.toISOString().slice(0, 10)) return false;
      if (dateFilter === "Last 7 Days" && (!added || added < sevenDaysAgo)) return false;
      if (dateFilter === "This Month" && (!added || added.getMonth() !== today.getMonth() || added.getFullYear() !== today.getFullYear())) return false;
      if (query) return Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase());
      return true;
    });
  }, [potentials, query, status, level, dateFilter]);

  const columns: ColumnDef<PotentialCustomer>[] = [
    { accessorKey: "Name", header: "Customer Name" },
    { accessorKey: "Tel", header: "Phone" },
    { accessorKey: "Business", header: "Business" },
    { accessorKey: "Purpose", header: "Purpose" },
    { accessorKey: "Amount", header: "Amount" },
    { accessorKey: "Interest", header: "Interest" },
    { accessorKey: "Loan_Type", header: "Loan Type" },
    { accessorKey: "Status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.Status} /> },
    { accessorKey: "Potential_Level", header: "Potential Level", cell: ({ row }) => <LeadBadge level={row.original.Potential_Level} /> },
    { accessorKey: "Next_Follow_Up", header: "Next Follow Up" },
    { accessorKey: "Date_Added", header: "Date Added" },
    {
      id: "Action",
      header: "Action",
      cell: ({ row }) => (
        <Button
          variant="outline"
          className="h-8"
          onClick={(event) => {
            event.stopPropagation();
            setSelected(row.original);
          }}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold">My Potential Customers</h2>
        <p className="mt-1 text-sm text-muted">List of customers you have marked as potential.</p>
      </div>
      <div className="crm-card p-4">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input className="input-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer..." />
            </div>
          </div>
          <Select label="Status" value={status} options={["All", ...Array.from(new Set(potentials.map((row) => row.Status).filter(Boolean)))]} onChange={setStatus} />
          <Select label="Potential Level" value={level} options={["All", "Hot", "Warm", "Cold"]} onChange={setLevel} />
          <Select label="Date Added" value={dateFilter} options={["All", "Today", "Last 7 Days", "This Month"]} onChange={setDateFilter} />
          <div className="flex items-end">
            <Button variant="outline" onClick={() => exportCsv(filtered, "potential_customers.csv")}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>
      <div className="rounded-md bg-bank-soft px-4 py-3 text-sm font-bold text-bank-dark">Showing {filtered.length.toLocaleString()} potential customers</div>
      <DataTable data={filtered} columns={columns} search={query} onRowClick={setSelected} />
      <CustomerDrawer
        customer={selected}
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

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input-control" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

function exportCsv(rows: PotentialCustomer[], filename: string) {
  const csv = [columnsList.join(","), ...rows.map((row) => columnsList.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
