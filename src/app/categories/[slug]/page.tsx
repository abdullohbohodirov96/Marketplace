import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hydrateOfferCards, hydrateUsedDeviceCards, type RawOffer, type RawUsedDevice } from "@/lib/marketplace/hydrate-offers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ProductCard } from "@/components/marketplace/product-card";
import { Card } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name_uz")
    .eq("slug", slug)
    .maybeSingle();
  return { title: category?.name_uz ?? "Kategoriya" };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name_uz, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!category) notFound();

  const { data: catalogProducts } = await supabase
    .from("catalog_products")
    .select("id")
    .eq("category_id", category.id)
    .eq("status", "approved");

  const catalogIds = (catalogProducts ?? []).map((c) => c.id);

  const [{ data: rawOffers }, { data: rawUsedDevices }] = catalogIds.length
    ? await Promise.all([
        supabase
          .from("product_offers")
          .select("id, slug, seller_product_name, price, old_price, condition, catalog_product_id, store_id")
          .in("catalog_product_id", catalogIds)
          .eq("status", "active")
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("used_device_units")
          .select("id, slug, title, price, battery_health, telefy_check_status, catalog_product_id, store_id")
          .in("catalog_product_id", catalogIds)
          .eq("status", "active")
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] as RawOffer[] }, { data: [] as RawUsedDevice[] }];

  const [newProducts, usedProducts] = await Promise.all([
    hydrateOfferCards(supabase, rawOffers ?? []),
    hydrateUsedDeviceCards(supabase, rawUsedDevices ?? []),
  ]);
  const products = [...newProducts, ...usedProducts];

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container py-8 sm:py-12">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {category.name_uz}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            {products.length > 0
              ? `${products.length} ta mahsulot topildi`
              : "Ushbu kategoriyada hali mahsulot yo'q"}
          </p>

          {products.length > 0 ? (
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <Card className="mt-7 flex flex-col items-center gap-2 border-dashed p-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
                <PackageSearch className="h-6 w-6" />
              </span>
              <p className="font-medium text-foreground">Hozircha mahsulot yo&rsquo;q</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Sotuvchilar ushbu kategoriyaga mahsulot qo&rsquo;shishi bilanoq bu yerda ko&rsquo;rinadi.
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
