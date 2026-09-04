import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Kategoriyalar" };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name_uz, slug, icon, parent_id")
    .eq("is_active", true)
    .is("parent_id", null)
    .order("sort_order", { ascending: true });

  const hasCategories = !!categories && categories.length > 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container py-8 sm:py-12">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Kategoriyalar
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Kerakli mahsulot toifasini tanlang.
          </p>

          {hasCategories ? (
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card p-5 text-center transition-colors hover:border-primary/40 hover:bg-primary-50"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
                    <LayoutGrid className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{cat.name_uz}</span>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="mt-7 flex flex-col items-center gap-2 border-dashed p-10 text-center">
              <p className="font-medium text-foreground">Kategoriyalar hali qo’shilmagan</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Admin panel orqali kategoriyalar qo’shilgach, ular shu yerda ko’rinadi.
              </p>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
