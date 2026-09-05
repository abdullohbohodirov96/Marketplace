"use client";

import { useState, useTransition } from "react";
import { updateReservationStatusAction } from "@/app/reservations/actions";
import { Button } from "@/components/ui/button";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("uz-UZ").format(Math.round(value));
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Kutilmoqda",
  seller_confirmed: "Tasdiqlangan",
  customer_arrived: "Xaridor keldi",
};

export interface ReservationRowData {
  id: string;
  status: string;
  price_locked: number;
  expires_at: string;
  customer_comment: string | null;
  product_offer_id: string | null;
  used_device_unit_id: string | null;
}

export function ReservationRow({ reservation }: { reservation: ReservationRowData }) {
  const [isPending, startTransition] = useTransition();
  // Read once at mount rather than during render — Date.now() is impure and
  // this is only ever a rough "still holding?" cue, not a live countdown.
  const [renderedAt] = useState(() => Date.now());

  const act = (action: "confirm" | "reject" | "arrived" | "purchased") => {
    startTransition(async () => {
      await updateReservationStatusAction(reservation.id, action);
    });
  };

  const expiresAt = new Date(reservation.expires_at);
  const isExpired = expiresAt.getTime() < renderedAt;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{formatPrice(reservation.price_locked)} so&rsquo;m</p>
          <p className="text-xs text-muted-foreground">
            {STATUS_LABEL[reservation.status] ?? reservation.status} ·{" "}
            {isExpired ? "muddati o'tgan" : `${expiresAt.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })} gacha`}
          </p>
        </div>
        <span className="shrink-0 rounded bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
          {reservation.used_device_unit_id ? "Ishlatilgan" : "Yangi"}
        </span>
      </div>

      {reservation.customer_comment && (
        <p className="text-xs text-muted-foreground">&ldquo;{reservation.customer_comment}&rdquo;</p>
      )}

      <div className="flex gap-2">
        {reservation.status === "pending" && (
          <>
            <Button size="sm" disabled={isPending} onClick={() => act("confirm")}>
              Tasdiqlash
            </Button>
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => act("reject")}>
              Rad etish
            </Button>
          </>
        )}
        {reservation.status === "seller_confirmed" && (
          <Button size="sm" disabled={isPending} onClick={() => act("arrived")}>
            Xaridor keldi
          </Button>
        )}
        {reservation.status === "customer_arrived" && (
          <Button size="sm" disabled={isPending} onClick={() => act("purchased")}>
            Sotildi
          </Button>
        )}
      </div>
    </div>
  );
}
