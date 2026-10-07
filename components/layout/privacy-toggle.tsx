"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

/**
 * "Hide amounts" — blurs every figure on screen (anything using
 * .tabular-nums) for checking the app in public. A per-device convenience,
 * so it lives in localStorage; the inline script in app/layout.tsx applies
 * it before first paint so amounts never flash.
 */
const KEY = "hide-amounts";

function apply(on: boolean) {
  if (on) document.documentElement.dataset.privacy = "on";
  else delete document.documentElement.dataset.privacy;
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // Storage blocked (private mode) — the toggle still works for this visit.
  }
  window.dispatchEvent(new Event("privacy-change"));
}

function usePrivacy() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => setOn(document.documentElement.dataset.privacy === "on");
    sync();
    window.addEventListener("privacy-change", sync);
    return () => window.removeEventListener("privacy-change", sync);
  }, []);

  return [on, (next: boolean) => apply(next)] as const;
}

/** Eye button for the top bar. */
export function PrivacyButton() {
  const [on, set] = usePrivacy();
  return (
    <Button
      variant="secondary"
      size="icon-sm"
      className="rounded-full"
      onClick={() => set(!on)}
      aria-pressed={on}
      aria-label={on ? "Show amounts" : "Hide amounts"}
      title={on ? "Show amounts" : "Hide amounts"}
    >
      {on ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </Button>
  );
}

/** Same setting as a switch, for the Settings page. */
export function PrivacySwitch() {
  const [on, set] = usePrivacy();
  return <Switch checked={on} onCheckedChange={set} aria-label="Hide amounts" />;
}
