import { AlertCircle, CalendarClock } from "lucide-react";
import { formatINR } from "@/lib/money";
import { daysUntil } from "@/lib/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4" />
          Upcoming Bills
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bills.map((bill) => {
          const { text, overdue } = dueLabel(bill.nextDueDate);
          return (
            <div key={bill.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{bill.description}</p>
                <p className={cn("flex items-center gap-1 text-xs", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                  {overdue && <AlertCircle className="size-3" />}
                  {text}
                  {bill.categoryName && ` · ${bill.categoryName}`}
                </p>
              </div>
              <span className="font-medium tabular-nums">{formatINR(bill.amountPaise)}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
