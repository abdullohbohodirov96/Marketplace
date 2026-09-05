"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uniqueSlug, slugify } from "@/lib/utils/slugify";
import { uzPhoneRegex } from "@/lib/validations/auth";
import { hashImei, imeiLastDigits, isValidImei } from "@/lib/utils/imei";
import type { DeviceConditionGrade } from "@/types/database.types";

export interface SellActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

const DEFAULT_MARKET_ID = "00000000-0000-0000-0000-000000000001"; // Malika — see 0023_markets_and_locations.sql

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
  const block = String(formData.get("block") ?? "").trim();
  const rowLabel = String(formData.get("row_label") ?? "").trim();
  const shopNumber = String(formData.get("shop_number") ?? "").trim();

  const fieldErrors: Record<string, string[]> = {};
  if (name.length < 2) fieldErrors.name = ["Do'kon nomini kiriting (kamida 2 ta belgi)"];
  if (!uzPhoneRegex.test(phonePrimary)) {
    fieldErrors.phone_primary = ["Telefon raqami +998901234567 ko'rinishida bo'lishi kerak"];
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const { data: store, error } = await supabase
    .from("stores")
    .insert({
      owner_id: user.id,
      name,
      slug: uniqueSlug(name),
      phone_primary: phonePrimary,
      short_description: shortDescription || null,
      block: block || null,
      row_label: rowLabel || null,
      shop_number: shopNumber || null,
      // No moderation queue exists yet, so a seller's own store goes live
      // immediately — the admin panel can suspend it later if needed.
      status: "approved",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Mirror the same address onto store_locations (the normalized model new
  // code reads from — see 0023_markets_and_locations.sql) so this store
  // isn't missing a primary location the way pre-migration stores would be.
  if (store) {
    await supabase.from("store_locations").insert({
      store_id: store.id,
      label: "Asosiy",
      market_id: DEFAULT_MARKET_ID,
      block: block || null,
      row_label: rowLabel || null,
      shop_number: shopNumber || null,
      is_primary: true,
    });
  }

  revalidatePath("/sell/new");
  return { success: true };
}

/**
 * Finds an existing catalog product for this title+category (simple
 * slug-based match — avoids an obvious duplicate like two sellers both
 * typing "iPhone 15 Pro Max 256GB" into their own separate catalog rows)
 * or creates a new one. A real "search & pick from catalog" UI is the
 * proper fix for this (see project notes) — this is the interim guard.
 */
async function findOrCreateCatalogProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  { title, categoryId, userId }: { title: string; categoryId: string; userId: string },
): Promise<{ id: string } | { error: string }> {
  const titleSlug = slugify(title);

  const { data: existing } = await supabase
    .from("catalog_products")
    .select("id")
    .eq("category_id", categoryId)
    .eq("slug", titleSlug)
    .maybeSingle();

  if (existing) return { id: existing.id };

  const { data: created, error } = await supabase
    .from("catalog_products")
    .insert({
      name: title,
      slug: uniqueSlug(title),
      category_id: categoryId,
      status: "approved",
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !created) return { error: error?.message ?? "Mahsulot yaratishda xatolik" };
  return { id: created.id };
}

/**
 * Finds an existing variant (same color+memory under this catalog product)
 * or creates a new one — keeps two sellers listing the exact same SKU
 * sharing one ProductVariant row, which is what makes price comparison
 * across stores actually mean something.
 */
async function findOrCreateVariant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  { catalogProductId, color, memory }: { catalogProductId: string; color: string | null; memory: string | null },
): Promise<{ id: string } | { error: string }> {
  let query = supabase.from("product_variants").select("id").eq("catalog_product_id", catalogProductId);
  query = color ? query.eq("color", color) : query.is("color", null);
  query = memory ? query.eq("memory", memory) : query.is("memory", null);
  const { data: existing } = await query.maybeSingle();

  if (existing) return { id: existing.id };

  const variantLabel = [memory, color].filter(Boolean).join(" ") || "standart";
  const { data: created, error } = await supabase
    .from("product_variants")
    .insert({
      catalog_product_id: catalogProductId,
      slug: uniqueSlug(`${catalogProductId.slice(0, 8)}-${variantLabel}`),
      color: color || null,
      memory: memory || null,
    })
    .select("id")
    .single();

  if (error || !created) return { error: error?.message ?? "Variant yaratishda xatolik" };
  return { id: created.id };
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
  const color = String(formData.get("color") ?? "").trim();
  const memory = String(formData.get("memory") ?? "").trim();
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

  const catalogResult = await findOrCreateCatalogProduct(supabase, { title, categoryId, userId: user.id });
  if ("error" in catalogResult) return { error: catalogResult.error };

  const variantResult = await findOrCreateVariant(supabase, {
    catalogProductId: catalogResult.id,
    color: color || null,
    memory: memory || null,
  });
  if ("error" in variantResult) return { error: variantResult.error };

  const { error: offerError } = await supabase.from("product_offers").insert({
    catalog_product_id: catalogResult.id,
    variant_id: variantResult.id,
    store_id: store.id,
    seller_product_name: title,
    slug: uniqueSlug(title),
    price,
    old_price: oldPrice,
    condition: "new",
    color: color || null,
    memory: memory || null,
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

export async function createUsedDeviceAction(
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
  const color = String(formData.get("color") ?? "").trim();
  const memory = String(formData.get("memory") ?? "").trim();
  const batteryHealthRaw = String(formData.get("battery_health") ?? "").replace(/[^0-9]/g, "");
  const screenCondition = String(formData.get("screen_condition") ?? "unknown") as
    | "original"
    | "changed"
    | "unknown";
  const conditionGrade = String(formData.get("condition_grade") ?? "good") as DeviceConditionGrade;
  const warrantyDaysRaw = String(formData.get("warranty_days") ?? "0").replace(/[^0-9]/g, "");
  const imeiRaw = String(formData.get("imei") ?? "").replace(/[^0-9]/g, "");
  const wasRepaired = formData.get("was_repaired") === "true";
  const boxAvailable = formData.get("box_available") === "true";
  const chargerAvailable = formData.get("charger_available") === "true";
  const description = String(formData.get("description") ?? "").trim();

  const fieldErrors: Record<string, string[]> = {};
  if (title.length < 2) fieldErrors.title = ["Mahsulot nomini kiriting"];
  if (!categoryId) fieldErrors.category_id = ["Kategoriyani tanlang"];
  const price = Number(priceDigits);
  if (!price || price <= 0) fieldErrors.price = ["Narxni kiriting"];
  const batteryHealth = batteryHealthRaw ? Number(batteryHealthRaw) : null;
  if (batteryHealth !== null && (batteryHealth < 0 || batteryHealth > 100)) {
    fieldErrors.battery_health = ["Batareya holati 0-100 oralig'ida bo'lishi kerak"];
  }
  if (!["original", "changed", "unknown"].includes(screenCondition)) {
    fieldErrors.screen_condition = ["Ekran holatini tanlang"];
  }
  if (!["like_new", "excellent", "good", "fair"].includes(conditionGrade)) {
    fieldErrors.condition_grade = ["Umumiy holatni tanlang"];
  }
  if (imeiRaw && !isValidImei(imeiRaw)) {
    fieldErrors.imei = ["IMEI 14-16 ta raqamdan iborat bo'lishi kerak (odatda 15 ta)"];
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const catalogResult = await findOrCreateCatalogProduct(supabase, { title, categoryId, userId: user.id });
  if ("error" in catalogResult) return { error: catalogResult.error };

  const variantResult = await findOrCreateVariant(supabase, {
    catalogProductId: catalogResult.id,
    color: color || null,
    memory: memory || null,
  });
  if ("error" in variantResult) return { error: variantResult.error };

  // The raw IMEI (imeiRaw) is used only to derive these two values and is
  // never itself written to the database, logged, or returned to the
  // client — see src/lib/utils/imei.ts.
  const imeiHash = imeiRaw ? hashImei(imeiRaw) : null;
  const imeiLastFour = imeiRaw ? imeiLastDigits(imeiRaw) : null;

  const { error: deviceError } = await supabase.from("used_device_units").insert({
    catalog_product_id: catalogResult.id,
    variant_id: variantResult.id,
    store_id: store.id,
    slug: uniqueSlug(title),
    title,
    price,
    battery_health: batteryHealth,
    screen_condition: screenCondition,
    condition_grade: conditionGrade,
    warranty_days: warrantyDaysRaw ? Number(warrantyDaysRaw) : 0,
    imei_hash: imeiHash,
    imei_last_digits: imeiLastFour,
    // Self-reported by the seller, never platform-verified — the UI must
    // never present this as an authoritative/checked fact (that's what
    // telefy_check_status is for, and it's admin/moderator-only).
    imei_registered: false,
    was_repaired: wasRepaired,
    box_available: boxAvailable,
    charger_available: chargerAvailable,
    description: description || null,
    status: "active",
    published_at: new Date().toISOString(),
  });

  if (deviceError) {
    if (deviceError.code === "23505" && deviceError.message.includes("imei_hash")) {
      return {
        error: "Bu IMEI raqamli telefon marketplace'da allaqachon ro'yxatga olingan",
        fieldErrors: { imei: ["Bu telefon allaqachon ro'yxatga olingan"] },
      };
    }
    return { error: deviceError.message };
  }

  revalidatePath("/sell/new");
  revalidatePath("/categories");
  revalidatePath("/search");
  return { success: true };
}
