import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/dates";
import type { MoneyFlow } from "@/types/domain";

/**
 * Where a month's money went, via the get_money_flow RPC (0003_money_flows.sql).
 * Returns null — rather than throwing — until that migration has been run, so
 * pages that show it can simply leave the strip out.
 */
export async function getMoneyFlow(ref: Date = new Date()): Promise<MoneyFlow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_money_flow", { ref_date: toISODate(ref) });

  if (error) {
    console.warn("[money-flow] get_money_flow unavailable — has 0003_money_flows.sql been run?", error.message);
    return null;
  }

  const row = data?.[0];
  const flow = {
    earnedPaise: row?.earned_paise ?? 0,
    spentPaise: row?.spent_paise ?? 0,
    investedPaise: row?.invested_paise ?? 0,
    lentPaise: row?.lent_paise ?? 0,
    borrowedPaise: row?.borrowed_paise ?? 0,
    repaidToYouPaise: row?.repaid_to_you_paise ?? 0,
    repaidByYouPaise: row?.repaid_by_you_paise ?? 0,
  };

  return {
    ...flow,
    leftPaise:
      flow.earnedPaise +
      flow.borrowedPaise +
      flow.repaidToYouPaise -
      flow.spentPaise -
      flow.investedPaise -
      flow.lentPaise -
      flow.repaidByYouPaise,
  };
}
