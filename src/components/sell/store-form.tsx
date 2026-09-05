"use client";

import { useActionState } from "react";
import { createStoreAction, type SellActionState } from "@/app/sell/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: SellActionState = {};

export function StoreForm() {
  const [state, formAction] = useActionState(createStoreAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div>
        <Label htmlFor="name">Do&rsquo;kon nomi</Label>
        <Input
          id="name"
          name="name"
          placeholder="Masalan: TechnoMall Malika"
          className="mt-1.5"
          invalid={!!state.fieldErrors?.name}
          required
        />
        <FieldError messages={state.fieldErrors?.name} />
      </div>

      <div>
        <Label htmlFor="phone_primary">Aloqa uchun telefon</Label>
        <Input
          id="phone_primary"
          name="phone_primary"
          type="tel"
          inputMode="tel"
          placeholder="+998901234567"
          className="mt-1.5"
          invalid={!!state.fieldErrors?.phone_primary}
          required
        />
        <FieldError messages={state.fieldErrors?.phone_primary} />
      </div>

      <div>
        <Label htmlFor="short_description">Qisqacha tavsif (ixtiyoriy)</Label>
        <Input
          id="short_description"
          name="short_description"
          placeholder="Masalan: original telefonlar, kafolat bilan"
          className="mt-1.5"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="block">Blok</Label>
          <Input id="block" name="block" placeholder="B" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="row_label">Qator</Label>
          <Input id="row_label" name="row_label" placeholder="3" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="shop_number">Do&rsquo;kon raqami</Label>
          <Input id="shop_number" name="shop_number" placeholder="23" className="mt-1.5" />
        </div>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Malika bozoridagi joylashuvingiz — xaridorlar do&rsquo;koningizni topishi uchun.
      </p>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton size="lg">Do&rsquo;konni yaratish</SubmitButton>
    </form>
  );
}
