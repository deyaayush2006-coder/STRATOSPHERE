/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Images come from Supabase Storage and from public/, and are rendered with
     plain <img> rather than next/image — the site's art direction relies on
     object-fit and fixed aspect ratios that the optimiser would fight. */
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
