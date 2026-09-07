import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { setUserStatusAction } from "./actions";

export const metadata: Metadata = { title: "Foydalanuvchilar — Admin" };

const ROLE_LABEL: Record<string, string> = {
  customer: "Mijoz",
  seller: "Sotuvchi",
  moderator: "Moderator",
  admin: "Admin",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const PAGE_SIZE = 50;

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, status, created_at")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  const rows = users ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Foydalanuvchilar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Oxirgi {PAGE_SIZE} ta ro&rsquo;yxatdan o&rsquo;tgan foydalanuvchi. Bloklangan foydalanuvchi
        tizimga kira olmaydi va yangi do&rsquo;kon yoki e&rsquo;lon qo&rsquo;sha olmaydi.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center text-sm text-muted-foreground">
            Hali hech kim ro&rsquo;yxatdan o&rsquo;tmagan.
          </div>
        )}
        {rows.map((u) => {
          const isSelf = u.id === currentUser?.id;
          const isBlocked = u.status === "blocked";
          return (
            <div
              key={u.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {u.full_name}
                  {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(siz)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.phone ?? "—"} · {ROLE_LABEL[u.role] ?? u.role} · {formatDate(u.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-[11px] font-medium",
                    isBlocked ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
                  )}
                >
                  {isBlocked ? "Bloklangan" : "Faol"}
                </span>
                {!isSelf && u.role !== "admin" && (
                  <form action={setUserStatusAction.bind(null, u.id, isBlocked ? "active" : "blocked")}>
                    <Button type="submit" size="sm" variant={isBlocked ? "outline" : "destructive"}>
                      {isBlocked ? "Blokdan chiqarish" : "Bloklash"}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
