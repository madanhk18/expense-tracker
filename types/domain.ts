import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type RecurringExpense = Database["public"]["Tables"]["recurring_expenses"]["Row"];

export type ExpenseWithCategory = Expense & {
  category: Pick<Category, "id" | "name" | "icon" | "color"> | null;
};

export interface DashboardStats {
  todayPaise: number;
  weekPaise: number;
  monthPaise: number;
  previousMonthPaise: number;
  monthTransactionCount: number;
  avgDailyPaise: number;
  highestExpensePaise: number;
}

export type Income = Database["public"]["Tables"]["income"]["Row"];

export type IncomeWithCategory = Income & {
  category: Pick<Category, "id" | "name" | "icon" | "color"> | null;
};

export interface IncomeStats {
  todayIncomePaise: number;
  weekIncomePaise: number;
  monthIncomePaise: number;
  previousMonthIncomePaise: number;
  monthExpensePaise: number;
  /** null when no income has been logged this month — never NaN/Infinity. */
  savingsRatePercent: number | null;
}
