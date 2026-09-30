import { NextResponse } from "next/server";
import { landingPathFor } from "@/lib/landing";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: session.sub,
      email: session.email,
      name: session.name,
      role: session.role,
    },
    // Lets the header and home CTA point at the step the user is actually on.
    landing: await landingPathFor({ id: session.sub, role: session.role }),
  });
}
