import { Smartphone, Laptop, Headphones, Cpu, Watch, Camera, Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Placeholder product art. Sellers haven't uploaded real photos yet (that's
 * the next increment — see product-images storage bucket), so every listing
 * shows a clean category icon on a colored tile instead of a fake or
 * mismatched photo. Color + icon are picked from the category slug so the
 * same product always renders the same way.
 */
const CATEGORY_ICON: Record<string, typeof Smartphone> = {
  telefonlar: Smartphone,
  noutbuklar: Laptop,
  quloqchinlar: Headphones,
  "kompyuter-aksessuarlari": Cpu,
  "smart-soatlar": Watch,
  kameralar: Camera,
};

const PALETTE = [
  "from-indigo-400/25 to-indigo-600/10 text-indigo-500",
  "from-amber-400/25 to-amber-600/10 text-amber-500",
  "from-emerald-400/25 to-emerald-600/10 text-emerald-500",
  "from-rose-400/25 to-rose-600/10 text-rose-500",
  "from-sky-400/25 to-sky-600/10 text-sky-500",
  "from-violet-400/25 to-violet-600/10 text-violet-500",
];

function hashToIndex(value: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash % mod;
}

export function ProductThumb({
  categorySlug,
  seed,
  className,
}: {
  categorySlug?: string | null;
  seed: string;
  className?: string;
}) {
  const Icon = (categorySlug && CATEGORY_ICON[categorySlug]) || Package;
  const palette = PALETTE[hashToIndex(seed, PALETTE.length)];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-br",
        palette,
        className,
      )}
    >
      <Icon className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
    </div>
  );
}
