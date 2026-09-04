import type { Metadata } from "next";

export const metadata: Metadata = { title: "Akkount bloklangan" };

export default function AccountBlockedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-bold text-foreground">Akkountingiz bloklangan</h1>
      <p className="max-w-md text-muted-foreground">
        Hisobingiz administrator tomonidan vaqtincha bloklangan. Savollar bo’yicha qo’llab-quvvatlash
        xizmatiga murojaat qiling.
      </p>
    </div>
  );
}
