import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { ProductCardData } from "@/components/marketplace/product-card";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface RawOffer {
  id: string;
  slug: string;
  seller_product_name: string | null;
  price: number;
  old_price: number | null;
  condition: "new" | "used" | string;
  catalog_product_id: string;
  store_id: string;
}

export interface RawUsedDevice {
  id: string;
  slug: string;
  title: string | null;
  price: number;
  battery_health: number | null;
  telefy_check_status: string;
  catalog_product_id: string;
  store_id: string;
  images?: string[] | null;
}

interface CatalogLookup {
  catalogById: Map<string, { id: string; name: string; category_id: string }>;
  categorySlugById: Map<string, string>;
  storeById: Map<string, { id: string; name: string }>;
}

/**
 * The hand-maintained database.types.ts has no FK relationship metadata, so
 * Supabase's nested `select("foo(bar)")` embedding can't be typed safely
 * here. Instead we fetch the three tables flat and join them in memory —
 * fine at this scale (a single category/search/store page of results).
 */
async function buildCatalogLookup(
  supabase: Supabase,
  catalogIds: string[],
  storeIds: string[],
): Promise<CatalogLookup> {
  const [{ data: catalogProducts }, { data: stores }] = await Promise.all([
    catalogIds.length
      ? supabase.from("catalog_products").select("id, name, category_id").in("id", catalogIds)
      : Promise.resolve({ data: [] as { id: string; name: string; category_id: string }[] }),
    storeIds.length
      ? supabase.from("stores").select("id, name").in("id", storeIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const categoryIds = [...new Set((catalogProducts ?? []).map((c) => c.category_id))];
  const { data: categories } = categoryIds.length
    ? await supabase.from("categories").select("id, slug").in("id", categoryIds)
    : { data: [] as { id: string; slug: string }[] };

  return {
    catalogById: new Map((catalogProducts ?? []).map((c) => [c.id, c])),
    categorySlugById: new Map((categories ?? []).map((c) => [c.id, c.slug])),
    storeById: new Map((stores ?? []).map((s) => [s.id, s])),
  };
}

/**
 * One primary/first image url per offer id — product_offer_images is a
 * separate table (a seller can upload several photos), so a listing feed
 * only needs the lead image, not the full gallery (that's fetched directly
 * by the product detail page instead).
 */
async function buildOfferImageLookup(supabase: Supabase, offerIds: string[]): Promise<Map<string, string>> {
  if (offerIds.length === 0) return new Map();
  const { data: images } = await supabase
    .from("product_offer_images")
    .select("product_offer_id, url, is_primary, sort_order")
    .in("product_offer_id", offerIds)
    .order("sort_order", { ascending: true });

  const byOffer = new Map<string, string>();
  for (const img of images ?? []) {
    // is_primary wins outright; otherwise the first row by sort_order (the
    // query above is already ordered, so "first seen" is correct).
    if (img.is_primary || !byOffer.has(img.product_offer_id)) {
      byOffer.set(img.product_offer_id, img.url);
    }
  }
  return byOffer;
}

export async function hydrateOfferCards(supabase: Supabase, offers: RawOffer[]): Promise<ProductCardData[]> {
  if (offers.length === 0) return [];

  const [{ catalogById, categorySlugById, storeById }, imageByOffer] = await Promise.all([
    buildCatalogLookup(
      supabase,
      [...new Set(offers.map((o) => o.catalog_product_id))],
      [...new Set(offers.map((o) => o.store_id))],
    ),
    buildOfferImageLookup(
      supabase,
      offers.map((o) => o.id),
    ),
  ]);

  return offers.map((offer) => {
    const catalogProduct = catalogById.get(offer.catalog_product_id);
    const categorySlug = catalogProduct ? categorySlugById.get(catalogProduct.category_id) : null;
    return {
      slug: offer.slug,
      title: offer.seller_product_name || catalogProduct?.name || "Mahsulot",
      price: offer.price,
      oldPrice: offer.old_price,
      condition: offer.condition === "used" ? "used" : "new",
      storeName: storeById.get(offer.store_id)?.name ?? null,
      categorySlug: categorySlug ?? null,
      imageUrl: imageByOffer.get(offer.id) ?? null,
    };
  });
}

/** Same shape as hydrateOfferCards, for used_device_units instead of product_offers. */
export async function hydrateUsedDeviceCards(
  supabase: Supabase,
  devices: RawUsedDevice[],
): Promise<ProductCardData[]> {
  if (devices.length === 0) return [];

  const { catalogById, categorySlugById, storeById } = await buildCatalogLookup(
    supabase,
    [...new Set(devices.map((d) => d.catalog_product_id))],
    [...new Set(devices.map((d) => d.store_id))],
  );

  return devices.map((device) => {
    const catalogProduct = catalogById.get(device.catalog_product_id);
    const categorySlug = catalogProduct ? categorySlugById.get(catalogProduct.category_id) : null;
    return {
      slug: device.slug,
      title: device.title || catalogProduct?.name || "Ishlatilgan telefon",
      price: device.price,
      condition: "used" as const,
      storeName: storeById.get(device.store_id)?.name ?? null,
      categorySlug: categorySlug ?? null,
      isUsed: true,
      batteryHealth: device.battery_health,
      telefyCheckPassed: device.telefy_check_status === "passed" || device.telefy_check_status === "passed_with_notes",
      imageUrl: device.images?.[0] ?? null,
    };
  });
}
