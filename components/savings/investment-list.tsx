import { PiggyBank } from "lucide-react";
import { format } from "date-fns";
import { formatINR } from "@/lib/money";
import { EmptyState } from "@/components/shared/empty-state";
import { InvestmentRow } from "./investment-row";
import { AddInvestmentDialog } from "./savings-dialogs";
import type { Investment } from "@/types/domain";

/** Investment history, grouped by month with each month's total. */
export function InvestmentList({ investments }: { investments: Investment[] }) {
  if (investments.length === 0) {
    return (
      <EmptyState
        icon={PiggyBank}
        title="Nothing invested yet"
        description="Log a SIP, FD or any money you put aside — it won't count as spending."
        action={<AddInvestmentDialog />}
      />
    );
  }

  const groups = new Map<string, Investment[]>();
  for (const entry of investments) {
    const label = format(new Date(entry.invested_at), "MMMM yyyy");
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(entry);
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([label, items]) => (
        <div key={label} className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-sm text-[var(--success)] tabular-nums">
              {formatINR(items.reduce((sum, e) => sum + e.amount_paise, 0))}
            </p>
          </div>
          <div className="surface divide-y divide-border overflow-hidden rounded-xl">
            {items.map((entry) => (
              <InvestmentRow key={entry.id} investment={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
