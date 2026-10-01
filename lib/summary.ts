import {
  allFields,
  fieldTitle,
  formatAnswer,
  listValue,
  textValue,
  type RequirementData,
  type RequirementForm,
} from "./form";
import { validateStep } from "./validate";

export type SummaryItem = {
  label: string;
  value: string;
};

export type RequirementSummary = {
  featureCount: number;
  completionPercent: number;
  highlights: SummaryItem[];
};

export function summarizeRequirements(
  form: RequirementForm,
  data: RequirementData,
): RequirementSummary {
  const steps = form.steps.length;
  let completedSteps = 0;
  for (let step = 0; step < steps; step += 1) {
    if (validateStep(form, step, data) === null) completedSteps += 1;
  }

  let featureCount = 0;
  const highlights: SummaryItem[] = [];
  for (const field of allFields(form)) {
    if (field.countAsFeature) {
      featureCount += field.type === "multi"
        ? listValue(data, field.key).length
        : Number(Boolean(textValue(data, field.key)));
    }
    if (field.showInSummary) {
      const value = formatAnswer(field, data);
      if (value) highlights.push({ label: fieldTitle(field), value });
    }
  }

  return {
    featureCount,
    completionPercent: steps === 0 ? 0 : Math.round((completedSteps / steps) * 100),
    highlights,
  };
}
