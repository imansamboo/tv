import { FormWizard } from "@/components/form/FormWizard";

export default function FormPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-amber-300">فرم نیازمندی‌های سایت</p>
        <h1 className="text-3xl font-black">سایت کسب‌وکار شما چه امکاناتی باید داشته باشد؟</h1>
        <p className="mt-2 max-w-3xl text-white/60">
          این فرم برای صاحب کسب‌وکار است و سؤال‌های آن بر اساس کسب‌وکاری که هنگام ثبت‌نام انتخاب کرده‌اید آماده شده است. پاسخ‌ها به‌صورت پیش‌نویس ذخیره می‌شوند و بعد از ثبت نهایی قابل ویرایش نیستند.
        </p>
      </div>
      <FormWizard />
    </div>
  );
}
