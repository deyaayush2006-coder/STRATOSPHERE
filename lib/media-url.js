const BUCKET_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media`;

export function mediaUrl(src) {
  if (!src) return "";
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return src;
  if (src.startsWith("/")) return src;
  return `${BUCKET_BASE}/${src}`;
}

// next/image only optimises hosts listed in next.config.mjs (this site and the
// Supabase bucket); any other host throws and takes the page down. Images from
// elsewhere are passed through unoptimised instead.
export function isOptimisable(src) {
  const url = mediaUrl(src);
  return (url.startsWith("/") && !url.startsWith("//")) || url.startsWith(`${BUCKET_BASE}/`);
}
