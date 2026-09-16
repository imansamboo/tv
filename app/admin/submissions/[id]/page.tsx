"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { RequirementsSummary } from "@/components/RequirementsSummary";
import {
  ADMIN_FEATURES,
  BRANDS,
  BUSINESS_TYPES,
  BUYER_FEATURES,
  DELIVERY_METHODS,
  DESIGN_STYLES,
  EXISTING_WEBSITE,
  INVENTORY_SOURCE,
  PAYMENT_GATEWAYS,
  PRODUCT_VOLUME,
  SIZE_RANGES,
  labelOf,
  labelsFor,
} from "@/lib/catalog";
import { emptyRequirement, type RequirementData } from "@/lib/form";
import { faDate } from "@/lib/format";
import { summarizeRequirements } from "@/lib/summary";

type Detail = {
  id: string;
  status: "DRAFT" | "SUBMITTED";
  data: RequirementData;
  completionPercent: number;
  featureCount: number;
  submittedAt: string | null;
  updatedAt: string;
  user: { email: string; name: string | null };
};

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [row, setRow] = useState<Detail | null>(null);

  useEffect(() => {
    fetch(`/api/admin/submissions/${id}`)
      .then((res) => res.json())
      .then(setRow);
  }, [id]);

  const data = row?.data || emptyRequirement();
  const summary = summarizeRequirements(data);

  return (
    <AdminShell>
      <Link href="/admin" className="text-sm text-amber-300">
        بازگشت به فهرست
      </Link>
      {!row ? (
        <p className="text-white/50">در حال بارگذاری...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="space-y-4 rounded-3xl border border-white/10 bg-[#101826] p-6">
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">{data.storeName || "بدون نام"}</h2>
                <p className="text-sm text-white/50">
                  {data.contactName || row.user.name} · {row.user.email}
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                {row.status === "SUBMITTED" ? "ثبت نهایی" : "پیش‌نویس"}
              </span>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <Item label="نوع فعالیت" value={labelOf(data.businessType, BUSINESS_TYPES)} />
              <Item label="شهر" value={data.city} />
              <Item label="وضعیت سایت" value={labelOf(data.existingWebsite, EXISTING_WEBSITE)} />
              <Item label="حجم کاتالوگ" value={labelOf(data.productVolume, PRODUCT_VOLUME)} />
              <Item label="ورود محصولات" value={labelOf(data.inventorySource, INVENTORY_SOURCE)} />
              <Item label="ثبت" value={faDate(row.submittedAt || row.updatedAt)} />
              <Item label="برندها" value={labelsFor(data.brandsToSell, BRANDS).join("، ")} />
              <Item label="سایزها" value={labelsFor(data.sizeRanges, SIZE_RANGES).join("، ")} />
              <Item
                label="تجربه خرید"
                value={labelsFor(data.buyerFeatures, BUYER_FEATURES).join("، ")}
              />
              <Item
                label="پرداخت"
                value={labelsFor(data.paymentGateways, PAYMENT_GATEWAYS).join("، ")}
              />
              <Item
                label="ارسال"
                value={labelsFor(data.deliveryMethods, DELIVERY_METHODS).join("، ")}
              />
              <Item
                label="پنل مدیریت"
                value={labelsFor(data.adminFeatures, ADMIN_FEATURES).join("، ")}
              />
              <Item label="طراحی" value={labelOf(data.designStyle, DESIGN_STYLES)} />
            </dl>
            {data.storeDescription && (
              <Block title="درباره فروشگاه" text={data.storeDescription} />
            )}
            {data.buyerNotes && <Block title="توضیحات تجربه خرید" text={data.buyerNotes} />}
            {data.servicesNotes && <Block title="توضیحات خدمات" text={data.servicesNotes} />}
            {data.adminNotes && <Block title="نیازهای پنل" text={data.adminNotes} />}
            {data.referenceSites && <Block title="سایت‌های مرجع" text={data.referenceSites} />}
            {data.designNotes && <Block title="توضیحات طراحی" text={data.designNotes} />}
            <ul className="rounded-2xl bg-white/5 p-4 text-sm">
              <li>نصب در محل: {data.installationOnSite ? "بله" : "خیر"}</li>
              <li>نمایش گارانتی: {data.warrantyDisplay ? "بله" : "خیر"}</li>
              <li>شفافیت قبل از پرداخت: {data.transparentCheckout ? "بله" : "خیر"}</li>
              <li>لوگو آماده: {data.hasLogo ? "بله" : "خیر"}</li>
              <li>راهنمای برند: {data.hasBrandGuide ? "بله" : "خیر"}</li>
              <li>تم تیره: {data.darkMode ? "بله" : "خیر"}</li>
              <li>اولویت موبایل: {data.mobileFirst ? "بله" : "خیر"}</li>
            </ul>
          </section>
          <RequirementsSummary data={data} summary={summary} />
        </div>
      )}
    </AdminShell>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <dt className="text-xs text-white/45">{label}</dt>
      <dd className="mt-1">{value || "—"}</dd>
    </div>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 text-sm leading-7">
      <p className="mb-2 text-xs text-white/45">{title}</p>
      <p>{text}</p>
    </div>
  );
}
