import { NextResponse } from "next/server";
import { listActiveBusinesses } from "@/lib/business";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ businesses: await listActiveBusinesses() });
}
