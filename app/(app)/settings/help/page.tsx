import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";

interface GuideSection {
  title: string;
  badge?: string;
  points: string[];
}

const SECTIONS: GuideSection[] = [
  {
    title: "Recently added",
    badge: "New",
    points: [
      "Bill Reminders — the dashboard now shows an \"Upcoming Bills\" card for any recurring expense (Netflix, rent, etc.) due within the next 3 days, or already overdue. It appears right below your monthly total. Nothing to set up — it reads your existing Recurring rules automatically. See \"Bill Reminders\" below for details.",
      "This \"How to use this app\" page — a running guide to every feature, updated as new ones ship.",
      "Income tracking and Lending (Udhaar) below are still planned, not built yet — they'll move up here once they ship.",
    ],
  },
  {
    title: "Income & savings rate",
    badge: "New",
    points: [
      "The Income tab logs money coming in — salary, freelance work, interest, gifts, refunds. Same flow as an expense: amount, source, optional note, date.",
      "Mark an entry as \"repeats every month\" to flag regular income. It is a label for now — nothing is added automatically yet.",
      "Your savings rate on the dashboard is (income − spending) ÷ income for the current month. 77% means you kept 77 paise of every rupee you earned.",
      "Log no income in a month and the card asks you to add some rather than showing a meaningless 0%.",
      "Spend more than you earned and the rate goes negative, in red, with the amount you overshot by.",
      "Income sources and spending categories are separate lists — you manage both under Settings → Categories.",
    ],
  },
  {
    title: "Dashboard",
    points: [
      "Shows today's, this week's, and this month's spending at a glance, plus your average per day and highest single expense.",
      "The big number at the top is your total spend for the current month, with a % change vs last month underneath.",
      "\"Recent Expenses\" shows your last few entries — tap \"View all\" to go to the full Expenses list.",
      "If you've set a monthly budget, its progress bar appears here too.",
    ],
  },
  {
    title: "Adding an expense",
    points: [
      "Tap \"Add Expense\" (top bar on desktop, the floating + button on mobile) from any screen.",
      "Amount, description, and payment method are required. Category, merchant, date/time, and notes are optional.",
      "Amount always means rupees — type \"450\" or \"450.50\", no need to type ₹.",
      "The same form is used to edit — tap any expense in the list to open it pre-filled.",
    ],
  },
  {
    title: "Expenses list",
    points: [
      "Search by description, merchant, or notes. Filter by category, payment method, or date range (Today / This week / This month / Last month / custom).",
      "Sort by newest, oldest, highest amount, or lowest amount.",
      "Swipe/tap the ⋮ menu on any row to edit or delete it.",
      "Export your expenses as CSV or JSON from the top of this page — useful for backups or spreadsheets.",
      "Import a CSV: the app previews every row first and rejects malformed ones before anything is saved.",
    ],
  },
  {
    title: "Analytics",
    points: [
      "Category breakdown (pie + bar) shows where your money goes each month.",
      "Month-over-month comparison shows whether you're spending more or less than last month, and in which categories.",
      "Use the month picker at the top to look at any past month.",
    ],
  },
  {
    title: "Budgets",
    points: [
      "Set one overall monthly budget, and/or a separate budget per category.",
      "Progress bars turn amber at 70% used, orange at 90%, and red once you go over — so you get a warning before you're over budget, not just after.",
      "Budgets reset each calendar month.",
    ],
  },
  {
    title: "Recurring expenses",
    points: [
      "Set up a rule once (e.g. \"Netflix, ₹649, monthly\") and it auto-generates as a real expense on its due date whenever you open the app — no manual re-entry.",
      "Weekly, monthly, or yearly frequency, with a custom interval (e.g. every 2 weeks).",
      "Turn a rule off any time without deleting its history.",
      "The app guarantees it never generates the same recurring expense twice for the same day, even if you reload repeatedly.",
    ],
  },
  {
    title: "Settings",
    points: [
      "Update your display name and currency preferences under Profile.",
      "Switch between light, dark, and system theme under Appearance.",
      "Manage your custom categories, or change your password / delete your account under Account & security.",
    ],
  },
  {
    title: "Income & Savings Rate",
    badge: "Coming soon",
    points: [
      "Log income alongside expenses to see your savings rate — the % of income you're keeping each month — right on the dashboard.",
      "This section will be filled in once the feature ships.",
    ],
  },
  {
    title: "Lending (Udhaar tracker)",
    badge: "Coming soon",
    points: [
      "Track informal money lent to or borrowed from friends and family, with a running balance per person and partial-settlement history.",
      "This section will be filled in once the feature ships.",
    ],
  },
  {
    title: "Bill Reminders",
    points: [
      "Any active Recurring expense due within the next 3 days — or already overdue — shows up automatically in the \"Upcoming Bills\" card on your dashboard.",
      "No setup needed: it's generated from the same rules you already created under Recurring. Nothing to add or toggle.",
      "Bills due today or tomorrow show \"Due today\" / \"Due tomorrow\"; further out shows \"Due in N days\".",
      "A bill past its due date (not yet auto-generated as an expense) shows in red as \"Overdue by N days\" so it stands out.",
      "Turn off a recurring rule under Recurring and it disappears from this card immediately — no separate reminder to cancel.",
      "No bills due soon → the card simply doesn't show, keeping the dashboard uncluttered.",
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start gap-2">
        <Link
          href="/settings"
          aria-label="Back to settings"
          className="glass mt-1 grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <PageHeader
          title="How to use this app"
          description="A quick guide to every feature — what it does and how to use it."
        />
      </div>

      {SECTIONS.map((section) => (
        <GlassCard key={section.title}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{section.title}</CardTitle>
            {section.badge && (
              <Badge variant="secondary" className="font-normal">
                {section.badge}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
              {section.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </CardContent>
        </GlassCard>
      ))}
    </div>
  );
}
