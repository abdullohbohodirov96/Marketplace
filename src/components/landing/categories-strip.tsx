import Link from "next/link";
import { LayoutGrid, Smartphone, Laptop, Headphones, Cpu, Watch, Camera } from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

const FALLBACK_ICONS = [Smartphone, Laptop, Headphones, Cpu, Watch, Camera];

export function CategoriesStrip({
  categories,
}: {
  categories: { id: string; name_uz: string; slug: string }[];
}) {
  if (categories.length === 0) return null;

  return (
    <section className="relative bg-[#0a0b18] pb-16 sm:pb-24">
      <div className="container">
        <ScrollReveal className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Mashhur kategoriyalar
          </h2>
          <Link href="/categories" className="text-sm font-medium text-primary-400 hover:text-primary-300">
            Hammasi &rarr;
          </Link>
        </ScrollReveal>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {categories.map((cat, i) => {
            const Icon = FALLBACK_ICONS[i % FALLBACK_ICONS.length] ?? LayoutGrid;
            return (
              <ScrollReveal key={cat.id} delay={0.04 * i}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="flex flex-col items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center backdrop-blur transition-colors hover:border-primary-400/30 hover:bg-white/[0.07]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-primary-300 ring-1 ring-white/10">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-white/80 sm:text-sm">{cat.name_uz}</span>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
