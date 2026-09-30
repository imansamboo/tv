"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type ImagePreviewModalProps = {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
};

export function ImagePreviewModal({ src, alt, open, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="بستن پیش‌نمایش"
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute end-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#101826]/90 text-white/90 shadow-lg transition hover:border-white/35 hover:text-white"
        aria-label="بستن"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- full-resolution preview at natural dimensions */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => event.stopPropagation()}
        className="relative z-[1] max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-black/40 object-contain shadow-2xl"
      />
    </div>,
    document.body,
  );
}
