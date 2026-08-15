import { format } from "date-fns";
import type { ExpenseWithCategory } from "@/types/domain";
import { paiseToRupees } from "@/lib/money";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function expensesToCSV(expenses: ExpenseWithCategory[]): string {
  const header = ["Date", "Time", "Item", "Category", "Merchant", "Payment Method", "Amount", "Notes"];
  const lines = expenses.map((e) => {
    const date = new Date(e.expense_at);
    return [
      format(date, "yyyy-MM-dd"),
      format(date, "HH:mm"),
      e.description,
      e.category?.name ?? "",
      e.merchant ?? "",
      e.payment_method,
      paiseToRupees(e.amount_paise).toFixed(2),
      e.notes ?? "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(",");
  });

  return [header.join(","), ...lines].join("\n");
}

export function expensesToJSON(expenses: ExpenseWithCategory[]): string {
  return JSON.stringify(
    expenses.map((e) => ({
      date: e.expense_at,
      item: e.description,
      category: e.category?.name ?? null,
      merchant: e.merchant,
      paymentMethod: e.payment_method,
      amountRupees: paiseToRupees(e.amount_paise),
      notes: e.notes,
    })),
    null,
    2
  );
}
