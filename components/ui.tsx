import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-white/85">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-white/45">{hint}</span> : null}
      {error ? <span className="block text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-amber-400";

export function OptionButton({
  selected,
  title,
  subtitle,
  meta,
  onClick,
}: {
  selected: boolean;
  title: string;
  subtitle?: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-full rounded-2xl border p-4 text-right transition",
        selected
          ? "border-amber-400 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]"
          : "border-white/10 bg-white/5 hover:border-white/25",
      )}
    >
      <div className="font-semibold">{title}</div>
      {subtitle ? (
        <div className="mt-1 text-sm leading-6 text-white/55">{subtitle}</div>
      ) : null}
      {meta ? <div className="mt-3 text-sm font-bold text-amber-300">{meta}</div> : null}
    </button>
  );
}

export function PrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50",
        props.className,
      )}
    >
      {children}
    </button>
  );
}
