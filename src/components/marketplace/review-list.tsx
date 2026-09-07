import { RatingStars } from "@/components/marketplace/rating-stars";

export interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Reviewer names aren't shown — public.profiles has no public-read RLS
 * policy (only self/admin, see 0018_row_level_security.sql), and opening
 * one up just to print a first name isn't worth the extra surface area.
 * "Xaridor" (a customer) is the honest generic label instead.
 */
export function ReviewList({ reviews }: { reviews: ReviewRow[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        Hali baho yo&rsquo;q — birinchi bo&rsquo;lib siz qoldiring.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-background">
      {reviews.map((review) => (
        <div key={review.id} className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Xaridor</p>
            <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
          </div>
          <RatingStars value={review.rating} />
          {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
        </div>
      ))}
    </div>
  );
}
