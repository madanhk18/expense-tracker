import { deleteAccountAction } from "@/lib/actions/settings";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { LogoutButton } from "@/components/layout/logout-button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Panel } from "@/components/shared/panel";
import { PageHeader } from "@/components/shared/page-header";

export default function AccountSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Account &amp; security" description="Password, sessions and account removal." />

      <Panel>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Panel>

      <Panel>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Panel>

      <Panel className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Deleting your account permanently removes all your expenses, budgets, and recurring rules. This cannot be undone.
          </p>
          <DeleteAccountDialog
            onConfirm={async () => {
              "use server";
              await deleteAccountAction();
            }}
          />
        </CardContent>
      </Panel>
    </div>
  );
}
