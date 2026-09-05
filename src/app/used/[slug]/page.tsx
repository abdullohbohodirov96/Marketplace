import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Store, ShieldCheck, BadgeCheck, BatteryMedium, Package, Zap } from "lucide-react";
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

const CONDITION_GRADE_LABEL: Record<string, string> = {
  like_new: "Like New",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
};

const TELEFY_CHECK_LABEL: Record<string, string> = {
  not_checked: "Tekshirilmagan",
  pending: "Tekshiruv jarayonida",
  passed: "Telefy Check: o'tdi",
  passed_with_notes: "Telefy Check: eslatmalar bilan o'tdi",
  failed: "Telefy Check: o'tmadi",
};

async function getDeviceBySlug(slug: string) {
  const supabase = await createClient();

  const { data: device } = await supabase
    .from("used_device_units")
    .select(
      "id, slug, title, price, battery_health, battery_replaced, screen_condition, condition_grade, was_repaired, box_available, charger_available, warranty_days, telefy_check_status, telefy_check_notes, description, catalog_product_id, store_id, status",
    )
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (!device) return null;

  const [{ data: catalogProduct }, { data: store }] = await Promise.all([
    supabase.from("catalog_products").select("name, category_id").eq("id", device.catalog_product_id).maybeSingle(),
    supabase
      .from("stores")
      .select("id, name, slug, phone_primary, verified, status")
      .eq("id", device.store_id)
      .maybeSingle(),
  ]);

  const { data: category } = catalogProduct
    ? await supabase.from("categories").select("slug, name_uz").eq("id", catalogProduct.category_id).maybeSingle()
    : { data: null };

  return { device, catalogProduct, store, category };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getDeviceBySlug(slug);
  const title = result?.device.title || result?.catalogProduct?.name || "Ishlatilgan telefon";
  return { title };
}

export default async function UsedDeviceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const [result, { data: userData }] = await Promise.all([getDeviceBySlug(slug), supabase.auth.getUser()]);

  if (!result || result.device.status !== "active" || !result.store || result.store.status !== "approved") {
    notFound();
  }

  const { device, catalogProduct, store, category } = result;
  const title = device.title || catalogProduct?.name || "Ishlatilgan telefon";

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container max-w-3xl py-8 sm:py-12">
          <div className="grid gap-8 sm:grid-cols-2">
            <ProductThumb categorySlug={category?.slug} seed={device.slug} className="aspect-square w-full" />

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
                <span className="text-2xl font-bold text-foreground sm:text-3xl">{formatPrice(device.price)}</span>
                <span className="text-sm text-muted-foreground">so&rsquo;m</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                  Ishlatilgan · {CONDITION_GRADE_LABEL[device.condition_grade] ?? device.condition_grade}
                </span>
                {device.warranty_days > 0 && (
                  <span className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {device.warranty_days} kun kafolat
                  </span>
                )}
                {(device.telefy_check_status === "passed" || device.telefy_check_status === "passed_with_notes") && (
                  <span className="flex items-center gap-1 rounded bg-success/10 px-2 py-1 text-xs font-medium text-success">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {TELEFY_CHECK_LABEL[device.telefy_check_status]}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-3.5 text-sm">
                {device.battery_health !== null && (
                  <div className="flex items-center gap-2">
                    <BatteryMedium className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Batareya: {device.battery_health}%</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    Ekran:{" "}
                    {device.screen_condition === "original"
                      ? "Original"
                      : device.screen_condition === "changed"
                        ? "Almashtirilgan"
                        : "Noma'lum"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{device.box_available ? "Qutisi bor" : "Qutisi yo'q"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {device.charger_available ? "Zaryadlovchisi bor" : "Zaryadlovchisi yo'q"}
                  </span>
                </div>
              </div>

              {device.was_repaired && (
                <p className="text-xs text-muted-foreground">Bu qurilma avval ta&rsquo;mirlangan.</p>
              )}

              {device.description && (
                <p className="whitespace-pre-line text-sm text-muted-foreground">{device.description}</p>
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
                <ReserveButton storeId={store.id} price={device.price} deviceId={device.id} isLoggedIn={!!userData.user} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
