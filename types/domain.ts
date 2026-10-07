import type { Database } from "./database.types";

export type { LendingStatus } from "./database.types";

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

export type Investment = Database["public"]["Tables"]["investments"]["Row"];
export type RecurringInvestment = Database["public"]["Tables"]["recurring_investments"]["Row"];
export type LendingRecord = Database["public"]["Tables"]["lending_records"]["Row"];
export type LendingSettlement = Database["public"]["Tables"]["lending_settlements"]["Row"];

/** A lending record with its repayments and what's still outstanding. */
export type LendingRecordWithSettlements = LendingRecord & {
  settlements: LendingSettlement[];
  settledPaise: number;
  remainingPaise: number;
};

/** Everything open with one person, netted: positive = they owe you. */
export interface LendingPerson {
  name: string;
  netPaise: number;
  owedToYouPaise: number;
  youOwePaise: number;
  records: LendingRecordWithSettlements[];
}

/** Where one month's money went. See get_money_flow in 0003_money_flows.sql. */
export interface MoneyFlow {
  earnedPaise: number;
  spentPaise: number;
  investedPaise: number;
  lentPaise: number;
  borrowedPaise: number;
  repaidToYouPaise: number;
  repaidByYouPaise: number;
  /** earned + borrowed + repaid to you − spent − invested − lent − repaid by you */
  leftPaise: number;
}
