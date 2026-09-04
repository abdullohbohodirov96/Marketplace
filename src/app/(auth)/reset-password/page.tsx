import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Yangi parol" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const { phone } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Yangi parol o’rnating</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {phone ? "Telefoningizga yuborilgan kodni kiriting" : "Yangi parolingizni kiriting"}
      </p>
      <div className="mt-6">
        <ResetPasswordForm phone={phone} />
      </div>
    </div>
  );
}
