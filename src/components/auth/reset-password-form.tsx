"use client";

import { useActionState, useState } from "react";
import {
  resetPasswordAction,
  verifyPhoneOtpAndResetAction,
  type ActionState,
} from "@/app/(auth)/actions";
import { passwordSchema } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { FieldError } from "@/components/auth/field-error";

const initialState: ActionState = {};

export function ResetPasswordForm({ phone }: { phone?: string }) {
  const action = phone ? verifyPhoneOtpAndResetAction : resetPasswordAction;
  const [state, formAction] = useActionState(action, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Same live-validation fix as RegisterForm: once the person types here,
  // this replaces the (potentially stale, from a previous failed submit)
  // state.fieldErrors?.password so the field always reflects what's
  // actually in it right now, not what was submitted last time.
  const passwordCheck = password.length > 0 ? passwordSchema.safeParse(password) : null;
  const livePasswordError =
    passwordCheck && !passwordCheck.success ? passwordCheck.error.issues[0]?.message : undefined;

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
          invalid={password.length > 0 ? !!livePasswordError : !!state.fieldErrors?.password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {password.length > 0 ? (
          livePasswordError && <p className="mt-1.5 text-sm text-destructive">{livePasswordError}</p>
        ) : (
          <FieldError messages={state.fieldErrors?.password} />
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Yangi parolni tasdiqlang</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          className="mt-1.5"
          invalid={!!state.fieldErrors?.confirmPassword || passwordsMismatch}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {passwordsMismatch ? (
          <p className="mt-1.5 text-sm text-destructive">Parollar mos kelmadi</p>
        ) : passwordsMatch ? (
          <p className="mt-1.5 text-sm text-success">Parollar mos keldi</p>
        ) : (
          <FieldError messages={state.fieldErrors?.confirmPassword} />
        )}
      </div>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton size="lg" disabled={passwordsMismatch || !!livePasswordError}>
        Parolni saqlash
      </SubmitButton>
    </form>
  );
}
