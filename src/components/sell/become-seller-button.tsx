"use client";

import { useActionState } from "react";
import { becomeSellerAction, type SellActionState } from "@/app/sell/actions";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: SellActionState = {};

export function BecomeSellerButton() {
  const [state, formAction] = useActionState(becomeSellerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton size="lg">Sotuvchi sifatida boshlash</SubmitButton>
    </form>
  );
}
