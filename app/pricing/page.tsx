import { PricingForm } from "@/components/pricing/PricingForm";

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-amber-300">فرم امکانات و قیمت</p>
        <h1 className="text-3xl font-black">قیمت سایت شما بر اساس امکانات انتخابی</h1>
        <p className="mt-2 max-w-3xl text-white/60">
          نیازمندی‌های فروشگاه شما ثبت شده است. در این مرحله امکانات مورد نظرتان را انتخاب کنید تا
          قیمت نهایی مشخص شود. مورد پایه ثابت است و قیمت آن نقطه شروع محاسبه است.
        </p>
      </div>
      <PricingForm />
    </div>
  );
}
