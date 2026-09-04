import { Users, Store, Tag, UserPlus, Clock } from "lucide-react";
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
  ]);

  return {
    totalUsers: totalUsers.count ?? 0,
    totalSellers: totalSellers.count ?? 0,
    signupsToday: signupsToday.count ?? 0,
    totalStores: totalStores.count ?? 0,
    pendingStores: pendingStores.count ?? 0,
    totalOffers: totalOffers.count ?? 0,
    activeOffers: activeOffers.count ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Jami foydalanuvchilar", value: stats.totalUsers, icon: Users },
    { label: "Sotuvchilar", value: stats.totalSellers, icon: UserPlus },
    { label: "Bugungi ro'yxatdan o'tishlar", value: stats.signupsToday, icon: Clock },
    { label: "Jami do'konlar", value: stats.totalStores, icon: Store },
    { label: "Tasdiqni kutayotgan do'konlar", value: stats.pendingStores, icon: Store },
    { label: "Jami e'lonlar", value: stats.totalOffers, icon: Tag },
    { label: "Faol e'lonlar", value: stats.activeOffers, icon: Tag },
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

      <div className="mt-8 rounded-xl border border-dashed border-border bg-secondary/30 p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Tez orada shu yerda:</p>
        <p className="mt-1">
          Har bir do&rsquo;konga kunlik/oylik tashrif soni, qo&rsquo;ng&rsquo;iroq tugmasi bosilishlari,
          bog&rsquo;lanishlar va yuborilgan SMS&rsquo;lar bo&rsquo;yicha to&rsquo;liq statistika. Buning uchun
          saytda voqealarni (event) yozib boruvchi kuzatuv qo&rsquo;shilishi kerak — bu
          navbatdagi ish sifatida qo&rsquo;shiladi.
        </p>
      </div>
    </div>
  );
}
