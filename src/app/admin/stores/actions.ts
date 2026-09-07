"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Suspends/reactivates an already-approved store. Admin-only, matching
 * stores_owner_update in 0018_row_level_security.sql (public.is_admin(),
 * not moderators). Suspending pulls the store AND every one of its
 * listings out of public view — see product_offers_public_read /
 * used_device_units_public_read in 0031_moderation_hardening.sql, which
 * now join back to the parent store's status.
 */
export async function setStoreStatusAction(
  storeId: string,
  status: "approved" | "suspended",
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("stores").update({ status }).eq("id", storeId);
  revalidatePath("/admin/stores");
  revalidatePath("/admin/moderation");
}
