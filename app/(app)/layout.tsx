import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateDueRecurringExpenses } from "@/lib/queries/dashboard";
import { getExpenseCategories } from "@/lib/queries/categories";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AddExpenseFab } from "@/components/expenses/add-expense-fab";
import { Topbar } from "@/components/layout/topbar";
import { IdleLogout } from "@/components/auth/idle-logout";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Idempotent + dedup-safe at the DB level — safe to call on every layout render.
  try {
    await generateDueRecurringExpenses();
  } catch {
    // Non-fatal: recurring generation failing shouldn't block the whole app from loading.
  }

  // Powers the mobile add-expense button.
  const categories = await getExpenseCategories();

  return (
    <div className="flex min-h-svh bg-background">
      <IdleLogout />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-28 md:pb-0">
        <Topbar />
        <main className="flex-1 p-4 pb-8 md:p-6">{children}</main>
      </div>
      <AddExpenseFab categories={categories} />
      <BottomNav />
    </div>
  );
}
