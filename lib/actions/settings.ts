"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function updateProfileAction(input: { displayName: string; dateFormat: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: input.displayName || null, date_format: input.dateFormat })
    .eq("id", user.id);

  if (error) throw error;
  revalidatePath("/settings");
}

/**
 * Permanently deletes the user's auth account (cascades to all their data
 * via `on delete cascade` FKs). Requires the service-role key because a
 * client can never delete its own auth.users row via the anon key.
 */
export async function deleteAccountAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = await createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw error;

  await supabase.auth.signOut();
  redirect("/login");
}
