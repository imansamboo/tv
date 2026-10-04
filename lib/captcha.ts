import { jwtVerify, SignJWT } from "jose";
import { toEnDigits } from "./format";

const PERSIAN_NUMBERS: readonly [number, string][] = [
  [1, "یک"],
  [2, "دو"],
  [3, "سه"],
  [4, "چهار"],
  [5, "پنج"],
  [6, "شش"],
  [7, "هفت"],
  [8, "هشت"],
  [9, "نه"],
];

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "fariman-dev-secret-change-me-please",
  );
}

function numberWord(value: number) {
  return PERSIAN_NUMBERS.find(([digit]) => digit === value)?.[1] ?? String(value);
}

export type CaptchaChallenge = {
  token: string;
  question: string;
};

/** Builds a short Persian math question and signs the expected numeric answer. */
export async function createCaptchaChallenge(): Promise<CaptchaChallenge> {
  const left = 1 + Math.floor(Math.random() * 9);
  const right = 1 + Math.floor(Math.random() * 9);
  const subtract = Math.random() < 0.35 && left > right;
  const answer = subtract ? left - right : left + right;
  const question = subtract
    ? `${numberWord(left)} منهای ${numberWord(right)} چند می‌شود؟`
    : `${numberWord(left)} به‌علاوه ${numberWord(right)} چند می‌شود؟`;

  const token = await new SignJWT({ kind: "captcha", answer })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret());

  return { token, question };
}

export function parseCaptchaAnswer(raw: string) {
  const normalized = toEnDigits(raw.trim()).replace(/\s+/g, "");
  if (!/^-?\d+$/.test(normalized)) return null;
  return Number(normalized);
}

export async function verifyCaptcha(token: string, rawAnswer: string) {
  const answer = parseCaptchaAnswer(rawAnswer);
  if (answer === null) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.kind !== "captcha" || typeof payload.answer !== "number") return false;
    return payload.answer === answer;
  } catch {
    return false;
  }
}

export const CAPTCHA_INVALID_MESSAGE = "پاسخ کد امنیتی درست نیست. دوباره تلاش کنید.";
export const CAPTCHA_REQUIRED_MESSAGE = "پاسخ کد امنیتی را وارد کنید.";
export const CAPTCHA_LOADING_MESSAGE =
  "کد امنیتی هنوز آماده نیست. لطفاً صبر کنید یا دکمه «جدید» را بزنید.";

/** Returns the first captcha input error, before any other field is checked. */
export function captchaInputError(token: unknown, answer: unknown) {
  const normalizedToken = typeof token === "string" ? token.trim() : "";
  const normalizedAnswer = typeof answer === "string" ? answer.trim() : "";
  if (!normalizedToken) return CAPTCHA_LOADING_MESSAGE;
  if (!normalizedAnswer) return CAPTCHA_REQUIRED_MESSAGE;
  return null;
}

export async function requireValidCaptcha(token: unknown, answer: unknown) {
  const inputError = captchaInputError(token, answer);
  if (inputError) return { ok: false as const, error: inputError };
  const valid = await verifyCaptcha(String(token).trim(), String(answer).trim());
  if (!valid) return { ok: false as const, error: CAPTCHA_INVALID_MESSAGE };
  return { ok: true as const };
}
