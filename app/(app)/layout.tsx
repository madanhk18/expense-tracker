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
    // Dark ground on mobile, so the content sheet reads as a card sitting on
    // top of it with the nav bar showing through underneath.
    <div className="flex min-h-svh bg-foreground md:bg-background">
      <IdleLogout />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-svh flex-1 flex-col rounded-b-3xl bg-background pb-28 md:min-h-0 md:rounded-none md:pb-0">
          <Topbar />
          <main className="flex-1 p-4 pb-8 md:p-6">{children}</main>
        </div>
      </div>
      <AddExpenseFab categories={categories} />
      <BottomNav />
    </div>
  );
}
