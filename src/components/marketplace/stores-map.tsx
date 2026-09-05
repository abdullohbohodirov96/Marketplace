"use client";

import Link from "next/link";
import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { BadgeCheck, Store as StoreIcon } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { ensureLeafletDefaultIcon } from "@/lib/leaflet-icon-fix";

export interface MapStore {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  verified: boolean;
  latitude: number;
  longitude: number;
}

const TASHKENT_CENTER: [number, number] = [41.2995, 69.2401];

export function StoresMap({ stores }: { stores: MapStore[] }) {
  ensureLeafletDefaultIcon();

  const center = useMemo<[number, number]>(() => {
    if (stores.length === 0) return TASHKENT_CENTER;
    const avgLat = stores.reduce((sum, s) => sum + s.latitude, 0) / stores.length;
    const avgLng = stores.reduce((sum, s) => sum + s.longitude, 0) / stores.length;
    return [avgLat, avgLng];
  }, [stores]);

  return (
    <MapContainer center={center} zoom={stores.length > 0 ? 14 : 12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
      />
      {stores.map((store) => (
        <Marker key={store.id} position={[store.latitude, store.longitude]}>
          <Popup>
            <Link href={`/stores/${store.slug}`} className="flex items-center gap-2 no-underline">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logoUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                  <StoreIcon className="h-4 w-4 text-muted-foreground" />
                </span>
              )}
              <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                {store.name}
                {store.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </span>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
