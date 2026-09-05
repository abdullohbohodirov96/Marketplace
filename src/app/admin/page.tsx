import { Users, Store, Tag, UserPlus, Clock, Eye, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

async function getStats() {
  const supabase = await createClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalSellers,
    signupsToday,
    totalStores,
    pendingStores,
    totalOffers,
    activeOffers,
    totalStoreViews,
    storeViewsToday,
    activeReservations,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "seller"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),
    supabase.from("stores").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("product_offers").select("*", { count: "exact", head: true }),
    supabase.from("product_offers").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("store_views").select("*", { count: "exact", head: true }),
    supabase.from("store_views").select("*", { count: "exact", head: true }).gte("created_at", startOfToday.toISOString()),
    supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "seller_confirmed", "customer_arrived"]),
  ]);

  return {
    totalUsers: totalUsers.count ?? 0,
    totalSellers: totalSellers.count ?? 0,
    signupsToday: signupsToday.count ?? 0,
    totalStores: totalStores.count ?? 0,
    pendingStores: pendingStores.count ?? 0,
    totalOffers: totalOffers.count ?? 0,
    activeOffers: activeOffers.count ?? 0,
    totalStoreViews: totalStoreViews.count ?? 0,
    storeViewsToday: storeViewsToday.count ?? 0,
    activeReservations: activeReservations.count ?? 0,
  };
}

async function getTopStoresByViews() {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: views } = await supabase
    .from("store_views")
    .select("store_id")
    .gte("created_at", since.toISOString())
    .not("store_id", "is", null)
    .limit(5000);

  if (!views || views.length === 0) return [];

  const countByStore = new Map<string, number>();
  for (const v of views) {
    if (!v.store_id) continue;
    countByStore.set(v.store_id, (countByStore.get(v.store_id) ?? 0) + 1);
  }
  const topIds = [...countByStore.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (topIds.length === 0) return [];

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug")
    .in("id", topIds.map(([id]) => id));
  const storeById = new Map((stores ?? []).map((s) => [s.id, s]));

  return topIds
    .map(([id, count]) => {
      const store = storeById.get(id);
      return store ? { id, name: store.name, slug: store.slug, count } : null;
    })
    .filter((x): x is { id: string; name: string; slug: string; count: number } => x !== null);
}

export default async function AdminDashboardPage() {
  const [stats, topStores] = await Promise.all([getStats(), getTopStoresByViews()]);

  const cards = [
    { label: "Jami foydalanuvchilar", value: stats.totalUsers, icon: Users },
    { label: "Sotuvchilar", value: stats.totalSellers, icon: UserPlus },
    { label: "Bugungi ro'yxatdan o'tishlar", value: stats.signupsToday, icon: Clock },
    { label: "Jami do'konlar", value: stats.totalStores, icon: Store },
    { label: "Tasdiqni kutayotgan do'konlar", value: stats.pendingStores, icon: Store },
    { label: "Jami e'lonlar", value: stats.totalOffers, icon: Tag },
    { label: "Faol e'lonlar", value: stats.activeOffers, icon: Tag },
    { label: "Faol band qilishlar", value: stats.activeReservations, icon: CalendarClock },
    { label: "Bugungi do'kon tashriflari", value: stats.storeViewsToday, icon: Eye },
    { label: "Jami do'kon tashriflari", value: stats.totalStoreViews, icon: Eye },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Umumiy ko&rsquo;rinish</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Platformadagi real ma&rsquo;lumotlar — baza bo&rsquo;sh bo&rsquo;lsa, sonlar 0 ko&rsquo;rinadi.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-background p-5 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <c.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{c.label}</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{c.value.toLocaleString("uz-UZ")}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Eng ko&rsquo;p ko&rsquo;rilgan do&rsquo;konlar (oxirgi 30 kun)
        </h2>
        {topStores.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            {topStores.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}
              >
                <span className="w-5 shrink-0 text-muted-foreground">{i + 1}.</span>
                <span className="flex-1 truncate font-medium text-foreground">{s.name}</span>
                <span className="shrink-0 text-muted-foreground">{s.count.toLocaleString("uz-UZ")} tashrif</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-6 text-sm text-muted-foreground">
            Hali hech qanday do&rsquo;kon tashrifi qayd etilmagan. Xaridorlar do&rsquo;kon sahifalarini
            ko&rsquo;rgach, bu yerda statistika ko&rsquo;rina boshlaydi.
          </div>
        )}
      </div>
    </div>
  );
}
