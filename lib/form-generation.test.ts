import assert from "node:assert/strict";
import { test } from "node:test";
import { TV_REQUIREMENT_FORM } from "./business-seed";
import {
  buildFixPrompt,
  extraBusinessFormErrors,
  extractJsonFromText,
  validateGeneratedPayload,
} from "./form-generation";

test("extractJsonFromText reads fenced JSON", () => {
  const raw = extractJsonFromText('Here:\n```json\n{"description":"تست","form":{"steps":[]}}\n```');
  assert.deepEqual(raw, { description: "تست", form: { steps: [] } });
});

test("extractJsonFromText reads bare object", () => {
  const raw = extractJsonFromText('noise {"description":"a","form":{"steps":[]}} tail');
  assert.deepEqual(raw, { description: "a", form: { steps: [] } });
});

test("validateGeneratedPayload accepts TV reference form wrapped in payload", () => {
  const result = validateGeneratedPayload({
    description: "فروشگاه اینترنتی تلویزیون",
    form: TV_REQUIREMENT_FORM,
  });
  assert.equal(result.ok, true);
});

test("extraBusinessFormErrors rejects too many fields", () => {
  const huge = {
    ...TV_REQUIREMENT_FORM,
    steps: [
      ...TV_REQUIREMENT_FORM.steps,
      {
        id: "extra1",
        title: "اضافه",
        description: "تست",
        fields: Array.from({ length: 10 }, (_, index) => ({
          key: `field${index}`,
          type: "text" as const,
          label: `فیلد ${index}`,
          required: false,
          options: [],
          allowOther: false,
          countAsFeature: false,
          showInSummary: false,
        })),
      },
    ],
  };
  const errors = extraBusinessFormErrors(huge);
  assert.ok(errors.some((error) => error.includes("۳۰ فیلد")));
});

test("buildFixPrompt includes validation errors", () => {
  const prompt = buildFixPrompt(["خطای اول", "خطای دوم"], '{"bad":true}');
  assert.match(prompt, /خطای اول/);
  assert.match(prompt, /```json code block/);
});
