"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. Deliberately does NOT render <SiteHeader> —
 * that's an async server component that hits Supabase (auth + unread
 * notification count), and a Client Component boundary like this one can't
 * safely assume the request that crashed the page still has a working DB
 * connection. This stays a minimal, self-contained shell instead.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Root cause stays visible in server/edge logs (and the browser
    // console) rather than being swallowed — no silent failure.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center">
          <Logo />
        </div>
      </header>
      <main className="flex-1">
        <div className="container flex flex-col items-center gap-4 py-20 text-center sm:py-28">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Nimadir xato ketdi
          </h1>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">
            Sahifani yuklashda kutilmagan xatolik yuz berdi. Qaytadan urinib ko&rsquo;ring yoki bosh
            sahifaga qayting.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={reset}>
              <RotateCw />
              Qayta urinish
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <Home />
                Bosh sahifaga qaytish
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
