import { z } from "zod";

/**
 * Data-driven requirement form schema (mirrors valakala `lib/form.ts`).
 * Kept separate so sports seed data can validate without changing the legacy form module.
 */

export const FIELD_TYPES = ["text", "textarea", "select", "single", "multi"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_ROLES = ["contactName", "storeName", "city"] as const;
export type FieldRole = (typeof FIELD_ROLES)[number];

export const FIELD_ROLE_LABELS: Record<FieldRole, string> = {
  contactName: "نام رابط",
  storeName: "نام کسب‌وکار / فروشگاه",
  city: "شهر",
};

export const OTHER_ID = "other";

export const OPTIONAL_DESCRIPTION_HINT =
  "اختیاری — فقط توضیح تکمیلی است و جایگزین انتخاب گزینه نمی‌شود.";

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
  minLength: z.number().int().min(1).max(1000).optional(),
  requiredMessage: optionalText(300),
  options: z.array(formOptionSchema).max(100).default([]),
  allowOther: z.boolean().default(false),
  otherLabel: optionalText(100),
  otherPlaceholder: optionalText(300),
  defaultValue: optionalText(64),
  role: z.enum(FIELD_ROLES).optional(),
  countAsFeature: z.boolean().default(false),
  showInSummary: z.boolean().default(false),
  summaryLabel: optionalText(100),
});

export const formStepSchema = z.object({
  id: z.string().regex(KEY_PATTERN, "شناسه مرحله معتبر نیست."),
  title: z.string().trim().min(1, "عنوان همه مرحله‌ها را وارد کنید.").max(100),
  description: optionalText(300),
  fields: z.array(formFieldSchema).max(100),
});

function isChoiceField(field: Pick<FormField, "type">) {
  return field.type === "select" || field.type === "single" || field.type === "multi";
}

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
