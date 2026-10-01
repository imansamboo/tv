import {
  OTHER_LABEL,
  fieldTitle,
  hasOtherSelected,
  isChoiceField,
  listValue,
  textValue,
  type FormField,
  type RequirementData,
  type RequirementForm,
} from "./form";

function otherTextError(field: FormField, data: RequirementData) {
  if (!hasOtherSelected(field, data)) return null;
  if ((data.other[field.key] ?? "").trim().length < 2) {
    return `برای گزینه «${field.otherLabel || OTHER_LABEL}» در ${fieldTitle(field)}، توضیح کوتاه بنویسید.`;
  }
  return null;
}

export function validateField(field: FormField, data: RequirementData): string | null {
  if (field.type === "multi") {
    if (field.required && listValue(data, field.key).length === 0) {
      return field.requiredMessage || `حداقل یک گزینه برای «${fieldTitle(field)}» انتخاب کنید.`;
    }
    return otherTextError(field, data);
  }

  const value = textValue(data, field.key);
  if (isChoiceField(field)) {
    if (field.required && !value) {
      return field.requiredMessage || `«${fieldTitle(field)}» را انتخاب کنید.`;
    }
    return otherTextError(field, data);
  }

  if (field.required && value.trim().length < (field.minLength ?? 1)) {
    return field.requiredMessage || `«${fieldTitle(field)}» را کامل وارد کنید.`;
  }
  return null;
}

/** First problem in one step, or `null`. Indexes past the last step are the review. */
export function validateStep(
  form: RequirementForm,
  step: number,
  data: RequirementData,
): string | null {
  for (const field of form.steps[step]?.fields ?? []) {
    const error = validateField(field, data);
    if (error) return error;
  }
  return null;
}

export function firstInvalidStep(form: RequirementForm, data: RequirementData) {
  for (let step = 0; step < form.steps.length; step += 1) {
    const error = validateStep(form, step, data);
    if (error) return { step, error };
  }
  return null;
}
