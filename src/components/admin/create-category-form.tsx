"use client";

import { useActionState } from "react";
import { createCategoryAction, type CategoryActionState } from "@/app/admin/categories/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: CategoryActionState = {};

export function CreateCategoryForm({ parents }: { parents: { id: string; name_uz: string }[] }) {
  const [state, formAction] = useActionState(createCategoryAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="cat-name_uz">Nomi (o&rsquo;zbekcha)</Label>
          <Input
            id="cat-name_uz"
            name="name_uz"
            placeholder="Masalan: Planshetlar"
            className="mt-1.5"
            invalid={!!state.fieldErrors?.name_uz}
            required
          />
          <FieldError messages={state.fieldErrors?.name_uz} />
        </div>
        <div>
          <Label htmlFor="cat-name_ru">Nomi (ruscha, ixtiyoriy)</Label>
          <Input id="cat-name_ru" name="name_ru" placeholder="Планшеты" className="mt-1.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="cat-parent_id">Ustki kategoriya (ixtiyoriy)</Label>
          <select
            id="cat-parent_id"
            name="parent_id"
            defaultValue=""
            className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">— Yo&rsquo;q (asosiy kategoriya) —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name_uz}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="cat-sort_order">Tartib raqami</Label>
          <Input id="cat-sort_order" name="sort_order" type="text" inputMode="numeric" placeholder="0" className="mt-1.5" />
        </div>
      </div>

      <div>
        <Label htmlFor="cat-icon">Ikonka nomi (ixtiyoriy, lucide-react)</Label>
        <Input id="cat-icon" name="icon" placeholder="Masalan: tablet" className="mt-1.5" />
      </div>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-success/10 px-3.5 py-2.5 text-sm text-success" role="status">
          Kategoriya qo&rsquo;shildi.
        </p>
      )}

      <SubmitButton size="lg">Kategoriya qo&rsquo;shish</SubmitButton>
    </form>
  );
}
