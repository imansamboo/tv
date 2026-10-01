"use client";

import { useState } from "react";
import { ReviewPanel } from "@/components/form/ReviewPanel";
import { StepFields } from "@/components/form/StepFields";
import { PrimaryButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  REVIEW_STEP,
  emptyRequirement,
  normalizeRequirement,
  type RequirementData,
  type RequirementForm,
} from "@/lib/form";
import { validateStep } from "@/lib/validate";

/** The form exactly as the customer sees it; answers here are never saved. */
export function RequirementFormPreview({ form }: { form: RequirementForm }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<RequirementData>(() => emptyRequirement(form));
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const data = normalizeRequirement(answers, form);
  const reviewStep = form.steps.length;
  const current = Math.min(step, reviewStep);
  const titles = [...form.steps.map((s) => s.title), REVIEW_STEP.title];

  function check() {
    const error = validateStep(form, current, data);
    setMessage(error ? { tone: "error", text: error } : { tone: "ok", text: "این مرحله معتبر است." });
    if (!error) setStep(Math.min(reviewStep, current + 1));
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#101826]/80 p-5 sm:p-8">
      <ol className="mb-6 flex flex-wrap gap-2">
        {titles.map((title, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setStep(index);
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                index === current ? "bg-amber-400 text-black" : "bg-white/10 text-white/70",
              )}
            >
              {index + 1}. {title || "بدون عنوان"}
            </button>
          </li>
        ))}
      </ol>

      <div className="mb-6">
        <p className="text-amber-300">
          {current < reviewStep ? form.steps[current].description : REVIEW_STEP.description}
        </p>
        <h2 className="mt-1 text-2xl font-black">{titles[current]}</h2>
      </div>

      {current < reviewStep ? (
        <StepFields step={form.steps[current]} data={data} onChange={setAnswers} />
      ) : (
        <ReviewPanel form={form} data={data} />
      )}

      {message && (
        <p
          className={cn(
            "mt-5 text-sm",
            message.tone === "ok" ? "text-emerald-300" : "text-rose-400",
          )}
        >
          {message.text}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setAnswers(emptyRequirement(form));
            setMessage(null);
            setStep(0);
          }}
          className="rounded-2xl border border-white/15 px-5 py-3 text-sm"
        >
          پاک کردن پاسخ‌های آزمایشی
        </button>
        {current < reviewStep && (
          <PrimaryButton type="button" onClick={check}>
            بررسی و مرحله بعد
          </PrimaryButton>
        )}
      </div>
    </section>
  );
}
