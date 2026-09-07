"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { SubmitButton } from "@/components/auth/submit-button";
import { cn } from "@/lib/utils/cn";
import { submitReviewAction, type ReviewActionState } from "@/app/reviews/actions";

const initialState: ReviewActionState = {};

export function ReviewForm({
  target,
  isLoggedIn,
}: {
  target: { productOfferId: string; revalidate: string } | { storeId: string; revalidate: string };
  isLoggedIn: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [state, formAction] = useActionState(submitReviewAction.bind(null, target), initialState);

  if (!isLoggedIn) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Baho qoldirish uchun{" "}
        <a href="/login" className="font-medium text-primary hover:underline">
          tizimga kiring
        </a>
        .
      </p>
    );
  }

  if (state.success) {
    return (
      <p className="rounded-lg bg-success/10 px-3.5 py-2.5 text-sm text-success" role="status">
        Rahmat! Bahoyingiz ko&rsquo;rib chiqilgach ko&rsquo;rina boshlaydi.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
      <div>
        <p className="text-sm font-medium text-foreground">Bahoingiz</p>
        <input type="hidden" name="rating" value={rating} />
        <div className="mt-1.5 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} yulduz`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  n <= (hovered || rating) ? "fill-warning text-warning" : "fill-none text-border",
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <textarea
        name="comment"
        rows={3}
        placeholder="Fikringiz (ixtiyoriy)..."
        className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton size="sm" className="w-auto self-start" disabled={rating === 0}>
        Baho qoldirish
      </SubmitButton>
    </form>
  );
}
