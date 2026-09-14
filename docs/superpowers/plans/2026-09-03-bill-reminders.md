# Bill Due-Date Reminders Implementation Plan

> **Status: implemented.** All tasks below are done and shipped; the
> dashboard banner is live. Checkboxes ticked after a verification pass.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface upcoming and overdue recurring-expense due dates on the dashboard, so the user doesn't miss a bill.

**Architecture:** Banner-only version, per the spec's explicit recommendation ("Recommend starting here and upgrading to the alerts-table version later"). No new tables, no cron, no push notifications — a single query filters `recurring_expenses` by `next_due_date` and `is_active`, computed live on every dashboard load, rendered as a dismiss-free banner card.

**Tech Stack:** Next.js App Router, Supabase (Postgres, existing `recurring_expenses` table), date-fns.

**Spec:** Section "6. Bill Due-Date Reminders" of the upgrade-plan handoff document discussed in conversation (not a separate file — the relevant section is reproduced in full inside Task 1 below). This plan implements the "simplest version" branch the spec describes, explicitly skipping the `alerts` table / cron / push-notification branches (those depend on Feature 3, Anomaly Alerts, which is out of scope for this build).

## Global Constraints

- Money is always **integer paise (bigint)** in DB and app state. Conversion to/from rupees happens **only** in `lib/money.ts`, only at the UI boundary. Never use floats for money.
- No new table is introduced by this feature, so there is no new RLS surface to add — the existing `recurring_select_own` policy on `recurring_expenses` already scopes every query in this plan to the logged-in user.
- Reads go in `lib/queries/<domain>.ts` (this plan adds to the existing `lib/queries/recurring.ts` rather than creating a new file, since it's a read against the same table).
- Use `date-fns` via `lib/dates.ts`.
- **This repo has no automated test suite** (`package.json` defines only `dev`/`build`/`start`/`lint` — no `test` script). Every "verify" step in this plan therefore means: `npx tsc --noEmit` (types clean), `npm run lint` (no lint errors), and a manual QA pass against the README checklist item(s) added for this feature — not an automated test run.
- After the feature is complete, add corresponding entries to the README testing checklist (`## Testing checklist`), matching its existing bullet style.

---

### Task 1: `lib/dates.ts` helper + `lib/queries/recurring.ts` query

**Files:**
- Modify: `lib/dates.ts`
- Modify: `lib/queries/recurring.ts`

**Interfaces:**
- Consumes: `differenceInCalendarDays` from `date-fns`; existing `createClient` import in `lib/queries/recurring.ts`.
- Produces: `daysUntil(date: Date, ref?: Date): number` in `lib/dates.ts`; `listUpcomingBills(withinDays?: number): Promise<UpcomingBill[]>` in `lib/queries/recurring.ts`, plus the `UpcomingBill` type. Task 2 (UI) imports `listUpcomingBills` and `UpcomingBill`.

- [x] **Step 1: Add `daysUntil` to `lib/dates.ts`**

Add the import `differenceInCalendarDays` to the existing `date-fns` import line at the top of the file (merge into the existing multi-line import rather than adding a second one), then add this function anywhere after the other range helpers:

```typescript
/** Calendar-day distance from `ref` to `date`. Negative means `date` is in the past (overdue). */
export function daysUntil(date: Date, ref: Date = new Date()): number {
  return differenceInCalendarDays(date, ref);
}
```

- [x] **Step 2: Add `listUpcomingBills` to `lib/queries/recurring.ts`**

Add this import at the top of the file:

```typescript
import { toISODate } from "@/lib/dates";
import { addDays } from "date-fns";
```

Add this type and function anywhere after the existing `RecurringInput` interface:

```typescript
export interface UpcomingBill {
  id: string;
  description: string;
  amountPaise: number;
  nextDueDate: string; // yyyy-MM-dd
  categoryName: string | null;
}

/**
 * Active recurring expenses due within `withinDays` days (default 3),
 * including any already overdue (next_due_date in the past but not yet
 * generated — this can happen between dashboard visits). Computed live on
 * every call; no alerts table, no cron. Sorted soonest-due first.
 */
export async function listUpcomingBills(withinDays = 3): Promise<UpcomingBill[]> {
  const supabase = await createClient();
  const cutoff = toISODate(addDays(new Date(), withinDays));

  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("id, description, amount_paise, next_due_date, category:categories(name)")
    .eq("is_active", true)
    .lte("next_due_date", cutoff)
    .order("next_due_date", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    description: string;
    amount_paise: number;
    next_due_date: string;
    category: { name: string } | null;
  }>).map((row) => ({
    id: row.id,
    description: row.description,
    amountPaise: row.amount_paise,
    nextDueDate: row.next_due_date,
    categoryName: row.category?.name ?? null,
  }));
}
```

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
```

- [x] **Step 4: Commit**

```bash
git add lib/dates.ts lib/queries/recurring.ts
git commit -m "feat(bills): add listUpcomingBills query and daysUntil date helper"
```

---

### Task 2: `BillRemindersBanner` component

**Files:**
- Create: `components/dashboard/bill-reminders-banner.tsx`

**Interfaces:**
- Consumes: `UpcomingBill` type (Task 1); `formatINR` (`lib/money.ts`); `daysUntil` (`lib/dates.ts`).
- Produces: `BillRemindersBanner`. Task 3 (dashboard page) imports this.

- [x] **Step 1: Write the component**

```tsx
import { AlertCircle, CalendarClock } from "lucide-react";
import { formatINR } from "@/lib/money";
import { daysUntil } from "@/lib/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UpcomingBill } from "@/lib/queries/recurring";

function dueLabel(nextDueDate: string): { text: string; overdue: boolean } {
  const days = daysUntil(new Date(`${nextDueDate}T00:00:00`));
  if (days < 0) return { text: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`, overdue: true };
  if (days === 0) return { text: "Due today", overdue: false };
  if (days === 1) return { text: "Due tomorrow", overdue: false };
  return { text: `Due in ${days} days`, overdue: false };
}

export function BillRemindersBanner({ bills }: { bills: UpcomingBill[] }) {
  if (bills.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4" />
          Upcoming Bills
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bills.map((bill) => {
          const { text, overdue } = dueLabel(bill.nextDueDate);
          return (
            <div key={bill.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{bill.description}</p>
                <p className={cn("flex items-center gap-1 text-xs", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                  {overdue && <AlertCircle className="size-3" />}
                  {text}
                  {bill.categoryName && ` · ${bill.categoryName}`}
                </p>
              </div>
              <span className="font-medium tabular-nums">{formatINR(bill.amountPaise)}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
```

- [x] **Step 2: Verify**

```bash
npx tsc --noEmit && npm run lint
```

- [x] **Step 3: Commit**

```bash
git add components/dashboard/bill-reminders-banner.tsx
git commit -m "feat(bills): add BillRemindersBanner component"
```

---

### Task 3: Wire the banner into the dashboard

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `listUpcomingBills` (Task 1); `BillRemindersBanner` (Task 2).

- [x] **Step 1: Add the import**

```typescript
import { listUpcomingBills } from "@/lib/queries/recurring";
import { BillRemindersBanner } from "@/components/dashboard/bill-reminders-banner";
```

- [x] **Step 2: Add `listUpcomingBills()` to the existing `Promise.all` and destructure it as `upcomingBills`**

```typescript
  const [stats, recentExpenses, categories, overallBudget, monthAnalytics, upcomingBills] = await Promise.all([
    getDashboardStats(now),
    getRecentExpenses(6),
    getCategories(),
    getOverallBudget(now),
    getAnalytics(start, end),
    listUpcomingBills(),
  ]);
```

(If this file already has a longer `Promise.all` destructure from another feature plan applied earlier — e.g. `getPersonBalances` from the lending plan, or `getIncomeStats` from the income plan — append `listUpcomingBills()` and `upcomingBills` to that existing list rather than replacing it; the exact position among the array entries doesn't matter, only that each promise lines up with its destructured name.)

- [x] **Step 3: Render the banner**

Place `<BillRemindersBanner bills={upcomingBills} />` directly after the `<SpendSummary ... />` line and before the stat-card grid, so it's the first thing the user sees below the headline number:

```tsx
      <SpendSummary monthPaise={stats.monthPaise} percentChange={percentChange} greeting={greeting()} monthRef={now} />

      <BillRemindersBanner bills={upcomingBills} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
```

(Keep whatever `grid-cols-*` value is already in that line — this task doesn't change the stat-card grid.)

- [x] **Step 4: Verify**

```bash
npx tsc --noEmit && npm run lint && npm run dev
```

Manually visit `/dashboard`. To exercise the overdue path without waiting for a real due date: temporarily set an existing recurring expense's `next_due_date` to yesterday's date directly in the Supabase Table Editor, reload the dashboard, confirm it shows "Overdue by 1 day" in the destructive color, then set it back (or let `generate_due_recurring_expenses` catch it up on the next dashboard load, per existing behavior).

- [x] **Step 5: Commit**

```bash
git add "app/(app)/dashboard/page.tsx"
git commit -m "feat(bills): show upcoming/overdue bill reminders on dashboard"
```

---

### Task 4: README testing checklist update

**Files:**
- Modify: `README.md`

- [x] **Step 1: Add checklist items**

In the `## Testing checklist` section of `README.md`, add these bullets after the "recurring expense generates on schedule" line:

```markdown
- [ ] A recurring expense due within 3 days shows on the dashboard's "Upcoming Bills" banner
- [ ] A recurring expense past its due date (not yet generated) shows as "Overdue by N days" in the destructive color, not a negative day count
- [ ] Deactivating a recurring expense (`is_active = false`) immediately removes it from the banner on next dashboard load
- [ ] No upcoming/overdue bills → the "Upcoming Bills" card doesn't render at all (not an empty card)
- [ ] A second test account never sees the first account's recurring expenses in their banner (RLS via existing `recurring_select_own` policy)
```

- [x] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add bill reminders items to testing checklist"
```

---

## Self-Review Notes

- **Spec coverage:** dashboard banner/card sorted by nearest due date (Task 2/3, spec's "sorted by nearest due date"), overdue bills marked "overdue" not negative days (Task 2 `dueLabel`), deactivated recurring rules stop appearing immediately since the query filters `is_active = true` live on every load with no cached/stale alert row (Task 1), no new table / no cron / no push notifications — explicitly the "simplest version" the spec recommends starting with. Push notifications and the `alerts`-table upgrade path are explicitly out of scope per the spec's own phasing ("Recommend starting here... Treat this as an optional stretch sub-feature") and are not attempted here.
- **Placeholder scan:** none — every step has real, complete code.
- **Type consistency:** `UpcomingBill` is defined once in Task 1 and consumed with the same shape in Tasks 2–3.
