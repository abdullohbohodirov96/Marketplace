import { createClient } from "@/lib/supabase/server";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { CategoriesStrip } from "@/components/landing/categories-strip";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { ShowcaseSection } from "@/components/landing/showcase-section";
import { CtaSection } from "@/components/landing/cta-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name_uz, slug")
    .eq("is_active", true)
    .is("parent_id", null)
    .order("sort_order", { ascending: true })
    .limit(6);

  return (
    <div className="flex min-h-dvh flex-col bg-[#0a0b18]">
      <LandingHeader />

      <main className="flex-1 pb-16 lg:pb-0">
        <HeroSection />
        <FeaturesSection />
        <CategoriesStrip categories={categories ?? []} />
        <BenefitsSection />
        <ShowcaseSection />
        <CtaSection />
      </main>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
