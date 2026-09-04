"use client";

import { useActionState } from "react";
import {
  resetPasswordAction,
  verifyPhoneOtpAndResetAction,
  type ActionState,
} from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { FieldError } from "@/components/auth/field-error";

const initialState: ActionState = {};

export function ResetPasswordForm({ phone }: { phone?: string }) {
  const action = phone ? verifyPhoneOtpAndResetAction : resetPasswordAction;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {phone && (
        <>
          <input type="hidden" name="phone" value={phone} />
          <div>
            <Label htmlFor="token">SMS orqali kelgan kod</Label>
            <Input
              id="token"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className="mt-1.5"
              required
            />
          </div>
        </>
      )}

      <div>
        <Label htmlFor="password">Yangi parol</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          className="mt-1.5"
          invalid={!!state.fieldErrors?.password}
          required
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Yangi parolni tasdiqlang</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          className="mt-1.5"
          invalid={!!state.fieldErrors?.confirmPassword}
          required
        />
        <FieldError messages={state.fieldErrors?.confirmPassword} />
      </div>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton size="lg">Parolni saqlash</SubmitButton>
    </form>
  );
}
