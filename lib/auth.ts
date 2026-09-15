import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "parstv_session";

export type SessionUser = {
  sub: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
};

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "parstv-dev-secret-change-me-please",
  );
}

export async function signSession(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function readSession(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || !payload.email || !payload.role) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name || ""),
      role: payload.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
    } satisfies SessionUser;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
};
