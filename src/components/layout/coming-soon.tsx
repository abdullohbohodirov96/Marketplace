import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Button } from "@/components/ui/button";

/**
 * Shared placeholder for routes that are linked from nav/footer today but
 * whose real implementation lands in a later stage (see README roadmap).
 * Renders the full shell (header/footer/mobile nav) so navigation never
 * dead-ends in a 404 — only the page body is "tez orada" for now.
 */
export function ComingSoonPage({
  icon: Icon,
  title,
  description,
  stage,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  stage?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container flex flex-col items-center gap-4 py-20 text-center sm:py-28">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary">
            <Icon className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">{description}</p>
          {stage && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">{stage}</p>
          )}
          <Button variant="outline" asChild className="mt-2">
            <Link href="/">
              <ArrowLeft />
              Bosh sahifaga qaytish
            </Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
