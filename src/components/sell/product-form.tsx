"use client";

import { useActionState, useState } from "react";
import { createProductAction, type SellActionState } from "@/app/sell/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { cn } from "@/lib/utils/cn";

const initialState: SellActionState = {};

export function ProductForm({
  categories,
}: {
  categories: { id: string; name_uz: string }[];
}) {
  const [state, formAction] = useActionState(createProductAction, initialState);
  const [condition, setCondition] = useState<"new" | "used">("new");
  // Remounting the form on each success clears every field for the next
  // listing — a plain uncontrolled <form> otherwise keeps stale values.
  const [formVersion, setFormVersion] = useState(0);
  // Adjusting state during render (rather than in a useEffect) to react to a
  // prop/state change is the pattern React recommends for "reset on success".
  const [handledSuccess, setHandledSuccess] = useState(state.success);
  if (state.success !== handledSuccess) {
    setHandledSuccess(state.success);
    if (state.success) {
      setFormVersion((v) => v + 1);
      setCondition("new");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {state.success && (
        <p className="rounded-lg bg-success/10 px-3.5 py-2.5 text-sm text-success" role="status">
          Mahsulot qo&rsquo;shildi va marketplace&rsquo;da ko&rsquo;rina boshladi.
        </p>
      )}

      <form key={formVersion} action={formAction} className="flex flex-col gap-5" noValidate>
        <div>
          <Label htmlFor="title">Mahsulot nomi</Label>
          <Input
            id="title"
            name="title"
            placeholder="Masalan: iPhone 15 Pro 256GB"
            className="mt-1.5"
            invalid={!!state.fieldErrors?.title}
            required
          />
          <FieldError messages={state.fieldErrors?.title} />
        </div>

        <div>
          <Label htmlFor="category_id">Kategoriya</Label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue=""
            className={cn(
              "mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              state.fieldErrors?.category_id && "border-destructive",
            )}
          >
            <option value="" disabled>
              Kategoriyani tanlang
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_uz}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.category_id} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="price">Narxi (so&rsquo;m)</Label>
            <Input
              id="price"
              name="price"
              type="text"
              inputMode="numeric"
              placeholder="12400000"
              className="mt-1.5"
              invalid={!!state.fieldErrors?.price}
              required
            />
            <FieldError messages={state.fieldErrors?.price} />
          </div>
          <div>
            <Label htmlFor="old_price">Eski narx (ixtiyoriy)</Label>
            <Input
              id="old_price"
              name="old_price"
              type="text"
              inputMode="numeric"
              placeholder="13500000"
              className="mt-1.5"
              invalid={!!state.fieldErrors?.old_price}
            />
            <FieldError messages={state.fieldErrors?.old_price} />
          </div>
        </div>

        <div>
          <Label>Holati</Label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(["new", "used"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c)}
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors min-h-touch",
                  condition === c
                    ? "border-primary bg-primary-50 text-primary-700"
                    : "border-input bg-background text-foreground hover:bg-secondary",
                )}
              >
                {c === "new" ? "Yangi" : "Ishlatilgan"}
              </button>
            ))}
          </div>
          <input type="hidden" name="condition" value={condition} />
        </div>

        <div>
          <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Xotira hajmi, rangi, jihozlanishi va hokazo"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {state.error && (
          <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}

        <SubmitButton size="lg">Mahsulotni qo&rsquo;shish</SubmitButton>
      </form>
    </div>
  );
}
