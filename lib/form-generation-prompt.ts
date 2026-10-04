import { TV_REQUIREMENT_FORM } from "./business-seed";

const GENERATION_PROMPT_TEMPLATE = `You are generating a requirements-form dataset for an Iranian online-store design agency called «دُکون بازار».
Do NOT read, create, or modify any files and do NOT run commands. Reply with ONE JSON object only, inside a single \`\`\`json code block, and nothing else.

## Who fills this form
The form is filled by the STORE OWNER (not the end customer). They tell us what their online store for "{{BUSINESS_TYPE}}" must have: catalog, buyer experience, payment, delivery, services, admin panel, and design. All user-facing text must be natural, professional Persian (Farsi) and specific to this business. Use Persian digits inside labels/hints when writing numbers.

Extra notes from the admin (may be empty): {{NOTES}}

## Exact JSON shape
{
  "description": string,
  "form": {
    "steps": [
      {
        "id": string,
        "title": string,
        "description": string,
        "fields": [ Field, ... ]
      }
    ]
  }
}

Field = {
  "key": string,
  "type": "text" | "textarea" | "select" | "single" | "multi",
  "label": string,
  "hint"?: string,
  "placeholder"?: string,
  "required": boolean,
  "minLength"?: integer,
  "requiredMessage"?: string,
  "options": [ { "id": string, "label": string, "hint"?: string } ],
  "allowOther": boolean,
  "otherLabel"?: string,
  "otherPlaceholder"?: string,
  "defaultValue"?: string,
  "role"?: "contactName" | "storeName" | "city",
  "countAsFeature": boolean,
  "showInSummary": boolean,
  "summaryLabel"?: string
}

## Required structure (follow this order, 4–8 steps, at most 30 fields total)
1. Step id "store" (فروشگاه): contactName, storeName, businessType, city, existingWebsite, storeDescription
2. Step id "catalog": business-specific catalog fields plus productVolume and inventorySources
3. Step id "buyer": buyerFeatures + buyerNotes
4. Step id "payment": paymentGateways, deliveryMethods, purchaseServices, servicesNotes
5. Step id "admin": adminFeatures + adminNotes
6. Step id "design": designStyle, referenceSites, designAssets, designNotes
You may add at most two extra steps if the business genuinely needs them.

## Quality rules
- Every option label and hint must be meaningful for "{{BUSINESS_TYPE}}" in Iran.
- Prefer multi/single/select over free text.
- Optional textarea hints should say: «اختیاری — فقط توضیح تکمیلی است و جایگزین انتخاب گزینه نمی‌شود.»
- Output must be valid JSON with no comments and no trailing commas.

## Reference example (TV store — copy the style and shape, NOT the content)
{{EXAMPLE_FORM_JSON}}`;

export function buildGenerationPrompt(businessType: string, notes?: string | null) {
  const example = JSON.stringify({ description: "فروشگاه اینترنتی تلویزیون", form: TV_REQUIREMENT_FORM });
  return GENERATION_PROMPT_TEMPLATE.replaceAll("{{BUSINESS_TYPE}}", businessType)
    .replace("{{NOTES}}", notes?.trim() || "—")
    .replace("{{EXAMPLE_FORM_JSON}}", example);
}
