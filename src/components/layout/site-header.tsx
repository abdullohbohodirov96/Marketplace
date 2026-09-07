import Link from "next/link";
import { Heart, Bell, MapPin, Store, Search, User, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const NAV_ITEMS = [
  { href: "/categories", label: "Kategoriyalar" },
  { href: "/map", label: "Xarita", icon: MapPin },
  { href: "/stores", label: "Do’konlar", icon: Store },
];

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const unreadCount = user
    ? (
        await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("read_at", null)
      ).count ?? 0
    : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative hidden flex-1 max-w-xl md:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Mahsulot, brend yoki do’kon qidiring..."
            className="h-11 w-full rounded-lg border border-input bg-secondary/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon" aria-label="Sevimlilar" asChild className="hidden sm:inline-flex">
            <Link href={user ? "/favorites" : "/login?next=/favorites"}>
              <Heart />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Bildirishnomalar"
            asChild
            className="relative hidden sm:inline-flex"
          >
            <Link href={user ? "/notifications" : "/login?next=/notifications"}>
              <Bell />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-destructive" />
              )}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/register?role=seller">
              <Plus />
              Sotuvchi bo’lish
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Profil" asChild>
            <Link href={user ? "/account" : "/login"}>
              <User />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
