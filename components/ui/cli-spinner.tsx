"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** The braille "dots" spinner terminal tools use (Vercel CLI, npm, ora). */
const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const FRAME_MS = 80;

export function CliSpinner({ className }: { className?: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    // Respect reduced motion: hold a single frame instead of spinning.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), FRAME_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span aria-hidden className={cn("inline-block w-[1ch] text-center font-mono leading-none", className)}>
      {FRAMES[frame]}
    </span>
  );
}

/** Spinner + text, for buttons while they work: "⠹ Saving…". */
export function BusyLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <CliSpinner />
      {children}
    </span>
  );
}
