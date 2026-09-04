"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SubmitButton } from "@/components/auth/submit-button";
import { FieldError } from "@/components/auth/field-error";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div>
        <Label htmlFor="identifier">Telefon yoki email</Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="+998 90 123 45 67 yoki email"
          className="mt-1.5"
          invalid={!!state.fieldErrors?.identifier}
          required
        />
        <FieldError messages={state.fieldErrors?.identifier} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Parol</Label>
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Parolni unutdingizmi?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          className="mt-1.5"
          invalid={!!state.fieldErrors?.password}
          required
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-foreground">
        <Checkbox name="rememberMe" />
        Meni eslab qolish
      </label>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton size="lg">Kirish</SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Akkountingiz yo’qmi?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Ro’yxatdan o’tish
        </Link>
      </p>
    </form>
  );
}
