// Security headers for every response. Kept out of next.config.mjs so tests
// can check them.
//
// The full Content-Security-Policy ships as Report-Only first: watch the
// browser console on a preview deploy, fix anything it reports, then move it
// to the enforced header. The enforced header already blocks framing
// (clickjacking on the admin panel), plugins, <base> hijacking and forms
// posting to other sites.

function supabaseOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
  } catch {
    return "";
  }
}

export function contentSecurityPolicy({ dev = process.env.NODE_ENV !== "production" } = {}) {
  const supabase = supabaseOrigin();
  const realtime = supabase.replace(/^https:/, "wss:");
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${supabase}`.trim(),
    `media-src 'self' blob: ${supabase}`.trim(),
    "font-src 'self' data:",
    `connect-src 'self' ${supabase} ${realtime}`.trim(),
    "worker-src 'self' blob:",
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export const ENFORCED_CSP = "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";

export function securityHeaders() {
  return [
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Content-Security-Policy", value: ENFORCED_CSP },
    { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy() },
  ];
}
