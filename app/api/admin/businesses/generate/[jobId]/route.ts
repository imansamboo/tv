import { NextResponse } from "next/server";
import { loadFormGenerationJob } from "@/lib/form-generation-service";
import { forbidden, getAdminSession } from "@/lib/session";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!(await getAdminSession())) return forbidden();

  const { jobId } = await context.params;
  const job = await loadFormGenerationJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "درخواست تولید پیدا نشد." }, { status: 404 });
  }

  return NextResponse.json({ job });
}
