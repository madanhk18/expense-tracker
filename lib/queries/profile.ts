import { createClient } from "@/lib/supabase/server";

/**
 * The name to greet the signed-in user with: their profile display name,
 * falling back to the local part of their email, then to a neutral "there".
 */
export async function getGreetingName(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "there";

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.display_name?.trim();
  if (name) return name.split(" ")[0];

  const emailName = user.email?.split("@")[0];
  if (!emailName) return "there";

  // "madan.hk" / "madan_hk" -> "Madan"
  const first = emailName.split(/[._-]/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}
