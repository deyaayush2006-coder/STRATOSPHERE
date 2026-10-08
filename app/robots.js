import { SITE_URL } from "@/lib/site-url";

// The admin path is deliberately not listed here: robots.txt is public, so
// naming it would advertise it. The admin layout already sends noindex.
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
