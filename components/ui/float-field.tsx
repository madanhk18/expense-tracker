import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * An outlined field whose label sits in a notch on the top border, so the
 * label stays readable while the value is being typed. The label is always
 * "up" — no focus gymnastics, nothing that moves under the user.
 */
function FloatField({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative">
        <label
          htmlFor={htmlFor}
          className="absolute -top-2 left-3 z-10 bg-card px-1.5 text-[11px] font-medium tracking-wide text-muted-foreground"
        >
          {label}
        </label>
        {children}
      </div>
      {error && <p className="px-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export { FloatField };
