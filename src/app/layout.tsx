import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
// Self-hosted (npm package, no runtime/build-time fetch to Google's CDN —
// more reliable for CI/offline builds than next/font/google). Includes
// Latin + Cyrillic, matching the uz/ru locales.
import "@fontsource-variable/inter";
import "@fontsource-variable/inter/wght-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Malika Market — Malika bozori onlayn",
    template: "%s | Malika Market",
  },
  description:
    "Malika elektronika bozoridagi eng yaxshi takliflarni toping va solishtiring.",
  manifest: "/manifest.webmanifest",
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
