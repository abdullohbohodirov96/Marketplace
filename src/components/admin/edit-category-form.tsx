"use client";

import { useActionState, useState } from "react";
import { updateCategoryAction, type CategoryActionState } from "@/app/admin/categories/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { CategoryIconPicker } from "@/components/admin/category-icon-picker";

const initialState: CategoryActionState = {};

export interface EditableCategory {
  id: string;
  name_uz: string;
  name_ru: string | null;
  parent_id: string | null;
  icon: string | null;
  sort_order: number;
}

/**
 * Inline edit panel for one category row — swapped in by CategoryAdminList
 * in place of the row's normal view. The slug never appears here (see
 * updateCategoryAction: it's the public URL and stays fixed once created).
 */
export function EditCategoryForm({
  category,
  parents,
  onSaved,
  onCancel,
}: {
  category: EditableCategory;
  parents: { id: string; name_uz: string }[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState(updateCategoryAction.bind(null, category.id), initialState);
  const [handledSuccess, setHandledSuccess] = useState(state.success);
  if (state.success !== handledSuccess) {
    setHandledSuccess(state.success);
    if (state.success) onSaved();
  }

  const parentOptions = parents.filter((p) => p.id !== category.id);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-primary-50/40 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`edit-name_uz-${category.id}`}>Nomi (o&rsquo;zbekcha)</Label>
          <Input
            id={`edit-name_uz-${category.id}`}
            name="name_uz"
            defaultValue={category.name_uz}
            className="mt-1.5"
            invalid={!!state.fieldErrors?.name_uz}
            required
          />
          <FieldError messages={state.fieldErrors?.name_uz} />
        </div>
        <div>
          <Label htmlFor={`edit-name_ru-${category.id}`}>Nomi (ruscha, ixtiyoriy)</Label>
          <Input
            id={`edit-name_ru-${category.id}`}
            name="name_ru"
            defaultValue={category.name_ru ?? ""}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor={`edit-parent_id-${category.id}`}>Ustki kategoriya (ixtiyoriy)</Label>
          <select
            id={`edit-parent_id-${category.id}`}
            name="parent_id"
            defaultValue={category.parent_id ?? ""}
            className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">— Yo&rsquo;q (asosiy kategoriya) —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name_uz}
              </option>
            ))}
          </select>
          <FieldError messages={state.fieldErrors?.parent_id} />
        </div>
        <div>
          <Label htmlFor={`edit-sort_order-${category.id}`}>Tartib raqami</Label>
          <Input
            id={`edit-sort_order-${category.id}`}
            name="sort_order"
            type="text"
            inputMode="numeric"
            defaultValue={String(category.sort_order)}
            className="mt-1.5"
          />
        </div>
      </div>

      <CategoryIconPicker name="icon" defaultValue={category.icon} />

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton>Saqlash</SubmitButton>
        <Button type="button" variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
      </div>
    </form>
  );
}
