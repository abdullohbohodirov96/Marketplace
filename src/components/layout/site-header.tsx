import Link from "next/link";
import { Heart, Bell, MapPin, Store, Search, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/categories", label: "Kategoriyalar" },
  { href: "/map", label: "Xarita", icon: MapPin },
  { href: "/stores", label: "Do’konlar", icon: Store },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center gap-4">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-primary">
          Malika Market
        </Link>

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
          <Button variant="ghost" size="icon" aria-label="Sevimlilar" className="hidden sm:inline-flex">
            <Heart />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Bildirishnomalar" className="hidden sm:inline-flex">
            <Bell />
          </Button>
          <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/register?role=seller">
              <Plus />
              Sotuvchi bo’lish
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Profil" asChild>
            <Link href="/login">
              <User />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
