import { Layers, Target, Wallet } from "lucide-react";
import { getOverallBudget, getCategoryBudgets } from "@/lib/queries/budgets";
import { getAnalytics } from "@/lib/queries/analytics";
import { getCategories } from "@/lib/queries/categories";
import { monthRange } from "@/lib/dates";
import { saveOverallBudgetAction, saveCategoryBudgetAction, deleteCategoryBudgetAction } from "@/lib/actions/budgets";
import { BudgetProgress } from "@/components/budgets/budget-progress";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetDeleteButton } from "@/components/budgets/budget-delete-button";
import { EmptyState } from "@/components/shared/empty-state";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/shared/glass-card";
import { CategoryIcon } from "@/components/shared/category-icon";
import { GlassIcon } from "@/components/shared/glass-icon";
import { PageHeader } from "@/components/shared/page-header";

export default async function BudgetsPage() {
  const now = new Date();
  const { start, end } = monthRange(now);

  const [overallBudget, categoryBudgets, analytics, categories] = await Promise.all([
    getOverallBudget(now),
    getCategoryBudgets(now),
    getAnalytics(start, end),
    getCategories(),
  ]);

  const spentByCategoryId = new Map(analytics.categoryBreakdown.map((c) => [c.categoryId, c.paise]));
  const budgetedCategoryIds = new Set(categoryBudgets.map((b) => b.category_id));
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Budgets" description="Set a limit and track how close you are." />

      <GlassCard tint="var(--chart-1)">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <GlassIcon icon={Target} color="var(--chart-1)" size="sm" />
            Monthly Budget
          </CardTitle>
          <BudgetForm
            label="Monthly budget"
            currentPaise={overallBudget?.amount_paise}
            onSave={async (paise) => {
              "use server";
              await saveOverallBudgetAction(paise);
            }}
          />
        </CardHeader>
        <CardContent>
          {overallBudget ? (
            <BudgetProgress label="" spentPaise={analytics.totalPaise} budgetPaise={overallBudget.amount_paise} />
          ) : (
            <EmptyState icon={Wallet} title="No monthly budget set" description="Set a budget to track your spending against it." />
          )}
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <GlassIcon icon={Layers} color="var(--cat-shopping)" size="sm" />
            Category Budgets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categoryBudgets.length === 0 && (
            <p className="text-sm text-muted-foreground">No category budgets set yet.</p>
          )}
          {categoryBudgets.map((budget) => (
            <div key={budget.id} className="flex items-start gap-3">
              <CategoryIcon name={budget.category?.name} size="md" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <BudgetProgress
                  label={budget.category?.name ?? "Category"}
                  spentPaise={spentByCategoryId.get(budget.category_id!) ?? 0}
                  budgetPaise={budget.amount_paise}
                />
              </div>
              <BudgetForm
                label={`${budget.category?.name ?? "Category"} budget`}
                currentPaise={budget.amount_paise}
                onSave={async (paise) => {
                  "use server";
                  await saveCategoryBudgetAction(budget.category_id!, paise);
                }}
              />
              <BudgetDeleteButton
                categoryName={budget.category?.name ?? "Category"}
                onDelete={async () => {
                  "use server";
                  await deleteCategoryBudgetAction(budget.id);
                }}
              />
            </div>
          ))}

          {availableCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-white/40 pt-4 dark:border-white/10">
              {availableCategories.map((cat) => (
                <BudgetForm
                  key={cat.id}
                  label={`${cat.name} budget`}
                  buttonLabel={`Set ${cat.name} budget`}
                  onSave={async (paise) => {
                    "use server";
                    await saveCategoryBudgetAction(cat.id, paise);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </GlassCard>
    </div>
  );
}
