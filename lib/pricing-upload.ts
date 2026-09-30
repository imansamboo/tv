import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "pricing");
const PUBLIC_PREFIX = "/uploads/pricing/";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const UPLOAD_TYPE_MESSAGE = "فقط تصویر PNG، JPG، WebP یا GIF مجاز است.";
export const UPLOAD_SIZE_MESSAGE = "حجم تصویر باید کمتر از ۲ مگابایت باشد.";
export const UPLOAD_MISSING_MESSAGE = "فایل تصویر را انتخاب کنید.";
export const IMAGE_PATH_MESSAGE = "آدرس تصویر معتبر نیست؛ تصویر را دوباره بارگذاری کنید.";

/**
 * Only paths this module produced are accepted back from the admin client, so a
 * crafted `imageUrl` cannot point the page (or the unlink below) anywhere else.
 */
const STORED_IMAGE_PATH = /^\/uploads\/pricing\/[A-Za-z0-9_-]+\.(?:png|jpg|webp|gif)$/;

export function isStoredPricingImage(url: string) {
  return STORED_IMAGE_PATH.test(url);
}

export async function savePricingImage(
  file: File,
): Promise<{ imageUrl: string } | { error: string }> {
  const extension = EXTENSION_BY_TYPE[file.type];
  if (!extension) return { error: UPLOAD_TYPE_MESSAGE };
  if (file.size === 0) return { error: UPLOAD_MISSING_MESSAGE };
  if (file.size > MAX_UPLOAD_BYTES) return { error: UPLOAD_SIZE_MESSAGE };

  const name = `${randomUUID()}.${extension}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return { imageUrl: `${PUBLIC_PREFIX}${name}` };
}

/** Best-effort cleanup once an image is replaced or removed. */
export async function deletePricingImage(url: string | null | undefined) {
  if (!url || !isStoredPricingImage(url)) return;
  await unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => undefined);
}
