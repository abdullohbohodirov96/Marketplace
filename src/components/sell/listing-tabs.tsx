"use client";

import { useState } from "react";
import { ProductForm } from "@/components/sell/product-form";
import { UsedDeviceForm } from "@/components/sell/used-device-form";
import { cn } from "@/lib/utils/cn";

export function ListingTabs({ categories }: { categories: { id: string; name_uz: string }[] }) {
  const [tab, setTab] = useState<"new" | "used">("new");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary/60 p-1">
        <button
          type="button"
          onClick={() => setTab("new")}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-touch",
            tab === "new" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Yangi telefon
        </button>
        <button
          type="button"
          onClick={() => setTab("used")}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-touch",
            tab === "used" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Ishlatilgan telefon
        </button>
      </div>

      {tab === "new" ? <ProductForm categories={categories} /> : <UsedDeviceForm categories={categories} />}
    </div>
  );
}
