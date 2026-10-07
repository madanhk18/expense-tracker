import { formatINR } from "@/lib/money";
import type { MoneyFlow, LendingPerson } from "@/types/domain";

/**
 * The dashboard's "this month" highlights: short, specific sentences built
 * from numbers the page already has. Pure — no I/O — so it's easy to reason
 * about. Ordered by how much each one deserves attention.
 */

export type HighlightTone = "good" | "warn" | "info";
export type HighlightIcon = "category" | "trend-up" | "trend-down" | "invest" | "invest-empty" | "lending" | "bill" | "savings";

export interface Highlight {
  id: string;
  tone: HighlightTone;
  icon: HighlightIcon;
  title: string;
  detail: string;
  href: string;
  cta: string;
}

export interface HighlightInput {
  monthSpentPaise: number;
  previousMonthSpentPaise: number;
  /** Category share of this month's spending, largest first. */
  categoryBreakdown: { categoryId: string; name: string; paise: number }[];
  /** null when 0003 hasn't been run — investment/lending highlights are skipped. */
  flow: MoneyFlow | null;
  monthInvestments: { name: string; paise: number }[];
  hasSips: boolean;
  people: LendingPerson[] | null;
  billsDueCount: number;
  nextBill: { description: string; amountPaise: number; daysUntil: number } | null;
  savingsRatePercent: number | null;
}

function pct(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function dueText(days: number) {
  if (days < 0) return `overdue by ${-days} day${days === -1 ? "" : "s"}`;
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}

export function buildHighlights(input: HighlightInput): Highlight[] {
  const out: Highlight[] = [];

  // Bills come first when one is due — it's the only thing with a deadline.
  if (input.nextBill) {
    const bill = input.nextBill;
    out.push({
      id: "bill",
      tone: bill.daysUntil <= 1 ? "warn" : "info",
      icon: "bill",
      title: `${bill.description} ${dueText(bill.daysUntil)}`,
      detail:
        input.billsDueCount > 1
          ? `${formatINR(bill.amountPaise)} · ${input.billsDueCount - 1} more bill${input.billsDueCount === 2 ? "" : "s"} coming up`
          : `${formatINR(bill.amountPaise)} will be added automatically`,
      href: "/recurring",
      cta: "See bills",
    });
  }

  // Where most of the money went.
  const top = input.categoryBreakdown[0];
  if (top && input.monthSpentPaise > 0) {
    const share = pct(top.paise, input.monthSpentPaise);
    out.push({
      id: "top-category",
      tone: share >= 50 ? "warn" : "info",
      icon: "category",
      title: `Most of your spending went to ${top.name}`,
      detail: `${formatINR(top.paise, { decimals: false })} — ${share}% of this month`,
      href: top.categoryId && top.categoryId !== "uncategorized" ? `/categories/${top.categoryId}` : "/analytics",
      cta: "Look closer",
    });
  }

  // Month-over-month.
  if (input.previousMonthSpentPaise > 0 && input.monthSpentPaise > 0) {
    const change = pct(input.monthSpentPaise - input.previousMonthSpentPaise, input.previousMonthSpentPaise);
    if (Math.abs(change) >= 5) {
      out.push({
        id: "trend",
        tone: change > 0 ? "warn" : "good",
        icon: change > 0 ? "trend-up" : "trend-down",
        title: change > 0 ? `Spending is up ${change}% on last month` : `Spending is down ${-change}% on last month`,
        detail: `${formatINR(input.monthSpentPaise, { decimals: false })} so far vs ${formatINR(input.previousMonthSpentPaise, { decimals: false })} last month`,
        href: "/analytics",
        cta: "Compare",
      });
    }
  }

  // Investments.
  if (input.flow) {
    if (input.flow.investedPaise > 0) {
      const names = input.monthInvestments.map((i) => i.name);
      const unique = [...new Set(names)];
      out.push({
        id: "invested",
        tone: "good",
        icon: "invest",
        title: `You invested ${formatINR(input.flow.investedPaise, { decimals: false })} this month`,
        detail:
          unique.length > 0
            ? `${unique.slice(0, 2).join(", ")}${unique.length > 2 ? ` +${unique.length - 2} more` : ""}`
            : "Kept out of your spending",
        href: "/savings",
        cta: "Savings",
      });
    } else {
      out.push({
        id: "invest-nudge",
        tone: "info",
        icon: "invest-empty",
        title: "Nothing invested yet this month",
        detail: input.hasSips ? "Your SIPs will log themselves on their dates" : "Set up a SIP once and it logs itself monthly",
        href: "/savings",
        cta: input.hasSips ? "Savings" : "Set up SIP",
      });
    }
  }

  // Lending.
  if (input.people) {
    const owedToYou = input.people.filter((p) => p.netPaise > 0);
    const youOwe = input.people.filter((p) => p.netPaise < 0);
    if (owedToYou.length > 0) {
      const total = owedToYou.reduce((s, p) => s + p.netPaise, 0);
      out.push({
        id: "owed-to-you",
        tone: "info",
        icon: "lending",
        title: `${formatINR(total, { decimals: false })} to come back to you`,
        detail:
          owedToYou.length === 1
            ? `${owedToYou[0]!.name} owes you`
            : `${owedToYou[0]!.name} and ${owedToYou.length - 1} other${owedToYou.length === 2 ? "" : "s"}`,
        href: "/lending",
        cta: "Lending",
      });
    }
    if (youOwe.length > 0) {
      const total = youOwe.reduce((s, p) => s - p.netPaise, 0);
      out.push({
        id: "you-owe",
        tone: "warn",
        icon: "lending",
        title: `You owe ${formatINR(total, { decimals: false })}`,
        detail: youOwe.length === 1 ? `to ${youOwe[0]!.name}` : `to ${youOwe.length} people`,
        href: "/lending",
        cta: "Settle up",
      });
    }
  }

  // Savings rate — praise or nudge.
  if (input.savingsRatePercent !== null) {
    const rate = Math.round(input.savingsRatePercent);
    out.push({
      id: "savings-rate",
      tone: rate >= 20 ? "good" : "warn",
      icon: "savings",
      title: rate >= 0 ? `You've kept ${rate}% of what you earned` : `You've spent more than you earned`,
      detail: rate >= 20 ? "Nice — keep it above 20%" : "Aim to keep at least 20%",
      href: "/income",
      cta: "Income",
    });
  }

  return out;
}
