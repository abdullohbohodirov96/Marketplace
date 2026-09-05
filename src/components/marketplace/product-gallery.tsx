"use client";

import { useState } from "react";
import { ProductThumb } from "@/components/marketplace/product-thumb";
import { cn } from "@/lib/utils/cn";

/**
 * Main image + thumbnail strip for a listing's detail page. Sellers can
 * upload real photos now (see product-images storage bucket + the
 * ListingImageInput used at creation time); a listing with none yet still
 * falls back to the generated ProductThumb tile rather than a broken image.
 */
export function ProductGallery({
  images,
  categorySlug,
  seed,
  title,
  className,
}: {
  images: string[];
  categorySlug?: string | null;
  seed: string;
  title: string;
  className?: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <ProductThumb categorySlug={categorySlug} seed={seed} className={className} />;
  }

  const activeUrl = images[active] ?? images[0];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- seller-uploaded Supabase Storage urls */}
      <img
        src={activeUrl}
        alt={title}
        className="aspect-square w-full rounded-lg border border-border object-cover"
      />
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                active === i ? "border-primary" : "border-transparent",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- seller-uploaded Supabase Storage urls */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
