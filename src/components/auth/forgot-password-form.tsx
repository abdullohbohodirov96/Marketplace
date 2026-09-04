"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { FieldError } from "@/components/auth/field-error";

const initialState: Awaited<ReturnType<typeof forgotPasswordAction>> = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-center">
        <p className="font-medium text-foreground">Yuborildi</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {state.phone
            ? `${state.phone} raqamiga tasdiqlash kodi yuborildi.`
            : "Emailingizni tekshiring — parolni tiklash havolasi yuborildi."}
        </p>
        {state.phone && (
          <Link
            href={`/reset-password?phone=${encodeURIComponent(state.phone)}`}
            className="mt-4 inline-block font-medium text-primary hover:underline"
          >
            Kodni kiritish
          </Link>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div>
        <Label htmlFor="identifier">Telefon yoki email</Label>
        <Input
          id="identifier"
          name="identifier"
          placeholder="+998 90 123 45 67 yoki email"
          className="mt-1.5"
          invalid={!!state.fieldErrors?.identifier}
          required
        />
        <FieldError messages={state.fieldErrors?.identifier} />
        <p className="mt-2 text-sm text-muted-foreground">
          Parolni tiklash uchun ko’rsatma yuboramiz.
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton size="lg">Yuborish</SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Kirish sahifasiga qaytish
        </Link>
      </p>
    </form>
  );
}
