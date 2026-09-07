import type { Metadata } from "next";
import { Bell, CheckCheck, Store, Tag, Star, MessageSquare, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { markNotificationReadAction, markAllNotificationsReadAction } from "./actions";

export const metadata: Metadata = { title: "Bildirishnomalar" };

const TYPE_ICON: Record<string, LucideIcon> = {
  store_approved: Store,
  store_rejected: XCircle,
  product_approved: Tag,
  product_rejected: XCircle,
  new_review: Star,
  seller_reply: MessageSquare,
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects a signed-out visitor to /login.
  if (!user) return null;

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = notifications ?? [];
  const unreadCount = rows.filter((n) => !n.is_read).length;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container max-w-2xl py-8 sm:py-12">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Bildirishnomalar</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Do&rsquo;koningiz yoki e&rsquo;loningiz holati o&rsquo;zgarganda shu yerga tushadi.
              </p>
            </div>
            {unreadCount > 0 && (
              <form action={markAllNotificationsReadAction}>
                <Button type="submit" size="sm" variant="outline">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Hammasini o&rsquo;qilgan qilish
                </Button>
              </form>
            )}
          </div>

          {rows.length === 0 ? (
            <Card className="mt-7 flex flex-col items-center gap-2 border-dashed p-10 text-center">
              <Bell className="h-6 w-6 text-muted-foreground" />
              <p className="font-medium text-foreground">Hozircha bildirishnoma yo&rsquo;q</p>
            </Card>
          ) : (
            <div className="mt-6 flex flex-col gap-2">
              {rows.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                return (
                  <form key={n.id} action={markNotificationReadAction.bind(null, n.id)}>
                    <button
                      type="submit"
                      disabled={n.is_read}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
                        n.is_read
                          ? "border-border bg-background"
                          : "border-primary/30 bg-primary-50/40 hover:bg-primary-50/70",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          n.is_read ? "bg-secondary text-muted-foreground" : "bg-primary-50 text-primary",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                      </div>
                      {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </button>
                  </form>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
