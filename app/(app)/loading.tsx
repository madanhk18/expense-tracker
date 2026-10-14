"use client";

import { usePathname } from "next/navigation";
import { CliSpinner } from "@/components/ui/cli-spinner";

const MESSAGES: [prefix: string, text: string][] = [
  ["/dashboard", "Getting your month together"],
  ["/expenses", "Loading your expenses"],
  ["/income", "Loading your income"],
  ["/savings", "Counting your savings"],
  ["/lending", "Checking who owes whom"],
  ["/analytics", "Crunching the numbers"],
  ["/categories", "Loading this category"],
  ["/settings", "Opening settings"],
];

/** Shown while a page's data loads — a terminal-style spinner line, like a CLI build. */
export default function AppLoading() {
  const pathname = usePathname();
  const text = MESSAGES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Loading";

  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <p className="flex items-center gap-2.5 font-mono text-sm text-muted-foreground">
        <CliSpinner className="text-base text-foreground" />
        {text}…
      </p>
    </div>
  );
}
