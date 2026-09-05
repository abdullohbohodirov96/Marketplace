import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ProductThumb } from "@/components/marketplace/product-thumb";

export interface ProductCardData {
  slug: string;
  title: string;
  price: number;
  oldPrice?: number | null;
  condition?: "new" | "used";
  storeName?: string | null;
  categorySlug?: string | null;
  /** Used device units live at /used/[slug] instead of /product/[slug]. */
  isUsed?: boolean;
  batteryHealth?: number | null;
  telefyCheckPassed?: boolean;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("uz-UZ").format(Math.round(value));
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const discountPct =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

  return (
    <Link
      href={`${product.isUsed ? "/used" : "/product"}/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative p-3 pb-0">
        <ProductThumb
          categorySlug={product.categorySlug}
          seed={product.slug}
          className="aspect-square w-full"
        />
        {discountPct !== null && (
          <span className="absolute left-4 top-4 rounded bg-success px-1.5 py-0.5 text-[11px] font-semibold text-success-foreground">
            -{discountPct}%
          </span>
        )}
        {product.condition === "used" && (
          <span className="absolute right-4 top-4 rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
            Ishlatilgan
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground group-hover:text-primary">
          {product.title}
        </p>
        <div className="mt-auto flex items-baseline gap-1.5">
          <span className="text-base font-bold text-foreground">{formatPrice(product.price)}</span>
          <span className="text-xs text-muted-foreground">so&rsquo;m</span>
        </div>
        {product.oldPrice && product.oldPrice > product.price && (
          <span className="text-xs text-muted-foreground line-through">
            {formatPrice(product.oldPrice)} so&rsquo;m
          </span>
        )}
        {(product.batteryHealth || product.telefyCheckPassed) && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {product.telefyCheckPassed && <ShieldCheck className="h-3 w-3 text-success" />}
            {product.batteryHealth && <span>Batareya {product.batteryHealth}%</span>}
          </p>
        )}
        {product.storeName && (
          <p className="mt-1 truncate text-xs text-muted-foreground">{product.storeName}</p>
        )}
      </div>
    </Link>
  );
}
