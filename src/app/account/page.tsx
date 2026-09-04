import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LogOut, Store, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/(auth)/actions";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Profil" };

const ROLE_LABEL: Record<string, string> = {
  customer: "Mijoz",
  seller: "Sotuvchi",
  moderator: "Moderator",
  admin: "Administrator",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="container max-w-lg py-10 sm:py-14">
          <Card>
            <CardHeader className="items-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary">
                <User className="h-8 w-8" />
              </span>
              <CardTitle>{profile?.full_name ?? user.email ?? user.phone}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {profile?.phone ?? user.email} ·{" "}
                {profile?.role ? (ROLE_LABEL[profile.role] ?? profile.role) : "Mijoz"}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {profile?.role === "seller" && (
                <Button variant="outline" className="justify-start" asChild>
                  <a href="/sell/new">
                    <Store />
                    Do’konimni boshqarish
                  </a>
                </Button>
              )}
              <form action={logoutAction}>
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
                  <LogOut />
                  Chiqish
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            To’liq profil sozlamalari, sevimlilar va bildirishnomalar tez orada (2-bosqich).
          </p>
        </div>
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
