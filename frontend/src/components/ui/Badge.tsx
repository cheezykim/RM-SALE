import { cn } from "../../lib/utils";

export function LeadBadge({ level }: { level?: string }) {
  const label = normalizeLeadLevel(level);
  const title = label === "H" ? "High potential" : label === "M" ? "Medium potential" : "Low potential";
  const color =
    label === "H"
      ? "border-red-200/80 bg-red-50/90 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200"
      : label === "M"
        ? "border-amber-200/80 bg-amber-50/90 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200"
        : "border-slate-200/80 bg-slate-100/90 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300";

  return (
    <span className={cn("inline-flex min-w-8 items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-extrabold shadow-sm", color)} title={title}>
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
      ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"
      : normalized === "lost"
        ? "border-red-200/80 bg-red-50/90 text-red-800 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200"
        : ["follow up", "proposal sent", "document collection", "negotiation"].includes(normalized)
          ? "border-blue-200/80 bg-blue-50/90 text-blue-800 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200"
          : "border-bank/20 bg-bank-soft/90 text-bank-dark dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200";
  return <span className={cn("inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold shadow-sm", color)}>{value}</span>;
}
