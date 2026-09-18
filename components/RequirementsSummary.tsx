import { BUSINESS_TYPES, EXISTING_WEBSITE, labelWithOther } from "@/lib/catalog";
import type { RequirementData } from "@/lib/form";
import type { RequirementSummary } from "@/lib/summary";

function SummaryField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs tracking-wide text-amber-300">{label}</p>
      <div className="mt-1 text-sm text-white/70">{children}</div>
    </div>
  );
}

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
      <div className="mt-4 space-y-4">
        <SummaryField label="پیشرفت فرم">
          <span className="text-3xl font-black text-amber-300">{summary.completionPercent}%</span>
        </SummaryField>
        {!compact && (
          <>
            <SummaryField label="امکانات انتخاب‌شده">{summary.featureCount}</SummaryField>
            <SummaryField label="نوع فعالیت">
              {labelWithOther(data.businessType, BUSINESS_TYPES, data.businessTypeOther) || "—"}
            </SummaryField>
          </>
        )}
        {summary.highlights.length === 0 ? (
          <SummaryField label="وضعیت">
            با پر کردن مراحل، خلاصه نیازمندی‌های سایت اینجا نمایش داده می‌شود.
          </SummaryField>
        ) : (
          summary.highlights.map((item) => (
            <SummaryField key={item.label} label={item.label}>
              {item.value}
            </SummaryField>
          ))
        )}
        {data.existingWebsite && (
          <SummaryField label="وب‌سایت فعلی">
            {labelWithOther(
              data.existingWebsite,
              EXISTING_WEBSITE,
              data.existingWebsiteOther,
            )}
          </SummaryField>
        )}
      </div>
    </aside>
  );
}
