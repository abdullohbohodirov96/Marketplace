import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, Store, ShieldCheck, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: "Admin panel",
};

const NAV_ITEMS = [
  { href: "/admin", label: "Umumiy ko'rinish", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Kategoriyalar", icon: Tag },
  { href: "/admin", label: "Foydalanuvchilar", icon: Users, disabled: true },
  { href: "/admin", label: "Do'konlar", icon: Store, disabled: true },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh bg-secondary/20">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-background sm:flex sm:flex-col">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo href="/admin" />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.disabled ? "#" : item.href}
              aria-disabled={item.disabled}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                item.disabled
                  ? "cursor-not-allowed text-muted-foreground/50"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.disabled && (
                <span className="ml-auto rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  tez orada
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2.5 text-sm">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {profile.role === "admin" ? "Administrator" : "Moderator"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:hidden">
          <Logo href="/admin" />
          <span className="text-xs font-medium text-muted-foreground">
            {profile.role === "admin" ? "Admin" : "Moderator"}
          </span>
        </header>
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
