"use client";

import { useEffect } from "react";

/**
 * Last-resort fallback for a crash in the root layout itself (fonts,
 * <Providers>, etc.) — the one place Next.js requires a full <html>/<body>,
 * since this replaces the root layout rather than rendering inside it.
 * Kept deliberately plain (inline styles, no design-system imports): if the
 * root layout is what broke, importing more of the app risks failing again.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="uz">
      <body
        style={{
          display: "flex",
          minHeight: "100dvh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Nimadir xato ketdi</h1>
        <p style={{ maxWidth: 28 + "rem", fontSize: "0.9rem", color: "#64748b", margin: 0 }}>
          Sahifani yuklab bo&rsquo;lmadi. Iltimos, qayta urinib ko&rsquo;ring.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            padding: "0.65rem 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#3730c9",
            color: "#fff",
            fontSize: "0.9rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Qayta urinish
        </button>
      </body>
    </html>
  );
}
