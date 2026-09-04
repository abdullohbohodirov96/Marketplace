import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Parolni unutdingizmi" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Parolni tiklash</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Ro’yxatdan o’tgan telefon yoki emailingizni kiriting
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
