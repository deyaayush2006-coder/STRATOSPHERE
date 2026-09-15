/* Where optimised images are allowed to come from.
 *
 * Uploads live in Supabase Storage, whose hostname is per-project and only
 * known from the environment, so it is read rather than hardcoded. Anything
 * under public/ is same-origin and needs no entry at all.
 *
 * A missing or malformed URL is not fatal: next/image simply refuses to
 * optimise remote files, and every component that renders one falls back to
 * the unoptimised source. */
function supabasePattern() {
  try {
    const { protocol, hostname } = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    return [{ protocol: protocol.replace(":", ""), hostname, pathname: "/storage/v1/object/public/**" }];
  } catch {
    return [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: supabasePattern(),
    // The widths the site actually renders at: full-bleed covers, the two card
    // grids, and the 48px committee avatars.
    deviceSizes: [400, 640, 828, 1080, 1280, 1920],
    imageSizes: [48, 96, 160, 256, 384],
    formats: ["image/avif", "image/webp"],
  },

  /* three.js ships as ESM with deep subpath imports; transpiling keeps the
     examples/jsm modules drei reaches for from breaking the server build. */
  transpilePackages: ["three"],

  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
