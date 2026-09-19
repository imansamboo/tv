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
      <span className="text-sm font-medium text-white/85">
        {label}
        {hint ? (
          <span className="font-normal text-white/45"> ({hint})</span>
        ) : null}
      </span>
      {children}
      {error ? <span className="block text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-amber-400";

/** Uniform grid for option-button groups across all wizard steps. */
export const optionGridClass =
  "grid auto-rows-fr gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

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
        "flex min-h-[4.5rem] flex-col justify-center rounded-xl border p-3 text-right transition",
        selected
          ? "border-amber-400 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]"
          : "border-white/10 bg-white/5 hover:border-white/25",
      )}
    >
      <div className="text-sm font-semibold leading-snug">{title}</div>
      {subtitle ? (
        <div className="mt-0.5 text-xs leading-5 text-white/55">{subtitle}</div>
      ) : null}
      {meta ? <div className="mt-2 text-xs font-bold text-amber-300">{meta}</div> : null}
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
