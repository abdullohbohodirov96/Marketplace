import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { setStoreStatusAction } from "./actions";

export const metadata: Metadata = { title: "Do'konlar — Admin" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Kutilmoqda",
  approved: "Faol",
  rejected: "Rad etilgan",
  suspended: "To'xtatilgan",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-warning/10 text-warning-foreground",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  suspended: "bg-destructive/10 text-destructive",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const PAGE_SIZE = 50;

export default async function AdminStoresPage() {
  const supabase = await createClient();

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug, phone_primary, status, created_at")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  const rows = stores ?? [];
  const pendingCount = rows.filter((s) => s.status === "pending").length;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Do&rsquo;konlar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Oxirgi {PAGE_SIZE} ta do&rsquo;kon. To&rsquo;xtatilgan do&rsquo;konning o&rsquo;zi ham,
        barcha e&rsquo;lonlari ham marketplace&rsquo;dan darhol yashiriladi.
      </p>
      {pendingCount > 0 && (
        <p className="mt-2 text-sm text-warning-foreground">
          {pendingCount} ta do&rsquo;kon tasdiqni kutmoqda —{" "}
          <Link href="/admin/moderation" className="font-medium underline underline-offset-2">
            Moderatsiya sahifasida ko&rsquo;rib chiqing
          </Link>
          .
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center text-sm text-muted-foreground">
            Hali hech qanday do&rsquo;kon yo&rsquo;q.
          </div>
        )}
        {rows.map((store) => (
          <div
            key={store.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{store.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {store.phone_primary} · {formatDate(store.created_at)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={cn("rounded-full px-2 py-1 text-[11px] font-medium", STATUS_CLASS[store.status])}>
                {STATUS_LABEL[store.status] ?? store.status}
              </span>
              {store.status === "approved" && (
                <form action={setStoreStatusAction.bind(null, store.id, "suspended")}>
                  <Button type="submit" size="sm" variant="destructive">
                    To&rsquo;xtatish
                  </Button>
                </form>
              )}
              {store.status === "suspended" && (
                <form action={setStoreStatusAction.bind(null, store.id, "approved")}>
                  <Button type="submit" size="sm" variant="outline">
                    Qayta yoqish
                  </Button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
