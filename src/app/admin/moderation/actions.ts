"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ModerationActionState {
  error?: string;
  success?: boolean;
}

type ListingTable = "product_offers" | "used_device_units";

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "42501") return "Bu amal faqat administrator/moderator uchun ruxsat etilgan";
  return error.message;
}

// ---------------------------------------------------------------------------
// Stores — status is admin-only (see stores_owner_update in
// 0018_row_level_security.sql: only public.is_admin(), not moderators).
// ---------------------------------------------------------------------------
export async function approveStoreAction(storeId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("stores")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user?.id ?? null,
      rejection_reason: null,
    })
    .eq("id", storeId);

  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
  revalidatePath("/stores");
}

export async function rejectStoreAction(
  storeId: string,
  _prevState: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) return { error: "Rad etish sababini yozing (kamida 3 ta belgi)" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("stores")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", storeId);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Listings (product_offers / used_device_units) — moderator or admin, per
// their existing *_seller_update policies.
// ---------------------------------------------------------------------------
export async function approveListingAction(kind: ListingTable, listingId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from(kind)
    .update({ status: "active", published_at: new Date().toISOString(), rejection_reason: null })
    .eq("id", listingId);

  revalidatePath("/admin/moderation");
  revalidatePath("/search");
  revalidatePath("/categories");
}

export async function rejectListingAction(
  kind: ListingTable,
  listingId: string,
  _prevState: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) return { error: "Rad etish sababini yozing (kamida 3 ta belgi)" };

  const supabase = await createClient();
  const { error } = await supabase
    .from(kind)
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", listingId);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/moderation");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Reviews — moderation_status ('pending'/'approved'/'rejected'), moderator
// or admin (reviews_customer_update in 0018_row_level_security.sql already
// allows public.is_moderator_or_admin()). Approving is what actually makes
// reviews_sync_store_rating (0009) fold the review into stores.rating_avg.
// ---------------------------------------------------------------------------
export async function approveReviewAction(reviewId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("reviews").update({ status: "approved" }).eq("id", reviewId);
  revalidatePath("/admin/moderation");
  revalidatePath("/stores");
  revalidatePath("/product");
}

export async function rejectReviewAction(reviewId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("reviews").update({ status: "rejected" }).eq("id", reviewId);
  revalidatePath("/admin/moderation");
}

// ---------------------------------------------------------------------------
// Store verification ("tasdiqlangan sotuvchi") requests — moderator or
// admin (store_verifications_admin_update in 0018_row_level_security.sql).
// The actual stores.verified flip happens in
// sync_store_verified_badge (0034_store_verification_sync.sql), not here.
// ---------------------------------------------------------------------------
export async function approveVerificationAction(requestId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("store_verifications")
    .update({ status: "approved", reviewed_by: user?.id ?? null, verified_at: new Date().toISOString() })
    .eq("id", requestId);

  revalidatePath("/admin/moderation");
  revalidatePath("/sell/new");
}

export async function rejectVerificationAction(
  requestId: string,
  _prevState: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) return { error: "Rad etish sababini yozing (kamida 3 ta belgi)" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("store_verifications")
    .update({ status: "rejected", rejection_reason: reason, reviewed_by: user?.id ?? null })
    .eq("id", requestId);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/moderation");
  revalidatePath("/sell/new");
  return { success: true };
}
