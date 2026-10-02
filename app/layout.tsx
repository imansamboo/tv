import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { ChatBot } from "@/components/ChatBot";
import { Header } from "@/components/Header";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: `${SITE_NAME} | فرم نیازمندی‌های سایت فروشگاه`,
  description:
    "جمع‌آوری نیازمندی‌های صاحب فروشگاه برای طراحی سایت آنلاین: کاتالوگ، تجربه خرید، پرداخت و پنل مدیریت",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <ChatBot />
      </body>
    </html>
  );
}
