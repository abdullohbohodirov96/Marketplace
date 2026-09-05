"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uniqueSlug } from "@/lib/utils/slugify";
import { uzPhoneRegex } from "@/lib/validations/auth";

export interface SellActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

/**
 * Lets a signed-in customer start selling without a separate re-registration
 * flow — flips their profile role to "seller" so the store form below can
 * unlock. Mirrors how Uzum/OLX let any account become a seller from within
 * the app rather than gating it behind a special signup.
 */
export async function becomeSellerAction(): Promise<SellActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avval tizimga kiring" };

  const { error } = await supabase
    .from("profiles")
    .update({ role: "seller" })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/sell/new");
  return { success: true };
}

export async function createStoreAction(
  _prevState: SellActionState,
  formData: FormData,
): Promise<SellActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avval tizimga kiring" };

  const name = String(formData.get("name") ?? "").trim();
  const phonePrimary = String(formData.get("phone_primary") ?? "").trim();
  const shortDescription = String(formData.get("short_description") ?? "").trim();

  const fieldErrors: Record<string, string[]> = {};
  if (name.length < 2) fieldErrors.name = ["Do'kon nomini kiriting (kamida 2 ta belgi)"];
  if (!uzPhoneRegex.test(phonePrimary)) {
    fieldErrors.phone_primary = ["Telefon raqami +998901234567 ko'rinishida bo'lishi kerak"];
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const { error } = await supabase.from("stores").insert({
    owner_id: user.id,
    name,
    slug: uniqueSlug(name),
    phone_primary: phonePrimary,
    short_description: shortDescription || null,
    // No moderation queue exists yet, so a seller's own store goes live
    // immediately — the admin panel can suspend it later if needed.
    status: "approved",
  });

  if (error) return { error: error.message };

  revalidatePath("/sell/new");
  return { success: true };
}

export async function createProductAction(
  _prevState: SellActionState,
  formData: FormData,
): Promise<SellActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avval tizimga kiring" };

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!store) return { error: "Avval do'kon yarating" };

  const title = String(formData.get("title") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const priceDigits = String(formData.get("price") ?? "").replace(/[^0-9]/g, "");
  const oldPriceDigits = String(formData.get("old_price") ?? "").replace(/[^0-9]/g, "");
  const condition = String(formData.get("condition") ?? "new") === "used" ? "used" : "new";
  const description = String(formData.get("description") ?? "").trim();

  const fieldErrors: Record<string, string[]> = {};
  if (title.length < 2) fieldErrors.title = ["Mahsulot nomini kiriting"];
  if (!categoryId) fieldErrors.category_id = ["Kategoriyani tanlang"];
  const price = Number(priceDigits);
  if (!price || price <= 0) fieldErrors.price = ["Narxni kiriting"];
  const oldPrice = oldPriceDigits ? Number(oldPriceDigits) : null;
  if (oldPrice !== null && oldPrice <= price) {
    fieldErrors.old_price = ["Eski narx yangi narxdan katta bo'lishi kerak"];
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  // Each listing gets its own canonical catalog_product for now (no
  // duplicate-matching UI yet — see product_aliases for where that would
  // plug in later) plus the seller's offer on top of it.
  const { data: catalogProduct, error: catalogError } = await supabase
    .from("catalog_products")
    .insert({
      name: title,
      slug: uniqueSlug(title),
      category_id: categoryId,
      status: "approved",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (catalogError || !catalogProduct) {
    return { error: catalogError?.message ?? "Mahsulot yaratishda xatolik" };
  }

  const { error: offerError } = await supabase.from("product_offers").insert({
    catalog_product_id: catalogProduct.id,
    store_id: store.id,
    seller_product_name: title,
    slug: uniqueSlug(title),
    price,
    old_price: oldPrice,
    condition,
    description: description || null,
    status: "active",
    published_at: new Date().toISOString(),
  });

  if (offerError) return { error: offerError.message };

  revalidatePath("/sell/new");
  revalidatePath("/categories");
  revalidatePath("/search");
  return { success: true };
}
