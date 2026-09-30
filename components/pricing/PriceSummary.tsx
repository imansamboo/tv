import { toman } from "@/lib/format";
import type { PricingLine, PricingTotals } from "@/lib/pricing";

/**
 * Running total for the pricing form. Kept in the same sticky sidebar slot the
 * requirements wizard uses, so the current price is always on screen.
 */
export function PriceSummary({
  baseLine,
  extraLines,
  totals,
}: {
  baseLine: PricingLine | null;
  extraLines: PricingLine[];
  totals: PricingTotals;
}) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs tracking-wide text-amber-300">برآورد قیمت</p>

      <div className="mt-4 space-y-1">
        <p className="text-xs text-white/45">قیمت پایه</p>
        <p className="text-sm font-medium">
          {baseLine ? toman(baseLine.price) : "—"}
        </p>
        {baseLine ? <p className="text-xs text-white/45">{baseLine.title}</p> : null}
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-xs text-white/45">
          امکانات انتخاب‌شده {extraLines.length > 0 ? `(${extraLines.length})` : ""}
        </p>
        {extraLines.length === 0 ? (
          <p className="text-xs leading-6 text-white/45">
            هنوز امکانات اضافه‌ای انتخاب نکرده‌اید. با تیک زدن هر مورد، قیمت آن به مجموع اضافه
            می‌شود.
          </p>
        ) : (
          <ul className="space-y-2">
            {extraLines.map((line) => (
              <li key={line.itemId} className="flex items-start justify-between gap-2 text-sm">
                <span className="min-w-0 text-white/75">
                  <span className="text-emerald-300">✓</span> {line.title}
                </span>
                <span className="shrink-0 text-xs font-bold text-amber-300">
                  {toman(line.price)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-xs tracking-wide text-amber-300">قیمت نهایی</p>
        <p className="mt-1 text-2xl font-black text-amber-300">{toman(totals.totalPrice)}</p>
        {totals.extrasPrice > 0 ? (
          <p className="mt-1 text-xs text-white/45">
            پایه {toman(totals.basePrice)} + امکانات {toman(totals.extrasPrice)}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
