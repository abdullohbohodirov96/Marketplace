"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

/**
 * A text field with a show/hide toggle (eye icon), masked as dots by
 * default. Used for passwords, and reused for the registration phone
 * field so the number isn't left plainly visible on screen.
 */
const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "type"> & {
    /** The <input type> to use once revealed. Defaults to "text". */
    revealedType?: string;
    hideLabel?: string;
    showLabel?: string;
  }
>(
  (
    {
      className,
      revealedType = "text",
      hideLabel = "Parolni yashirish",
      showLabel = "Parolni ko'rsatish",
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? revealedType : "password"}
          className={cn("pr-11", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? hideLabel : showLabel}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
