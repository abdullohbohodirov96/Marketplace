"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/auth/submit-button";
import type { ModerationActionState } from "@/app/admin/moderation/actions";

const initialState: ModerationActionState = {};

/**
 * Reject needs a reason (stores.rejection_reason / product_offers.
 * rejection_reason / used_device_units.rejection_reason all already exist —
 * this is the only UI that ever fills them in). Collapsed behind a button so
 * the moderation queue doesn't show a textarea per row by default.
 */
export function ModerationRejectForm({
  action,
}: {
  action: (prevState: ModerationActionState, formData: FormData) => Promise<ModerationActionState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, initialState);

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Rad etish
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <textarea
          name="reason"
          required
          minLength={3}
          placeholder="Rad etish sababi (sotuvchiga ko'rinadi)..."
          rows={2}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {state.error && <p className="mt-1 text-xs text-destructive">{state.error}</p>}
      </div>
      <div className="flex shrink-0 gap-1.5">
        <SubmitButton size="sm" variant="destructive" className="w-auto">
          Tasdiqlash
        </SubmitButton>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} aria-label="Bekor qilish">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}
