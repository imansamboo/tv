import { z } from "zod";

/**
 * A requirements form is data, not code: each business owns one, built by the
 * admin as steps → fields → options. Answers are stored keyed by `field.key`,
 * so keys must never change once customers have started answering.
 */

export const FIELD_TYPES = ["text", "textarea", "select", "single", "multi"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "متن کوتاه",
  textarea: "متن بلند",
  select: "لیست کشویی (تک‌انتخابی)",
  single: "دکمه‌های تک‌انتخابی",
  multi: "دکمه‌های چندانتخابی (مولتی سلکت)",
};

/** Lets admin lists show who a requirement belongs to without knowing the form. */
export const FIELD_ROLES = ["contactName", "storeName", "city"] as const;
export type FieldRole = (typeof FIELD_ROLES)[number];

export const FIELD_ROLE_LABELS: Record<FieldRole, string> = {
  contactName: "نام رابط",
  storeName: "نام کسب‌وکار / فروشگاه",
  city: "شهر",
};

export const OTHER_ID = "other";
export const OTHER_LABEL = "سایر";
export const OTHER_HINT = "گزینه دلخواه خود را در کادر زیر بنویسید";

export const OPTIONAL_DESCRIPTION_HINT =
  "اختیاری — فقط توضیح تکمیلی است و جایگزین انتخاب گزینه نمی‌شود.";
export const MULTI_SELECT_HINT = "می‌توانید چند گزینه انتخاب کنید.";
export const SINGLE_SELECT_HINT = "یک گزینه را انتخاب کنید.";

export const REVIEW_STEP = { title: "بازبینی", description: "تأیید نهایی نیازمندی‌ها" } as const;

const MAX_TEXT = 5000;
const KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional();

export const formOptionSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "شناسه گزینه خالی است.")
    .max(64)
    .refine((id) => id !== OTHER_ID, "شناسه «other» برای گزینه «سایر» رزرو شده است."),
  label: z.string().trim().min(1, "عنوان همه گزینه‌ها را وارد کنید.").max(200),
  hint: optionalText(300),
});

export const formFieldSchema = z.object({
  key: z.string().regex(KEY_PATTERN, "کلید فیلد معتبر نیست."),
  type: z.enum(FIELD_TYPES),
  label: z.string().trim().min(1, "عنوان همه فیلدها را وارد کنید.").max(200),
  hint: optionalText(500),
  placeholder: optionalText(300),
  required: z.boolean().default(false),
  /** Text fields only. */
  minLength: z.number().int().min(1).max(1000).optional(),
  /** Replaces the generic "please fill …" message. */
  requiredMessage: optionalText(300),
  options: z.array(formOptionSchema).max(100).default([]),
  allowOther: z.boolean().default(false),
  otherLabel: optionalText(100),
  otherPlaceholder: optionalText(300),
  /** Dropdowns only: the option chosen for a new, empty form. */
  defaultValue: optionalText(64),
  role: z.enum(FIELD_ROLES).optional(),
  /** Selected options count toward "امکانات انتخاب‌شده". */
  countAsFeature: z.boolean().default(false),
  showInSummary: z.boolean().default(false),
  /** Short label for summaries, review and validation messages. */
  summaryLabel: optionalText(100),
});

export const formStepSchema = z.object({
  id: z.string().regex(KEY_PATTERN, "شناسه مرحله معتبر نیست."),
  title: z.string().trim().min(1, "عنوان همه مرحله‌ها را وارد کنید.").max(100),
  description: optionalText(300),
  fields: z.array(formFieldSchema).max(100),
});

export const requirementFormSchema = z
  .object({ steps: z.array(formStepSchema).min(1, "فرم باید حداقل یک مرحله داشته باشد.").max(20) })
  .superRefine((form, ctx) => {
    const keys = new Set<string>();
    const stepIds = new Set<string>();
    const roles = new Set<string>();
    for (const step of form.steps) {
      if (stepIds.has(step.id)) ctx.addIssue({ code: "custom", message: "شناسه مرحله تکراری است." });
      stepIds.add(step.id);
      if (step.fields.length === 0) {
        ctx.addIssue({ code: "custom", message: `مرحله «${step.title}» هیچ فیلدی ندارد.` });
      }
      for (const field of step.fields) {
        if (keys.has(field.key)) {
          ctx.addIssue({ code: "custom", message: `کلید فیلد «${field.key}» تکراری است.` });
        }
        keys.add(field.key);
        if (field.role) {
          if (roles.has(field.role)) {
            ctx.addIssue({
              code: "custom",
              message: `نقش «${FIELD_ROLE_LABELS[field.role]}» فقط به یک فیلد می‌تواند داده شود.`,
            });
          }
          roles.add(field.role);
        }
        if (isChoiceField(field)) {
          if (field.options.length === 0) {
            ctx.addIssue({
              code: "custom",
              message: `فیلد «${field.label}» باید حداقل یک گزینه داشته باشد.`,
            });
          }
          const ids = new Set(field.options.map((option) => option.id));
          if (ids.size !== field.options.length) {
            ctx.addIssue({ code: "custom", message: `گزینه‌های «${field.label}» شناسه تکراری دارند.` });
          }
        }
      }
    }
  });

export type FormOption = z.infer<typeof formOptionSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export type FormStep = z.infer<typeof formStepSchema>;
export type RequirementForm = z.infer<typeof requirementFormSchema>;

export type AnswerValue = string | string[];

export type RequirementData = {
  values: Record<string, AnswerValue>;
  /** Free text typed next to a selected «سایر» option, keyed by field key. */
  other: Record<string, string>;
};

export function isChoiceField(field: Pick<FormField, "type">) {
  return field.type === "select" || field.type === "single" || field.type === "multi";
}

export function fieldTitle(field: FormField) {
  return field.summaryLabel || field.label;
}

export function allFields(form: RequirementForm): FormField[] {
  return form.steps.flatMap((step) => step.fields);
}

/** Parses a stored form; a broken row yields `null` instead of crashing a page. */
export function parseRequirementForm(raw: string | null | undefined): RequirementForm | null {
  if (!raw) return null;
  try {
    const parsed = requirementFormSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function emptyRequirement(form: RequirementForm): RequirementData {
  const values: Record<string, AnswerValue> = {};
  for (const field of allFields(form)) {
    if (field.type === "multi") values[field.key] = [];
    else if (field.type === "select" && field.defaultValue) values[field.key] = field.defaultValue;
    else values[field.key] = "";
  }
  return { values, other: {} };
}

function knownChoice(field: FormField, id: string) {
  return (field.allowOther && id === OTHER_ID) || field.options.some((option) => option.id === id);
}

/**
 * Coerces anything (client payload or stored JSON) into answers for `form`:
 * unknown keys are dropped, types fixed and choices limited to real options.
 */
export function normalizeRequirement(raw: unknown, form: RequirementForm): RequirementData {
  const result = emptyRequirement(form);
  const input = raw && typeof raw === "object" ? (raw as Partial<RequirementData>) : {};
  const values = input.values && typeof input.values === "object" ? input.values : {};
  const other = input.other && typeof input.other === "object" ? input.other : {};

  for (const field of allFields(form)) {
    const value = (values as Record<string, unknown>)[field.key];
    if (field.type === "multi") {
      if (Array.isArray(value)) {
        result.values[field.key] = [
          ...new Set(value.filter((id): id is string => typeof id === "string" && knownChoice(field, id))),
        ];
      }
    } else if (typeof value === "string") {
      const text = value.slice(0, MAX_TEXT);
      if (!isChoiceField(field)) result.values[field.key] = text;
      else if (text === "" || knownChoice(field, text)) result.values[field.key] = text;
    }

    const otherText = (other as Record<string, unknown>)[field.key];
    if (field.allowOther && typeof otherText === "string" && otherText) {
      result.other[field.key] = otherText.slice(0, MAX_TEXT);
    }
  }
  return result;
}

export function parseRequirementData(raw: string, form: RequirementForm): RequirementData {
  try {
    return normalizeRequirement(JSON.parse(raw), form);
  } catch {
    return emptyRequirement(form);
  }
}

export function textValue(data: RequirementData, key: string): string {
  const value = data.values[key];
  return typeof value === "string" ? value : "";
}

export function listValue(data: RequirementData, key: string): string[] {
  const value = data.values[key];
  return Array.isArray(value) ? value : [];
}

export function toggleInList(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function hasOtherSelected(field: FormField, data: RequirementData) {
  if (!field.allowOther) return false;
  return field.type === "multi"
    ? listValue(data, field.key).includes(OTHER_ID)
    : textValue(data, field.key) === OTHER_ID;
}

function optionLabel(field: FormField, id: string, otherText: string) {
  if (id === OTHER_ID) {
    const text = otherText.trim();
    return text ? `${OTHER_LABEL} (${text})` : field.otherLabel || OTHER_LABEL;
  }
  return field.options.find((option) => option.id === id)?.label ?? "";
}

/** Human-readable answer, `""` when unanswered. */
export function formatAnswer(field: FormField, data: RequirementData): string {
  const otherText = data.other[field.key] ?? "";
  if (field.type === "multi") {
    return listValue(data, field.key)
      .map((id) => optionLabel(field, id, otherText))
      .filter(Boolean)
      .join("، ");
  }
  const value = textValue(data, field.key);
  if (!value) return "";
  return isChoiceField(field) ? optionLabel(field, value, otherText) : value.trim();
}

export type CustomerInfo = { contactName: string; storeName: string; city: string };

/** Answers of the fields that carry a contact / store / city role. */
export function customerInfo(form: RequirementForm, data: RequirementData): CustomerInfo {
  const info: CustomerInfo = { contactName: "", storeName: "", city: "" };
  for (const field of allFields(form)) {
    if (field.role) info[field.role] = formatAnswer(field, data);
  }
  return info;
}

/** Fresh unique key for a field or step the admin adds in the builder. */
export function generateKey(prefix: "f" | "s" | "o", taken: ReadonlySet<string> = new Set()) {
  for (;;) {
    const key = `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
    if (!taken.has(key)) return key;
  }
}
