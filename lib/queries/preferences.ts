import { createClient } from "@/lib/supabase/server";
import { parsePreferences, type Preferences } from "@/lib/preferences";

export async function getPreferences(): Promise<Preferences> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return parsePreferences(user?.user_metadata);
}
