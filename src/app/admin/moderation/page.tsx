import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/marketplace/rating-stars";
import { ModerationRejectForm } from "@/components/admin/moderation-reject-form";
import {
  approveStoreAction,
  rejectStoreAction,
  approveListingAction,
  rejectListingAction,
  approveReviewAction,
  rejectReviewAction,
  approveVerificationAction,
  rejectVerificationAction,
} from "./actions";

export const metadata: Metadata = { title: "Moderatsiya — Admin" };

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("uz-UZ").format(Math.round(value));
}

export default async function AdminModerationPage() {
  const supabase = await createClient();

  const [
    { data: pendingStores },
    { data: pendingOffers },
    { data: pendingDevices },
    { data: pendingReviews },
    { data: pendingVerifications },
  ] = await Promise.all([
    supabase
      .from("stores")
      .select("id, name, phone_primary, block, row_label, shop_number, owner_id, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("product_offers")
      .select("id, seller_product_name, price, store_id, catalog_product_id, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("used_device_units")
      .select("id, title, price, store_id, catalog_product_id, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("reviews")
      .select("id, rating, comment, store_id, product_offer_id, created_at")
      .eq("status", "pending")
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("store_verifications")
      .select("id, store_id, submitted_data, created_at")
      .eq("verification_type", "verified_seller")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const stores = pendingStores ?? [];
  const offers = pendingOffers ?? [];
  const devices = pendingDevices ?? [];
  const reviews = pendingReviews ?? [];
  const verifications = pendingVerifications ?? [];

  const reviewOfferIds = [...new Set(reviews.filter((r) => r.product_offer_id).map((r) => r.product_offer_id!))];
  const { data: reviewedOffers } = reviewOfferIds.length
    ? await supabase
        .from("product_offers")
        .select("id, seller_product_name, catalog_product_id, store_id")
        .in("id", reviewOfferIds)
    : { data: [] as { id: string; seller_product_name: string | null; catalog_product_id: string; store_id: string }[] };
  const reviewedOfferById = new Map((reviewedOffers ?? []).map((o) => [o.id, o]));

  const ownerIds = [...new Set(stores.map((s) => s.owner_id))];
  const storeIds = [
    ...new Set([
      ...offers.map((o) => o.store_id),
      ...devices.map((d) => d.store_id),
      ...reviews.filter((r) => r.store_id).map((r) => r.store_id!),
      ...(reviewedOffers ?? []).map((o) => o.store_id),
      ...verifications.map((v) => v.store_id),
    ]),
  ];
  const catalogIds = [
    ...new Set([
      ...offers.map((o) => o.catalog_product_id),
      ...devices.map((d) => d.catalog_product_id),
      ...(reviewedOffers ?? []).map((o) => o.catalog_product_id),
    ]),
  ];

  const [{ data: owners }, { data: listingStores }, { data: catalogProducts }] = await Promise.all([
    ownerIds.length > 0
      ? supabase.from("profiles").select("id, full_name, phone").in("id", ownerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; phone: string | null }[] }),
    storeIds.length > 0
      ? supabase.from("stores").select("id, name").in("id", storeIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    catalogIds.length > 0
      ? supabase.from("catalog_products").select("id, name").in("id", catalogIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));
  const storeNameById = new Map((listingStores ?? []).map((s) => [s.id, s.name]));
  const catalogNameById = new Map((catalogProducts ?? []).map((c) => [c.id, c.name]));

  const totalPending = stores.length + offers.length + devices.length + reviews.length + verifications.length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Moderatsiya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Yangi do&rsquo;konlar va e&rsquo;lonlar shu yerda tasdiqlanadi — tasdiqlanmaguncha
          marketplace&rsquo;da hech kimga ko&rsquo;rinmaydi.
        </p>
      </div>

      {totalPending === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center text-sm text-muted-foreground">
          Hozircha kutilayotgan narsa yo&rsquo;q. Yangi do&rsquo;kon yoki e&rsquo;lon qo&rsquo;shilishi
          bilan bu yerda paydo bo&rsquo;ladi.
        </div>
      )}

      {stores.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Yangi do&rsquo;konlar <span className="text-muted-foreground">({stores.length})</span>
          </h2>
          <div className="flex flex-col gap-2.5">
            {stores.map((store) => {
              const owner = ownerById.get(store.owner_id);
              return (
                <Card key={store.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{store.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {owner?.full_name ?? "Noma'lum"} · {store.phone_primary}
                        {store.block && ` · ${store.block}-blok`}
                        {store.row_label && ` ${store.row_label}-qator`}
                        {store.shop_number && ` ${store.shop_number}-do'kon`}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(store.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
                      <form action={approveStoreAction.bind(null, store.id)}>
                        <Button type="submit" size="sm">
                          Tasdiqlash
                        </Button>
                      </form>
                      <ModerationRejectForm action={rejectStoreAction.bind(null, store.id)} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {offers.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Yangi telefon e&rsquo;lonlari <span className="text-muted-foreground">({offers.length})</span>
          </h2>
          <div className="flex flex-col gap-2.5">
            {offers.map((offer) => (
              <Card key={offer.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {offer.seller_product_name ?? catalogNameById.get(offer.catalog_product_id) ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {storeNameById.get(offer.store_id) ?? "Noma'lum do'kon"} · {formatPrice(offer.price)} so&rsquo;m
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(offer.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
                    <form action={approveListingAction.bind(null, "product_offers", offer.id)}>
                      <Button type="submit" size="sm">
                        Tasdiqlash
                      </Button>
                    </form>
                    <ModerationRejectForm action={rejectListingAction.bind(null, "product_offers", offer.id)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {devices.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Ishlatilgan telefon e&rsquo;lonlari <span className="text-muted-foreground">({devices.length})</span>
          </h2>
          <div className="flex flex-col gap-2.5">
            {devices.map((device) => (
              <Card key={device.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {device.title ?? catalogNameById.get(device.catalog_product_id) ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {storeNameById.get(device.store_id) ?? "Noma'lum do'kon"} · {formatPrice(device.price)} so&rsquo;m
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(device.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
                    <form action={approveListingAction.bind(null, "used_device_units", device.id)}>
                      <Button type="submit" size="sm">
                        Tasdiqlash
                      </Button>
                    </form>
                    <ModerationRejectForm action={rejectListingAction.bind(null, "used_device_units", device.id)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Baholar <span className="text-muted-foreground">({reviews.length})</span>
          </h2>
          <div className="flex flex-col gap-2.5">
            {reviews.map((review) => {
              const offer = review.product_offer_id ? reviewedOfferById.get(review.product_offer_id) : null;
              const targetLabel = review.store_id
                ? storeNameById.get(review.store_id)
                : (offer?.seller_product_name ??
                  (offer ? catalogNameById.get(offer.catalog_product_id) : null));
              const targetStoreName = review.store_id
                ? storeNameById.get(review.store_id)
                : offer
                  ? storeNameById.get(offer.store_id)
                  : null;
              return (
                <Card key={review.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <RatingStars value={review.rating} />
                        <p className="truncate text-sm font-medium text-foreground">{targetLabel ?? "—"}</p>
                      </div>
                      {review.comment && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">{review.comment}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {review.store_id ? "Do'kon haqida" : `${targetStoreName ?? "Noma'lum do'kon"} da e'lon haqida`}
                        {" · "}
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <form action={approveReviewAction.bind(null, review.id)}>
                        <Button type="submit" size="sm">
                          Tasdiqlash
                        </Button>
                      </form>
                      <form action={rejectReviewAction.bind(null, review.id)}>
                        <Button type="submit" size="sm" variant="outline">
                          Rad etish
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {verifications.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Tasdiqlangan sotuvchi so&rsquo;rovlari{" "}
            <span className="text-muted-foreground">({verifications.length})</span>
          </h2>
          <div className="flex flex-col gap-2.5">
            {verifications.map((request) => {
              const note =
                request.submitted_data && typeof request.submitted_data === "object"
                  ? (request.submitted_data as { note?: string }).note
                  : null;
              return (
                <Card key={request.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {storeNameById.get(request.store_id) ?? "Noma'lum do'kon"}
                      </p>
                      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(request.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
                      <form action={approveVerificationAction.bind(null, request.id)}>
                        <Button type="submit" size="sm">
                          Tasdiqlash
                        </Button>
                      </form>
                      <ModerationRejectForm action={rejectVerificationAction.bind(null, request.id)} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
