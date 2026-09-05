"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Store as StoreIcon, Upload } from "lucide-react";
import { updateStoreLogoAction, type SellActionState } from "@/app/sell/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const initialState: SellActionState = {};

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" loading={pending} className="shrink-0">
      <Upload />
      Yuklash
    </Button>
  );
}

export function StoreLogoUpload({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const [state, formAction] = useActionState(updateStoreLogoAction, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileChosen, setFileChosen] = useState(false);

  const shownLogo = preview ?? currentLogoUrl;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-3.5">
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40",
          )}
        >
          {shownLogo ? (
            // Store logos are user-uploaded and vary in dimensions — a plain
            // <img> avoids next/image's required width/height for this
            // small, purely decorative preview.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownLogo} alt="Do'kon logotipi" className="h-full w-full object-cover" />
          ) : (
            <StoreIcon className="h-7 w-7 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label className="flex h-9 w-fit cursor-pointer items-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-secondary">
            Rasm tanlash
            <input
              type="file"
              name="logo"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setFileChosen(!!file);
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />
          </label>
          <p className="mt-1 text-[11px] text-muted-foreground">JPG, PNG yoki WEBP, 5MB gacha</p>
        </div>
        {fileChosen && <UploadButton />}
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.success && <p className="text-xs text-success">Logotip yangilandi</p>}
    </form>
  );
}
