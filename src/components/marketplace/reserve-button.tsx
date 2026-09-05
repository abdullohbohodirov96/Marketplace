"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check } from "lucide-react";
import { createReservationAction } from "@/app/reservations/actions";
import { Button } from "@/components/ui/button";

export function ReserveButton({
  storeId,
  price,
  offerId,
  deviceId,
  isLoggedIn,
}: {
  storeId: string;
  price: number;
  offerId?: string;
  deviceId?: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-success/10 px-3.5 py-2.5 text-sm text-success">
        <Check className="h-4 w-4 shrink-0" />
        Narx band qilindi — sotuvchi tasdiqlashini kuting va Malika bozoriga kelib oling.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="lg"
        disabled={isPending}
        onClick={() => {
          if (!isLoggedIn) {
            router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
            return;
          }
          startTransition(async () => {
            const result = await createReservationAction({ storeId, price, offerId, deviceId });
            if (result.error) setError(result.error);
            else setDone(true);
          });
        }}
      >
        <CalendarClock />
        Narxni band qilish
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
