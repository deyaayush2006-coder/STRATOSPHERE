import { api, mediaUrl } from "../lib/api";

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

export async function loadMedia({ force = false } = {}) {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;

  inflight = api
    .listMedia()
    .then(({ items }) => {
      cache = items;
      emit();
      return items;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export async function uploadMedia(file, { alt = "" } = {}) {
  const prepared = await downscale(file);

  const form = new FormData();
  form.append("file", prepared.blob, prepared.filename);
  form.append("alt", alt);
  if (prepared.width) form.append("width", String(prepared.width));
  if (prepared.height) form.append("height", String(prepared.height));

  const { media } = await api.uploadMedia(form);
  cache = cache ? [media, ...cache] : [media];
  emit();
  return media;
}

export async function deleteMedia(id) {
  await api.deleteMedia(id);
  cache = (cache || []).filter((m) => m.id !== id);
  emit();
}

/* Longest edge after resizing. The widest slot on the site is a full-width
   backdrop, and 1600px covers that on a 2x display without storing a 12MP
   phone photo in the database. */
const MAX_EDGE = 1600;
const QUALITY = 0.82;

export function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* Resize and re-encode in the browser before upload.
 *
 * This is what keeps images in Mongo viable: a 4MB phone photo lands as
 * roughly 150KB of WebP, so the admin can upload from their phone without
 * thinking about file size and the club never runs into the storage tier.
 * Animated GIFs are passed through untouched — drawing one to a canvas would
 * flatten it to a single frame.
 */
export async function downscale(file) {
  const passthrough = { blob: file, filename: file.name, width: 0, height: 0 };

  if (file.type === "image/gif" || !file.type.startsWith("image/")) return passthrough;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return passthrough; // browser cannot decode it; let the server decide
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
