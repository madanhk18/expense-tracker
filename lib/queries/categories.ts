import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/domain";

/** System categories + the current user's own custom categories, alphabetical. */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");

  if (error) throw error;
  return data ?? [];
}

export async function createCategory(input: { name: string; icon?: string; color?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...input, user_id: user.id, is_system: false })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
