"use server";

import { revalidatePath } from "next/cache";
import { upsertOverallBudget, upsertCategoryBudget } from "@/lib/queries/budgets";

export async function saveOverallBudgetAction(amountPaise: number) {
  await upsertOverallBudget(amountPaise);
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

export async function saveCategoryBudgetAction(categoryId: string, amountPaise: number) {
  await upsertCategoryBudget(categoryId, amountPaise);
  revalidatePath("/budgets");
}
