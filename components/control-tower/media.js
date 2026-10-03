"use client";

import { supabaseBrowser } from "@/lib/supabase/browser";
import { mediaUrl } from "@/lib/media-url";

let cache = null;
let inflight = null;
const listeners = new Set();

const emit = () => listeners.forEach((fn) => fn(cache));

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getCached() {
  return cache;
}

const toItem = (row) => ({
  id: row.id,
  url: row.path,
  filename: row.filename,
  contentType: row.content_type,
  size: row.size,
  width: row.width,
  height: row.height,
  alt: row.alt,
  createdAt: row.created_at,
});

export async function loadMedia({ force = false } = {}) {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;

  inflight = supabaseBrowser()
    .from("media")
    .select("*")
    .order("created_at", { ascending: false })
    .then(({ data, error }) => {
      if (error) throw new Error(error.message);
      cache = (data ?? []).map(toItem);
      emit();
      return cache;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export async function uploadMedia(file, { alt = "" } = {}) {
  const supabase = supabaseBrowser();
  const prepared = await downscale(file);

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("Your session has expired. Sign in again.");

  const stamp = new Date().toISOString().slice(0, 10);
  const safe = prepared.filename.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
  const path = `${stamp}/${crypto.randomUUID().slice(0, 8)}-${safe}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, prepared.blob, {
      contentType: prepared.blob.type || "application/octet-stream",
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("media")
    .insert({
      path,
      filename: prepared.filename,
      content_type: prepared.blob.type || "image/webp",
      size: prepared.blob.size ?? 0,
      width: prepared.width || null,
      height: prepared.height || null,
      alt,
      uploaded_by: auth.user.id,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from("media").remove([path]);
    throw new Error(error.message);
  }

  const item = toItem(data);
  cache = cache ? [item, ...cache] : [item];
  emit();
  return item;
}

export async function deleteMedia(id) {
  const supabase = supabaseBrowser();
  const item = (cache || []).find((m) => m.id === id);

  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (item?.url) await supabase.storage.from("media").remove([item.url]);

  cache = (cache || []).filter((m) => m.id !== id);
  emit();
}

const MAX_EDGE = 1600;
const QUALITY = 0.82;

export function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function downscale(file) {
  const passthrough = { blob: file, filename: file.name, width: 0, height: 0 };

  if (file.type === "image/gif" || !file.type.startsWith("image/")) return passthrough;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return passthrough;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const type = canvas.toDataURL("image/webp").startsWith("data:image/webp")
    ? "image/webp"
    : "image/jpeg";

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
  if (!blob) return passthrough;

  if (blob.size >= file.size && scale === 1) return { ...passthrough, width, height };

  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  const ext = type === "image/webp" ? "webp" : "jpg";

  return { blob, filename: `${base}.${ext}`, width, height };
}

export { mediaUrl };
