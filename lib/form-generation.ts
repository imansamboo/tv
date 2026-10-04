import { z } from "zod";
import { TV_REQUIREMENT_FORM } from "./business-seed";
import {
  allFields,
  isChoiceField,
  requirementFormSchema,
  type FormField,
  type RequirementForm,
} from "./form";

export const SHARED_FIELD_KEYS = [
  "existingWebsite",
  "productVolume",
  "inventorySources",
  "paymentGateways",
  "deliveryMethods",
  "purchaseServices",
  "designStyle",
  "designAssets",
] as const;

const generatedPayloadSchema = z.object({
  description: z.string().trim().min(1, "توضیح کسب‌وکار خالی است.").max(200, "توضیح کسب‌وکار خیلی طولانی است."),
  form: requirementFormSchema,
});

export type GeneratedBusinessPayload = z.infer<typeof generatedPayloadSchema>;

const tvFieldsByKey = new Map(allFields(TV_REQUIREMENT_FORM).map((field) => [field.key, field]));

function optionIds(field: FormField) {
  return new Set(field.options.map((option) => option.id));
}

/** Pulls JSON from a fenced block or the outermost object in free text. */
export function extractJsonFromText(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = (fenced?.[1] ?? text).trim();
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("در پاسخ Cursor، JSON پیدا نشد.");
  }
  return JSON.parse(source.slice(start, end + 1));
}

export function parseGeneratedPayload(raw: unknown): GeneratedBusinessPayload {
  return generatedPayloadSchema.parse(raw);
}

/** Rules beyond zod: store step, step/field counts, shared pricing-catalog keys. */
export function extraBusinessFormErrors(form: RequirementForm): string[] {
  const errors: string[] = [];
  const fields = allFields(form);

  if (form.steps.length < 4) errors.push("فرم باید حداقل ۴ مرحله داشته باشد.");
  if (form.steps.length > 8) errors.push("فرم نباید بیش از ۸ مرحله داشته باشد.");
  if (fields.length > 30) errors.push("فرم نباید بیش از ۳۰ فیلد داشته باشد.");

  const store = form.steps.find((step) => step.id === "store");
  if (!store) {
    errors.push('مرحله اول باید id برابر "store" داشته باشد.');
  } else {
    const contact = store.fields.find((field) => field.key === "contactName");
    const storeName = store.fields.find((field) => field.key === "storeName");
    const city = store.fields.find((field) => field.key === "city");
    if (!contact || contact.type !== "text" || !contact.required || contact.role !== "contactName") {
      errors.push("فیلد contactName در مرحله store الزامی است (text, required, role contactName).");
    }
    if (!storeName || storeName.type !== "text" || !storeName.required || storeName.role !== "storeName") {
      errors.push("فیلد storeName در مرحله store الزامی است (text, required, role storeName).");
    }
    if (!city || city.type !== "select" || !city.required || city.role !== "city") {
      errors.push("فیلد city در مرحله store الزامی است (select, required, role city).");
    }
  }

  for (const key of SHARED_FIELD_KEYS) {
    const generated = fields.find((field) => field.key === key);
    const baseline = tvFieldsByKey.get(key);
    if (!generated || !baseline) continue;
    if (generated.type !== baseline.type) {
      errors.push(`فیلد «${key}» باید نوع ${baseline.type} داشته باشد.`);
      continue;
    }
    if (!isChoiceField(generated)) continue;
    const generatedIds = optionIds(generated);
    for (const option of baseline.options) {
      if (!generatedIds.has(option.id)) {
        errors.push(`فیلد «${key}» باید گزینه «${option.id}» را داشته باشد (برای سازگاری قیمت‌گذاری).`);
      }
    }
  }

  return errors;
}

export function validateGeneratedPayload(raw: unknown): { ok: true; data: GeneratedBusinessPayload } | { ok: false; errors: string[] } {
  const parsed = generatedPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message || "ساختار JSON نامعتبر است."),
    };
  }
  const extra = extraBusinessFormErrors(parsed.data.form);
  if (extra.length > 0) return { ok: false, errors: extra };
  return { ok: true, data: parsed.data };
}

export function buildFixPrompt(errors: readonly string[], previousOutput: string) {
  return `Your previous JSON response was invalid. Fix ALL issues below and reply with ONE corrected JSON object only, inside a single \`\`\`json code block, and nothing else.

Errors:
${errors.map((error) => `- ${error}`).join("\n")}

Previous output:
${previousOutput}`;
}

export async function uniqueBusinessName(baseName: string, exists: (name: string) => Promise<boolean>) {
  if (!(await exists(baseName))) return baseName;
  for (let index = 2; index < 100; index += 1) {
    const candidate = `${baseName} (${index})`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error("نام کسب‌وکار تکراری است و پسوند منحصربه‌فرد پیدا نشد.");
}
