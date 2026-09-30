"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePreviewModal } from "@/components/pricing/ImagePreviewModal";
import { cn } from "@/lib/cn";
import { toman } from "@/lib/format";
import { PRICING_IMAGE_SIZE, type PricingItemView } from "@/lib/pricing";

/**
 * Square thumbnail, rendered only when the item actually has an image so a
 * missing one leaves no empty box and does not change the card layout.
 */
function ItemImage({ src, alt }: { src: string | null; alt: string }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!src) return null;

  function openPreview(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setPreviewOpen(true);
  }

  return (
    <>
      <button
        type="button"
        data-pricing-preview
        aria-label={`نمایش بزرگ ${alt}`}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={openPreview}
        className="m-0 inline-flex shrink-0 cursor-zoom-in border-0 bg-transparent p-0 leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        <Image
          src={src}
          alt={alt}
          width={PRICING_IMAGE_SIZE}
          height={PRICING_IMAGE_SIZE}
          draggable={false}
          className="pointer-events-none h-20 w-20 rounded-2xl border border-white/10 bg-black/20 object-cover sm:h-28 sm:w-28"
        />
      </button>
      <ImagePreviewModal
        src={src}
        alt={alt}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}

function ItemBody({
  item,
  badge,
  badgeClass,
}: {
  item: PricingItemView;
  badge: string;
  badgeClass: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold leading-snug">{item.title}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", badgeClass)}>
          {badge}
        </span>
      </div>
      {item.description ? (
        <p className="text-xs leading-6 text-white/55">{item.description}</p>
      ) : null}
    </div>
  );
}

function ItemPrice({ item }: { item: PricingItemView }) {
  return (
    <div className="shrink-0 text-sm font-bold text-amber-300 sm:text-base">
      {item.kind === "OPTIONAL" ? "+ " : ""}
      {toman(item.price)}
    </div>
  );
}

/** The mandatory item: always counted, never togglable, visually set apart. */
export function BaseItemCard({ item }: { item: PricingItemView }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
      <ItemImage src={item.imageUrl} alt={item.title} />
      <ItemBody
        item={item}
        badge="پایه — همیشه انتخاب‌شده"
        badgeClass="bg-emerald-400/20 text-emerald-200"
      />
      <ItemPrice item={item} />
    </div>
  );
}

export function OptionalItemCard({
  item,
  selected,
  disabled,
  onToggle,
}: {
  item: PricingItemView;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition",
        selected
          ? "border-amber-400 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]"
          : "border-white/10 bg-white/5 hover:border-white/25",
        disabled && "cursor-default opacity-60",
      )}
      onClick={(event) => {
        if (disabled || event.defaultPrevented) return;
        // Preview lives in a portal. A click that closes it must not select the item.
        if (document.querySelector("[data-pricing-lightbox]")) return;
        const target = event.target as HTMLElement;
        if (!event.currentTarget.contains(target)) return;
        if (target.closest("[data-pricing-preview], input")) return;
        onToggle();
      }}
    >
      <input
        type="checkbox"
        aria-label={item.title}
        className="mt-1 h-5 w-5 shrink-0 accent-amber-400"
        checked={selected}
        disabled={disabled}
        onClick={(event) => event.stopPropagation()}
        onChange={onToggle}
      />
      <ItemImage src={item.imageUrl} alt={item.title} />
      <ItemBody item={item} badge="اختیاری" badgeClass="bg-white/10 text-white/60" />
      <ItemPrice item={item} />
    </div>
  );
}
