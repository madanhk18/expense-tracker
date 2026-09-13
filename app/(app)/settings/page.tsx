import Link from "next/link";
import {
  ChevronRight,
  HelpCircle,
  Palette,
  ShieldCheck,
  Tags,
  UserRound,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateProfileAction } from "@/lib/actions/settings";
import { ProfileForm } from "@/components/settings/profile-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { GlassCard } from "@/components/shared/glass-card";
import { GlassIcon } from "@/components/shared/glass-icon";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

const LINKS = [
  {
    href: "/settings/categories",
    label: "Manage categories",
    icon: Tags,
    color: "var(--cat-shopping)",
  },
  { href: "/budgets", label: "Manage budgets", icon: Wallet, color: "var(--cat-healthcare)" },
  {
    href: "/settings/account",
    label: "Account & security",
    icon: ShieldCheck,
    color: "var(--cat-bills)",
  },
  {
    href: "/settings/help",
    label: "How to use this app",
    icon: HelpCircle,
    color: "var(--cat-entertainment)",
  },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Settings" description="Your profile, appearance and account." />

      <GlassCard tint="var(--chart-1)">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <GlassIcon icon={UserRound} color="var(--chart-1)" size="sm" />
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
      </GlassCard>

      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <GlassIcon icon={Palette} color="var(--cat-subscriptions)" size="sm" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Theme</p>
          <ThemeToggle />
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardContent className="space-y-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-2xl px-2 py-2.5 text-sm font-medium transition-colors hover:bg-white/50 dark:hover:bg-white/8"
            >
              <GlassIcon icon={link.icon} color={link.color} size="sm" />
              {link.label}
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </GlassCard>
    </div>
  );
}
