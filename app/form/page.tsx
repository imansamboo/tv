import { FormWizard } from "@/components/form/FormWizard";

export default function FormPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-amber-300">فرم چندمرحله‌ای خرید</p>
        <h1 className="text-3xl font-black">تجمیع نیاز مشتری فروشگاه تلویزیون</h1>
        <p className="mt-2 max-w-3xl text-white/60">
          پاسخ‌ها به‌صورت پیش‌نویس ذخیره می‌شوند. بعد از ثبت نهایی و ورود به درگاه، دیگر امکان ویرایش نیست.
        </p>
      </div>
      <FormWizard />
    </div>
  );
}
