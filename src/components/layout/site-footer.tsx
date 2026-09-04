import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/30 pb-20 lg:pb-0">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-primary">Malika Market</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Malika elektronika bozoridagi eng yaxshi takliflarni toping va solishtiring.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Xaridorlar uchun</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/categories" className="hover:text-foreground">Kategoriyalar</Link></li>
            <li><Link href="/map" className="hover:text-foreground">Xarita</Link></li>
            <li><Link href="/stores" className="hover:text-foreground">Do’konlar</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Sotuvchilar uchun</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/register?role=seller" className="hover:text-foreground">Sotuvchi bo’lish</Link></li>
            <li><Link href="/pricing" className="hover:text-foreground">Tariflar</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Platforma</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">Biz haqimizda</Link></li>
            <li><Link href="/terms" className="hover:text-foreground">Foydalanish shartlari</Link></li>
            <li><Link href="/privacy" className="hover:text-foreground">Maxfiylik siyosati</Link></li>
          </ul>
        </div>
      </div>
      <div className="container border-t border-border py-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Malika Market
      </div>
    </footer>
  );
}
