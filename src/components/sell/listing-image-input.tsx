"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

export const MAX_LISTING_IMAGES = 5;

/**
 * Multi-image picker used by both create-listing forms (ProductForm,
 * UsedDeviceForm). Uploads are NOT a separate action/request — the files
 * ride along inside the same <form> as a plain `name="images"` file input,
 * exactly like store-logo-upload's single-file version, and the server
 * action (see src/app/sell/actions.ts) uploads them to the already-
 * provisioned 'product-images' storage bucket once the listing row exists.
 * Purely optional: a listing without photos still falls back to the
 * generated ProductThumb tile.
 */
export function ListingImageInput({ id, error }: { id: string; error?: string[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);

  function syncFromInput() {
    const files = inputRef.current?.files;
    const list = files ? Array.from(files) : [];
    setPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return list.map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    });
  }

  function removeAt(index: number) {
    const input = inputRef.current;
    if (!input?.files) return;
    const dt = new DataTransfer();
    Array.from(input.files).forEach((f, i) => {
      if (i !== index) dt.items.add(f);
    });
    input.files = dt.files;
    syncFromInput();
  }

  return (
    <div>
      <Label htmlFor={id}>Rasmlar (ixtiyoriy, {MAX_LISTING_IMAGES} tagacha)</Label>
      <input
        ref={inputRef}
        id={id}
        name="images"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={syncFromInput}
        className={cn(
          "mt-1.5 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground file:min-h-touch hover:file:bg-secondary/80",
          error && "text-destructive",
        )}
      />
      <p className="mt-1 text-xs text-muted-foreground">JPG, PNG yoki WEBP, har biri 8MB gacha.</p>
      {error && <p className="mt-1 text-xs text-destructive">{error.join(", ")}</p>}

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {previews.map((p, i) => (
            <div key={p.url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not a remote asset */}
              <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Rasmni o'chirish"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
