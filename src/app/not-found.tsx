import Link from "next/link";
import { Home, Search } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container flex flex-col items-center gap-4 py-20 text-center sm:py-28">
          <p className="text-7xl font-bold tracking-tight text-primary-200 sm:text-8xl" aria-hidden="true">
            404
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Sahifa topilmadi
          </h1>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">
            Siz qidirayotgan sahifa o&rsquo;chirilgan yoki manzil noto&rsquo;g&rsquo;ri kiritilgan bo&rsquo;lishi
            mumkin.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/">
                <Home />
                Bosh sahifaga qaytish
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/search">
                <Search />
                Qidiruvga o&rsquo;tish
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
