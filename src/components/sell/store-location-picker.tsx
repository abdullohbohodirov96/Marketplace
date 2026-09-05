"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { updateStoreLocationAction, type SellActionState } from "@/app/sell/actions";
import { Button } from "@/components/ui/button";
import { ensureLeafletDefaultIcon } from "@/lib/leaflet-icon-fix";

const initialState: SellActionState = {};

// Toshkent markazi — do'kon hali o'z koordinatasini belgilamagan bo'lsa
// xarita shu nuqtadan boshlanadi.
const TASHKENT_CENTER: [number, number] = [41.2995, 69.2401];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      <MapPin />
      Joylashuvni saqlash
    </Button>
  );
}

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function StoreLocationPicker({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  ensureLeafletDefaultIcon();

  const initialPosition = useMemo<[number, number] | null>(
    () => (latitude !== null && longitude !== null ? [latitude, longitude] : null),
    [latitude, longitude],
  );
  const [position, setPosition] = useState<[number, number] | null>(initialPosition);
  const [state, formAction] = useActionState(updateStoreLocationAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <div className="overflow-hidden rounded-xl border border-border">
        <MapContainer
          center={position ?? TASHKENT_CENTER}
          zoom={position ? 16 : 12}
          scrollWheelZoom={false}
          style={{ height: "220px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
          />
          <ClickToPlace onPick={(lat, lng) => setPosition([lat, lng])} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Do&rsquo;koningiz joylashgan nuqtani belgilash uchun xaritaga bosing — xaridorlar
        &ldquo;Xarita&rdquo; sahifasida do&rsquo;koningizni shu nuqtada topadi.
      </p>
      <input type="hidden" name="latitude" value={position?.[0] ?? ""} />
      <input type="hidden" name="longitude" value={position?.[1] ?? ""} />
      <div className="flex items-center gap-3">
        <SaveButton />
        {state.error && <p className="text-xs text-destructive">{state.error}</p>}
        {state.success && <p className="text-xs text-success">Joylashuv saqlandi</p>}
      </div>
    </form>
  );
}
