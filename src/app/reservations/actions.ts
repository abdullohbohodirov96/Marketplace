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
 *
 * SECURITY: price and store_id are never accepted from the caller — a
 * client-supplied price would let anyone reserve a phone at any price they
 * choose. Both are looked up here from the offer/device row itself, and
 * the reservations_validate_target trigger (0028_reservation_and_variant_
 * hardening.sql) re-checks the same thing at the database level as
 * defense-in-depth.
 */
export async function createReservationAction(input: {
  offerId?: string;
  deviceId?: string;
  comment?: string;
}): Promise<ReservationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Band qilish uchun avval tizimga kiring" };

  if ((!input.offerId && !input.deviceId) || (input.offerId && input.deviceId)) {
    return { error: "Noto'g'ri so'rov" };
  }

  let storeId: string;
  let price: number;

  if (input.offerId) {
    const { data: offer, error } = await supabase
      .from("product_offers")
      .select("store_id, price, status")
      .eq("id", input.offerId)
      .maybeSingle();
    if (error || !offer) return { error: "Taklif topilmadi" };
    if (offer.status !== "active") return { error: "Bu taklif hozir mavjud emas" };
    storeId = offer.store_id;
    price = offer.price;
  } else {
    const { data: device, error } = await supabase
      .from("used_device_units")
      .select("store_id, price, status")
      .eq("id", input.deviceId!)
      .maybeSingle();
    if (error || !device) return { error: "Mahsulot topilmadi" };
    if (device.status !== "active") return { error: "Bu mahsulot hozir mavjud emas" };
    storeId = device.store_id;
    price = device.price;
  }

  const expiresAt = new Date(Date.now() + RESERVATION_HOLD_HOURS * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("reservations").insert({
    user_id: user.id,
    store_id: storeId,
    product_offer_id: input.offerId ?? null,
    used_device_unit_id: input.deviceId ?? null,
    price_locked: price,
    customer_comment: input.comment?.trim() || null,
    // Purely advisory — reservations_validate_target (0029) always
    // overwrites this to "now + 4h" server-side for a non-privileged
    // insert, so a tampered value sent here has no effect.
    expires_at: expiresAt,
    status: "pending",
  });

  if (error) {
    // reservations_one_active_per_device_idx (0029) — someone else's hold
    // on this exact used phone is still active. Race-safe: Postgres's
    // unique index (not an app-level lock) is what actually prevents two
    // buyers from reserving the same physical unit at once.
    if (error.code === "23505" && error.message.includes("reservations_one_active_per_device_idx")) {
      return { error: "Bu telefonni hozir boshqa xaridor band qilib turibdi. Birozdan keyin qayta urinib ko'ring." };
    }
    return { error: error.message };
  }

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
 * restricts this to the store's own members or an admin, and
 * guard_reservation_transitions (0029_reservation_state_machine_and_
 * locking.sql) enforces the actual state machine (pending ->
 * seller_confirmed/rejected/cancelled -> customer_arrived -> purchased,
 * no skipping stages, nothing revivable once terminal) and stamps
 * confirmed_at/purchased_at/cancelled_at itself — this action only sends
 * the target status, never a timestamp, since a client-supplied timestamp
 * is silently ignored by the trigger anyway.
 */
export async function updateReservationStatusAction(
  reservationId: string,
  action: keyof typeof SELLER_TRANSITIONS,
): Promise<ReservationActionState> {
  const supabase = await createClient();
  const status = SELLER_TRANSITIONS[action];
  if (!status) return { error: "Noma'lum amal" };

  const { error } = await supabase.from("reservations").update({ status }).eq("id", reservationId);
  if (error) {
    if (error.message.includes("bu status o'tishi ruxsat etilmagan")) {
      return { error: "Bu holatdan bunday o'tish mumkin emas — sahifani yangilab qayta ko'ring." };
    }
    return { error: error.message };
  }

  revalidatePath("/sell/new");
  return { success: true };
}
