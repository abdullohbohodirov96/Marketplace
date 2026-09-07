import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

/**
 * Shared shell for the three "real content, not a stub" legal/info pages
 * (/about, /privacy, /terms) — plain prose, no typography plugin installed,
 * so headings/paragraphs/lists are styled by hand here instead of a global
 * `prose` class.
 */
export function LegalPage({
  icon: Icon,
  title,
  updatedAt,
  intro,
  sections,
}: {
  icon: LucideIcon;
  title: string;
  updatedAt: string;
  intro?: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container max-w-3xl py-10 sm:py-14">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
              <p className="text-xs text-muted-foreground">Oxirgi yangilanish: {updatedAt}</p>
            </div>
          </div>

          {intro && <div className="mt-6 text-sm leading-relaxed text-muted-foreground sm:text-base">{intro}</div>}

          <div className="mt-8 flex flex-col gap-8">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
                <div className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
