import type { Metadata } from "next";
import { Search as SearchIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hydrateOfferCards, type RawOffer } from "@/lib/marketplace/hydrate-offers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ProductCard } from "@/components/marketplace/product-card";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Qidiruv" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();

  let rawOffers: RawOffer[] = [];

  if (query.length >= 2) {
    const { data: matchingCatalogProducts } = await supabase
      .from("catalog_products")
      .select("id")
      .eq("status", "approved")
      .ilike("name", `%${query}%`);

    const catalogIds = (matchingCatalogProducts ?? []).map((c) => c.id);

    const [{ data: offersByCatalog }, { data: offersByName }] = await Promise.all([
      catalogIds.length
        ? supabase
            .from("product_offers")
            .select("id, slug, seller_product_name, price, old_price, condition, catalog_product_id, store_id")
            .in("catalog_product_id", catalogIds)
            .eq("status", "active")
            .is("deleted_at", null)
        : Promise.resolve({ data: [] as RawOffer[] }),
      supabase
        .from("product_offers")
        .select("id, slug, seller_product_name, price, old_price, condition, catalog_product_id, store_id")
        .ilike("seller_product_name", `%${query}%`)
        .eq("status", "active")
        .is("deleted_at", null),
    ]);

    const byId = new Map<string, RawOffer>();
    for (const offer of [...(offersByCatalog ?? []), ...(offersByName ?? [])]) {
      byId.set(offer.id, offer);
    }
    rawOffers = [...byId.values()];
  }

  const products = await hydrateOfferCards(supabase, rawOffers);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container py-8 sm:py-12">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Qidiruv</h1>

          <form action="/search" method="GET" className="relative mt-5 max-w-xl">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Mahsulot nomini kiriting..."
              className="h-12 w-full rounded-lg border border-input bg-secondary/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
          </form>

          {query.length > 0 && query.length < 2 && (
            <p className="mt-4 text-sm text-muted-foreground">Kamida 2 ta belgi kiriting.</p>
          )}

          {query.length >= 2 && (
            <p className="mt-5 text-sm text-muted-foreground">
              &ldquo;{query}&rdquo; bo&rsquo;yicha {products.length} ta natija
            </p>
          )}

          {products.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            query.length >= 2 && (
              <Card className="mt-7 flex flex-col items-center gap-2 border-dashed p-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <SearchIcon className="h-6 w-6" />
                </span>
                <p className="font-medium text-foreground">Hech narsa topilmadi</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Boshqa so&rsquo;z bilan qidirib ko&rsquo;ring yoki imloni tekshiring.
                </p>
              </Card>
            )
          )}
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
