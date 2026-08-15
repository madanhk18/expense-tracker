import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateProfileAction } from "@/lib/actions/settings";
import { ProfileForm } from "@/components/settings/profile-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Theme</p>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y p-0">
          <Link href="/settings/categories" className="flex items-center justify-between p-4 text-sm">
            Manage categories
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link href="/budgets" className="flex items-center justify-between p-4 text-sm">
            Manage budgets
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link href="/settings/account" className="flex items-center justify-between p-4 text-sm">
            Account &amp; security
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
