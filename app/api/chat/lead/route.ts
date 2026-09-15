import { NextResponse } from "next/server";
import { z } from "zod";
import { IRAN_PHONE, normalizePhone } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({
  phone: z.string(),
  name: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "شماره موبایل لازم است." }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!IRAN_PHONE.test(phone)) {
    return NextResponse.json(
      { error: "شماره موبایل معتبر نیست. با ۰۹ شروع شود." },
      { status: 400 },
    );
  }

  const session = await getSession();
  const lead = await prisma.campaignLead.create({
    data: {
      phone,
      name: parsed.data.name?.trim() || session?.name || null,
      message: parsed.data.message?.slice(0, 500) || null,
      userId: session?.sub,
    },
  });

  return NextResponse.json({ ok: true, id: lead.id, phone });
}
