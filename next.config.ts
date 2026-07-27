import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ?? '',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: 'woqrmopjginkkngxmdzf.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
};

export default nextConfig;
