import type { FormGenerationStatus } from "@prisma/client";
import {
  createAgent,
  createFollowupRun,
  CursorApiError,
  getRun,
  TERMINAL_RUN_STATUSES,
} from "./cursor-api";
import { buildGenerationPrompt } from "./form-generation-prompt";
import {
  buildFixPrompt,
  extractJsonFromText,
  uniqueBusinessName,
  validateGeneratedPayload,
} from "./form-generation";
import { prisma } from "./prisma";

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1_000;
const processing = new Set<string>();

export type FormGenerationJobView = {
  id: string;
  businessType: string;
  notes: string | null;
  status: FormGenerationStatus;
  error: string | null;
  businessId: string | null;
  createdAt: string;
  updatedAt: string;
};

function toJobView(job: {
  id: string;
  businessType: string;
  notes: string | null;
  status: FormGenerationStatus;
  error: string | null;
  businessId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): FormGenerationJobView {
  return {
    id: job.id,
    businessType: job.businessType,
    notes: job.notes,
    status: job.status,
    error: job.error,
    businessId: job.businessId,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

async function pollRun(agentId: string, runId: string) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const run = await getRun(agentId, runId);
    if (TERMINAL_RUN_STATUSES.has(run.status)) return run;
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error("زمان انتظار برای پاسخ Cursor API به پایان رسید.");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function persistBusiness(payload: { description: string; form: object }, businessType: string) {
  const name = await uniqueBusinessName(businessType, async (candidate) =>
    Boolean(await prisma.business.findUnique({ where: { name: candidate }, select: { id: true } })),
  );
  const last = await prisma.business.aggregate({ _max: { sortOrder: true } });
  return prisma.business.create({
    data: {
      name,
      description: payload.description,
      form: JSON.stringify(payload.form),
      active: false,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });
}

async function handleRunResult(jobId: string, agentId: string, runId: string, rawResult: string | null | undefined) {
  if (!rawResult?.trim()) {
    throw new Error("Cursor API پاسخ خالی برگرداند.");
  }
  await prisma.formGenerationJob.update({
    where: { id: jobId },
    data: { rawResult, attempts: { increment: 1 } },
  });

  let parsed: unknown;
  try {
    parsed = extractJsonFromText(rawResult);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "JSON نامعتبر است.");
  }

  const validation = validateGeneratedPayload(parsed);
  if (validation.ok) {
    const business = await persistBusiness(validation.data, (await prisma.formGenerationJob.findUniqueOrThrow({ where: { id: jobId } })).businessType);
    await prisma.formGenerationJob.update({
      where: { id: jobId },
      data: { status: "SUCCEEDED", businessId: business.id, error: null },
    });
    return;
  }

  const job = await prisma.formGenerationJob.findUniqueOrThrow({ where: { id: jobId } });
  if (job.attempts >= 2) {
    throw new Error(validation.errors.join(" "));
  }

  const fix = await createFollowupRun(agentId, buildFixPrompt(validation.errors, rawResult));
  await prisma.formGenerationJob.update({
    where: { id: jobId },
    data: { runId: fix.run.id },
  });
  const fixedRun = await pollRun(agentId, fix.run.id);
  if (fixedRun.status !== "FINISHED") {
    throw new Error(fixedRun.error || "اصلاح خودکار فرم ناموفق بود.");
  }
  await handleRunResult(jobId, agentId, fix.run.id, fixedRun.result);
}

export async function processFormGenerationJob(jobId: string) {
  if (processing.has(jobId)) return;
  processing.add(jobId);
  try {
    let job = await prisma.formGenerationJob.findUnique({ where: { id: jobId } });
    if (!job || job.status === "SUCCEEDED" || job.status === "FAILED") return;

    await prisma.formGenerationJob.update({
      where: { id: jobId },
      data: { status: "RUNNING", error: null },
    });

    if (!job.agentId || !job.runId) {
      const prompt = buildGenerationPrompt(job.businessType, job.notes);
      const created = await createAgent(prompt, `requirement-form: ${job.businessType}`);
      job = await prisma.formGenerationJob.update({
        where: { id: jobId },
        data: { agentId: created.agent.id, runId: created.run.id },
      });
    }

    const run = await pollRun(job.agentId!, job.runId!);
    if (run.status !== "FINISHED") {
      throw new Error(run.error || `وضعیت اجرا: ${run.status}`);
    }
    await handleRunResult(jobId, job.agentId!, job.runId!, run.result);
  } catch (error) {
    const message =
      error instanceof CursorApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "تولید فرم ناموفق بود.";
    await prisma.formGenerationJob.update({
      where: { id: jobId },
      data: { status: "FAILED", error: message },
    });
  } finally {
    processing.delete(jobId);
  }
}

export async function startFormGeneration(input: {
  businessType: string;
  notes?: string | null;
  createdById: string;
}) {
  const job = await prisma.formGenerationJob.create({
    data: {
      businessType: input.businessType,
      notes: input.notes?.trim() || null,
      createdById: input.createdById,
    },
  });
  void processFormGenerationJob(job.id);
  return job.id;
}

export async function loadFormGenerationJob(jobId: string) {
  const job = await prisma.formGenerationJob.findUnique({ where: { id: jobId } });
  if (!job) return null;
  if (job.status === "PENDING" || job.status === "RUNNING") {
    void processFormGenerationJob(jobId);
  }
  return toJobView(job);
}
