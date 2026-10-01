import {
  allFields,
  fieldTitle,
  formatAnswer,
  type RequirementData,
  type RequirementForm,
} from "@/lib/form";

function Info({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 whitespace-pre-line font-medium">{value}</p>
    </div>
  );
}

export function ReviewPanel({
  form,
  data,
  completionPercent,
}: {
  form: RequirementForm;
  data: RequirementData;
  completionPercent?: number;
}) {
  const fields = allFields(form);
  const short = fields.filter((field) => field.type !== "textarea");
  const long = fields.filter((field) => field.type === "textarea");
  return (
    <div className="space-y-4 text-sm leading-7">
      <div className="grid gap-3 sm:grid-cols-2">
        {short.map((field) => (
          <Info key={field.key} label={fieldTitle(field)} value={formatAnswer(field, data)} />
        ))}
        {completionPercent !== undefined && <Info label="پیشرفت" value={`${completionPercent}%`} />}
      </div>
      {long.map((field) => (
        <Info key={field.key} label={fieldTitle(field)} value={formatAnswer(field, data)} />
      ))}
    </div>
  );
}
