"use server";

import { revalidatePath } from "next/cache";
import {
  createInvestment,
  updateInvestment,
  deleteInvestment,
  createRecurringInvestment,
  setRecurringInvestmentActive,
  deleteRecurringInvestment,
  generateDueRecurringInvestments,
} from "@/lib/queries/investments";
import {
  investmentInsertSchema,
  sipInsertSchema,
  type InvestmentInsertValues,
  type SipInsertValues,
} from "@/lib/validations/investment.schema";

function revalidateMoney() {
  revalidatePath("/savings");
  revalidatePath("/income");
  revalidatePath("/lending");
  revalidatePath("/dashboard");
}

export async function createInvestmentAction(input: InvestmentInsertValues) {
  await createInvestment(investmentInsertSchema.parse(input));
  revalidateMoney();
}

export async function updateInvestmentAction(id: string, input: InvestmentInsertValues) {
  await updateInvestment(id, investmentInsertSchema.parse(input));
  revalidateMoney();
}

export async function deleteInvestmentAction(id: string) {
  await deleteInvestment(id);
  revalidateMoney();
}

export async function createSipAction(input: SipInsertValues) {
  await createRecurringInvestment(sipInsertSchema.parse(input));
  // A SIP that starts today (or earlier) should show up straight away.
  await generateDueRecurringInvestments();
  revalidateMoney();
}

export async function setSipActiveAction(id: string, isActive: boolean) {
  await setRecurringInvestmentActive(id, isActive);
  revalidateMoney();
}

export async function deleteSipAction(id: string) {
  await deleteRecurringInvestment(id);
  revalidateMoney();
}
