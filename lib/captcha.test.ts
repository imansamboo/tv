import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CAPTCHA_INVALID_MESSAGE,
  CAPTCHA_LOADING_MESSAGE,
  CAPTCHA_REQUIRED_MESSAGE,
  captchaInputError,
  createCaptchaChallenge,
  parseCaptchaAnswer,
  requireValidCaptcha,
  verifyCaptcha,
} from "./captcha";
import { toFaDigits } from "./format";

const WORD_TO_DIGIT = new Map(
  ["یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"].map((word, index) => [
    word,
    index + 1,
  ]),
);

function expectedAnswer(question: string) {
  const [leftWord, operator, rightWord] = question.replace("؟", "").split(/\s+/);
  const left = WORD_TO_DIGIT.get(leftWord!) ?? 0;
  const right = WORD_TO_DIGIT.get(rightWord!) ?? 0;
  return operator === "منهای" ? left - right : left + right;
}

test("captcha question is Persian and verification accepts fa digits", async () => {
  const challenge = await createCaptchaChallenge();
  assert.match(challenge.question, /(به‌علاوه|منهای)/);
  assert.match(challenge.question, /چند می‌شود؟/);

  const expected = expectedAnswer(challenge.question);
  assert.equal(await verifyCaptcha(challenge.token, String(expected)), true);
  assert.equal(await verifyCaptcha(challenge.token, toFaDigits(expected)), true);
});

test("parseCaptchaAnswer normalizes Persian digits", () => {
  assert.equal(parseCaptchaAnswer("  ۱۲ "), 12);
  assert.equal(parseCaptchaAnswer("7"), 7);
  assert.equal(parseCaptchaAnswer("abc"), null);
});

test("captcha input is checked before other fields", () => {
  assert.equal(captchaInputError("", ""), CAPTCHA_LOADING_MESSAGE);
  assert.equal(captchaInputError("token", ""), CAPTCHA_REQUIRED_MESSAGE);
  assert.equal(captchaInputError("token", "  "), CAPTCHA_REQUIRED_MESSAGE);
  assert.equal(captchaInputError("token", "7"), null);
});

test("requireValidCaptcha rejects bad answers before credential checks would run", async () => {
  const challenge = await createCaptchaChallenge();
  const missing = await requireValidCaptcha(challenge.token, "");
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.error, CAPTCHA_REQUIRED_MESSAGE);

  const wrong = await requireValidCaptcha(challenge.token, "99999");
  assert.equal(wrong.ok, false);
  if (!wrong.ok) assert.equal(wrong.error, CAPTCHA_INVALID_MESSAGE);
});

test("invalid captcha answers are rejected", async () => {
  const challenge = await createCaptchaChallenge();
  assert.equal(await verifyCaptcha(challenge.token, "99999"), false);
  assert.equal(await verifyCaptcha("bad-token", "1"), false);
  assert.ok(CAPTCHA_INVALID_MESSAGE.length > 0);
});
