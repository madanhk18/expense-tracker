"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/** List / Insights — the same month, seen two ways. */
export function ViewToggle({ view }: { view: "list" | "insights" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(next: "list" | "insights") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "list") params.delete("view");
    else params.set("view", next);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className="mx-auto flex w-full max-w-xs rounded-full bg-muted p-1">
      {(["list", "insights"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => select(value)}
          className={cn(
            "flex-1 rounded-full py-2 text-sm font-medium capitalize transition-colors",
            view === value ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground"
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
