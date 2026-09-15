import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookieOptions, signSession, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emptyRequirement } from "@/lib/form";

const schema = z.object({
  name: z.string().trim().min(3, "نام را کامل وارد کنید."),
  email: z.string().trim().toLowerCase().email("ایمیل معتبر نیست."),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر باشد."),
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

  const { name, email, password } = parsed.data;
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
      requirement: {
        create: {
          data: JSON.stringify(emptyRequirement()),
        },
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
