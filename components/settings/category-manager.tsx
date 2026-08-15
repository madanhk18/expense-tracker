"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/types/domain";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("categories").insert({ name: newName.trim(), user_id: user.id, is_system: false });
      if (error) throw error;

      toast.success("Category added");
      setNewName("");
      router.refresh();
    } catch (error) {
      logError("category-add", error);
      toast.error(toFriendlyMessage(error, "Couldn't add this category — it may already exist."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Category removed");
      router.refresh();
    } catch (error) {
      logError("category-delete", error);
      toast.error(toFriendlyMessage(error));
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name" />
        <Button type="submit" disabled={submitting}>
          <Plus className="mr-1.5 size-4" /> Add
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge key={cat.id} variant="secondary" className="gap-1.5 py-1.5 pl-3 pr-2 font-normal">
            {cat.name}
            {cat.is_system ? (
              <Lock className="size-3 text-muted-foreground" />
            ) : (
              <button onClick={() => handleDelete(cat.id)} aria-label={`Delete ${cat.name}`}>
                <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}
