import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Ro’yxatdan o’tish" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Ro’yxatdan o’tish</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Bir necha soniyada boshlang</p>
      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}
