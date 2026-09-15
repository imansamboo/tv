import { BRANDS, PANELS, SHIPMENTS, SIZES } from "@/lib/catalog";
import type { RequirementData } from "@/lib/form";
import { toman } from "@/lib/format";
import type { Quote } from "@/lib/pricing";

export function PriceBox({
  data,
  quote,
  compact = false,
}: {
  data: RequirementData;
  quote: Quote;
  compact?: boolean;
}) {
  const size = SIZES.find((item) => item.inches === data.sizeInches);
  const brand = BRANDS.find((item) => item.id === data.brand);
  const panel = PANELS.find((item) => item.id === data.panelType);
  const ship = SHIPMENTS.find((item) => item.id === data.shipmentType);

  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs tracking-wide text-amber-300">برآورد لحظه‌ای</p>
      <h3 className="mt-1 text-lg font-bold">جمع قابل پرداخت</h3>
      <p className="mt-3 text-3xl font-black text-amber-300">
        {quote.total ? toman(quote.total) : "—"}
      </p>
      {!compact && (
        <dl className="mt-4 space-y-2 text-sm text-white/70">
          <div className="flex justify-between gap-3">
            <dt>تلویزیون</dt>
            <dd>{quote.tvPrice ? toman(quote.tvPrice) : "انتخاب سایز"}</dd>
          </div>
          {quote.extras.map((line) => (
            <div key={line.key} className="flex justify-between gap-3">
              <dt>{line.label}</dt>
              <dd className="text-amber-200">{toman(line.amount)}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-4 space-y-1 text-xs text-white/45">
        <p>{size ? `${size.label} · ${size.hint}` : "سایز هنوز انتخاب نشده"}</p>
        <p>{brand ? `${brand.label}${panel ? ` / ${panel.label}` : ""}` : "برند انتخاب نشده"}</p>
        <p>{ship ? `ارسال: ${ship.label}` : "روش ارسال در مرحله آخر"}</p>
      </div>
    </aside>
  );
}
