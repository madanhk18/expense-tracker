import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateDueRecurringExpenses } from "@/lib/queries/dashboard";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";

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

  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
