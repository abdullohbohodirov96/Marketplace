import type { NextConfig } from "next";

// Fail the production build/start immediately if a secret the app cannot
// run safely without is missing, rather than deploying successfully and
// only discovering it later when a seller's "Ishlatilgan telefon qo'shish"
// request throws at request time (see src/lib/utils/imei.ts). Skipped in
// development so `npm run dev` without a full .env.local doesn't break.
if (process.env.NODE_ENV === "production" && !process.env.IMEI_HASH_SECRET) {
  throw new Error(
    "IMEI_HASH_SECRET environment o'zgaruvchisi sozlanmagan. " +
      "Render (yoki boshqa hosting) Environment Variables bo'limiga qo'shing " +
      "(generatsiya qilish uchun: openssl rand -hex 32). Tafsilot: .env.example.",
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
