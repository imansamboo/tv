import Link from "next/link";

const highlights = [
  {
    title: "نیازمندی‌های فروشگاه، نه خرید مشتری",
    text: "فرم برای صاحب فروشگاه است: چه برندها، امکانات، درگاه پرداخت و پنل مدیریتی می‌خواهید.",
  },
  {
    title: "تجربه خرید مشتری نهایی",
    text: "پیکربندی مرحله‌ای، فیلتر، مقایسه، ارسال و نصب — همان چیزهایی که در فروشگاه‌های بزرگ می‌بینید.",
  },
  {
    title: "پیش‌نویس و ثبت نهایی",
    text: "با ایمیل ثبت‌نام کنید، مرحله‌به‌مرحله پر کنید و بعد از ثبت نهایی فرم قفل می‌شود.",
  },
];

const sampleSteps = [
  "معرفی فروشگاه و وضعیت سایت فعلی",
  "برندها و بازه سایزهای کاتالوگ",
  "امکانات سایت برای مشتری (فیلتر، مقایسه، چت)",
  "درگاه پرداخت، ارسال، نصب و گارانتی",
  "پنل مدیریت سفارش و موجودی",
  "سبک طراحی و سایت‌های مرجع",
];

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm text-amber-300">سامانه جمع‌آوری نیازمندی فروشگاه تلویزیون</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-14 sm:text-5xl">
            برای سایت فروش تلویزیون‌تان چه می‌خواهید؟
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-9 text-white/70">
            این فرم برای صاحب فروشگاه است، نه مشتری. شما می‌گویید کاتالوگ، تجربه خرید، پرداخت، ارسال و پنل مدیریت چطور باشد؛ ما بر اساس آن سایت فروش تلویزیون را طراحی می‌کنیم.
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
          <p className="text-sm text-white/50">مراحل فرم نیازمندی</p>
          <ol className="mt-4 space-y-3 text-sm">
            {sampleSteps.map((item, index) => (
              <li key={item} className="flex gap-3 rounded-2xl bg-black/20 px-4 py-3">
                <span className="font-black text-amber-300">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
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
