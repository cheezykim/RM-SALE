import { cn } from "../../lib/utils";

export function LeadBadge({ level }: { level?: string }) {
  const label = normalizeLeadLevel(level);
  const title = label === "H" ? "High potential" : label === "M" ? "Medium potential" : "Low potential";
  const color =
    label === "H"
      ? "bg-red-50 text-red-700"
      : label === "M"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span className={cn("inline-flex min-w-8 items-center justify-center rounded-md px-2.5 py-1 text-xs font-extrabold", color)} title={title}>
      {label}
    </span>
  );
}

export function normalizeLeadLevel(level?: string) {
  const normalized = (level || "").trim().toLowerCase();
  if (normalized.includes("warm") || normalized === "m" || normalized.includes("medium")) return "M";
  if (normalized.includes("cold") || normalized === "l" || normalized.includes("low")) return "L";
  return "H";
}

export function StatusBadge({ status }: { status?: string }) {
  const value = status || "Interested";
  const normalized = value.toLowerCase();
  const color =
    normalized === "converted"
      ? "bg-emerald-100 text-emerald-800"
      : normalized === "lost"
        ? "bg-red-100 text-red-800"
        : ["follow up", "proposal sent", "document collection", "negotiation"].includes(normalized)
          ? "bg-blue-100 text-blue-800"
          : "bg-bank-soft text-bank-dark";
  return <span className={cn("inline-flex rounded-md px-2.5 py-1 text-xs font-bold", color)}>{value}</span>;
}
