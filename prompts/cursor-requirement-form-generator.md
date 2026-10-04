# تولید خودکار فرم نیازمندی با Cursor API

این فایل دو پرامپت دارد:

1. **پرامپت پیاده‌سازی** — برای Cursor Agent جهت ساخت قابلیت در پروژه
2. **پرامپت تولید دیتاست** — متنی که سرویس برای هر نوع کسب‌وکار به Cursor API می‌فرستد

---

## بخش ۱: پرامپت پیاده‌سازی (برای Cursor Agent)

````text
در این پروژه (Next.js 16 + Prisma/SQLite + zod، رابط کاربری فارسی و RTL) قابلیتی اضافه کن که ادمین یک نوع کسب‌وکار را به زبان فارسی وارد کند (مثلاً «فروشگاه آنلاین داروخانه») و سرویس با Cursor Cloud Agents API یک فرم نیازمندی کامل برای آن تولید کند. فرم تولیدشده به‌صورت یک Business غیرفعال ذخیره می‌شود تا ادمین آن را در فرم‌ساز بازبینی و منتشر کند.

قبل از نوشتن کد، راهنمای مربوط را در node_modules/next/dist/docs/ بخوان (طبق AGENTS.md).

## ساختار فعلی که باید رعایت شود
- مدل داده: `Business { id, name (unique), description, active, sortOrder, form (JSON string) }` در prisma/schema.prisma
- اسکیمای فرم: `requirementFormSchema` در lib/form.ts. خروجی AI فقط وقتی معتبر است که از `requirementFormSchema.safeParse` رد شود.
- نمونه‌های مرجع فرم: TV_REQUIREMENT_FORM در lib/business-seed.ts و SPORTS_REQUIREMENT_FORM در lib/business-sports-seed.ts
- پنل ادمین بیزینس‌ها: app/admin/businesses و app/admin/businesses/[id] (فرم‌ساز با پیش‌نمایش)، API: app/api/admin/businesses
- احراز هویت ادمین: `getAdminSession()` و `forbidden()` در lib/session.ts
- فرم قیمت خودکار: lib/pricing-form-generator.ts و lib/pricing-catalog-*.ts روی کلید فیلدها و شناسه گزینه‌ها کار می‌کنند. بیزینس ناشناخته فعلاً از کاتالوگ تلویزیون استفاده می‌کند. این بخش را تغییر نده، فقط در گزارش نهایی ذکرش کن.

## یکپارچه‌سازی با Cursor API
- کلید را از env بخوان: `CURSOR_API_KEY`. هرگز سمت کلاینت نرود و لاگ نشود. آن را به `.env.example` اضافه کن.
- ساخت ایجنت بدون ریپو: `POST https://api.cursor.com/v1/agents`
  - Auth: `Authorization: Bearer <CURSOR_API_KEY>` (یا Basic با `key:`)
  - Body: `{ "prompt": { "text": "<متن بخش ۲ با جایگذاری متغیرها>" }, "name": "requirement-form: <businessType>" }`
  - فیلدهای `repos` و `env` را نفرست تا ایجنت no-repo ساخته شود. `autoCreatePR` را نفرست.
  - پاسخ: `agent.id` و `run.id`
- گرفتن نتیجه: `GET /v1/agents/{agentId}/runs/{runId}` را با فاصله (مثلاً هر ۵ ثانیه و حداکثر ۱۰ دقیقه) poll کن تا `status` یکی از `FINISHED | ERROR | CANCELLED | EXPIRED` شود. متن نهایی در فیلد `result` است.
- اصلاح خودکار: اگر JSON نامعتبر بود یا از zod رد نشد، یک بار با `POST /v1/agents/{agentId}/runs` و `{ "prompt": { "text": "<پیام خطاهای zod + درخواست اصلاح>" } }` اصلاح بخواه. اگر باز هم شکست خورد، job را FAILED کن.
- استخراج JSON: اگر خروجی داخل ```json ... ``` بود، محتوای بلوک را بردار. اگر نبود، از اولین `{` تا آخرین `}` را بردار.
- خطاهای HTTP (401، 429، 5xx) را با پیام فارسی مناسب به ادمین نشان بده. برای 429 و 5xx یک retry با backoff بگذار.
- فراخوانی‌های API را در یک ماژول جدا بنویس: lib/cursor-api.ts با توابع `createAgent` و `getRun` و `createFollowupRun`، با timeout مشخص برای fetch.

## Job در پس‌زمینه
- مدل Prisma جدید: `FormGenerationJob { id, businessType, notes?, status (PENDING|RUNNING|SUCCEEDED|FAILED), agentId?, runId?, attempts, error?, rawResult?, businessId?, createdById, createdAt, updatedAt }` و بعد `prisma db push`.
- `POST /api/admin/businesses/generate`: فقط ادمین. ورودی را با zod بررسی کن: `businessType` بین ۲ تا ۱۰۰ کاراکتر و `notes` اختیاری تا ۱۰۰۰ کاراکتر. job بساز، کار را بدون await شروع کن و فوراً `{ jobId }` برگردان.
- `GET /api/admin/businesses/generate/[jobId]`: وضعیت job و در صورت موفقیت `businessId`.
- در صورت موفقیت، Business را با `active: false`، نام `businessType` (اگر نام تکراری بود پسوند « (۲)» و بعدی‌ها) و `description` تولیدشده ذخیره کن.
- اگر سرور ری‌استارت شد، jobهای RUNNING که `runId` دارند در درخواست بعدی وضعیت دوباره از run خوانده شوند.

## اعتبارسنجی بیشتر از zod (lib/form-generation.ts)
- مرحله اول باید فیلدهای `contactName` و `storeName` (هر دو text و required) و `city` (select با role مربوطه) را داشته باشد، مثل فرم تلویزیون.
- کلیدهای مشترک (paymentGateways، deliveryMethods، purchaseServices، inventorySources، productVolume، designStyle، designAssets، existingWebsite) اگر وجود دارند باید همان type و همان شناسه گزینه‌های پایه‌ی فرم تلویزیون را داشته باشند. می‌توانند گزینه اضافه هم داشته باشند. این کار برای سازگاری با کاتالوگ قیمت است.
- حداقل ۴ و حداکثر ۸ مرحله، و حداکثر ۳۰ فیلد در کل.
- تابع خالصی بنویس که لیست خطاهای فارسی برگرداند تا هم برای پیام اصلاح به AI و هم در تست استفاده شود.

## رابط کاربری
- در app/admin/businesses دکمه «تولید فرم با هوش مصنوعی» اضافه کن. با زدن آن مودال باز شود با فیلد نوع کسب‌وکار و توضیحات اختیاری.
- بعد از ارسال، وضعیت را poll کن و پیام‌های «در حال تولید…» / «ناموفق: …» / «آماده است» را نشان بده.
- وقتی آماده شد، لینک «بازبینی در فرم‌ساز» به /admin/businesses/{id} نمایش بده.
- استایل را از کامپوننت‌های موجود (components/ui.tsx) و تم تیره فعلی بگیر.

## تست و تحویل
- تست واحد (node:test + tsx، مثل lib/pricing.test.ts) برای استخراج JSON از متن، اعتبارسنجی اضافه و ساخت پیام اصلاح. API واقعی را در تست صدا نزن، fetch را mock کن. فایل تست را به اسکریپت `test` در package.json اضافه کن.
- `npm test`، `npm run lint` و `npm run build` باید پاس شوند.
- در README بخش کوتاهی بنویس درباره متغیر `CURSOR_API_KEY` و نحوه استفاده.
````

---

## بخش ۲: پرامپت تولید دیتاست (ارسال به Cursor API)

این متن در کد به‌صورت template نگه داشته می‌شود. `{{BUSINESS_TYPE}}`، `{{NOTES}}` و `{{EXAMPLE_FORM_JSON}}` موقع اجرا جایگذاری می‌شوند. برای `{{EXAMPLE_FORM_JSON}}` از `JSON.stringify(TV_REQUIREMENT_FORM)` استفاده کن.

````text
You are generating a requirements-form dataset for an Iranian online-store design agency called «دُکون بازار».
Do NOT read, create, or modify any files and do NOT run commands. Reply with ONE JSON object only, inside a single ```json code block, and nothing else.

## Who fills this form
The form is filled by the STORE OWNER (not the end customer). They tell us what their online store for "{{BUSINESS_TYPE}}" must have: catalog, buyer experience, payment, delivery, services, admin panel, and design. All user-facing text must be natural, professional Persian (Farsi) and specific to this business. Use Persian digits inside labels/hints when writing numbers.

Extra notes from the admin (may be empty): {{NOTES}}

## Exact JSON shape
{
  "description": string,            // one-sentence Persian description of this business, max 200 chars
  "form": {
    "steps": [
      {
        "id": string,               // English, regex ^[A-Za-z][A-Za-z0-9_]{0,63}$, unique
        "title": string,            // Persian, max 100 chars
        "description": string,      // Persian, max 300 chars
        "fields": [ Field, ... ]    // at least 1
      }
    ]
  }
}

Field = {
  "key": string,                    // English camelCase, regex ^[A-Za-z][A-Za-z0-9_]{0,63}$, unique across the WHOLE form
  "type": "text" | "textarea" | "select" | "single" | "multi",
  "label": string,                  // Persian, max 200
  "hint"?: string,                  // Persian, max 500
  "placeholder"?: string,           // Persian, max 300
  "required": boolean,
  "minLength"?: integer 1..1000,    // text fields only
  "requiredMessage"?: string,       // Persian, max 300
  "options": [ { "id": string, "label": string, "hint"?: string } ],
                                    // REQUIRED (>=1) for select/single/multi; [] for text/textarea
                                    // option id: short English, unique within the field, max 64, NEVER "other"
  "allowOther": boolean,            // true adds a «سایر» choice with free text
  "otherLabel"?: string,
  "otherPlaceholder"?: string,
  "defaultValue"?: string,          // select only; must equal one option id
  "role"?: "contactName" | "storeName" | "city",   // each role used at most once
  "countAsFeature": boolean,        // true for multi fields that are site features
  "showInSummary": boolean,
  "summaryLabel"?: string           // short Persian label, max 100
}

## Required structure (follow this order, 4–8 steps, at most 30 fields total)
1. Step id "store" (فروشگاه):
   - contactName: text, required, minLength 3, role "contactName", showInSummary true
   - storeName: text, required, minLength 2, role "storeName", showInSummary true
   - businessType: single, required, options physical / online / both, allowOther true
   - city: select, required, role "city", options = major Iranian cities + {"id":"سایر","label":"سایر شهرها"}, defaultValue "تهران"
   - existingWebsite: single, required, options EXACTLY ids none / have / redesign
   - storeDescription: textarea, optional
2. Step id "catalog": business-specific catalog fields (for example product categories, brands, and anything domain-specific such as prescription upload for a pharmacy), plus:
   - productVolume: single, required, options EXACTLY ids small / medium / large (labels adapted to this business)
   - inventorySources: multi, required, must include ids manual / excel / api / erp (you may add more)
3. Step id "buyer": buyerFeatures (multi, required, countAsFeature true, 6–10 options specific to this business, include "chat" and "blog") + buyerNotes (textarea)
4. Step id "payment":
   - paymentGateways: multi, required, must include ids zarinpal / idpay / snappay / card / installment
   - deliveryMethods: multi, required, must include ids standard / express / pickup
   - purchaseServices: multi, must include ids installationOnSite / warrantyDisplay / transparentCheckout (relabel installationOnSite to the service that fits this business)
   - servicesNotes: textarea
5. Step id "admin": adminFeatures (multi, required, countAsFeature true, include orders / inventory / sms / staff plus business-specific tools) + adminNotes (textarea)
6. Step id "design":
   - designStyle: single, required, options EXACTLY ids modern / premium / budget / custom
   - referenceSites: textarea
   - designAssets: multi, options EXACTLY ids hasLogo / hasBrandGuide / darkMode / mobileFirst
   - designNotes: textarea
You may add at most two extra steps if the business genuinely needs them (for example legal/licensing for a pharmacy, or booking for a service business). Give each extra step its own English id.

## Quality rules
- Every option label and hint must be meaningful for "{{BUSINESS_TYPE}}" in Iran. No generic filler, no English text in labels.
- Prefer multi/single/select over free text. Use textarea only for "notes" fields, and set allowOther true on most choice fields.
- Optional textarea hints should say: «اختیاری — فقط توضیح تکمیلی است و جایگزین انتخاب گزینه نمی‌شود.»
- Be careful with legal or sensitive domains (medicine, finance, and similar). Add fields for licenses or regulations instead of promising features that are illegal in Iran.
- Output must be valid JSON: no comments, no trailing commas.

## Reference example (TV store — copy the style and shape, NOT the content)
{{EXAMPLE_FORM_JSON}}
````

---

## یادداشت

کلیدهای مشترک (`paymentGateways`، `deliveryMethods`، `designStyle` و …) عمداً با فرم تلویزیون/ورزشی یکسان نگه داشته شده‌اند تا `lib/pricing-catalog-shared.ts` بدون تغییر، فرم قیمت (پایه ۹۰M + افزونه‌ها + سقف ۴۰۰M) را برای بیزینس جدید هم بسازد.
