import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Store, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StoreForm } from "@/components/sell/store-form";
import { ProductForm } from "@/components/sell/product-form";
import { BecomeSellerButton } from "@/components/sell/become-seller-button";
import { ProductThumb } from "@/components/marketplace/product-thumb";

export const metadata: Metadata = { title: "Mahsulot qo'shish" };

function formatPrice(value: number): string {
  return new Intl.NumberFormat("uz-UZ").format(Math.round(value));
}

export default async function SellNewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/sell/new");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isSeller = profile?.role === "seller" || profile?.role === "admin";

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, status")
    .eq("owner_id", user.id)
    .maybeSingle();

  const [{ data: categories }, { data: offers }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name_uz")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("sort_order", { ascending: true }),
    store
      ? supabase
          .from("product_offers")
          .select("id, slug, seller_product_name, price, old_price, condition, status, catalog_product_id")
          .eq("store_id", store.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
  ]);

  const catalogIds = [...new Set((offers ?? []).map((o) => o.catalog_product_id))];
  const { data: offerCatalogProducts } = catalogIds.length
    ? await supabase.from("catalog_products").select("id, category_id").in("id", catalogIds)
    : { data: [] as { id: string; category_id: string }[] };
  const offerCategoryIds = [...new Set((offerCatalogProducts ?? []).map((c) => c.category_id))];
  const { data: offerCategories } = offerCategoryIds.length
    ? await supabase.from("categories").select("id, slug").in("id", offerCategoryIds)
    : { data: [] as { id: string; slug: string }[] };
  const catalogCategoryById = new Map((offerCatalogProducts ?? []).map((c) => [c.id, c.category_id]));
  const categorySlugById = new Map((offerCategories ?? []).map((c) => [c.id, c.slug]));

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container max-w-2xl py-10 sm:py-14">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Mahsulot qo&rsquo;shish
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Do&rsquo;koningizni oching va telefonlaringizni marketplace&rsquo;da soting.
            </p>
          </div>

          {!isSeller && (
            <Card>
              <CardHeader className="items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <Sparkles className="h-7 w-7" />
                </span>
                <CardTitle>Sotuvchi bo&rsquo;ling</CardTitle>
                <CardDescription>
                  Hisobingizni sotuvchi rejimiga o&rsquo;tkazing va bir necha daqiqada o&rsquo;z
                  do&rsquo;koningizni oching.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BecomeSellerButton />
              </CardContent>
            </Card>
          )}

          {isSeller && !store && (
            <Card>
              <CardHeader>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <Store className="h-6 w-6" />
                </span>
                <CardTitle>Do&rsquo;koningizni yarating</CardTitle>
                <CardDescription>
                  Mahsulot qo&rsquo;shishdan oldin do&rsquo;kon ma&rsquo;lumotlarini kiriting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StoreForm />
              </CardContent>
            </Card>
          )}

          {isSeller && store && (
            <div className="flex flex-col gap-8">
              {store.status !== "approved" && (
                <p className="rounded-lg bg-warning/10 px-3.5 py-2.5 text-sm text-warning-foreground">
                  &ldquo;{store.name}&rdquo; do&rsquo;koni hozircha ko&rsquo;rib chiqilmoqda. Mahsulot
                  qo&rsquo;shishingiz mumkin, tasdiqlangach ular marketplace&rsquo;da ko&rsquo;rinadi.
                </p>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Yangi mahsulot</CardTitle>
                  <CardDescription>&ldquo;{store.name}&rdquo; nomidan e&rsquo;lon joylashtiring.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductForm categories={categories ?? []} />
                </CardContent>
              </Card>

              {offers && offers.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-foreground">
                    Sizning e&rsquo;lonlaringiz ({offers.length})
                  </h2>
                  <div className="flex flex-col gap-2.5">
                    {offers.map((offer) => {
                      const categoryId = catalogCategoryById.get(offer.catalog_product_id);
                      const categorySlug = categoryId ? categorySlugById.get(categoryId) : undefined;
                      return (
                        <Link
                          key={offer.id}
                          href={`/product/${offer.slug}`}
                          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                        >
                          <ProductThumb categorySlug={categorySlug} seed={offer.slug} className="h-14 w-14 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {offer.seller_product_name}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {formatPrice(offer.price)} so&rsquo;m
                            </p>
                          </div>
                          <span className="shrink-0 rounded bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                            {offer.status === "active" ? "Faol" : offer.status}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
