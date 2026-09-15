const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toEnDigits(value: string) {
  return value.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

export function toFaDigits(value: string | number) {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function toman(amount: number) {
  return `${toFaDigits(Math.round(amount).toLocaleString("en-US"))} تومان`;
}

export function faDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export const IRAN_PHONE = /^09\d{9}$/;

export function normalizePhone(value: string) {
  const digits = toEnDigits(value).replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.startsWith("9") && digits.length === 10) return `0${digits}`;
  return digits;
}
