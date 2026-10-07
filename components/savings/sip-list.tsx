"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { MoreVertical, Pause, Play, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { investmentStyle } from "@/lib/category-style";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { setSipActiveAction, deleteSipAction } from "@/lib/actions/investments";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconChip } from "@/components/shared/icon-chip";
import type { RecurringInvestment } from "@/types/domain";

const PER = { weekly: "week", monthly: "month", yearly: "year" } as const;

export function SipList({ sips }: { sips: RecurringInvestment[] }) {
  return (
    <div className="divide-y divide-border">
      {sips.map((sip) => (
        <SipRow key={sip.id} sip={sip} />
      ))}
    </div>
  );
}

function SipRow({ sip }: { sip: RecurringInvestment }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const style = investmentStyle(sip.investment_type);

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      router.refresh();
    } catch (error) {
      logError("sip-action", error);
      toast.error(toFriendlyMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-3 py-2.5", !sip.is_active && "opacity-60")}>
      <IconChip icon={style.icon} color={style.color} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{sip.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {sip.is_active ? `Next on ${format(parseISO(sip.next_due_date), "d MMM")}` : "Paused"}
          {" · "}
          {formatINR(sip.amount_paise, { decimals: false })}/{PER[sip.frequency]}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={busy} aria-label="SIP actions">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              run(() => setSipActiveAction(sip.id, !sip.is_active), sip.is_active ? "SIP paused" : "SIP resumed")
            }
          >
            {sip.is_active ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}
            {sip.is_active ? "Pause" : "Resume"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => run(() => deleteSipAction(sip.id), "SIP stopped")}>
            <Trash2 className="mr-2 size-4" /> Stop &amp; remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
