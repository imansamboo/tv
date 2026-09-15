import Link from "next/link";

const highlights = [
  {
    title: "انتخاب سایز با قیمت زنده",
    text: "مثل فروشگاه‌های بزرگ، دکمه ۳۲ تا ۸۵ اینچ دارید و با هر انتخاب مبلغ عوض می‌شود.",
  },
  {
    title: "شفافیت قبل از درگاه",
    text: "هزینه ارسال، کاور محافظ و بیمه حمل در مرحله آخر به فاکتور اضافه می‌شود؛ نه بعد از پرداخت.",
  },
  {
    title: "ادامه از همان‌جا که ماندید",
    text: "با ایمیل ثبت‌نام کنید، پیش‌نویس ذخیره می‌شود و بعد از ثبت نهایی دیگر فرم قفل است.",
  },
];

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm text-amber-300">فروشگاه تخصصی تلویزیون</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-14 sm:text-5xl">
            همه نیاز خرید تلویزیون را در یک فرم چندمرحله‌ای جمع می‌کنیم
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-9 text-white/70">
            با بررسی فروشگاه‌هایی مثل دیجی‌کالا، تکنولایف، سامسونگ و بست‌بای مشخص شد مشتری علاوه بر سایز و برند، به نصب، حمل داخل منزل، کاور، بیمه مسیر و گارانتی هم فکر می‌کند. پارس‌تی‌وی همین مسیر را به فارسی و مرحله‌به‌مرحله پیاده کرده است.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-2xl bg-amber-400 px-6 py-3 font-bold text-black"
            >
              ثبت‌نام و شروع فرم
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-white/15 px-6 py-3 font-bold"
            >
              ورود به حساب
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">نمونه فاکتور قبل از درگاه</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between rounded-2xl bg-black/20 px-4 py-3">
              <span>تلویزیون ۶۵ اینچ QLED</span>
              <span className="text-amber-300">۴۹٬۵۰۰٬۰۰۰</span>
            </li>
            <li className="flex justify-between rounded-2xl bg-black/20 px-4 py-3">
              <span>ارسال داخل منزل</span>
              <span className="text-amber-300">۲٬۱۴۰٬۰۰۰</span>
            </li>
            <li className="flex justify-between rounded-2xl bg-black/20 px-4 py-3">
              <span>کاور محافظ</span>
              <span className="text-amber-300">۸۹۰٬۰۰۰</span>
            </li>
            <li className="flex justify-between rounded-2xl bg-black/20 px-4 py-3">
              <span>بیمه حمل</span>
              <span className="text-amber-300">۱٬۲۴۰٬۰۰۰</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <article key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">{item.title}</h2>
            <p className="mt-3 leading-8 text-white/65">{item.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
