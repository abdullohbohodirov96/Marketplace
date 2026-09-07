import { Store as StoreIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const SIZE_CLASSES = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-16 w-16",
} as const;

const ICON_SIZE_CLASSES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
} as const;

/**
 * A store's actual uploaded logo (stores.logo_url, set via
 * StoreLogoUpload/updateStoreLogoAction) wherever a store is represented —
 * falls back to a plain <Store> glyph for a store that hasn't uploaded one
 * yet. Centralizing this in one place means every customer-facing spot
 * (store page header, store cards, the store chip on a listing page) shows
 * the real logo consistently instead of each page needing its own <img>
 * vs. icon branching.
 */
export function StoreLogo({
  logoUrl,
  size = "md",
  className,
}: {
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-50 text-primary",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {logoUrl ? (
        // Store logos are user-uploaded and vary in dimensions — a plain
        // <img> avoids next/image's required width/height for this small,
        // purely decorative avatar (same reasoning as StoreLogoUpload's own
        // preview).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <StoreIcon className={ICON_SIZE_CLASSES[size]} />
      )}
    </span>
  );
}
