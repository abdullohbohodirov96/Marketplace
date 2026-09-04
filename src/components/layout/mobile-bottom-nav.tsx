import Link from "next/link";
import { Home, Search, Plus, MapPin, User } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Bosh sahifa", icon: Home },
  { href: "/search", label: "Qidiruv", icon: Search },
  { href: "/sell/new", label: "Qo'shish", icon: Plus },
  { href: "/map", label: "Xarita", icon: MapPin },
  { href: "/account", label: "Profil", icon: User },
];

export function MobileBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-background pb-safe-bottom lg:hidden"
      aria-label="Asosiy navigatsiya"
    >
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex min-w-touch flex-1 flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground active:text-primary"
        >
          <item.icon className="h-5 w-5" />
          <span className="text-[11px] font-medium leading-none">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
