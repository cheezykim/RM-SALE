import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-bank text-white shadow-sm hover:bg-bank-dark hover:shadow-lift dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10",
    outline: "border border-border bg-white/75 text-slate-800 shadow-sm backdrop-blur hover:border-bank/30 hover:bg-bank-mist dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-emerald-400/30 dark:hover:bg-white/10",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700"
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
