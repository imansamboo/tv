import { FormWizard } from "@/components/form/FormWizard";

export default function FormPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-amber-300">فرم نیازمندی‌های سایت</p>
        <h1 className="text-3xl font-black">سایت فروش تلویزیون شما چه امکاناتی باید داشته باشد؟</h1>
        <p className="mt-2 max-w-3xl text-white/60">
          این فرم برای صاحب فروشگاه است. اطلاعات خرید مشتری یا شماره تماس گرفته نمی‌شود؛ فقط نیازمندی‌های کاتالوگ، تجربه خرید، پرداخت و پنل مدیریت را مشخص می‌کنید. پاسخ‌ها به‌صورت پیش‌نویس ذخیره می‌شوند و بعد از ثبت نهایی قابل ویرایش نیستند.
        </p>
      </div>
      <FormWizard />
    </div>
  );
}
