"use server";

import { revalidatePath } from "next/cache";
import { parseToPaise } from "@/lib/money";
import {
  createLendingRecord,
  deleteLendingRecord,
  addSettlement,
  deleteSettlement,
} from "@/lib/queries/lending";
import { lendingInsertSchema, type LendingInsertValues } from "@/lib/validations/lending.schema";

function revalidateMoney() {
  revalidatePath("/lending");
  revalidatePath("/income");
  revalidatePath("/savings");
  revalidatePath("/dashboard");
}

export async function createLendingAction(input: LendingInsertValues) {
  await createLendingRecord(lendingInsertSchema.parse(input));
  revalidateMoney();
}

export async function deleteLendingAction(id: string) {
  await deleteLendingRecord(id);
  revalidateMoney();
}

/**
 * Returns an error message instead of throwing for the one case the user can
 * fix — production builds hide thrown Server Action messages from the client.
 */
export async function settleAction(
  recordId: string,
  amount: string,
  note: string
): Promise<{ error: string } | undefined> {
  const paise = parseToPaise(amount);
  if (paise === null) return { error: "Enter a valid amount greater than 0" };

  try {
    await addSettlement(recordId, paise, note.trim() || null);
  } catch (error) {
    if (error instanceof Error && error.message === "REPAYMENT_TOO_LARGE") {
      return { error: "That's more than what's left on this entry." };
    }
    throw error;
  }
  revalidateMoney();
}

export async function deleteSettlementAction(settlementId: string, recordId: string) {
  await deleteSettlement(settlementId, recordId);
  revalidateMoney();
}
