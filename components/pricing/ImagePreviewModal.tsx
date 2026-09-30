"use client";

import { useEffect, useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

type ImagePreviewModalProps = {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
};

function isBackdropTarget(target: EventTarget | null) {
  return target instanceof Element && target.hasAttribute("data-pricing-backdrop");
}

/** The click that dismisses the lightbox must not land on the card underneath. */
function swallowFollowingClick() {
  const swallow = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };
  document.addEventListener("click", swallow, true);
  window.setTimeout(() => document.removeEventListener("click", swallow, true), 0);
}

export function ImagePreviewModal({ src, alt, open, onClose }: ImagePreviewModalProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Keep the form inert while the preview is open, and for the rest of the
    // dismissing click, so that click cannot toggle a pricing checkbox.
    const background = [...document.querySelectorAll("header, main")];
    background.forEach((node) => node.setAttribute("inert", ""));

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.setTimeout(() => {
        if (document.querySelector("[data-pricing-lightbox]")) return;
        background.forEach((node) => node.removeAttribute("inert"));
      }, 0);
    };
  }, [open]);

  if (!open) return null;

  function dismiss(event: ReactMouseEvent | ReactPointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopPropagation();
    swallowFollowingClick();
    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      data-pricing-lightbox=""
      onPointerDown={(event) => {
        if (isBackdropTarget(event.target)) dismiss(event);
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (isBackdropTarget(event.target)) dismiss(event);
      }}
    >
      <div
        data-pricing-backdrop=""
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
      />
      <button
        type="button"
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          dismiss(event);
        }}
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
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        className="relative z-[1] max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-black/40 object-contain shadow-2xl"
      />
    </div>,
    document.body,
  );
}
