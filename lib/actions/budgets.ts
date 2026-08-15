"use server";

import { revalidatePath } from "next/cache";
import { upsertOverallBudget, upsertCategoryBudget, deleteBudget } from "@/lib/queries/budgets";

export async function saveOverallBudgetAction(amountPaise: number) {
  await upsertOverallBudget(amountPaise);
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function saveCategoryBudgetAction(categoryId: string, amountPaise: number) {
  await upsertCategoryBudget(categoryId, amountPaise);
  revalidatePath("/budgets");
}

export async function deleteCategoryBudgetAction(budgetId: string) {
  await deleteBudget(budgetId);
  revalidatePath("/budgets");
}
