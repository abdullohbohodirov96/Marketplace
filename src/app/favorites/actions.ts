"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ToggleResult {
  saved: boolean;
  error?: string;
}

/**
 * favorites_owner_all / saved_stores_owner_all (0018_row_level_security.sql)
 * already scope every row to auth.uid(), so these two toggles are the only
 * app code that was ever missing — favorites (0008) has sat completely
 * unused until now.
 */
export async function toggleFavoriteAction(productOfferId: string, revalidatePathTo?: string): Promise<ToggleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { saved: false, error: "Avval tizimga kiring" };

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_offer_id", productOfferId)
    .eq("list_name", "Sevimlilar")
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    if (revalidatePathTo) revalidatePath(revalidatePathTo);
    revalidatePath("/favorites");
    return { saved: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, product_offer_id: productOfferId });
  if (error) return { saved: false, error: error.message };

  if (revalidatePathTo) revalidatePath(revalidatePathTo);
  revalidatePath("/favorites");
  return { saved: true };
}

export async function toggleSavedStoreAction(storeId: string, revalidatePathTo?: string): Promise<ToggleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { saved: false, error: "Avval tizimga kiring" };

  const { data: existing } = await supabase
    .from("saved_stores")
    .select("id")
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (existing) {
    await supabase.from("saved_stores").delete().eq("id", existing.id);
    if (revalidatePathTo) revalidatePath(revalidatePathTo);
    revalidatePath("/favorites");
    return { saved: false };
  }

  const { error } = await supabase.from("saved_stores").insert({ user_id: user.id, store_id: storeId });
  if (error) return { saved: false, error: error.message };

  if (revalidatePathTo) revalidatePath(revalidatePathTo);
  revalidatePath("/favorites");
  return { saved: true };
}
