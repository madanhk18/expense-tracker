import { AlertCircle, CalendarClock } from "lucide-react";
import { formatINR } from "@/lib/money";
import { daysUntil } from "@/lib/dates";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Panel } from "@/components/shared/panel";
import { IconChip } from "@/components/shared/icon-chip";
import { CategoryIcon } from "@/components/shared/category-icon";
import { cn } from "@/lib/utils";
import type { UpcomingBill } from "@/lib/queries/recurring";

function dueLabel(nextDueDate: string): { text: string; overdue: boolean } {
  const days = daysUntil(new Date(`${nextDueDate}T00:00:00`));
  if (days < 0) return { text: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`, overdue: true };
  if (days === 0) return { text: "Due today", overdue: false };
  if (days === 1) return { text: "Due tomorrow", overdue: false };
  return { text: `Due in ${days} days`, overdue: false };
}

export function BillRemindersBanner({ bills }: { bills: UpcomingBill[] }) {
  if (bills.length === 0) return null;

  return (
    <Panel>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 text-base">
          <IconChip icon={CalendarClock} color="var(--warning)" size="sm" />
          Upcoming Bills
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {bills.map((bill) => {
          const { text, overdue } = dueLabel(bill.nextDueDate);
          return (
            <div
              key={bill.id}
              className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-muted"
            >
              <CategoryIcon name={bill.categoryName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{bill.description}</p>
                <p
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    overdue ? "font-medium text-destructive" : "text-muted-foreground"
                  )}
                >
                  {overdue && <AlertCircle className="size-3" />}
                  {text}
                  {bill.categoryName && ` · ${bill.categoryName}`}
                </p>
              </div>
              <span className="font-semibold tabular-nums">{formatINR(bill.amountPaise)}</span>
            </div>
          );
        })}
      </CardContent>
    </Panel>
  );
}
