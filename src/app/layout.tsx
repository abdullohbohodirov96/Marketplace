import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
// Self-hosted (npm package, no runtime/build-time fetch to Google's CDN —
// more reliable for CI/offline builds than next/font/google). Includes
// Latin + Cyrillic, matching the uz/ru locales.
import "@fontsource-variable/inter";
import "@fontsource-variable/inter/wght-italic.css";
import "./globals.css";

const SITE_TITLE = "Telefy — Malika bozori onlayn";
const SITE_DESCRIPTION = "Malika elektronika bozoridagi eng yaxshi takliflarni toping va solishtiring.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: SITE_TITLE,
    template: "%s | Telefy",
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  // Per-page routes (product/used/store) override title/description/images
  // via their own generateMetadata — this is the fallback for everything
  // else (home, categories, /about, etc.) so a shared link never renders
  // blank on Telegram/Instagram.
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    siteName: "Telefy",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/logo-full.png", width: 1901, height: 535, alt: "Telefy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/logo-full.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
