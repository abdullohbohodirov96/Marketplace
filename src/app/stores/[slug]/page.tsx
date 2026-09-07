import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone, BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hydrateOfferCards, hydrateUsedDeviceCards, type RawOffer, type RawUsedDevice } from "@/lib/marketplace/hydrate-offers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ProductCard } from "@/components/marketplace/product-card";
import { ReviewList } from "@/components/marketplace/review-list";
import { ReviewForm } from "@/components/marketplace/review-form";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import { StoreLogo } from "@/components/marketplace/store-logo";
import { Card } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("name, short_description, description, logo_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!store) return { title: "Do'kon" };

  const title = store.name;
  const description =
    store.short_description || store.description || `${store.name} — Malika bozorida ishonchli do'kon.`;
  const primaryImage = store.logo_url ?? undefined;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      images: primaryImage ? [{ url: primaryImage }] : undefined,
    },
    twitter: {
      card: primaryImage ? "summary_large_image" : "summary",
      title,
      description,
      images: primaryImage ? [primaryImage] : undefined,
    },
  };
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
    .select("id, name, short_description, description, phone_primary, verified, rating_avg, rating_count, status, logo_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!store || store.status !== "approved") notFound();

  // Fire-and-forget analytics — a logging failure (RLS hiccup, network
  // blip) must never break the page for the visitor. See
  // analytics_events_insert in 0018_row_level_security.sql (user_id must be
  // null or the caller's own id) and the store_views view in
  // 0016_analytics.sql that the admin/seller dashboards read this back
  // through.
  supabase.auth.getUser().then(({ data: { user } }) => {
    void supabase
      .from("analytics_events")
      .insert({ event_type: "store_view", store_id: store.id, user_id: user?.id ?? null, source_page: "store_detail" });
  });

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
      .select("id, slug, title, price, battery_health, telefy_check_status, catalog_product_id, store_id, images")
      .eq("store_id", store.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const [newProducts, usedProducts, { data: reviews }, { data: userData }] = await Promise.all([
    hydrateOfferCards(supabase, (rawOffers ?? []) as RawOffer[]),
    hydrateUsedDeviceCards(supabase, (rawUsedDevices ?? []) as RawUsedDevice[]),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at")
      .eq("store_id", store.id)
      .eq("status", "approved")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.auth.getUser(),
  ]);
  const products = [...newProducts, ...usedProducts];

  const { data: existingSavedStore } = userData.user
    ? await supabase
        .from("saved_stores")
        .select("id")
        .eq("user_id", userData.user.id)
        .eq("store_id", store.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container py-8 sm:py-12">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <StoreLogo logoUrl={store.logo_url} size="lg" />
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
            <FavoriteButton
              target={{ storeId: store.id }}
              isLoggedIn={!!userData.user}
              initialSaved={!!existingSavedStore}
              revalidatePathTo={`/stores/${slug}`}
              size="sm"
            />
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

          <h2 className="mb-3 mt-10 text-lg font-semibold text-foreground">
            Baholar {store.rating_count > 0 && `(${store.rating_count})`}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ReviewList reviews={reviews ?? []} />
            <ReviewForm
              target={{ storeId: store.id, revalidate: `/stores/${slug}` }}
              isLoggedIn={!!userData.user}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
