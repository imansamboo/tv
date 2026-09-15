import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { readSession, SESSION_COOKIE, type SessionUser } from "./auth";

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export async function getRequestSession(request: NextRequest) {
  return readSession(request.cookies.get(SESSION_COOKIE)?.value);
}
