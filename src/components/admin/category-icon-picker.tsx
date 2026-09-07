"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { CATEGORY_ICON_OPTIONS } from "@/lib/marketplace/category-icons";
import { cn } from "@/lib/utils/cn";

/**
 * A clickable grid of preset icons, submitted as a plain hidden input
 * (`name`) so it drops straight into the existing create/edit <form>
 * without any extra client-side wiring. Click again to deselect (falls
 * back to the generic tag icon everywhere it's rendered).
 */
export function CategoryIconPicker({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [selected, setSelected] = useState(defaultValue ?? "");

  return (
    <div>
      <Label>Ikonka (ixtiyoriy)</Label>
      <input type="hidden" name={name} value={selected} />
      <div className="mt-1.5 grid grid-cols-6 gap-1.5 sm:grid-cols-8">
        {CATEGORY_ICON_OPTIONS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={selected === key}
            onClick={() => setSelected((v) => (v === key ? "" : key))}
            className={cn(
              "flex aspect-square items-center justify-center rounded-lg border transition-colors min-h-touch",
              selected === key
                ? "border-primary bg-primary-50 text-primary"
                : "border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
