/* Turns a stored image reference into something the browser can load.
 *
 * Kept apart from the Supabase clients on purpose: this is imported by client
 * components, and pulling in supabase-js just to build a string would put the
 * whole library in the browser bundle.
 *
 * Three kinds of value reach it, and all three have to keep working:
 *   - a bare object path        -> an upload, served from the media bucket
 *   - a path under public/      -> an image that shipped with the repo
 *   - an absolute URL or data:  -> left exactly as it is
 */
const BUCKET_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media`;

export function mediaUrl(src) {
  if (!src) return "";
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return src;
  if (src.startsWith("/")) return src;
  return `${BUCKET_BASE}/${src}`;
}
