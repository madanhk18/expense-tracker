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
