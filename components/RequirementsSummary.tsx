import {
  BRANDS,
  BUSINESS_TYPES,
  DESIGN_STYLES,
  EXISTING_WEBSITE,
  labelOf,
  labelsFor,
} from "@/lib/catalog";
import type { RequirementData } from "@/lib/form";
import type { RequirementSummary } from "@/lib/summary";

export function RequirementsSummary({
  data,
  summary,
  compact = false,
}: {
  data: RequirementData;
  summary: RequirementSummary;
  compact?: boolean;
}) {
  return (
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs tracking-wide text-amber-300">خلاصه نیازمندی‌ها</p>
      <h3 className="mt-1 text-lg font-bold">پیشرفت فرم</h3>
      <p className="mt-3 text-3xl font-black text-amber-300">{summary.completionPercent}%</p>
      {!compact && (
        <dl className="mt-4 space-y-2 text-sm text-white/70">
          <div className="flex justify-between gap-3">
            <dt>امکانات انتخاب‌شده</dt>
            <dd>{summary.featureCount}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>فروشگاه</dt>
            <dd>{data.storeName || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>نوع فعالیت</dt>
            <dd>{labelOf(data.businessType, BUSINESS_TYPES)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>برندها</dt>
            <dd>{data.brandsToSell.length ? labelsFor(data.brandsToSell, BRANDS).length : 0}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>سبک طراحی</dt>
            <dd>{labelOf(data.designStyle, DESIGN_STYLES)}</dd>
          </div>
        </dl>
      )}
      <div className="mt-4 space-y-1 text-xs text-white/45">
        {summary.highlights.length === 0 ? (
          <p>با پر کردن مراحل، خلاصه نیازمندی‌های سایت اینجا نمایش داده می‌شود.</p>
        ) : (
          summary.highlights.map((item) => <p key={item}>• {item}</p>)
        )}
        {data.existingWebsite && (
          <p className="pt-2">{labelOf(data.existingWebsite, EXISTING_WEBSITE)}</p>
        )}
      </div>
    </aside>
  );
}
