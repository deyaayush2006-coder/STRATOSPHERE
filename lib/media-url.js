const BUCKET_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media`;

export function mediaUrl(src) {
  if (!src) return "";
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return src;
  if (src.startsWith("/")) return src;
  return `${BUCKET_BASE}/${src}`;
}
