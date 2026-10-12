import { formatINR } from "@/lib/money";
import type { LendingPerson } from "@/types/domain";

/**
 * The dashboard's lending nudges: money waiting to come back and money you
 * owe. These are running balances, which no other dashboard card shows —
 * totals, bills, trends, investing and the savings rate each have their own
 * card, so they don't repeat here. Pure — no I/O.
 */

export type HighlightTone = "good" | "warn" | "info";
export type HighlightIcon = "lending";

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
  /** null when 0003 hasn't been run — lending highlights are skipped. */
  people: LendingPerson[] | null;
}

export function buildHighlights(input: HighlightInput): Highlight[] {
  const out: Highlight[] = [];

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

  return out;
}
