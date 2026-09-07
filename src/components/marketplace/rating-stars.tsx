import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Read-only star row — used for both an average rating and a single review's rating. */
export function RatingStars({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const rounded = Math.round(value);
  const starClass = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(starClass, n <= rounded ? "fill-warning text-warning" : "fill-none text-border")}
        />
      ))}
    </span>
  );
}
