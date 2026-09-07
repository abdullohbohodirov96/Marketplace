"use client";

import { useActionState } from "react";
import { BadgeCheck, Clock, XCircle } from "lucide-react";
import { SubmitButton } from "@/components/auth/submit-button";
import { submitVerificationAction, type VerificationActionState } from "@/app/sell/verification/actions";

const initialState: VerificationActionState = {};

export function VerificationRequestForm({
  storeId,
  isVerified,
  pendingStatus,
  rejectionReason,
}: {
  storeId: string;
  isVerified: boolean;
  pendingStatus: "pending" | "approved" | "rejected" | null;
  rejectionReason: string | null;
}) {
  const [state, formAction] = useActionState(submitVerificationAction.bind(null, storeId), initialState);

  if (isVerified) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-success/10 px-3.5 py-2.5 text-sm text-success">
        <BadgeCheck className="h-4 w-4 shrink-0" />
        Do&rsquo;koningiz tasdiqlangan sotuvchi maqomiga ega.
      </p>
    );
  }

  if (state.success || pendingStatus === "pending") {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3.5 py-2.5 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 shrink-0" />
        So&rsquo;rovingiz ko&rsquo;rib chiqilmoqda.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {pendingStatus === "rejected" && (
        <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Oldingi so&rsquo;rov rad etildi{rejectionReason ? ` — sabab: ${rejectionReason}` : ""}. Qayta
            yuborishingiz mumkin.
          </span>
        </p>
      )}
      <textarea
        name="note"
        required
        minLength={10}
        rows={3}
        placeholder="Nega tasdiqlangan sotuvchi bo'lishni xohlaysiz? (masalan: necha yildan beri Malika bozorida ishlaysiz)"
        className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton size="sm" className="w-auto self-start">
        So&rsquo;rov yuborish
      </SubmitButton>
    </form>
  );
}
