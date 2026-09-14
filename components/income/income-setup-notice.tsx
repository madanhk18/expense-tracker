import { Database } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Panel } from "@/components/shared/panel";
import { IconChip } from "@/components/shared/icon-chip";

const STEPS = [
  "Open your project in Supabase, then SQL Editor → New query.",
  "Paste the whole contents of supabase/migrations/0002_income.sql and run it.",
  "Come back and reload this page.",
];

/**
 * Shown when the income table isn't there yet — the 0002 migration has to be
 * run by hand in Supabase, so this explains exactly how rather than failing.
 */
export function IncomeSetupNotice() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center">
      <Panel className="w-full">
        <CardContent className="space-y-5 text-center">
          <div className="flex justify-center">
            <IconChip icon={Database} color="var(--chart-1)" size="lg" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight">One setup step left</h2>
            <p className="text-sm text-muted-foreground">
              Income tracking stores entries in a new table. Run its migration once and this page
              turns on.
            </p>
          </div>

          <ol className="space-y-2.5 text-left">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="btn-solid grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="text-foreground">{step}</span>
              </li>
            ))}
          </ol>

          <p className="rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs break-all">
            supabase/migrations/0002_income.sql
          </p>
        </CardContent>
      </Panel>
    </div>
  );
}
