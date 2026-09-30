import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE, type SessionUser } from "./auth";

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export async function getRequestSession(request: NextRequest) {
  return readSession(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function getAdminSession(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.role === "ADMIN" ? session : null;
}

export function forbidden() {
  return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
}
