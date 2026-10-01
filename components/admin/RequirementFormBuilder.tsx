"use client";

import { useState, type ReactNode } from "react";
import { Field, fieldClass } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  FIELD_ROLES,
  FIELD_ROLE_LABELS,
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  OTHER_LABEL,
  allFields,
  generateKey,
  isChoiceField,
  type FieldRole,
  type FieldType,
  type FormField,
  type FormOption,
  type FormStep,
  type RequirementForm,
} from "@/lib/form";

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function takenKeys(form: RequirementForm) {
  return new Set(allFields(form).map((field) => field.key));
}

function newOption(field: FormField, label: string): FormOption {
  return { id: generateKey("o", new Set(field.options.map((o) => o.id))), label };
}

/** Drops settings that do not apply to the field's current type before saving. */
export function cleanForm(form: RequirementForm): RequirementForm {
  return {
    steps: form.steps.map((step) => ({
      ...step,
      fields: step.fields.map((field) => {
        const choice = isChoiceField(field);
        const text = field.type === "text" || field.type === "textarea";
        return {
          ...field,
          options: choice ? field.options : [],
          allowOther: choice && field.allowOther,
          otherLabel: choice && field.allowOther ? field.otherLabel : undefined,
          otherPlaceholder: choice && field.allowOther ? field.otherPlaceholder : undefined,
          defaultValue: field.type === "select" ? field.defaultValue || undefined : undefined,
          minLength: text ? field.minLength : undefined,
        };
      }),
    })),
  };
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2 py-1 text-xs transition disabled:opacity-30",
        danger
          ? "border-rose-400/30 text-rose-300 hover:bg-rose-400/10"
          : "border-white/15 text-white/70 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-white/80">
      <input
        type="checkbox"
        className="size-4 accent-amber-400"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

export function RequirementFormBuilder({
  form,
  onChange,
}: {
  form: RequirementForm;
  onChange: (form: RequirementForm) => void;
}) {
  const [openField, setOpenField] = useState<string | null>(null);

  function setSteps(steps: FormStep[]) {
    onChange({ ...form, steps });
  }
  function updateStep(index: number, patch: Partial<FormStep>) {
    setSteps(form.steps.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }
  function updateField(stepIndex: number, fieldIndex: number, patch: Partial<FormField>) {
    const step = form.steps[stepIndex];
    updateStep(stepIndex, {
      fields: step.fields.map((field, i) => (i === fieldIndex ? { ...field, ...patch } : field)),
    });
  }

  function addStep() {
    const id = generateKey("s", new Set(form.steps.map((step) => step.id)));
    const key = generateKey("f", takenKeys(form));
    setSteps([
      ...form.steps,
      {
        id,
        title: "مرحله جدید",
        fields: [blankField(key)],
      },
    ]);
    setOpenField(key);
  }

  function addField(stepIndex: number) {
    const key = generateKey("f", takenKeys(form));
    const step = form.steps[stepIndex];
    updateStep(stepIndex, { fields: [...step.fields, blankField(key)] });
    setOpenField(key);
  }

  function removeStep(index: number) {
    const step = form.steps[index];
    if (!confirm(`مرحله «${step.title}» و همه فیلدهای آن حذف شود؟`)) return;
    setSteps(form.steps.filter((_, i) => i !== index));
  }

  function removeField(stepIndex: number, fieldIndex: number) {
    const step = form.steps[stepIndex];
    const field = step.fields[fieldIndex];
    if (!confirm(`فیلد «${field.label}» حذف شود؟ پاسخ‌های پیش‌نویس این فیلد هم پاک می‌شود.`)) return;
    updateStep(stepIndex, { fields: step.fields.filter((_, i) => i !== fieldIndex) });
  }

  function moveField(stepIndex: number, fieldIndex: number, delta: number) {
    const fields = form.steps[stepIndex].fields;
    const target = fieldIndex + delta;
    if (target >= 0 && target < fields.length) {
      updateStep(stepIndex, { fields: move(fields, fieldIndex, delta) });
      return;
    }
    // Past the edge of a step: hand the field to the neighbouring step.
    const neighbour = stepIndex + delta;
    if (neighbour < 0 || neighbour >= form.steps.length) return;
    const field = fields[fieldIndex];
    setSteps(
      form.steps.map((step, i) => {
        if (i === stepIndex) return { ...step, fields: fields.filter((_, j) => j !== fieldIndex) };
        if (i === neighbour) {
          return { ...step, fields: delta < 0 ? [...step.fields, field] : [field, ...step.fields] };
        }
        return step;
      }),
    );
  }

  const usedRoles = new Map<FieldRole, string>();
  for (const field of allFields(form)) if (field.role) usedRoles.set(field.role, field.key);

  return (
    <div className="space-y-5">
      {form.steps.map((step, stepIndex) => (
        <section
          key={step.id}
          className="space-y-4 rounded-3xl border border-white/10 bg-[#101826]/80 p-5"
        >
          <div className="flex flex-wrap items-start gap-3">
            <span className="mt-8 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-black">
              مرحله {stepIndex + 1}
            </span>
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <Field label="عنوان مرحله">
                <input
                  className={fieldClass}
                  value={step.title}
                  onChange={(event) => updateStep(stepIndex, { title: event.target.value })}
                />
              </Field>
              <Field label="توضیح مرحله" hint="بالای عنوان نمایش داده می‌شود">
                <input
                  className={fieldClass}
                  value={step.description ?? ""}
                  onChange={(event) => updateStep(stepIndex, { description: event.target.value })}
                />
              </Field>
            </div>
            <div className="mt-8 flex gap-1">
              <IconButton
                label="انتقال مرحله به بالا"
                disabled={stepIndex === 0}
                onClick={() => setSteps(move(form.steps, stepIndex, -1))}
              >
                ↑
              </IconButton>
              <IconButton
                label="انتقال مرحله به پایین"
                disabled={stepIndex === form.steps.length - 1}
                onClick={() => setSteps(move(form.steps, stepIndex, 1))}
              >
                ↓
              </IconButton>
              <IconButton
                label="حذف مرحله"
                danger
                disabled={form.steps.length === 1}
                onClick={() => removeStep(stepIndex)}
              >
                حذف مرحله
              </IconButton>
            </div>
          </div>

          <ul className="space-y-2">
            {step.fields.map((field, fieldIndex) => {
              const open = openField === field.key;
              const first = stepIndex === 0 && fieldIndex === 0;
              const last =
                stepIndex === form.steps.length - 1 && fieldIndex === step.fields.length - 1;
              return (
                <li key={field.key} className="rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="flex flex-wrap items-center gap-2 p-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-right"
                      onClick={() => setOpenField(open ? null : field.key)}
                    >
                      <span className="font-medium">
                        {field.label || "بدون عنوان"}
                        {field.required ? <span className="text-amber-300"> *</span> : null}
                      </span>
                      <span className="mr-2 text-xs text-white/45">
                        {FIELD_TYPE_LABELS[field.type]}
                        {isChoiceField(field) ? ` · ${field.options.length} گزینه` : ""}
                        {field.allowOther && isChoiceField(field) ? " + سایر" : ""}
                        {field.role ? ` · ${FIELD_ROLE_LABELS[field.role]}` : ""}
                      </span>
                    </button>
                    <div className="flex gap-1">
                      <IconButton
                        label="انتقال فیلد به بالا"
                        disabled={first}
                        onClick={() => moveField(stepIndex, fieldIndex, -1)}
                      >
                        ↑
                      </IconButton>
                      <IconButton
                        label="انتقال فیلد به پایین"
                        disabled={last}
                        onClick={() => moveField(stepIndex, fieldIndex, 1)}
                      >
                        ↓
                      </IconButton>
                      <IconButton
                        label={open ? "بستن" : "ویرایش فیلد"}
                        onClick={() => setOpenField(open ? null : field.key)}
                      >
                        {open ? "بستن" : "ویرایش"}
                      </IconButton>
                      <IconButton
                        label="حذف فیلد"
                        danger
                        onClick={() => removeField(stepIndex, fieldIndex)}
                      >
                        حذف
                      </IconButton>
                    </div>
                  </div>
                  {open && (
                    <FieldEditor
                      field={field}
                      roleTakenBy={usedRoles}
                      onChange={(patch) => updateField(stepIndex, fieldIndex, patch)}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => addField(stepIndex)}
            className="w-full rounded-2xl border border-dashed border-white/20 py-3 text-sm text-white/70 hover:border-amber-400 hover:text-amber-300"
          >
            + افزودن فیلد به این مرحله
          </button>
        </section>
      ))}

      <button
        type="button"
        onClick={addStep}
        className="w-full rounded-3xl border border-dashed border-amber-400/40 py-4 text-sm font-bold text-amber-300 hover:bg-amber-400/10"
      >
        + افزودن مرحله جدید
      </button>
      <p className="text-xs text-white/40">
        مرحله «بازبینی» به‌صورت خودکار بعد از آخرین مرحله به کاربر نمایش داده می‌شود.
      </p>
    </div>
  );
}

function blankField(key: string): FormField {
  return {
    key,
    type: "text",
    label: "فیلد جدید",
    required: false,
    options: [],
    allowOther: false,
    countAsFeature: false,
    showInSummary: false,
  };
}

function FieldEditor({
  field,
  roleTakenBy,
  onChange,
}: {
  field: FormField;
  roleTakenBy: Map<FieldRole, string>;
  onChange: (patch: Partial<FormField>) => void;
}) {
  const choice = isChoiceField(field);
  const text = field.type === "text" || field.type === "textarea";

  function changeType(type: FieldType) {
    const patch: Partial<FormField> = { type };
    if (isChoiceField({ type }) && field.options.length === 0) {
      const first = newOption(field, "گزینه ۱");
      patch.options = [first, { id: generateKey("o", new Set([first.id])), label: "گزینه ۲" }];
    }
    onChange(patch);
  }

  function setOptions(options: FormOption[]) {
    const patch: Partial<FormField> = { options };
    if (field.defaultValue && !options.some((option) => option.id === field.defaultValue)) {
      patch.defaultValue = undefined;
    }
    onChange(patch);
  }

  return (
    <div className="space-y-4 border-t border-white/10 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="عنوان فیلد">
          <input
            className={fieldClass}
            value={field.label}
            onChange={(event) => onChange({ label: event.target.value })}
          />
        </Field>
        <Field label="نوع فیلد">
          <select
            className={fieldClass}
            value={field.type}
            onChange={(event) => changeType(event.target.value as FieldType)}
          >
            {FIELD_TYPES.map((type) => (
              <option key={type} value={type}>
                {FIELD_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="راهنما" hint="داخل پرانتز کنار عنوان">
          <input
            className={fieldClass}
            value={field.hint ?? ""}
            onChange={(event) => onChange({ hint: event.target.value })}
          />
        </Field>
        {field.type !== "single" && field.type !== "multi" && (
          <Field
            label={field.type === "select" ? "متن گزینه خالی" : "متن نمونه (placeholder)"}
            hint={field.type === "select" ? "وقتی پیش‌فرض ندارد" : undefined}
          >
            <input
              className={fieldClass}
              value={field.placeholder ?? ""}
              onChange={(event) => onChange({ placeholder: event.target.value })}
            />
          </Field>
        )}
        <Field label="عنوان کوتاه" hint="در خلاصه، بازبینی و پیام خطا">
          <input
            className={fieldClass}
            value={field.summaryLabel ?? ""}
            onChange={(event) => onChange({ summaryLabel: event.target.value })}
          />
        </Field>
        <Field label="نقش فیلد" hint="برای نمایش در لیست‌های مدیریت">
          <select
            className={fieldClass}
            value={field.role ?? ""}
            onChange={(event) =>
              onChange({ role: (event.target.value || undefined) as FieldRole | undefined })
            }
          >
            <option value="">بدون نقش</option>
            {FIELD_ROLES.map((role) => {
              const owner = roleTakenBy.get(role);
              return (
                <option key={role} value={role} disabled={Boolean(owner) && owner !== field.key}>
                  {FIELD_ROLE_LABELS[role]}
                  {owner && owner !== field.key ? " (به فیلد دیگری داده شده)" : ""}
                </option>
              );
            })}
          </select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Check label="اجباری" checked={field.required} onChange={(required) => onChange({ required })} />
        <Check
          label="نمایش در خلاصه کنار فرم"
          checked={field.showInSummary}
          onChange={(showInSummary) => onChange({ showInSummary })}
        />
        {choice && (
          <Check
            label="شمارش در «امکانات انتخاب‌شده»"
            checked={field.countAsFeature}
            onChange={(countAsFeature) => onChange({ countAsFeature })}
          />
        )}
      </div>

      {field.required && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="پیام خطای اجباری" hint="خالی = پیام پیش‌فرض">
            <input
              className={fieldClass}
              value={field.requiredMessage ?? ""}
              onChange={(event) => onChange({ requiredMessage: event.target.value })}
            />
          </Field>
          {text && (
            <Field label="حداقل تعداد کاراکتر">
              <input
                className={fieldClass}
                type="number"
                min={1}
                max={1000}
                value={field.minLength ?? ""}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  onChange({ minLength: value >= 1 ? Math.min(1000, Math.floor(value)) : undefined });
                }}
              />
            </Field>
          )}
        </div>
      )}

      {choice && (
        <OptionsEditor field={field} onOptions={setOptions} onChange={onChange} />
      )}

      <p className="text-xs text-white/35" dir="ltr">
        key: {field.key}
      </p>
    </div>
  );
}

function OptionsEditor({
  field,
  onOptions,
  onChange,
}: {
  field: FormField;
  onOptions: (options: FormOption[]) => void;
  onChange: (patch: Partial<FormField>) => void;
}) {
  function updateOption(index: number, patch: Partial<FormOption>) {
    onOptions(field.options.map((option, i) => (i === index ? { ...option, ...patch } : option)));
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 p-4">
      <p className="text-sm font-medium text-white/85">گزینه‌ها</p>
      <ul className="space-y-2">
        {field.options.map((option, index) => (
          <li key={option.id} className="flex flex-wrap items-center gap-2">
            <input
              className={cn(fieldClass, "min-w-40 flex-1")}
              value={option.label}
              placeholder="عنوان گزینه"
              onChange={(event) => updateOption(index, { label: event.target.value })}
            />
            {field.type !== "select" && (
              <input
                className={cn(fieldClass, "min-w-40 flex-1")}
                value={option.hint ?? ""}
                placeholder="توضیح زیر گزینه (اختیاری)"
                onChange={(event) => updateOption(index, { hint: event.target.value })}
              />
            )}
            <div className="flex gap-1">
              <IconButton
                label="انتقال گزینه به بالا"
                disabled={index === 0}
                onClick={() => onOptions(move(field.options, index, -1))}
              >
                ↑
              </IconButton>
              <IconButton
                label="انتقال گزینه به پایین"
                disabled={index === field.options.length - 1}
                onClick={() => onOptions(move(field.options, index, 1))}
              >
                ↓
              </IconButton>
              <IconButton
                label="حذف گزینه"
                danger
                onClick={() => onOptions(field.options.filter((_, i) => i !== index))}
              >
                حذف
              </IconButton>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() =>
          onOptions([...field.options, newOption(field, `گزینه ${field.options.length + 1}`)])
        }
        className="rounded-xl border border-dashed border-white/20 px-4 py-2 text-xs text-white/70 hover:border-amber-400 hover:text-amber-300"
      >
        + افزودن گزینه
      </button>

      {field.type === "select" && (
        <Field label="گزینه پیش‌فرض">
          <select
            className={fieldClass}
            value={field.defaultValue ?? ""}
            onChange={(event) => onChange({ defaultValue: event.target.value || undefined })}
          >
            <option value="">بدون پیش‌فرض</option>
            {field.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Check
        label={`گزینه «${OTHER_LABEL}» با کادر توضیح`}
        checked={field.allowOther}
        onChange={(allowOther) => onChange({ allowOther })}
      />
      {field.allowOther && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="عنوان گزینه سایر" hint={`خالی = «${OTHER_LABEL}»`}>
            <input
              className={fieldClass}
              value={field.otherLabel ?? ""}
              onChange={(event) => onChange({ otherLabel: event.target.value })}
            />
          </Field>
          <Field label="متن نمونه کادر سایر">
            <input
              className={fieldClass}
              value={field.otherPlaceholder ?? ""}
              onChange={(event) => onChange({ otherPlaceholder: event.target.value })}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
