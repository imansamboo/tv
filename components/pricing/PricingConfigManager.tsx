"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Field, fieldClass, PrimaryButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { toman } from "@/lib/format";
import {
  PRICING_IMAGE_HINT,
  PRICING_IMAGE_SIZE,
  PRICING_KIND_LABELS,
  type PricingItemKind,
} from "@/lib/pricing";
import type { AdminPricingItem, AdminPricingSection } from "@/lib/pricing-service";

type ConfigPayload = {
  sections: AdminPricingSection[];
  configError: string | null;
};

type SectionDraft = { title: string; subtitle: string; active: boolean };

type ItemDraft = {
  title: string;
  description: string;
  price: string;
  kind: PricingItemKind;
  active: boolean;
  imageUrl: string | null;
};

const ghostButton =
  "rounded-full border border-white/15 px-3 py-1 text-xs transition hover:bg-white/10 disabled:opacity-40";

function emptySectionDraft(): SectionDraft {
  return { title: "", subtitle: "", active: true };
}

function emptyItemDraft(): ItemDraft {
  return { title: "", description: "", price: "", kind: "OPTIONAL", active: true, imageUrl: null };
}

function itemToDraft(item: AdminPricingItem): ItemDraft {
  return {
    title: item.title,
    description: item.description ?? "",
    price: String(item.price),
    kind: item.kind,
    active: item.active,
    imageUrl: item.imageUrl,
  };
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-white/75">
      <input
        type="checkbox"
        className="h-4 w-4 accent-amber-400"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function SectionForm({
  draft,
  setDraft,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  draft: SectionDraft;
  setDraft: (draft: SectionDraft) => void;
  submitLabel: string;
  busy: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <Field label="عنوان بخش *">
        <input
          className={fieldClass}
          value={draft.title}
          placeholder="مثلاً وب‌سایت"
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </Field>
      <Field label="توضیح بخش" hint="اختیاری">
        <input
          className={fieldClass}
          value={draft.subtitle}
          placeholder="یک خط توضیح برای مشتری"
          onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })}
        />
      </Field>
      <Toggle
        checked={draft.active}
        label="بخش فعال باشد"
        onChange={(active) => setDraft({ ...draft, active })}
      />
      <div className="flex gap-2">
        <PrimaryButton type="button" onClick={onSubmit} disabled={busy}>
          {submitLabel}
        </PrimaryButton>
        {onCancel ? (
          <button type="button" className={ghostButton} onClick={onCancel} disabled={busy}>
            انصراف
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ItemForm({
  draft,
  setDraft,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
  onError,
}: {
  draft: ItemDraft;
  setDraft: (draft: ItemDraft) => void;
  submitLabel: string;
  busy: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  onError: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    onError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/pricing/upload", { method: "POST", body });
      const payload = await res.json();
      if (!res.ok) {
        onError(payload.error || "بارگذاری تصویر ممکن نشد.");
        return;
      }
      setDraft({ ...draft, imageUrl: payload.imageUrl });
    } catch {
      onError("ارتباط با سرور برقرار نشد. تصویر بارگذاری نشد.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <Field label="عنوان مورد *">
        <input
          className={fieldClass}
          value={draft.title}
          placeholder="مثلاً درگاه پرداخت"
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </Field>
      <Field label="توضیح" hint="اختیاری">
        <textarea
          className={`${fieldClass} min-h-20`}
          value={draft.description}
          placeholder="توضیح کوتاه برای مشتری"
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="قیمت (تومان) *">
          <input
            className={fieldClass}
            value={draft.price}
            inputMode="numeric"
            placeholder="5000000"
            onChange={(event) => setDraft({ ...draft, price: event.target.value })}
          />
        </Field>
        <Field label="نوع مورد *" hint="فقط یک مورد پایه مجاز است">
          <select
            className={fieldClass}
            value={draft.kind}
            onChange={(event) =>
              setDraft({ ...draft, kind: event.target.value as PricingItemKind })
            }
          >
            <option value="OPTIONAL">{PRICING_KIND_LABELS.OPTIONAL}</option>
            <option value="BASE">{PRICING_KIND_LABELS.BASE}</option>
          </select>
        </Field>
      </div>

      <Field label="تصویر" hint={PRICING_IMAGE_HINT}>
        <div className="flex flex-wrap items-center gap-3">
          {draft.imageUrl ? (
            <Image
              src={draft.imageUrl}
              alt={draft.title || "تصویر مورد"}
              width={PRICING_IMAGE_SIZE}
              height={PRICING_IMAGE_SIZE}
              className="h-20 w-20 rounded-2xl border border-white/10 object-cover"
            />
          ) : (
            <span className="text-xs text-white/45">تصویری انتخاب نشده است.</span>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={uploading || busy}
            className="text-xs text-white/60"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload(file);
            }}
          />
          {uploading ? <span className="text-xs text-white/45">در حال بارگذاری...</span> : null}
          {draft.imageUrl ? (
            <button
              type="button"
              className={ghostButton}
              disabled={busy}
              onClick={() => setDraft({ ...draft, imageUrl: null })}
            >
              حذف تصویر
            </button>
          ) : null}
        </div>
      </Field>

      <Toggle
        checked={draft.active}
        label="مورد فعال باشد"
        onChange={(active) => setDraft({ ...draft, active })}
      />
      <div className="flex gap-2">
        <PrimaryButton type="button" onClick={onSubmit} disabled={busy || uploading}>
          {submitLabel}
        </PrimaryButton>
        {onCancel ? (
          <button type="button" className={ghostButton} onClick={onCancel} disabled={busy}>
            انصراف
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function PricingConfigManager() {
  const [payload, setPayload] = useState<ConfigPayload | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [newSection, setNewSection] = useState<SectionDraft>(emptySectionDraft);
  const [showNewSection, setShowNewSection] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionDraft, setSectionDraft] = useState<SectionDraft>(emptySectionDraft);

  const [newItemSection, setNewItemSection] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<ItemDraft>(emptyItemDraft);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(emptyItemDraft);

  const load = useCallback(
    () =>
      fetch("/api/admin/pricing")
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (!ok) {
            setError(data.error || "دریافت تنظیمات ممکن نشد.");
            return;
          }
          setPayload(data);
        })
        .catch(() => setError("ارتباط با سرور برقرار نشد.")),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  /** Runs one mutation, surfaces its Persian error, then reloads the config. */
  const mutate = useCallback(
    async (url: string, init: RequestInit) => {
      setBusy(true);
      setError("");
      try {
        const res = await fetch(url, {
          ...init,
          headers: init.body ? { "Content-Type": "application/json" } : undefined,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "انجام این عملیات ممکن نشد.");
          return false;
        }
        await load();
        return true;
      } catch {
        setError("ارتباط با سرور برقرار نشد.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  if (!payload) {
    return <p className="py-10 text-center text-white/60">در حال بارگذاری تنظیمات...</p>;
  }

  const { sections } = payload;

  return (
    <div className="space-y-5">
      {payload.configError ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {payload.configError} تا رفع این مورد، فرم قیمت‌گذاری برای مشتری فعال نمی‌شود.
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          فرم قیمت‌گذاری فعال است و مشتری‌ها می‌توانند آن را تکمیل کنند.
        </div>
      )}

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/60">
          ترتیب بخش‌ها و موردها همان ترتیبی است که مشتری در فرم می‌بیند.
        </p>
        <button
          type="button"
          className={ghostButton}
          onClick={() => {
            setNewSection(emptySectionDraft());
            setShowNewSection((value) => !value);
          }}
        >
          {showNewSection ? "بستن فرم بخش" : "افزودن بخش"}
        </button>
      </div>

      {showNewSection ? (
        <SectionForm
          draft={newSection}
          setDraft={setNewSection}
          submitLabel="ثبت بخش"
          busy={busy}
          onCancel={() => setShowNewSection(false)}
          onSubmit={async () => {
            const ok = await mutate("/api/admin/pricing/sections", {
              method: "POST",
              body: JSON.stringify({
                title: newSection.title,
                subtitle: newSection.subtitle || undefined,
                active: newSection.active,
              }),
            });
            if (ok) {
              setShowNewSection(false);
              setNewSection(emptySectionDraft());
            }
          }}
        />
      ) : null}

      {sections.length === 0 ? (
        <p className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white/45">
          هنوز بخشی ساخته نشده است.
        </p>
      ) : null}

      {sections.map((section, sectionIndex) => (
        <section
          key={section.id}
          className="space-y-4 rounded-3xl border border-white/10 bg-[#101826]/80 p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-white/40">{sectionIndex + 1}</span>
                <h2 className="text-lg font-black">{section.title}</h2>
                {!section.active ? (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60">
                    غیرفعال
                  </span>
                ) : null}
              </div>
              {section.subtitle ? (
                <p className="mt-1 text-xs text-white/45">{section.subtitle}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={ghostButton}
                disabled={busy || sectionIndex === 0}
                onClick={() =>
                  mutate(`/api/admin/pricing/sections/${section.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ move: "up" }),
                  })
                }
              >
                بالا
              </button>
              <button
                type="button"
                className={ghostButton}
                disabled={busy || sectionIndex === sections.length - 1}
                onClick={() =>
                  mutate(`/api/admin/pricing/sections/${section.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ move: "down" }),
                  })
                }
              >
                پایین
              </button>
              <button
                type="button"
                className={ghostButton}
                disabled={busy}
                onClick={() =>
                  mutate(`/api/admin/pricing/sections/${section.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ active: !section.active }),
                  })
                }
              >
                {section.active ? "غیرفعال کردن" : "فعال کردن"}
              </button>
              <button
                type="button"
                className={ghostButton}
                disabled={busy}
                onClick={() => {
                  setEditingSection(section.id);
                  setSectionDraft({
                    title: section.title,
                    subtitle: section.subtitle ?? "",
                    active: section.active,
                  });
                }}
              >
                ویرایش
              </button>
              <button
                type="button"
                className={cn(ghostButton, "text-rose-300")}
                disabled={busy}
                onClick={() => {
                  if (!confirm(`بخش «${section.title}» و همه موردهای آن حذف شود؟`)) return;
                  void mutate(`/api/admin/pricing/sections/${section.id}`, { method: "DELETE" });
                }}
              >
                حذف
              </button>
            </div>
          </div>

          {editingSection === section.id ? (
            <SectionForm
              draft={sectionDraft}
              setDraft={setSectionDraft}
              submitLabel="ذخیره بخش"
              busy={busy}
              onCancel={() => setEditingSection(null)}
              onSubmit={async () => {
                const ok = await mutate(`/api/admin/pricing/sections/${section.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({
                    title: sectionDraft.title,
                    subtitle: sectionDraft.subtitle,
                    active: sectionDraft.active,
                  }),
                });
                if (ok) setEditingSection(null);
              }}
            />
          ) : null}

          <div className="space-y-3">
            {section.items.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/45">
                این بخش موردی ندارد.
              </p>
            ) : (
              section.items.map((item, itemIndex) => (
                <div key={item.id} className="space-y-3">
                  <div
                    className={cn(
                      "flex flex-wrap items-start gap-3 rounded-2xl border p-3",
                      item.kind === "BASE"
                        ? "border-emerald-400/40 bg-emerald-400/10"
                        : "border-white/10 bg-white/5",
                      !item.active && "opacity-60",
                    )}
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={PRICING_IMAGE_SIZE}
                        height={PRICING_IMAGE_SIZE}
                        className="h-16 w-16 shrink-0 rounded-xl border border-white/10 object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-white/40">{itemIndex + 1}</span>
                        <span className="font-bold">{item.title}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-bold",
                            item.kind === "BASE"
                              ? "bg-emerald-400/20 text-emerald-200"
                              : "bg-white/10 text-white/60",
                          )}
                        >
                          {PRICING_KIND_LABELS[item.kind]}
                        </span>
                        {!item.active ? (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60">
                            غیرفعال
                          </span>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="mt-1 text-xs leading-6 text-white/50">{item.description}</p>
                      ) : null}
                      <p className="mt-1 text-sm font-bold text-amber-300">{toman(item.price)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={ghostButton}
                        disabled={busy || itemIndex === 0}
                        onClick={() =>
                          mutate(`/api/admin/pricing/items/${item.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ move: "up" }),
                          })
                        }
                      >
                        بالا
                      </button>
                      <button
                        type="button"
                        className={ghostButton}
                        disabled={busy || itemIndex === section.items.length - 1}
                        onClick={() =>
                          mutate(`/api/admin/pricing/items/${item.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ move: "down" }),
                          })
                        }
                      >
                        پایین
                      </button>
                      <button
                        type="button"
                        className={ghostButton}
                        disabled={busy}
                        onClick={() =>
                          mutate(`/api/admin/pricing/items/${item.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ active: !item.active }),
                          })
                        }
                      >
                        {item.active ? "غیرفعال کردن" : "فعال کردن"}
                      </button>
                      <button
                        type="button"
                        className={ghostButton}
                        disabled={busy}
                        onClick={() => {
                          setEditingItem(item.id);
                          setItemDraft(itemToDraft(item));
                        }}
                      >
                        ویرایش
                      </button>
                      <button
                        type="button"
                        className={cn(ghostButton, "text-rose-300")}
                        disabled={busy}
                        onClick={() => {
                          if (!confirm(`مورد «${item.title}» حذف شود؟`)) return;
                          void mutate(`/api/admin/pricing/items/${item.id}`, { method: "DELETE" });
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  </div>

                  {editingItem === item.id ? (
                    <ItemForm
                      draft={itemDraft}
                      setDraft={setItemDraft}
                      submitLabel="ذخیره مورد"
                      busy={busy}
                      onError={setError}
                      onCancel={() => setEditingItem(null)}
                      onSubmit={async () => {
                        const ok = await mutate(`/api/admin/pricing/items/${item.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({
                            title: itemDraft.title,
                            description: itemDraft.description,
                            price: itemDraft.price,
                            kind: itemDraft.kind,
                            active: itemDraft.active,
                            imageUrl: itemDraft.imageUrl,
                          }),
                        });
                        if (ok) setEditingItem(null);
                      }}
                    />
                  ) : null}
                </div>
              ))
            )}

            {newItemSection === section.id ? (
              <ItemForm
                draft={newItem}
                setDraft={setNewItem}
                submitLabel="ثبت مورد"
                busy={busy}
                onError={setError}
                onCancel={() => setNewItemSection(null)}
                onSubmit={async () => {
                  const ok = await mutate("/api/admin/pricing/items", {
                    method: "POST",
                    body: JSON.stringify({
                      sectionId: section.id,
                      title: newItem.title,
                      description: newItem.description || undefined,
                      price: newItem.price,
                      kind: newItem.kind,
                      active: newItem.active,
                      imageUrl: newItem.imageUrl,
                    }),
                  });
                  if (ok) {
                    setNewItemSection(null);
                    setNewItem(emptyItemDraft());
                  }
                }}
              />
            ) : (
              <button
                type="button"
                className={ghostButton}
                onClick={() => {
                  setNewItem(emptyItemDraft());
                  setNewItemSection(section.id);
                }}
              >
                افزودن مورد به این بخش
              </button>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
