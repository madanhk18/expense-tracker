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
  findManualPaymentNear,
  findSipDueNear,
  linkPaymentToSip,
  nextDueAfter,
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

/** A payment that looks like one already counted, for the form to ask about. */
export type PossibleDuplicate = { kind: "sip" | "manual"; name: string; date: string };

/**
 * Pass `confirmed: true` to save even if it looks like a SIP payment that
 * will be added automatically; otherwise that case comes back as a question.
 */
export async function createInvestmentAction(
  input: InvestmentInsertValues,
  confirmed = false
): Promise<{ duplicate: PossibleDuplicate } | undefined> {
  const values = investmentInsertSchema.parse(input);
  if (!confirmed) {
    const sip = await findSipDueNear(values.amount_paise, values.invested_at);
    if (sip) return { duplicate: { kind: "sip", name: sip.name, date: sip.next_due_date } };
  }
  await createInvestment(values);
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

/**
 * `firstPayment` answers the duplicate question:
 *   undefined — check, and return the question if a matching payment exists
 *   "linked"  — that payment was this SIP's first one; start from the next date
 *   "separate" — it was a one-off; start as entered
 */
export async function createSipAction(
  input: SipInsertValues,
  firstPayment?: "linked" | "separate"
): Promise<{ duplicate: PossibleDuplicate } | undefined> {
  const values = sipInsertSchema.parse(input);
  const manual = firstPayment === "separate" ? null : await findManualPaymentNear(values.amount_paise, values.start_date);

  if (manual && !firstPayment) {
    return { duplicate: { kind: "manual", name: manual.name, date: manual.invested_at.slice(0, 10) } };
  }

  if (manual && firstPayment === "linked") {
    const ruleId = await createRecurringInvestment(values, nextDueAfter(values.start_date, values.frequency));
    await linkPaymentToSip(manual.id, ruleId);
  } else {
    await createRecurringInvestment(values);
  }

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
