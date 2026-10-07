"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PAYMENT_METHODS } from "@/lib/constants";
import { BILL_REMINDER_DAYS, type Preferences } from "@/lib/preferences";
import { updatePreferencesAction } from "@/lib/actions/settings";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { PaymentIcon } from "@/components/shared/category-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Each control saves on change — no Save button to forget. */
export function PreferencesForm({ initial }: { initial: Preferences }) {
  const [prefs, setPrefs] = useState(initial);
  const [pending, startTransition] = useTransition();

  function save(change: Partial<Preferences>, message: string) {
    const previous = prefs;
    setPrefs({ ...prefs, ...change });
    startTransition(async () => {
      try {
        await updatePreferencesAction(change);
        toast.success(message);
      } catch (error) {
        setPrefs(previous);
        logError("preferences-update", error);
        toast.error(toFriendlyMessage(error, "Couldn't save that. Please try again."));
      }
    });
  }

  return (
    <div className="divide-y divide-border">
      <Row
        title="Default payment method"
        hint="Pre-selected every time you add an expense."
      >
        <Select
          value={prefs.defaultPaymentMethod}
          disabled={pending}
          onValueChange={(value) =>
            save({ defaultPaymentMethod: value as Preferences["defaultPaymentMethod"] }, `New expenses default to ${value}`)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                <PaymentIcon method={m} size="sm" />
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>

      <Row title="Bill reminders" hint="How far ahead bills show on your dashboard.">
        <div className="flex rounded-full bg-muted p-1">
          {BILL_REMINDER_DAYS.map((days) => (
            <button
              key={days}
              type="button"
              disabled={pending}
              aria-pressed={prefs.billReminderDays === days}
              onClick={() =>
                save({ billReminderDays: days }, `Bills now show ${days} ${days === 1 ? "day" : "days"} ahead`)
              }
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium tabular-nums transition-colors",
                prefs.billReminderDays === days
                  ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {days}d
            </button>
          ))}
        </div>
      </Row>
    </div>
  );
}

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}
