import Link from "next/link";
import { ArrowRight, Smartphone, Laptop, Headphones, Cpu, Watch, Camera } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PLACEHOLDER_CATEGORIES = [
  { label: "Telefonlar", icon: Smartphone },
  { label: "Noutbuklar", icon: Laptop },
  { label: "Aksessuarlar", icon: Headphones },
  { label: "Komponentlar", icon: Cpu },
  { label: "Aqlli soatlar", icon: Watch },
  { label: "Fototexnika", icon: Camera },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1 pb-20 lg:pb-0">
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-primary-50 to-background">
          <div className="container flex flex-col items-center gap-4 py-14 text-center sm:py-20">
            <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Malika bozoridagi eng yaxshi takliflarni toping
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Yuzlab sotuvchi, minglab mahsulot — narxlarni solishtiring va ishonchli do’konni tanlang.
            </p>
            <div className="mt-2 flex w-full max-w-lg flex-col gap-3 sm:flex-row">
              <Button size="lg" className="flex-1" asChild>
                <Link href="/search">
                  Mahsulot qidirish <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="flex-1" asChild>
                <Link href="/register?role=seller">Sotuvchi bo’lish</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="container py-10 sm:py-14">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Mashhur kategoriyalar
          </h2>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {PLACEHOLDER_CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href="/categories"
                className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-primary/40 hover:bg-primary-50"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <cat.icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-medium text-foreground">{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Product feed placeholder — wired to live ranking/search in Stage 3-4 */}
        <section className="container py-10 sm:py-14">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Siz uchun tavsiyalar
            </h2>
          </div>
          <Card className="mt-5 flex flex-col items-center gap-2 border-dashed p-10 text-center">
            <p className="font-medium text-foreground">Mahsulotlar lentasi tez orada</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Katalog, sotuvchi takliflari va aralash tavsiya lentasi 3–4-bosqichda ulanadi. Hozircha
              arxitektura, autentifikatsiya va dizayn tizimi tayyorlandi.
            </p>
          </Card>
        </section>
      </main>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
