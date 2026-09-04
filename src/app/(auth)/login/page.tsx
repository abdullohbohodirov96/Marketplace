import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Kirish" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Xush kelibsiz</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Hisobingizga kiring</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
