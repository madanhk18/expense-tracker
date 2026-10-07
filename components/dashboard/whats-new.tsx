"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Download, EyeOff, HandCoins, PiggyBank, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Bump when a new batch of features ships so the card shows again. */
const KEY = "whats-new-dismissed:2026-10";

const ITEMS = [
  { href: "/savings", label: "Savings & SIPs", icon: PiggyBank },
  { href: "/lending", label: "Lending (Udhaar)", icon: HandCoins },
  { href: "/recurring", label: "Bill reminders", icon: CalendarClock },
  { href: "/settings", label: "Hide amounts", icon: EyeOff },
  { href: "/settings", label: "Export to Excel", icon: Download },
];

/** A dismissible "what's new" strip so new features don't go unnoticed. */
export function WhatsNew() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === "1";
    } catch {
      // Storage blocked — just show it.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(!dismissed);
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Ignore — it just shows again next visit.
    }
  }

  return (
    <div className="surface relative flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2.5 pr-8">
        <span className="btn-solid grid size-8 shrink-0 place-items-center rounded-lg">
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">New in your app</p>
          <p className="text-xs text-muted-foreground">Tap one to try it.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:ml-auto">
        {ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="field flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <item.icon className="size-3.5" />
            {item.label}
          </Link>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-muted-foreground"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
