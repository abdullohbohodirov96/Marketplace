"use client";

import { useActionState, useState } from "react";
import { createUsedDeviceAction, type SellActionState } from "@/app/sell/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { cn } from "@/lib/utils/cn";
import type { DeviceConditionGrade } from "@/types/database.types";

const initialState: SellActionState = {};

const CONDITION_GRADES: { value: DeviceConditionGrade; label: string }[] = [
  { value: "like_new", label: "Like New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export function UsedDeviceForm({
  categories,
}: {
  categories: { id: string; name_uz: string }[];
}) {
  const [state, formAction] = useActionState(createUsedDeviceAction, initialState);
  const [conditionGrade, setConditionGrade] = useState<DeviceConditionGrade>("good");
  const [screenCondition, setScreenCondition] = useState<"original" | "changed" | "unknown">("original");
  const [wasRepaired, setWasRepaired] = useState(false);
  const [boxAvailable, setBoxAvailable] = useState(false);
  const [chargerAvailable, setChargerAvailable] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [handledSuccess, setHandledSuccess] = useState(state.success);

  if (state.success !== handledSuccess) {
    setHandledSuccess(state.success);
    if (state.success) {
      setFormVersion((v) => v + 1);
      setConditionGrade("good");
      setScreenCondition("original");
      setWasRepaired(false);
      setBoxAvailable(false);
      setChargerAvailable(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {state.success && (
        <p className="rounded-lg bg-success/10 px-3.5 py-2.5 text-sm text-success" role="status">
          Ishlatilgan telefon qo&rsquo;shildi va marketplace&rsquo;da ko&rsquo;rina boshladi.
        </p>
      )}

      <form key={formVersion} action={formAction} className="flex flex-col gap-5" noValidate>
        <div>
          <Label htmlFor="used-title">Mahsulot nomi</Label>
          <Input
            id="used-title"
            name="title"
            placeholder="Masalan: iPhone 13 Pro 256GB"
            className="mt-1.5"
            invalid={!!state.fieldErrors?.title}
            required
          />
          <FieldError messages={state.fieldErrors?.title} />
        </div>

        <div>
          <Label htmlFor="used-category_id">Kategoriya</Label>
          <select
            id="used-category_id"
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
            <Label htmlFor="used-memory">Xotira hajmi (ixtiyoriy)</Label>
            <Input id="used-memory" name="memory" placeholder="256GB" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="used-color">Rangi (ixtiyoriy)</Label>
            <Input id="used-color" name="color" placeholder="Space Gray" className="mt-1.5" />
          </div>
        </div>

        <div>
          <Label htmlFor="used-price">Narxi (so&rsquo;m)</Label>
          <Input
            id="used-price"
            name="price"
            type="text"
            inputMode="numeric"
            placeholder="9000000"
            className="mt-1.5"
            invalid={!!state.fieldErrors?.price}
            required
          />
          <FieldError messages={state.fieldErrors?.price} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="battery_health">Batareya holati (%)</Label>
            <Input
              id="battery_health"
              name="battery_health"
              type="text"
              inputMode="numeric"
              placeholder="92"
              className="mt-1.5"
              invalid={!!state.fieldErrors?.battery_health}
            />
            <FieldError messages={state.fieldErrors?.battery_health} />
          </div>
          <div>
            <Label htmlFor="imei_last_digits">IMEI oxirgi 4 raqami (ixtiyoriy)</Label>
            <Input
              id="imei_last_digits"
              name="imei_last_digits"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              className="mt-1.5"
              invalid={!!state.fieldErrors?.imei_last_digits}
            />
            <FieldError messages={state.fieldErrors?.imei_last_digits} />
          </div>
        </div>

        <div>
          <Label>Umumiy holati</Label>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {CONDITION_GRADES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setConditionGrade(g.value)}
                className={cn(
                  "rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors min-h-touch",
                  conditionGrade === g.value
                    ? "border-primary bg-primary-50 text-primary-700"
                    : "border-input bg-background text-foreground hover:bg-secondary",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="condition_grade" value={conditionGrade} />
        </div>

        <div>
          <Label>Ekran holati</Label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(
              [
                { value: "original", label: "Original" },
                { value: "changed", label: "Almashtirilgan" },
                { value: "unknown", label: "Noma'lum" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScreenCondition(opt.value)}
                className={cn(
                  "rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors min-h-touch",
                  screenCondition === opt.value
                    ? "border-primary bg-primary-50 text-primary-700"
                    : "border-input bg-background text-foreground hover:bg-secondary",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="screen_condition" value={screenCondition} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setWasRepaired((v) => !v)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors min-h-touch",
              wasRepaired
                ? "border-primary bg-primary-50 text-primary-700"
                : "border-input bg-background text-foreground hover:bg-secondary",
            )}
          >
            Ta&rsquo;mirlangan{wasRepaired ? " ✓" : ""}
          </button>
          <button
            type="button"
            onClick={() => setBoxAvailable((v) => !v)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors min-h-touch",
              boxAvailable
                ? "border-primary bg-primary-50 text-primary-700"
                : "border-input bg-background text-foreground hover:bg-secondary",
            )}
          >
            Qutisi bor{boxAvailable ? " ✓" : ""}
          </button>
          <button
            type="button"
            onClick={() => setChargerAvailable((v) => !v)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors min-h-touch",
              chargerAvailable
                ? "border-primary bg-primary-50 text-primary-700"
                : "border-input bg-background text-foreground hover:bg-secondary",
            )}
          >
            Zaryadlovchisi bor{chargerAvailable ? " ✓" : ""}
          </button>
          <input type="hidden" name="was_repaired" value={String(wasRepaired)} />
          <input type="hidden" name="box_available" value={String(boxAvailable)} />
          <input type="hidden" name="charger_available" value={String(chargerAvailable)} />
        </div>

        <div>
          <Label htmlFor="used-warranty_days">Do&rsquo;kon kafolati (kun, ixtiyoriy)</Label>
          <Input
            id="used-warranty_days"
            name="warranty_days"
            type="text"
            inputMode="numeric"
            placeholder="14"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="used-description">Tavsif (ixtiyoriy)</Label>
          <textarea
            id="used-description"
            name="description"
            rows={3}
            placeholder="Qo'shimcha holat tafsilotlari"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Telefy Check (mustaqil tekshiruv) belgisi bu yerdan qo&rsquo;yilmaydi — uni faqat
          moderator/admin tasdiqlaydi.
        </p>

        {state.error && (
          <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}

        <SubmitButton size="lg">Ishlatilgan telefonni qo&rsquo;shish</SubmitButton>
      </form>
    </div>
  );
}
