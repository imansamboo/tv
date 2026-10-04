import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookieOptions, signSession, SESSION_COOKIE } from "@/lib/auth";
import {
  CAPTCHA_INVALID_MESSAGE,
  CAPTCHA_REQUIRED_MESSAGE,
  verifyCaptcha,
} from "@/lib/captcha";
import { landingPathFor } from "@/lib/landing";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("ایمیل معتبر نیست."),
  password: z.string().min(1, "رمز عبور را وارد کنید."),
  captchaToken: z.string().trim().min(1, CAPTCHA_REQUIRED_MESSAGE),
  captchaAnswer: z.string().trim().min(1, CAPTCHA_REQUIRED_MESSAGE),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "اطلاعات نامعتبر است." },
      { status: 400 },
    );
  }

  const captchaOk = await verifyCaptcha(parsed.data.captchaToken, parsed.data.captchaAnswer);
  if (!captchaOk) {
    return NextResponse.json({ error: CAPTCHA_INVALID_MESSAGE }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json(
      { error: "ایمیل یا رمز عبور نادرست است." },
      { status: 401 },
    );
  }

  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name || "",
    role: user.role,
  });

  const nextPath = await landingPathFor(user);
  const response = NextResponse.json({
    ok: true,
    next: nextPath,
    user: { email: user.email, name: user.name, role: user.role },
  });
  response.cookies.set(SESSION_COOKIE, token, cookieOptions);
  return response;
}
