import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  Download,
  EyeOff,
  HandCoins,
  HelpCircle,
  Palette,
  PiggyBank,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateProfileAction } from "@/lib/actions/settings";
import { parsePreferences } from "@/lib/preferences";
import { getFeatureUsage } from "@/lib/queries/onboarding";
import { format } from "date-fns";
import { ProfileForm } from "@/components/settings/profile-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PrivacySwitch } from "@/components/layout/privacy-toggle";
import { Panel } from "@/components/shared/panel";
import { IconChip } from "@/components/shared/icon-chip";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

const LINKS = [
  { href: "/recurring", label: "Bills & recurring", icon: CalendarClock, color: "var(--warning)" },
  { href: "/settings/categories", label: "Manage categories", icon: Tags, color: "var(--cat-shopping)" },
  { href: "/settings/account", label: "Account & security", icon: ShieldCheck, color: "var(--cat-bills)" },
  { href: "/settings/help", label: "How to use this app", icon: HelpCircle, color: "var(--cat-entertainment)" },
];

const EXPORTS = [
  { kind: "expenses", label: "Expenses", icon: Receipt, color: "var(--chart-4)" },
  { kind: "income", label: "Income", icon: TrendingUp, color: "var(--success)" },
  { kind: "savings", label: "Savings", icon: PiggyBank, color: "var(--cat-groceries)" },
  { kind: "lending", label: "Lending", icon: HandCoins, color: "var(--cat-entertainment)" },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, usage] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    getFeatureUsage(),
  ]);
  const preferences = parsePreferences(user!.user_metadata);

  const displayName = profile?.display_name || user!.email!.split("@")[0]!;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  // Seven things the "Get started" checklist tracks (see settings/help).
  const tried = [
    usage.expenses,
    usage.income,
    usage.bills,
    usage.investments,
    usage.sips,
    usage.lending,
    usage.customCategories,
  ].filter((n) => n > 0).length;
  const stats = [
    { label: "Expenses", value: usage.expenses },
    { label: "Income", value: usage.income },
    { label: "Investments", value: usage.investments },
    { label: "Bills", value: usage.bills },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Settings" description="Your profile, preferences, appearance and data." />

      <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground">
        <div className="flex items-center gap-4 p-5">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-primary-foreground/15 text-xl font-bold ring-2 ring-primary-foreground/25">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xl font-bold tracking-tight">{displayName}</p>
            <p className="truncate text-sm opacity-75">{user!.email}</p>
            {profile?.created_at && (
              <p className="mt-0.5 text-xs opacity-60">
                Tracking since {format(new Date(profile.created_at), "MMMM yyyy")}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 border-t border-primary-foreground/15">
          {stats.map((stat) => (
            <div key={stat.label} className="px-2 py-3 text-center">
              <p className="text-lg font-bold tabular-nums">{stat.value}</p>
              <p className="text-[11px] opacity-65">{stat.label}</p>
            </div>
          ))}
        </div>
        <Link
          href="/settings/help"
          className="flex items-center gap-3 border-t border-primary-foreground/15 px-5 py-3 text-sm transition-colors hover:bg-primary-foreground/10"
        >
          <span className="min-w-0 flex-1">
            {tried === 7 ? "You've tried every feature" : `You've tried ${tried} of 7 features — see what's left`}
          </span>
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-primary-foreground/20">
            <span className="block h-full rounded-full bg-[var(--success)]" style={{ width: `${(tried / 7) * 100}%` }} />
          </span>
          <ChevronRight className="size-4 opacity-70" />
        </Link>
      </section>

      <Panel>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <IconChip icon={UserRound} color="var(--chart-1)" size="sm" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            profile={profile!}
            email={user!.email!}
            onSave={async (values) => {
              "use server";
              await updateProfileAction(values);
            }}
          />
        </CardContent>
      </Panel>

      <Panel>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <IconChip icon={SlidersHorizontal} color="var(--cat-healthcare)" size="sm" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PreferencesForm initial={preferences} />
        </CardContent>
      </Panel>

      <Panel>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <IconChip icon={Palette} color="var(--cat-subscriptions)" size="sm" />
            Appearance & privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <div className="flex items-center justify-between gap-3 pb-3">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Light, dark, or follow your device.</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-3 pt-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <EyeOff className="size-3.5" /> Hide amounts
              </p>
              <p className="text-xs text-muted-foreground">
                Blur every ₹ figure — for checking the app in public. Also the eye button in the top bar.
              </p>
            </div>
            <PrivacySwitch />
          </div>
        </CardContent>
      </Panel>

      <Panel>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <IconChip icon={Download} color="var(--chart-2)" size="sm" />
            Export your data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Download a CSV — opens in Excel, Numbers or Google Sheets.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EXPORTS.map((item) => (
              <a
                key={item.kind}
                href={`/api/export?kind=${item.kind}`}
                download
                className="surface surface-hover flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium"
              >
                <IconChip icon={item.icon} color={item.color} size="sm" />
                {item.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Panel>

      <Panel>
        <CardContent className="space-y-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <IconChip icon={link.icon} color={link.color} size="sm" />
              {link.label}
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Panel>
    </div>
  );
}
