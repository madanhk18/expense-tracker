import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      "This \"How to use this app\" page — a running guide to every feature, updated as new ones ship.",
      "That's the only feature shipped so far. Income tracking, Lending (Udhaar), and Bill Reminders below are planned but not built yet — this list will move them up here once they are.",
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
    badge: "Coming soon",
    points: [
      "A dashboard banner will surface recurring bills due in the next few days, and flag any that are overdue.",
      "This section will be filled in once the feature ships.",
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold">How to use this app</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        A quick guide to every feature — what it does and how to use it.
      </p>

      {SECTIONS.map((section) => (
        <Card key={section.title}>
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
        </Card>
      ))}
    </div>
  );
}
