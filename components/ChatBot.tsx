"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { IRAN_PHONE, normalizePhone } from "@/lib/format";

type Msg = { from: "bot" | "user"; text: string };

const FAQ: Array<{ test: RegExp; answer: string }> = [
  {
    test: /سایز|اینچ|اندازه/,
    answer:
      "برای فاصله حدود ۲ متر معمولاً ۵۵ اینچ و برای ۲٫۵ تا ۳ متر ۶۵ اینچ مناسب است. در فرم می‌توانید سایز را بزنید تا قیمت همان لحظه عوض شود.",
  },
  {
    test: /ارسال|حمل|پست/,
    answer:
      "هزینه ارسال، کاور محافظ و بیمه حمل در مرحله آخر قبل از درگاه به مبلغ اضافه می‌شود تا هیچ هزینه پنهانی نباشد.",
  },
  {
    test: /گارانتی|بیمه/,
    answer:
      "گارانتی شرکتی پیش‌فرض است. می‌توانید بیمه حمل و گارانتی طلایی ۱۲ یا ۲۴ ماهه را هم در مرحله خدمات اضافه کنید.",
  },
  {
    test: /نصب|دیوار/,
    answer:
      "برای ۶۵ اینچ به بالا ارسال داخل منزل و نصب دیواری پیشنهاد می‌شود. براکت و جمع‌آوری تلویزیون قبلی هم قابل انتخاب است.",
  },
];

export function ChatBot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "bot",
      text: "سلام! من مشاور کمپین پارس‌تی‌وی هستم. برای ارسال پیشنهادهای ویژه و موجودی‌های خاص، شماره موبایل‌تان را بفرستید.",
    },
  ]);

  const placeholder = useMemo(
    () => (phoneSaved ? "سؤال خود را بنویسید..." : "مثلاً ۰۹۱۲۱۲۳۴۵۶۷"),
    [phoneSaved],
  );

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((current) => [...current, { from: "user", text }]);

    const phone = normalizePhone(text);
    if (!phoneSaved && IRAN_PHONE.test(phone)) {
      setBusy(true);
      const res = await fetch("/api/chat/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message: "opt-in chatbot" }),
      });
      const payload = await res.json();
      setBusy(false);
      if (!res.ok) {
        setMessages((current) => [
          ...current,
          { from: "bot", text: payload.error || "ثبت شماره ممکن نشد." },
        ]);
        return;
      }
      setPhoneSaved(true);
      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text: `شماره ${phone} برای کمپین‌های بعدی ذخیره شد. اگر سؤالی درباره سایز، ارسال یا گارانتی دارید بپرسید.`,
        },
      ]);
      return;
    }

    if (!phoneSaved) {
      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text: "اول شماره موبایل ایرانی‌تان را بفرستید تا برای کمپین ثبت شود؛ بعد می‌توانم راهنمایی کنم.",
        },
      ]);
      return;
    }

    const hit = FAQ.find((item) => item.test.test(text));
    setMessages((current) => [
      ...current,
      {
        from: "bot",
        text:
          hit?.answer ||
          "سؤالتان ثبت شد. همکاران فروش در ساعات کاری تماس می‌گیرند. برای شروع انتخاب تلویزیون از منوی «فرم درخواست» اقدام کنید.",
      },
    ]);
  }

  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50">
      {open && (
        <div className="mb-3 flex h-[420px] w-[min(92vw,360px)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#101826] shadow-2xl">
          <div className="bg-amber-400 px-4 py-3 text-black">
            <p className="font-bold">مشاور کمپین پارس‌تی‌وی</p>
            <p className="text-xs opacity-80">
              دریافت شماره برای اطلاع‌رسانی موجودی و تخفیف
            </p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.map((msg, index) => (
              <div
                key={`${msg.from}-${index}`}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 leading-6",
                  msg.from === "bot"
                    ? "bg-white/8 text-white"
                    : "mr-auto bg-amber-400 text-black",
                )}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-amber-400 px-3 text-sm font-bold text-black disabled:opacity-50"
            >
              ارسال
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid h-14 w-14 place-items-center rounded-full bg-amber-400 text-lg font-black text-black shadow-lg shadow-amber-400/30"
        aria-label="گفتگو با مشاور"
      >
        {open ? "×" : "چت"}
      </button>
    </div>
  );
}
