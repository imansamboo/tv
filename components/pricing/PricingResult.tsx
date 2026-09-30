import { faDate, toman } from "@/lib/format";
import type { PricingQuoteView } from "@/lib/pricing-service";

/**
 * Read-only view of a submitted quote, built entirely from the stored snapshot
 * so it keeps showing the titles and prices that applied at submission time.
 */
export function PricingResult({ quote }: { quote: PricingQuoteView }) {
  const selected = quote.items.filter((item) => item.selected);
  const base = selected.filter((item) => item.kind === "BASE");
  const extras = selected.filter((item) => item.kind === "OPTIONAL");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-wide text-amber-300">امکانات انتخاب‌شده</p>
        <ul className="mt-3 space-y-2">
          {[...base, ...extras].map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-2xl bg-white/5 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  <span className="text-emerald-300">✓</span> {item.title}
                  {item.kind === "BASE" ? (
                    <span className="mr-2 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] font-bold text-emerald-200">
                      پایه
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-white/45">{item.sectionTitle}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-amber-300">
                {toman(item.price)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/70">
          <span>قیمت پایه</span>
          <span className="font-bold">{toman(quote.basePrice)}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-white/70">
          <span>امکانات انتخاب‌شده ({extras.length})</span>
          <span className="font-bold">{toman(quote.extrasPrice)}</span>
        </div>
        <div className="mt-4 border-t border-amber-400/20 pt-4">
          <p className="text-xs tracking-wide text-amber-300">قیمت نهایی</p>
          <p className="mt-1 text-3xl font-black text-amber-300">{toman(quote.totalPrice)}</p>
        </div>
      </div>

      <p className="text-xs text-white/40">
        زمان ثبت: {faDate(quote.submittedAt)} — قیمت‌های بالا همان قیمت‌های لحظه ثبت هستند و با
        تغییر تنظیمات تغییر نمی‌کنند.
      </p>
    </div>
  );
}
