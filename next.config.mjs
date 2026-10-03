function supabasePattern() {
  try {
    const { protocol, hostname } = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    return [{ protocol: protocol.replace(":", ""), hostname, pathname: "/storage/v1/object/public/**" }];
  } catch {
    return [];
  }
}

const nextConfig = {
  images: {
    remotePatterns: supabasePattern(),
    deviceSizes: [400, 640, 828, 1080, 1280, 1920],
    imageSizes: [48, 96, 160, 256, 384],
    formats: ["image/avif", "image/webp"],
  },

  transpilePackages: ["three"],

  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
