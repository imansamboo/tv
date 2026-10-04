import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookieOptions, signSession, SESSION_COOKIE } from "@/lib/auth";
import { requireValidCaptcha } from "@/lib/captcha";
import { prisma } from "@/lib/prisma";
import { initialRequirement, loadBusinessForm } from "@/lib/business";

const schema = z.object({
  name: z.string().trim().min(3, "نام را کامل وارد کنید."),
  email: z.string().trim().toLowerCase().email("ایمیل معتبر نیست."),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر باشد."),
  businessId: z.string({ error: "کسب‌وکار خود را انتخاب کنید." }).trim().min(1, "کسب‌وکار خود را انتخاب کنید."),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "اطلاعات نامعتبر است." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const captcha = await requireValidCaptcha(record.captchaToken, record.captchaAnswer);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "اطلاعات نامعتبر است." },
      { status: 400 },
    );
  }

  const { name, email, password, businessId } = parsed.data;
  const business = await loadBusinessForm(businessId, { activeOnly: true });
  if (!business) {
    return NextResponse.json({ error: "کسب‌وکار انتخاب‌شده معتبر نیست." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json(
      { error: "این ایمیل قبلاً ثبت شده است. وارد شوید." },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      businessId: business.business.id,
      requirement: {
        create: initialRequirement(business.form, name).columns,
      },
    },
  });

  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name || "",
    role: user.role,
  });

  const response = NextResponse.json({
    ok: true,
    user: { email: user.email, name: user.name, role: user.role },
  });
  response.cookies.set(SESSION_COOKIE, token, cookieOptions);
  return response;
}
