import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { ChatBot } from "@/components/ChatBot";
import { Header } from "@/components/Header";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "پارس‌تی‌وی | فرم هوشمند خرید تلویزیون",
  description:
    "تجمیع نیاز مشتری فروشگاه تلویزیون: سایز، برند، ارسال، کاور، بیمه حمل و ثبت درخواست",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <ChatBot />
      </body>
    </html>
  );
}
