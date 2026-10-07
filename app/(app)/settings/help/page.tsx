import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Download,
  EyeOff,
  HandCoins,
  LayoutDashboard,
  PieChart,
  PiggyBank,
  Receipt,
  Repeat,
  Search,
  Settings,
  Tags,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { getFeatureUsage } from "@/lib/queries/onboarding";
import { getExpenseCategories, getIncomeCategories } from "@/lib/queries/categories";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import { RecurringForm } from "@/components/recurring/recurring-form";
import { AddInvestmentDialog, AddSipDialog } from "@/components/savings/savings-dialogs";
import { AddLendingDialog } from "@/components/lending/add-lending-dialog";
import { Panel } from "@/components/shared/panel";
import { IconChip } from "@/components/shared/icon-chip";
import { PageHeader } from "@/components/shared/page-header";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * "How to use this app" as something you do, not something you read: a
 * checklist whose Try-it buttons open the real forms right here and tick
 * themselves off from your data, then one card per feature.
 */

interface Step {
  id: string;
  title: string;
  why: string;
  icon: LucideIcon;
  color: string;
  done: boolean;
  /** The real form, opened from this page. */
  action: (trigger: React.ReactNode) => React.ReactNode;
  /** Where to go once it's done. */
  href: string;
}

interface Feature {
  title: string;
  line: string;
  href: string;
  icon: LucideIcon;
  color: string;
  details: string[];
}

const FEATURES: Feature[] = [
  {
    title: "Dashboard",
    line: "This month in one screen — highlights, money in and out, bills due.",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "var(--chart-1)",
    details: [
      "\"This month at a glance\" picks out what matters: your biggest category, spending vs last month, what you invested, who owes you, the next bill.",
      "The tiles under it jump straight to Income, Savings, Lending and Bills.",
    ],
  },
  {
    title: "Expenses",
    line: "Every rupee spent, by month — with search, filters and a chart view.",
    href: "/expenses",
    icon: Receipt,
    color: "var(--chart-4)",
    details: [
      "The + button (bottom right on mobile) adds an expense from any screen.",
      "Switch List / Insights to see the month as a chart. Tap a row to edit or delete it.",
    ],
  },
  {
    title: "Money: income, savings, lending",
    line: "What came in, what you put aside, and who owes whom.",
    href: "/income",
    icon: HandCoins,
    color: "var(--success)",
    details: [
      "Income gives you a savings rate: how much of what you earned you kept.",
      "Savings (SIPs, FDs, gold…) never counts as spending. A SIP logs itself on every due date.",
      "Lending keeps one card per person — green they owe you, red you owe them. Record part-payments any time.",
    ],
  },
  {
    title: "Analytics",
    line: "Where the money goes — categories, trends, payment methods, merchants.",
    href: "/analytics",
    icon: PieChart,
    color: "var(--cat-shopping)",
    details: ["Pick any month or a custom range. Each category opens its own breakdown."],
  },
  {
    title: "Bills & recurring",
    line: "Rent, EMIs, subscriptions — added for you on their due date.",
    href: "/recurring",
    icon: CalendarClock,
    color: "var(--warning)",
    details: [
      "Set it once; it's never added twice for the same day.",
      "Bills due soon show on the dashboard. Choose how many days ahead in Settings.",
    ],
  },
  {
    title: "Settings",
    line: "Default payment method, bill reminder window, theme, export.",
    href: "/settings",
    icon: Settings,
    color: "var(--cat-subscriptions)",
    details: ["Everything saves as you change it."],
  },
];

const TIPS = [
  { icon: Search, text: "Search any expense from the bar at the top." },
  { icon: EyeOff, text: "The eye button blurs every amount — handy in public." },
  { icon: Download, text: "Settings → Export gives you a CSV for Excel." },
];

export default async function HelpPage() {
  const [usage, expenseCategories, incomeCategories] = await Promise.all([
    getFeatureUsage(),
    getExpenseCategories().catch(() => []),
    getIncomeCategories().catch(() => []),
  ]);

  const steps: Step[] = [
    {
      id: "expense",
      title: "Add your first expense",
      why: "Takes 5 seconds — amount, what for, done.",
      icon: Receipt,
      color: "var(--chart-4)",
      done: usage.expenses > 0,
      action: (t) => <AddExpenseDialog categories={expenseCategories} trigger={t} />,
      href: "/expenses",
    },
    {
      id: "income",
      title: "Log your salary",
      why: "Unlocks your savings rate on the dashboard.",
      icon: TrendingUp,
      color: "var(--success)",
      done: usage.income > 0,
      action: (t) => <AddIncomeDialog categories={incomeCategories} trigger={t} />,
      href: "/income",
    },
    {
      id: "bill",
      title: "Add a bill that repeats",
      why: "Rent, Netflix, EMI — added automatically, reminded before it's due.",
      icon: CalendarClock,
      color: "var(--warning)",
      done: usage.bills > 0,
      action: (t) => <RecurringForm categories={expenseCategories} trigger={t} />,
      href: "/recurring",
    },
    {
      id: "invest",
      title: "Log something you invested",
      why: "An FD, a lump sum, gold — kept out of spending.",
      icon: PiggyBank,
      color: "var(--cat-groceries)",
      done: usage.investments > 0,
      action: (t) => <AddInvestmentDialog trigger={t} />,
      href: "/savings",
    },
    {
      id: "sip",
      title: "Set up your monthly SIP",
      why: "Enter it once; it logs itself every month.",
      icon: Repeat,
      color: "var(--cat-healthcare)",
      done: usage.sips > 0,
      action: (t) => <AddSipDialog trigger={t} />,
      href: "/savings",
    },
    {
      id: "lending",
      title: "Note money you lent a friend",
      why: "Never forget who owes what.",
      icon: HandCoins,
      color: "var(--cat-entertainment)",
      done: usage.lending > 0,
      action: (t) => <AddLendingDialog people={[]} trigger={t} />,
      href: "/lending",
    },
    {
      id: "category",
      title: "Make a category of your own",
      why: "Petrol, Gym, Pet — whatever fits your life.",
      icon: Tags,
      color: "var(--cat-shopping)",
      done: usage.customCategories > 0,
      action: (t) => <Link href="/settings/categories">{t}</Link>,
      href: "/settings/categories",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  // Done steps sink to the bottom so the next thing to try is always first.
  const ordered = [...steps].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-start gap-2">
        <Link
          href="/settings"
          aria-label="Back to settings"
          className="surface mt-1 grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <PageHeader title="How to use this app" description="Try each feature right here — no reading required." />
      </div>

      <Panel>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <IconChip icon={Wallet} color="var(--chart-1)" size="sm" />
              {allDone ? "You've tried everything" : "Get started"}
            </CardTitle>
            <span className="text-sm font-semibold">
              {doneCount}
              <span className="text-muted-foreground">/{steps.length}</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--success)] transition-[width] duration-700"
              style={{ width: `${Math.max(4, (doneCount / steps.length) * 100)}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {ordered.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border p-3 transition-colors",
                step.done ? "bg-muted/50" : "bg-card"
              )}
            >
              {step.done ? (
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--success)] text-white">
                  <Check className="size-4" strokeWidth={3} />
                </span>
              ) : (
                <IconChip icon={step.icon} color={step.color} size="sm" />
              )}
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold", step.done && "text-muted-foreground line-through")}>
                  {step.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">{step.why}</p>
              </div>
              {step.done ? (
                <Link
                  href={step.href}
                  className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-primary hover:bg-muted"
                >
                  Open <ArrowRight className="size-3" />
                </Link>
              ) : (
                step.action(
                  <button
                    type="button"
                    className="btn-solid shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold"
                  >
                    Try it
                  </button>
                )
              )}
            </div>
          ))}
        </CardContent>
      </Panel>

      <section className="space-y-2">
        <p className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Explore</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Panel key={feature.title} size="sm">
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-start gap-3">
                  <IconChip icon={feature.icon} color={feature.color} size="md" />
                  <div className="min-w-0">
                    <p className="font-semibold">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.line}</p>
                  </div>
                </div>
                <details className="group text-xs text-muted-foreground">
                  <summary className="cursor-pointer list-none font-medium text-foreground/80 hover:text-foreground">
                    <span className="group-open:hidden">More ›</span>
                    <span className="hidden group-open:inline">Less ‹</span>
                  </summary>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {feature.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </details>
                <Link
                  href={feature.href}
                  className="field mt-auto flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold hover:bg-muted"
                >
                  Open {feature.title.split(":")[0]} <ArrowRight className="size-3" />
                </Link>
              </CardContent>
            </Panel>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <p className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Quick tips</p>
        <Panel size="sm">
          <CardContent className="space-y-2.5">
            {TIPS.map((tip) => (
              <p key={tip.text} className="flex items-center gap-2.5 text-sm">
                <tip.icon className="size-4 shrink-0 text-muted-foreground" />
                {tip.text}
              </p>
            ))}
          </CardContent>
        </Panel>
      </section>
    </div>
  );
}
