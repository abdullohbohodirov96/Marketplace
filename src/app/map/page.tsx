import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { StoresMap, type MapStore } from "@/components/marketplace/stores-map";

export const metadata: Metadata = { title: "Do'konlar xaritasi" };

export default async function MapPage() {
  const supabase = await createClient();

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug, logo_url, verified")
    .eq("status", "approved");

  const storeIds = (stores ?? []).map((s) => s.id);
  const { data: locations } = storeIds.length
    ? await supabase
        .from("store_locations")
        .select("store_id, latitude, longitude")
        .eq("is_primary", true)
        .in("store_id", storeIds)
    : { data: [] as { store_id: string; latitude: number | null; longitude: number | null }[] };

  const locationByStore = new Map((locations ?? []).map((l) => [l.store_id, l]));

  const mapStores: MapStore[] = (stores ?? []).flatMap((s) => {
    const loc = locationByStore.get(s.id);
    if (!loc || loc.latitude === null || loc.longitude === null) return [];
    return [
      {
        id: s.id,
        name: s.name,
        slug: s.slug,
        logoUrl: s.logo_url,
        verified: s.verified,
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
    ];
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container py-6 sm:py-10">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Do&rsquo;konlar xaritasi</h1>
          </div>

          {mapStores.length > 0 ? (
            <div className="h-[65vh] min-h-[360px] overflow-hidden rounded-xl border border-border">
              <StoresMap stores={mapStores} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/20 p-10 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-foreground">Hali hech bir do&rsquo;kon xaritada joylashuvini belgilamagan</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Sotuvchilar &ldquo;Mahsulot qo&rsquo;shish&rdquo; sahifasidagi do&rsquo;kon sozlamalaridan xaritada
                joylashuvni belgilashi bilan bu yerda ko&rsquo;rina boshlaydi.
              </p>
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            {mapStores.length} ta do&rsquo;kon xaritada ko&rsquo;rsatilmoqda.
          </p>
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
