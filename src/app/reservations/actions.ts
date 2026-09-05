"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReservationStatus } from "@/types/database.types";

export interface ReservationActionState {
  error?: string;
  success?: boolean;
}

const RESERVATION_HOLD_HOURS = 4;

/**
 * Buyer-facing "Reserve this price" — locks today's price for a few hours
 * so they can come pick it up at the market without it selling out from
 * under them. Exactly one of offerId/deviceId must be set (mirrors the
 * reservations_target_check constraint in 0026_reservations.sql).
 */
export async function createReservationAction(input: {
  storeId: string;
  price: number;
  offerId?: string;
  deviceId?: string;
  comment?: string;
}): Promise<ReservationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Band qilish uchun avval tizimga kiring" };

  const expiresAt = new Date(Date.now() + RESERVATION_HOLD_HOURS * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("reservations").insert({
    user_id: user.id,
    store_id: input.storeId,
    product_offer_id: input.offerId ?? null,
    used_device_unit_id: input.deviceId ?? null,
    price_locked: input.price,
    customer_comment: input.comment?.trim() || null,
    expires_at: expiresAt,
    status: "pending",
  });

  if (error) return { error: error.message };

  if (input.offerId) revalidatePath(`/product/${input.offerId}`);
  revalidatePath("/sell/new");
  return { success: true };
}

const SELLER_TRANSITIONS: Record<string, ReservationStatus> = {
  confirm: "seller_confirmed",
  reject: "rejected",
  arrived: "customer_arrived",
  purchased: "purchased",
  cancel: "cancelled",
};

/**
 * Seller-side reservation state transitions. RLS (reservations_update)
 * already restricts this to the store's own members or an admin — this
 * just maps a short action name to the enum value and stamps the matching
 * timestamp column.
 */
export async function updateReservationStatusAction(
  reservationId: string,
  action: keyof typeof SELLER_TRANSITIONS,
): Promise<ReservationActionState> {
  const supabase = await createClient();
  const status = SELLER_TRANSITIONS[action];
  if (!status) return { error: "Noma'lum amal" };

  const now = new Date().toISOString();
  const update =
    status === "seller_confirmed"
      ? { status, confirmed_at: now }
      : status === "purchased"
        ? { status, purchased_at: now }
        : status === "cancelled" || status === "rejected"
          ? { status, cancelled_at: now }
          : { status };

  const { error } = await supabase.from("reservations").update(update).eq("id", reservationId);
  if (error) return { error: error.message };

  revalidatePath("/sell/new");
  return { success: true };
}
