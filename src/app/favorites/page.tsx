import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Store, Phone, BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hydrateOfferCards, type RawOffer } from "@/lib/marketplace/hydrate-offers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ProductCard } from "@/components/marketplace/product-card";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Saqlanganlar" };

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects a signed-out visitor to /login before this
  // ever renders — this is just the type-safe fallback.
  if (!user) return null;

  const [{ data: favoriteRows }, { data: savedStoreRows }] = await Promise.all([
    supabase.from("favorites").select("product_offer_id").eq("user_id", user.id),
    supabase.from("saved_stores").select("store_id").eq("user_id", user.id),
  ]);

  const offerIds = (favoriteRows ?? []).map((f) => f.product_offer_id);
  const storeIds = (savedStoreRows ?? []).map((s) => s.store_id);

  const [{ data: rawOffers }, { data: savedStores }] = await Promise.all([
    offerIds.length > 0
      ? supabase
          .from("product_offers")
          .select("id, slug, seller_product_name, price, old_price, condition, catalog_product_id, store_id")
          .in("id", offerIds)
          .eq("status", "active")
          .is("deleted_at", null)
      : Promise.resolve({ data: [] as RawOffer[] }),
    storeIds.length > 0
      ? supabase
          .from("stores")
          .select("id, name, slug, short_description, phone_primary, verified, rating_avg, rating_count")
          .in("id", storeIds)
          .eq("status", "approved")
      : Promise.resolve({
          data: [] as {
            id: string;
            name: string;
            slug: string;
            short_description: string | null;
            phone_primary: string;
            verified: boolean;
            rating_avg: number;
            rating_count: number;
          }[],
        }),
  ]);

  const products = await hydrateOfferCards(supabase, (rawOffers ?? []) as RawOffer[]);
  const stores = savedStores ?? [];

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container py-8 sm:py-12">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Saqlanganlar</h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Sevimli e&rsquo;lonlaringiz va do&rsquo;konlaringiz shu yerda.
          </p>

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
            <Card className="flex flex-col items-center gap-2 border-dashed p-8 text-center">
              <Heart className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Hali saqlangan mahsulot yo&rsquo;q</p>
            </Card>
          )}

          <h2 className="mb-3 mt-8 text-lg font-semibold text-foreground">
            Do&rsquo;konlar {stores.length > 0 && `(${stores.length})`}
          </h2>
          {stores.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/stores/${store.slug}`}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                      <Store className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 truncate font-medium text-foreground">
                        {store.name}
                        {store.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                      </p>
                      {store.rating_count > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {store.rating_avg.toFixed(1)} ★ ({store.rating_count})
                        </p>
                      )}
                    </div>
                  </div>
                  {store.short_description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{store.short_description}</p>
                  )}
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {store.phone_primary}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center gap-2 border-dashed p-8 text-center">
              <Store className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Hali saqlangan do&rsquo;kon yo&rsquo;q</p>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
