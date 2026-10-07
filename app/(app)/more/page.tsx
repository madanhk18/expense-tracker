import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  HandCoins,
  HelpCircle,
  PiggyBank,
  Settings,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { listUpcomingBills } from "@/lib/queries/recurring";
import { PageHeader } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { IconChip } from "@/components/shared/icon-chip";
import { CardContent } from "@/components/ui/card";
import { LogoutButton } from "@/components/layout/logout-button";

/** Mobile catch-all for everything that doesn't fit in the bottom bar. */
export default async function MorePage() {
  const dueSoon = await listUpcomingBills(7).catch(() => []);

  const groups = [
    {
      title: "Plan",
      links: [
        {
          href: "/recurring",
          label: "Bills & recurring",
          hint: dueSoon.length > 0 ? `${dueSoon.length} due this week` : "Rent, subscriptions, EMIs",
          icon: CalendarClock,
          color: "var(--warning)",
        },
        { href: "/savings", label: "Savings & SIPs", hint: "Money put aside", icon: PiggyBank, color: "var(--cat-groceries)" },
        { href: "/lending", label: "Lending", hint: "Who owes whom", icon: HandCoins, color: "var(--cat-entertainment)" },
      ],
    },
    {
      title: "App",
      links: [
        { href: "/settings", label: "Settings", hint: "Profile and appearance", icon: Settings, color: "var(--chart-1)" },
        { href: "/settings/categories", label: "Categories", hint: "Spending and income", icon: Tags, color: "var(--cat-shopping)" },
        { href: "/settings/account", label: "Account & security", hint: "Password, delete account", icon: ShieldCheck, color: "var(--cat-bills)" },
        { href: "/settings/help", label: "How to use this app", hint: "Feature guide", icon: HelpCircle, color: "var(--cat-subscriptions)" },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="More" />
      {groups.map((group) => (
        <section key={group.title} className="space-y-2">
          <p className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{group.title}</p>
          <Panel>
            <CardContent className="space-y-1">
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted"
                >
                  <IconChip icon={link.icon} color={link.color} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{link.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{link.hint}</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Panel>
        </section>
      ))}
      <LogoutButton />
    </div>
  );
}
