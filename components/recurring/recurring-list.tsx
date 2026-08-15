"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Repeat } from "lucide-react";

interface RecurringItem {
  id: string;
  description: string;
  amount_paise: number;
  frequency: string;
  next_due_date: string;
  is_active: boolean;
  merchant: string | null;
  category: { name: string } | null;
}

export function RecurringList({ items }: { items: RecurringItem[] }) {
  const router = useRouter();

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("recurring_expenses").update({ is_active: isActive }).eq("id", id);
      if (error) throw error;
      router.refresh();
    } catch (error) {
      logError("recurring-toggle", error);
      toast.error(toFriendlyMessage(error));
    }
  }

  async function handleDelete(id: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Recurring expense removed");
      router.refresh();
    } catch (error) {
      logError("recurring-delete", error);
      toast.error(toFriendlyMessage(error));
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Repeat}
        title="No recurring expenses"
        description="Add subscriptions, rent, or bills that repeat automatically."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.description}</p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {item.category && <Badge variant="secondary" className="font-normal">{item.category.name}</Badge>}
                <span className="capitalize">{item.frequency}</span>
                <span>· Next: {formatDate(new Date(item.next_due_date))}</span>
              </div>
            </div>
            <span className="font-medium tabular-nums">{formatINR(item.amount_paise)}</span>
            <Switch checked={item.is_active} onCheckedChange={(checked) => toggleActive(item.id, checked)} />
            <Button variant="ghost" size="icon" className="size-8" onClick={() => handleDelete(item.id)}>
              <Trash2 className="size-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
