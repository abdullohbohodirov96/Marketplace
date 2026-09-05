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

/**
 * The hand-maintained database.types.ts has no FK relationship metadata, so
 * Supabase's nested `select("foo(bar)")` embedding can't be typed safely
 * here. Instead we fetch the three tables flat and join them in memory —
 * fine at this scale (a single category/search/store page of results).
 */
export async function hydrateOfferCards(
  supabase: Supabase,
  offers: RawOffer[],
): Promise<ProductCardData[]> {
  if (offers.length === 0) return [];

  const catalogIds = [...new Set(offers.map((o) => o.catalog_product_id))];
  const storeIds = [...new Set(offers.map((o) => o.store_id))];

  const [{ data: catalogProducts }, { data: stores }] = await Promise.all([
    supabase.from("catalog_products").select("id, name, category_id").in("id", catalogIds),
    supabase.from("stores").select("id, name").in("id", storeIds),
  ]);

  const categoryIds = [...new Set((catalogProducts ?? []).map((c) => c.category_id))];
  const { data: categories } = categoryIds.length
    ? await supabase.from("categories").select("id, slug").in("id", categoryIds)
    : { data: [] as { id: string; slug: string }[] };

  const catalogById = new Map((catalogProducts ?? []).map((c) => [c.id, c]));
  const categorySlugById = new Map((categories ?? []).map((c) => [c.id, c.slug]));
  const storeById = new Map((stores ?? []).map((s) => [s.id, s]));

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
    };
  });
}
