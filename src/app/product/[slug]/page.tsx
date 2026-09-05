import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Store, ShieldCheck, BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductThumb } from "@/components/marketplace/product-thumb";
import { ReserveButton } from "@/components/marketplace/reserve-button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Button } from "@/components/ui/button";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("uz-UZ").format(Math.round(value));
}

async function getOfferBySlug(slug: string) {
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from("product_offers")
    .select(
      "id, slug, seller_product_name, price, old_price, condition, description, warranty_months, delivery_available, catalog_product_id, store_id, status",
    )
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (!offer) return null;

  const [{ data: catalogProduct }, { data: store }, { data: otherOffersRaw }] = await Promise.all([
    supabase.from("catalog_products").select("name, category_id").eq("id", offer.catalog_product_id).maybeSingle(),
    supabase
      .from("stores")
      .select("id, name, slug, phone_primary, verified, status")
      .eq("id", offer.store_id)
      .maybeSingle(),
    supabase
      .from("product_offers")
      .select("id, slug, price, store_id")
      .eq("catalog_product_id", offer.catalog_product_id)
      .eq("status", "active")
      .is("deleted_at", null)
      .neq("id", offer.id)
      .order("price", { ascending: true })
      .limit(5),
  ]);

  const { data: category } = catalogProduct
    ? await supabase.from("categories").select("slug, name_uz").eq("id", catalogProduct.category_id).maybeSingle()
    : { data: null };

  const otherStoreIds = [...new Set((otherOffersRaw ?? []).map((o) => o.store_id))];
  const { data: otherStores } = otherStoreIds.length
    ? await supabase.from("stores").select("id, name").in("id", otherStoreIds).eq("status", "approved")
    : { data: [] as { id: string; name: string }[] };
  const otherStoreNameById = new Map((otherStores ?? []).map((s) => [s.id, s.name]));
  const otherOffers = (otherOffersRaw ?? [])
    .filter((o) => otherStoreNameById.has(o.store_id))
    .map((o) => ({ ...o, storeName: otherStoreNameById.get(o.store_id)! }));

  return { offer, catalogProduct, store, category, otherOffers };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getOfferBySlug(slug);
  const title = result?.offer.seller_product_name || result?.catalogProduct?.name || "Mahsulot";
  return { title };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const [result, { data: userData }] = await Promise.all([getOfferBySlug(slug), supabase.auth.getUser()]);

  if (!result || result.offer.status !== "active" || !result.store || result.store.status !== "approved") {
    notFound();
  }

  const { offer, catalogProduct, store, category, otherOffers } = result;
  const title = offer.seller_product_name || catalogProduct?.name || "Mahsulot";
  const hasDiscount = !!offer.old_price && offer.old_price > offer.price;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container max-w-3xl py-8 sm:py-12">
          <div className="grid gap-8 sm:grid-cols-2">
            <ProductThumb categorySlug={category?.slug} seed={offer.slug} className="aspect-square w-full" />

            <div className="flex flex-col gap-4">
              {category && (
                <Link
                  href={`/categories/${category.slug}`}
                  className="text-xs font-medium uppercase tracking-wide text-primary hover:underline"
                >
                  {category.name_uz}
                </Link>
              )}
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground sm:text-3xl">
                  {formatPrice(offer.price)}
                </span>
                <span className="text-sm text-muted-foreground">so&rsquo;m</span>
              </div>
              {hasDiscount && (
                <span className="-mt-3 text-sm text-muted-foreground line-through">
                  {formatPrice(offer.old_price!)} so&rsquo;m
                </span>
              )}

              <div className="flex flex-wrap gap-2">
                <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                  {offer.condition === "used" ? "Ishlatilgan" : "Yangi"}
                </span>
                {offer.warranty_months > 0 && (
                  <span className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {offer.warranty_months} oy kafolat
                  </span>
                )}
                {offer.delivery_available && (
                  <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    Yetkazib berish bor
                  </span>
                )}
              </div>

              {offer.description && (
                <p className="whitespace-pre-line text-sm text-muted-foreground">{offer.description}</p>
              )}

              <div className="mt-2 flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4">
                <Link
                  href={`/stores/${store.slug}`}
                  className="flex items-center gap-2.5 text-sm font-medium text-foreground hover:text-primary"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary">
                    <Store className="h-4 w-4" />
                  </span>
                  {store.name}
                  {store.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                </Link>
                <Button asChild size="lg">
                  <a href={`tel:${store.phone_primary}`}>
                    <Phone />
                    Bog&rsquo;lanish: {store.phone_primary}
                  </a>
                </Button>
                <ReserveButton offerId={offer.id} isLoggedIn={!!userData.user} />
              </div>
            </div>
          </div>

          {otherOffers.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-lg font-semibold text-foreground">Boshqa do&rsquo;konlarda narxi</h2>
              <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
                {otherOffers.map((o) => (
                  <Link
                    key={o.id}
                    href={`/product/${o.slug}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary/60"
                  >
                    <span className="font-medium text-foreground">{o.storeName}</span>
                    <span className="font-semibold text-foreground">{formatPrice(o.price)} so&rsquo;m</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
