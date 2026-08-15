import { formatINR } from "@/lib/money";
import { isSaturday, isSunday } from "date-fns";

export interface Insight {
  id: string;
  text: string;
}

interface InsightInput {
  monthPaise: number;
  previousMonthPaise: number;
  avgDailyPaise: number;
  highestExpensePaise: number;
  highestExpenseDescription?: string;
  categoryBreakdown: { name: string; paise: number }[];
  previousCategoryBreakdown: { name: string; paise: number }[];
  rows: { amount_paise: number; expense_at: string }[]; // current month rows, for weekend calc
}

/** Pure, deterministic rules over already-fetched data. No AI, no new queries. */
export function buildInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = [];

  if (input.categoryBreakdown.length > 0) {
    const top = input.categoryBreakdown[0];
    insights.push({
      id: "top-category",
      text: `${top.name} is your largest expense category this month at ${formatINR(top.paise)}.`,
    });
  }

  for (const cat of input.categoryBreakdown) {
    const prev = input.previousCategoryBreakdown.find((p) => p.name === cat.name);
    if (prev && prev.paise > 0) {
      const change = ((cat.paise - prev.paise) / prev.paise) * 100;
      if (Math.abs(change) >= 20) {
        insights.push({
          id: `category-change-${cat.name}`,
          text: `You spent ${Math.abs(Math.round(change))}% ${change > 0 ? "more" : "less"} on ${cat.name} this month than last month.`,
        });
      }
    }
  }

  if (input.avgDailyPaise > 0) {
    insights.push({
      id: "avg-daily",
      text: `Your average daily spending is ${formatINR(input.avgDailyPaise)}.`,
    });
  }

  if (input.highestExpensePaise > 0) {
    insights.push({
      id: "highest-expense",
      text: `Your highest expense this month was ${formatINR(input.highestExpensePaise)}${
        input.highestExpenseDescription ? ` for ${input.highestExpenseDescription}` : ""
      }.`,
    });
  }

  const weekendPaise = input.rows
    .filter((r) => {
      const d = new Date(r.expense_at);
      return isSaturday(d) || isSunday(d);
    })
    .reduce((sum, r) => sum + r.amount_paise, 0);

  if (weekendPaise > 0) {
    insights.push({
      id: "weekend-spend",
      text: `You spent ${formatINR(weekendPaise)} on weekends this month.`,
    });
  }

  const overFiveThousand = input.rows.filter((r) => r.amount_paise >= 500000).length;
  if (overFiveThousand > 0) {
    insights.push({
      id: "large-expenses",
      text: `You had ${overFiveThousand} expense${overFiveThousand > 1 ? "s" : ""} over ₹5,000 this month.`,
    });
  }

  return insights.slice(0, 6);
}
