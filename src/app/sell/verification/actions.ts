"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface VerificationActionState {
  error?: string;
  success?: boolean;
}

/**
 * A seller applies once per store — store_verifications_seller_insert
 * (0018_row_level_security.sql) only requires is_store_member(store_id), so
 * the one-active-request-at-a-time rule below is enforced here in app code,
 * not the database.
 */
export async function submitVerificationAction(
  storeId: string,
  _prevState: VerificationActionState,
  formData: FormData,
): Promise<VerificationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avval tizimga kiring" };

  const note = String(formData.get("note") ?? "").trim();
  if (note.length < 10) {
    return { error: "Nega tasdiqlangan sotuvchi bo'lishni xohlashingizni qisqacha yozing (kamida 10 ta belgi)" };
  }

  const { data: existing } = await supabase
    .from("store_verifications")
    .select("id")
    .eq("store_id", storeId)
    .eq("verification_type", "verified_seller")
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existing) {
    return { error: "Siz allaqachon so'rov yuborgansiz yoki tasdiqlangansiz" };
  }

  const { error } = await supabase.from("store_verifications").insert({
    store_id: storeId,
    verification_type: "verified_seller",
    submitted_data: { note },
  });

  if (error) return { error: error.message };

  revalidatePath("/sell/new");
  return { success: true };
}
