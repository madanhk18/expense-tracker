"use server";

import { revalidatePath } from "next/cache";
import { createIncome, updateIncome, deleteIncome } from "@/lib/queries/income";
import type { IncomeInsertValues } from "@/lib/validations/income.schema";

export async function createIncomeAction(input: IncomeInsertValues) {
  await createIncome(input);
  revalidatePath("/income");
  revalidatePath("/dashboard");
}

export async function updateIncomeAction(id: string, input: Partial<IncomeInsertValues>) {
  await updateIncome(id, input);
  revalidatePath("/income");
  revalidatePath("/dashboard");
}

export async function deleteIncomeAction(id: string) {
  await deleteIncome(id);
  revalidatePath("/income");
  revalidatePath("/dashboard");
}
