"use client";

import { supabaseBrowser } from "@/lib/supabase/browser";
import { mediaUrl } from "@/lib/media-url";

/* One shared copy of the media library.
 *
 * Every image field can open the picker, and each of them fetching the list
 * separately would mean a dozen identical requests on a page with a dozen
 * photos. The store fetches once, hands the same array to everyone, and
 * refetches only when an upload or a delete actually changes it.
 */

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
  // What gets written into the content: a bare object path, which mediaUrl
  // expands to the bucket URL wherever it is rendered.
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

/* Straight to Storage from the browser, then a row in the index.
 *
 * Not through a server action: the bytes would have to fit in the request body
 * limit and be buffered twice on the way. Row level security is what makes it
 * safe — the storage policy only accepts writes from an active staff account.
 */
export async function uploadMedia(file, { alt = "" } = {}) {
  const supabase = supabaseBrowser();
  const prepared = await downscale(file);

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("Your session has expired. Sign in again.");

  /* Date-prefixed and randomised: two people uploading poster.jpg on the same
     day must not overwrite each other, and the prefix keeps the bucket
     browsable in the Supabase dashboard. */
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
    /* The bytes landed but the index row did not. Drop the object rather than
       leave a file in the bucket that nothing can ever find or delete. */
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

  // Best effort: the row is what the library lists, so a stranded object is
  // untidy rather than broken.
  if (item?.url) await supabase.storage.from("media").remove([item.url]);

  cache = (cache || []).filter((m) => m.id !== id);
  emit();
}

/* Longest edge after resizing. The widest slot on the site is a full-width
   backdrop, and 1600px covers that on a 2x display without storing a 12MP
   phone photo. */
const MAX_EDGE = 1600;
const QUALITY = 0.82;

export function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* Resize and re-encode in the browser before upload.
 *
 * A 4MB phone photo lands as roughly 150KB of WebP, so the committee can
 * upload straight from a phone without thinking about file size and the club
 * stays inside the free storage tier. Animated GIFs pass through untouched —
 * drawing one to a canvas would flatten it to a single frame.
 */
export async function downscale(file) {
  const passthrough = { blob: file, filename: file.name, width: 0, height: 0 };

  if (file.type === "image/gif" || !file.type.startsWith("image/")) return passthrough;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return passthrough; // browser cannot decode it; let the bucket decide
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

  // WebP keeps transparency, so a logo survives the round trip.
  const type = canvas.toDataURL("image/webp").startsWith("data:image/webp")
    ? "image/webp"
    : "image/jpeg";

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
  if (!blob) return passthrough;

  // Re-encoding a small, already-optimised image can make it bigger.
  if (blob.size >= file.size && scale === 1) return { ...passthrough, width, height };

  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  const ext = type === "image/webp" ? "webp" : "jpg";

  return { blob, filename: `${base}.${ext}`, width, height };
}

export { mediaUrl };
