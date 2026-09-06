import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads live in private buckets, so display URLs are signed on demand.
 * Files are always stored under the owner's user id folder to satisfy
 * the storage access rules.
 */

const SIGNED_TTL = 60 * 60 * 4;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
    return "Please choose a JPG, PNG or WEBP image.";
  }
  if (file.size > MAX_IMAGE_BYTES) return "Images must be smaller than 8 MB.";
  return null;
}

export async function uploadFile(bucket: string, userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
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
