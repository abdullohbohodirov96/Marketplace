import type { Metadata } from "next";
import Link from "next/link";
import { Store, Phone, BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Do'konlar" };

export default async function StoresPage() {
  const supabase = await createClient();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug, short_description, phone_primary, verified, rating_avg, rating_count")
    .eq("status", "approved")
    .order("rating_avg", { ascending: false });

  const hasStores = !!stores && stores.length > 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container py-8 sm:py-12">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Do&rsquo;konlar</h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Malika bozorida ro&rsquo;yxatdan o&rsquo;tgan sotuvchilar.
          </p>

          {hasStores ? (
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/stores/${store.slug}`}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                      <Store className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 truncate font-medium text-foreground">
                        {store.name}
                        {store.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                      </p>
                      {store.rating_count > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {store.rating_avg.toFixed(1)} ★ ({store.rating_count})
                        </p>
                      )}
                    </div>
                  </div>
                  {store.short_description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{store.short_description}</p>
                  )}
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {store.phone_primary}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="mt-7 flex flex-col items-center gap-2 border-dashed p-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
                <Store className="h-6 w-6" />
              </span>
              <p className="font-medium text-foreground">Hozircha do&rsquo;konlar yo&rsquo;q</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Birinchi bo&rsquo;lib do&rsquo;kon oching va mahsulotlaringizni marketplace&rsquo;ga qo&rsquo;shing.
              </p>
              <Link
                href="/sell/new"
                className="mt-1 text-sm font-medium text-primary hover:underline"
              >
                Sotuvchi bo&rsquo;lish →
              </Link>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
