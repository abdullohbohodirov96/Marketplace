import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Store, Phone, BadgeCheck } from "lucide-react";
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
  const { data: store } = await supabase.from("stores").select("name").eq("slug", slug).maybeSingle();
  return { title: store?.name ?? "Do'kon" };
}

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, short_description, description, phone_primary, verified, rating_avg, rating_count, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!store || store.status !== "approved") notFound();

  const [{ data: rawOffers }, { data: rawUsedDevices }] = await Promise.all([
    supabase
      .from("product_offers")
      .select("id, slug, seller_product_name, price, old_price, condition, catalog_product_id, store_id")
      .eq("store_id", store.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("used_device_units")
      .select("id, slug, title, price, battery_health, telefy_check_status, catalog_product_id, store_id")
      .eq("store_id", store.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const [newProducts, usedProducts] = await Promise.all([
    hydrateOfferCards(supabase, (rawOffers ?? []) as RawOffer[]),
    hydrateUsedDeviceCards(supabase, (rawUsedDevices ?? []) as RawUsedDevice[]),
  ]);
  const products = [...newProducts, ...usedProducts];

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container py-8 sm:py-12">
          <div className="flex items-start gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
              <Store className="h-8 w-8" />
            </span>
            <div className="min-w-0">
              <h1 className="flex items-center gap-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {store.name}
                {store.verified && <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />}
              </h1>
              {store.rating_count > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {store.rating_avg.toFixed(1)} ★ ({store.rating_count} baho)
                </p>
              )}
              <a
                href={`tel:${store.phone_primary}`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                {store.phone_primary}
              </a>
            </div>
          </div>

          {(store.description || store.short_description) && (
            <p className="mt-5 max-w-2xl text-sm text-muted-foreground">
              {store.description || store.short_description}
            </p>
          )}

          <h2 className="mb-3 mt-8 text-lg font-semibold text-foreground">
            Mahsulotlar {products.length > 0 && `(${products.length})`}
          </h2>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center gap-2 border-dashed p-10 text-center">
              <p className="font-medium text-foreground">Hozircha mahsulot yo&rsquo;q</p>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
