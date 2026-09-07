"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { toggleFavoriteAction, toggleSavedStoreAction } from "@/app/favorites/actions";

export function FavoriteButton({
  target,
  isLoggedIn,
  initialSaved,
  revalidatePathTo,
  size = "lg",
}: {
  target: { productOfferId: string } | { storeId: string };
  isLoggedIn: boolean;
  initialSaved: boolean;
  revalidatePathTo?: string;
  size?: "sm" | "lg";
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      disabled={isPending}
      aria-pressed={saved}
      onClick={() => {
        if (!isLoggedIn) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        startTransition(async () => {
          const result =
            "productOfferId" in target
              ? await toggleFavoriteAction(target.productOfferId, revalidatePathTo)
              : await toggleSavedStoreAction(target.storeId, revalidatePathTo);
          if (!result.error) setSaved(result.saved);
        });
      }}
    >
      <Heart className={cn(saved && "fill-destructive text-destructive")} />
      {saved ? "Saqlangan" : "Saqlash"}
    </Button>
  );
}
