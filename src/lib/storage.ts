import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads live in private buckets, so display URLs are signed on demand.
 * Files are always stored under the owner's user id folder to satisfy
 * the storage access rules.
 */

const SIGNED_TTL = 60 * 60 * 4;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
/** Raw picks can be big phone photos; they are compressed before upload. */
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i;

export function validateImage(file: File): string | null {
  // Some Android gallery apps hand over files with an empty MIME type.
  const looksLikeImage = file.type.startsWith("image/") || (!file.type && IMAGE_EXT.test(file.name));
  if (!looksLikeImage) return "Please choose a JPG, PNG or WEBP image.";
  if (file.size > MAX_IMAGE_BYTES) return "Images must be smaller than 25 MB.";
  return null;
}

/** Resize to max 1280px and re-encode as JPEG (~80%) — typically 100–300 KB. */
export async function compressImage(file: File, maxSide = 1280, quality = 0.8): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // format the browser can't decode — upload as is
  }
}

export async function uploadFile(bucket: string, userId: string, file: File): Promise<string> {
  const upload = file.type.startsWith("image/") || !file.type ? await compressImage(file) : file;
  const ext = (upload.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, upload, { upsert: false, contentType: upload.type || "image/jpeg" });
  if (error) {
    console.error("upload failed", bucket, error);
    throw error;
  }
  return path;
}

export async function signedUrl(bucket: string, path: string): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_TTL);
  return data?.signedUrl ?? null;
}

/** Stored value may already be an external URL (sample data) or a bucket path. */
export async function resolveMediaUrls(bucket: string, paths: string[]): Promise<string[]> {
  const out = await Promise.all(paths.map((p) => signedUrl(bucket, p)));
  return out.filter((u): u is string => Boolean(u));
}
