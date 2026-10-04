import { NextResponse } from "next/server";
import { createCaptchaChallenge } from "@/lib/captcha";

export async function GET() {
  const challenge = await createCaptchaChallenge();
  return NextResponse.json(challenge);
}
