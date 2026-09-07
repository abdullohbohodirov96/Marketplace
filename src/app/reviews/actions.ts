"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export interface ReviewActionState {
  error?: string;
  success?: boolean;
}

type ReviewTarget = { productOfferId: string; revalidate: string } | { storeId: string; revalidate: string };

/**
 * Shared by the product-page and store-page review forms. reviews.status
 * defaults to 'pending' (0009_reviews_and_disputes.sql) so a submitted
 * review waits in /admin/moderation like a listing does — the
 * reviews_sync_store_rating trigger only counts 'approved' rows into
 * stores.rating_avg/rating_count, so nothing here needs to touch that
 * aggregate itself.
 */
export async function submitReviewAction(
  target: ReviewTarget,
  _prevState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Baho qoldirish uchun avval tizimga kiring" };

  const rl = await checkRateLimit(`review:${user.id}`, RATE_LIMITS.review);
  if (!rl.success) return { error: "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring." };

  const ratingRaw = String(formData.get("rating") ?? "");
  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Bahoni tanlang (1 dan 5 gacha)" };
  }
  const comment = String(formData.get("comment") ?? "").trim();

  const { error } = await supabase.from("reviews").insert({
    user_id: user.id,
    product_offer_id: "productOfferId" in target ? target.productOfferId : null,
    store_id: "storeId" in target ? target.storeId : null,
    rating,
    comment: comment || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Siz bu haqda allaqachon baho qoldirgansiz" };
    }
    return { error: error.message };
  }

  revalidatePath(target.revalidate);
  return { success: true };
}
