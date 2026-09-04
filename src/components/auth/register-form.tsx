"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SubmitButton } from "@/components/auth/submit-button";
import { FieldError } from "@/components/auth/field-error";
import { cn } from "@/lib/utils/cn";

const initialState: ActionState = {};

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);
  const [identifierType, setIdentifierType] = useState<"phone" | "email">("phone");
  const [role, setRole] = useState<"customer" | "seller">("customer");

  if (state.success) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-center">
        <p className="font-medium text-foreground">Deyarli tayyor!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {identifierType === "email"
            ? "Emailingizga tasdiqlash havolasi yuborildi."
            : "Ro’yxatdan muvaffaqiyatli o’tdingiz. Endi tizimga kirishingiz mumkin."}
        </p>
        <Link href="/login" className="mt-4 inline-block font-medium text-primary hover:underline">
          Kirish sahifasiga o’tish
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div>
        <Label>Kim sifatida ro’yxatdan o’tasiz?</Label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(["customer", "seller"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors min-h-touch",
                role === r
                  ? "border-primary bg-primary-50 text-primary-700"
                  : "border-input bg-background text-foreground hover:bg-secondary",
              )}
            >
              {r === "customer" ? "Mijozman" : "Sotuvchiman"}
            </button>
          ))}
        </div>
        <input type="hidden" name="role" value={role} />
      </div>

      <div>
        <Label htmlFor="fullName">Ism-familiya</Label>
        <Input id="fullName" name="fullName" autoComplete="name" className="mt-1.5" required />
        <FieldError messages={state.fieldErrors?.fullName} />
      </div>

      <div>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setIdentifierType("phone")}
            className={cn(
              "font-medium",
              identifierType === "phone" ? "text-primary" : "text-muted-foreground",
            )}
          >
            Telefon
          </button>
          <span className="text-muted-foreground">/</span>
          <button
            type="button"
            onClick={() => setIdentifierType("email")}
            className={cn(
              "font-medium",
              identifierType === "email" ? "text-primary" : "text-muted-foreground",
            )}
          >
            Email
          </button>
        </div>
        <input type="hidden" name="identifierType" value={identifierType} />

        {identifierType === "phone" ? (
          <>
            <Input
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="+998901234567"
              autoComplete="tel"
              className="mt-1.5"
              invalid={!!state.fieldErrors?.phone}
              required
            />
            <FieldError messages={state.fieldErrors?.phone} />
          </>
        ) : (
          <>
            <Input
              name="email"
              type="email"
              placeholder="email@misol.uz"
              autoComplete="email"
              className="mt-1.5"
              invalid={!!state.fieldErrors?.email}
              required
            />
            <FieldError messages={state.fieldErrors?.email} />
          </>
        )}
      </div>

      <div>
        <Label htmlFor="password">Parol</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="mt-1.5"
          invalid={!!state.fieldErrors?.password}
          required
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="mt-1.5"
          invalid={!!state.fieldErrors?.confirmPassword}
          required
        />
        <FieldError messages={state.fieldErrors?.confirmPassword} />
      </div>

      <div>
        <label className="flex items-start gap-2.5 text-sm text-foreground">
          <Checkbox name="agreeToTerms" className="mt-0.5" />
          <span>Men foydalanish shartlari va maxfiylik siyosatiga roziman</span>
        </label>
        <FieldError messages={state.fieldErrors?.agreeToTerms} />
      </div>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton size="lg">Ro’yxatdan o’tish</SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Akkountingiz bormi?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Kirish
        </Link>
      </p>
    </form>
  );
}
