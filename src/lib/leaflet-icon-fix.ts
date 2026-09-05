import L from "leaflet";

/**
 * Leaflet's default marker icon references relative image paths that break
 * once bundled (a well-known Leaflet + webpack/Turbopack issue — the
 * bundler doesn't know to copy those asset files anywhere). Pointing at the
 * same version's icons on a CDN sidesteps the whole class of bundler-asset
 * resolution problems instead of trying to get local asset imports right.
 * Call this once, client-side only, before rendering any <MapContainer>.
 */
let patched = false;

export function ensureLeafletDefaultIcon() {
  if (patched) return;
  patched = true;

  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}
