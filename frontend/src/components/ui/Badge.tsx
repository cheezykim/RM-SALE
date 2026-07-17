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

export function StatusBadge({ status, outlined = true }: { status?: string; outlined?: boolean }) {
  const value = status || "Not interested / Need";
  const normalized = value.toLowerCase();
  const color =
    normalized === "study initiated"
      ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"
      : normalized === "not interested / need"
        ? "border-red-200/80 bg-red-50/90 text-red-800 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200"
        : normalized === "interested-need appointment"
          ? "border-blue-200/80 bg-blue-50/90 text-blue-800 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200"
          : "border-amber-200/80 bg-amber-50/90 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200";
  return (
    <span
      className={cn("inline-flex rounded-lg px-2.5 py-1 text-xs font-bold", outlined && "border shadow-sm", color)}
      title={value}
    >
      {shortStatusLabel(value)}
    </span>
  );
}

export function shortStatusLabel(status?: string) {
  switch ((status || "").trim().toLowerCase()) {
    case "not interested / need":
      return "Not Interested";
    case "open to more information":
      return "Open";
    case "interested-need appointment":
      return "Appointment";
    case "study initiated":
      return "Study";
    default:
      return status || "Not Interested";
  }
}
