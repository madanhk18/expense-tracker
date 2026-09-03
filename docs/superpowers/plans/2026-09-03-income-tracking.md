# Income Tracking + Savings Rate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user log income (not just expenses) and see their monthly savings rate — the single most important personal-finance number — surfaced on the dashboard.

**Architecture:** Add a `type` discriminator column (`'expense' | 'income'`) to the existing `categories` table (reusing existing category UI/filter components, per the spec's recommendation) plus a new `income` table with RLS. A new `get_income_stats` Postgres RPC returns income totals and a null-safe savings-rate percentage in one round trip, mirroring the existing `get_dashboard_stats` pattern. A new `/income` route mirrors `/expenses`; the dashboard gets a savings-rate stat card and an income-vs-expense bar comparison.

**Tech Stack:** Next.js App Router, Supabase (Postgres + RLS), Zod, React Hook Form, shadcn/ui, Recharts, date-fns.

**Spec:** Section "1. Income Tracking + Savings Rate" of the upgrade-plan handoff document discussed in conversation (not a separate file — the relevant section is reproduced in full inside Task 1 below).

## Global Constraints

- Money is always **integer paise (bigint)** in DB and app state. Conversion to/from rupees happens **only** in `lib/money.ts`, only at the UI boundary. Never use floats for money.
- Every new table gets **Row Level Security**, added in the *same* migration as the table, following the exact policy-naming pattern in `supabase/migrations/0001_init.sql`.
- Reads go in `lib/queries/<domain>.ts`. Mutations go in `lib/actions/<domain>.ts` as Server Actions (`"use server"`). Validation schemas go in `lib/validations/<domain>.schema.ts`.
- Derive app-level types from `types/database.types.ts` in `types/domain.ts` — never hand-roll parallel types.
- Use `date-fns` via `lib/dates.ts`, Zod, React Hook Form, shadcn/ui + Tailwind, Recharts for the comparison chart.
- **This repo has no automated test suite** (`package.json` defines only `dev`/`build`/`start`/`lint` — no `test` script). Every "verify" step in this plan therefore means: `npx tsc --noEmit` (types clean), `npm run lint` (no lint errors), and a manual QA pass against the README checklist item(s) added for this feature — not an automated test run.
- After the feature is complete, add corresponding entries to the README testing checklist (`## Testing checklist`), matching its existing bullet style.

---

### Task 1: Migration — `categories.type` column, `income` table, RLS, `get_income_stats` RPC

**Files:**
- Create: `supabase/migrations/0002_income.sql`

**Interfaces:**
- Produces: `public.categories.type` column (default `'expense'`); table `public.income` (`id`, `user_id`, `amount_paise`, `category_id`, `description`, `received_at`, `is_recurring`, `recurring_income_id`, `created_at`, `updated_at`); function `public.get_income_stats(ref_date date)` returning `(today_income_paise, week_income_paise, month_income_paise, previous_month_income_paise, month_expense_paise, savings_rate_percent)`. Later tasks read/write these exact names.

- [ ] **Step 1: Write the migration file**

```sql
-- ============================================================================
-- Income tracking + savings rate
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- categories: add a type discriminator so income sources reuse the existing
-- category table/UI instead of a parallel "income_sources" concept.
-- Existing rows default to 'expense' so nothing already stored changes meaning.
-- ----------------------------------------------------------------------------
alter table public.categories add column if not exists type text not null default 'expense'
  check (type in ('expense', 'income'));

-- Seed default income categories (system, is_system true) — mirrors the
-- expense-category seed block at the end of 0001_init.sql.
insert into public.categories (name, icon, is_system, user_id, type)
values
  ('Salary', 'Wallet', true, null, 'income'),
  ('Freelance', 'Laptop', true, null, 'income'),
  ('Interest', 'Percent', true, null, 'income'),
  ('Gift', 'Gift', true, null, 'income'),
  ('Refund', 'Undo2', true, null, 'income'),
  ('Other Income', 'MoreHorizontal', true, null, 'income')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- income
-- ----------------------------------------------------------------------------
create table if not exists public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  category_id uuid references public.categories (id) on delete set null,
  description text,
  received_at timestamptz not null default now(),
  is_recurring boolean not null default false,
  -- No FK target yet — recurring income automation is out of scope for this
  -- feature; this field just reserves the shape for a future recurring_income
  -- table, matching the spec's "skip actual recurring income automation, just
  -- the flag/field for future use" instruction.
  recurring_income_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists income_user_received_at_idx
  on public.income (user_id, received_at desc);

drop trigger if exists set_updated_at on public.income;
create trigger set_updated_at before update on public.income
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.income enable row level security;

create policy "income_select_own" on public.income
  for select using (user_id = auth.uid());
create policy "income_insert_own" on public.income
  for insert with check (user_id = auth.uid());
create policy "income_update_own" on public.income
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "income_delete_own" on public.income
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RPC: get_income_stats — income totals + savings rate for the dashboard,
-- one round trip. Mirrors the shape/style of get_dashboard_stats in 0001.
-- savings_rate_percent is null (not NaN/Infinity) when month_income_paise = 0.
-- ----------------------------------------------------------------------------
create or replace function public.get_income_stats(ref_date date default current_date)
returns table (
  today_income_paise bigint,
  week_income_paise bigint,
  month_income_paise bigint,
  previous_month_income_paise bigint,
  month_expense_paise bigint,
  savings_rate_percent numeric
)
language sql
security definer set search_path = public
stable
as $$
  with income_sums as (
    select
      coalesce(sum(amount_paise) filter (where received_at::date = ref_date), 0)::bigint as today_income_paise,
      coalesce(sum(amount_paise) filter (
        where received_at::date >= date_trunc('week', ref_date::timestamp)::date
          and received_at::date < (date_trunc('week', ref_date::timestamp) + interval '7 days')::date
      ), 0)::bigint as week_income_paise,
      coalesce(sum(amount_paise) filter (
        where received_at::date >= date_trunc('month', ref_date::timestamp)::date
          and received_at::date <= ref_date
      ), 0)::bigint as month_income_paise,
      coalesce(sum(amount_paise) filter (
        where received_at::date >= date_trunc('month', ref_date::timestamp - interval '1 month')::date
          and received_at::date < date_trunc('month', ref_date::timestamp)::date
      ), 0)::bigint as previous_month_income_paise
    from public.income
    where user_id = auth.uid()
  ),
  expense_sums as (
    select coalesce(sum(amount_paise) filter (
      where expense_at::date >= date_trunc('month', ref_date::timestamp)::date
        and expense_at::date <= ref_date
    ), 0)::bigint as month_expense_paise
    from public.expenses
    where user_id = auth.uid()
  )
  select
    income_sums.today_income_paise,
    income_sums.week_income_paise,
    income_sums.month_income_paise,
    income_sums.previous_month_income_paise,
    expense_sums.month_expense_paise,
    case
      when income_sums.month_income_paise = 0 then null
      else round(
        ((income_sums.month_income_paise - expense_sums.month_expense_paise)::numeric / income_sums.month_income_paise) * 100,
        1
      )
    end as savings_rate_percent
  from income_sums, expense_sums;
$$;

commit;
```

- [ ] **Step 2: Run the migration**

Open the Supabase dashboard SQL Editor for this project, paste the file contents, run it. (Or `npx supabase db push` if the Supabase CLI is linked.) Confirm in **Table Editor** that `income` exists with RLS **Enabled**, and that `categories` has a new `type` column with existing rows showing `expense`.

- [ ] **Step 3: Regenerate types**

```bash
npx supabase gen types typescript --project-id <project-ref> > types/database.types.ts
```

If no live Supabase project is linked yet in this environment, skip this and hand-author the types in Task 2 instead.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_income.sql
git commit -m "feat(db): add categories.type, income table, get_income_stats RPC"
```

---

### Task 2: `types/database.types.ts` + `types/domain.ts` additions

**Files:**
- Modify: `types/database.types.ts`
- Modify: `types/domain.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `CategoryType`, updated `categories` Row with `type`, `Database["public"]["Tables"]["income"]`, `Database["public"]["Functions"]["get_income_stats"]`; domain types `Income`, `IncomeWithCategory`, `IncomeStats`. Later tasks import these exact names.

- [ ] **Step 1: Add `type` to the `categories` table shape in `types/database.types.ts`**

Add near the top with the other unions:

```typescript
export type CategoryType = "expense" | "income";
```

In the existing `categories` entry, add `type: CategoryType;` to `Row`, and update `Insert` to include a default-able field (it already spreads `Partial<Row>`, so no further change needed there beyond adding the field to `Row`):

```typescript
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          icon: string | null;
          color: string | null;
          is_system: boolean;
          type: CategoryType;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
```

- [ ] **Step 2: Add the `income` table type**

Insert after the `budgets` entry, before `recurring_expenses`:

```typescript
      income: {
        Row: {
          id: string;
          user_id: string;
          amount_paise: number;
          category_id: string | null;
          description: string | null;
          received_at: string;
          is_recurring: boolean;
          recurring_income_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["income"]["Row"]> & {
          user_id: string;
          amount_paise: number;
        };
        Update: Partial<Database["public"]["Tables"]["income"]["Row"]>;
        Relationships: [];
      };
```

- [ ] **Step 3: Add the `get_income_stats` RPC type**

If `Database["public"]` has no `Functions` key yet, add one as a sibling of `Tables` (same nesting level, i.e. `public: { Tables: {...}, Functions: {...} }`):

```typescript
    Functions: {
      get_income_stats: {
        Args: { ref_date?: string };
        Returns: {
          today_income_paise: number;
          week_income_paise: number;
          month_income_paise: number;
          previous_month_income_paise: number;
          month_expense_paise: number;
          savings_rate_percent: number | null;
        }[];
      };
    };
```

- [ ] **Step 4: Add domain types to `types/domain.ts`**

Add at the end of the file:

```typescript
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
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add types/database.types.ts types/domain.ts
git commit -m "feat(types): add income domain types and categories.type"
```

---

### Task 3: `lib/validations/income.schema.ts`

**Files:**
- Create: `lib/validations/income.schema.ts`

**Interfaces:**
- Consumes: `parseToPaise` from `lib/money.ts`.
- Produces: `incomeFormSchema`, `IncomeFormValues`, `formToIncomeInsertValues`, `IncomeInsertValues`. Task 4 (queries) and Task 6 (form) import these exact names.

- [ ] **Step 1: Write the schema file** (mirrors `lib/validations/expense.schema.ts`)

```typescript
import { z } from "zod";
import { parseToPaise } from "@/lib/money";

/** Form-shape schema — what the income form actually collects (rupees as string). */
export const incomeFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => parseToPaise(val) !== null, "Enter a valid amount greater than 0"),
  categoryId: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"), // yyyy-MM-dd
  time: z.string().optional().or(z.literal("")), // HH:mm
  isRecurring: z.boolean(),
});

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;

/** Wire-shape schema — what actually gets sent to Supabase (amount as integer paise). */
export const incomeInsertSchema = z.object({
  amount_paise: z.number().int().positive(),
  category_id: z.string().uuid().nullable(),
  description: z.string().trim().max(200).nullable(),
  received_at: z.string(), // ISO timestamp
  is_recurring: z.boolean(),
});

export type IncomeInsertValues = z.infer<typeof incomeInsertSchema>;

/** Convert validated form values into the wire shape sent to Supabase. */
export function formToIncomeInsertValues(values: IncomeFormValues): IncomeInsertValues {
  const paise = parseToPaise(values.amount);
  if (paise === null) throw new Error("Invalid amount");

  const time = values.time && values.time.length > 0 ? values.time : "00:00";
  const receivedAt = new Date(`${values.date}T${time}:00`);

  return {
    amount_paise: paise,
    category_id: values.categoryId || null,
    description: values.description ? values.description : null,
    received_at: receivedAt.toISOString(),
    is_recurring: values.isRecurring,
  };
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add lib/validations/income.schema.ts
git commit -m "feat(income): add Zod validation schemas"
```

---

### Task 4: `lib/queries/income.ts`

**Files:**
- Create: `lib/queries/income.ts`
- Modify: `lib/queries/categories.ts`

**Interfaces:**
- Consumes: `createClient` from `lib/supabase/server`; `IncomeInsertValues` from `lib/validations/income.schema`; `IncomeWithCategory`/`IncomeStats` from `types/domain`.
- Produces: `listIncome(filters?)`, `getIncome(id)`, `createIncome(input)`, `updateIncome(id, input)`, `deleteIncome(id)`, `getRecentIncome(limit?)`, `getIncomeStats(refDate?)`; and `getIncomeCategories()` added to `lib/queries/categories.ts`. Task 5 (actions) and Task 6/7 (UI) rely on these exact names and signatures.

- [ ] **Step 1: Write `lib/queries/income.ts`** (mirrors `lib/queries/expenses.ts` and `lib/queries/dashboard.ts`)

```typescript
import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/dates";
import type { IncomeInsertValues } from "@/lib/validations/income.schema";
import type { IncomeWithCategory, IncomeStats } from "@/types/domain";

export interface IncomeFilters {
  categoryId?: string;
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  sort?: "newest" | "oldest" | "amount_desc" | "amount_asc";
  page?: number;
  pageSize?: number;
}

const SELECT_WITH_CATEGORY = "*, category:categories(id, name, icon, color)";

export async function listIncome(filters: IncomeFilters = {}) {
  const supabase = await createClient();
  const { page = 1, pageSize = 50 } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("income").select(SELECT_WITH_CATEGORY, { count: "exact" });

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.dateFrom) query = query.gte("received_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("received_at", filters.dateTo);

  switch (filters.sort) {
    case "oldest":
      query = query.order("received_at", { ascending: true });
      break;
    case "amount_desc":
      query = query.order("amount_paise", { ascending: false });
      break;
    case "amount_asc":
      query = query.order("amount_paise", { ascending: true });
      break;
    default:
      query = query.order("received_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return { income: (data ?? []) as unknown as IncomeWithCategory[], total: count ?? 0 };
}

export async function getIncome(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("income").select(SELECT_WITH_CATEGORY).eq("id", id).single();
  if (error) throw error;
  return data as unknown as IncomeWithCategory;
}

export async function createIncome(input: IncomeInsertValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("income")
    .insert({ ...input, user_id: user.id })
    .select(SELECT_WITH_CATEGORY)
    .single();

  if (error) throw error;
  return data as unknown as IncomeWithCategory;
}

export async function updateIncome(id: string, input: Partial<IncomeInsertValues>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income")
    .update(input)
    .eq("id", id)
    .select(SELECT_WITH_CATEGORY)
    .single();

  if (error) throw error;
  return data as unknown as IncomeWithCategory;
}

export async function deleteIncome(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("income").delete().eq("id", id);
  if (error) throw error;
}

export async function getRecentIncome(limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income")
    .select(SELECT_WITH_CATEGORY)
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as IncomeWithCategory[];
}

/** One round trip via the get_income_stats RPC (see 0002_income.sql). */
export async function getIncomeStats(refDate: Date = new Date()): Promise<IncomeStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_income_stats", { ref_date: toISODate(refDate) });

  if (error) throw error;
  const row = data?.[0];

  return {
    todayIncomePaise: row?.today_income_paise ?? 0,
    weekIncomePaise: row?.week_income_paise ?? 0,
    monthIncomePaise: row?.month_income_paise ?? 0,
    previousMonthIncomePaise: row?.previous_month_income_paise ?? 0,
    monthExpensePaise: row?.month_expense_paise ?? 0,
    savingsRatePercent: row?.savings_rate_percent ?? null,
  };
}
```

- [ ] **Step 2: Read the existing `getCategories` function**

Open `lib/queries/categories.ts` and confirm its current export shape before editing (it should export a `getCategories()` returning all categories visible to the user, per `categories_select` RLS policy: own rows + system rows). Add a new function to the bottom of that same file:

```typescript
/** Income-type categories only, for the income form's category picker. */
export async function getIncomeCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").eq("type", "income").order("name");
  if (error) throw error;
  return (data ?? []) as unknown as Category[];
}
```

(If `createClient` and `Category` aren't already imported at the top of `lib/queries/categories.ts`, add `import { createClient } from "@/lib/supabase/server";` and `import type { Category } from "@/types/domain";` — check first, since the file's existing `getCategories` almost certainly already imports both.)

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/queries/income.ts lib/queries/categories.ts
git commit -m "feat(income): add query layer and income category filter"
```

---

### Task 5: `lib/actions/income.ts`

**Files:**
- Create: `lib/actions/income.ts`

**Interfaces:**
- Consumes: `createIncome`, `updateIncome`, `deleteIncome` from `lib/queries/income`; `IncomeInsertValues` from `lib/validations/income.schema`.
- Produces: `createIncomeAction(input)`, `updateIncomeAction(id, input)`, `deleteIncomeAction(id)`. Task 6 (UI) imports these.

- [ ] **Step 1: Write the actions file** (mirrors `lib/actions/budgets.ts`)

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createIncome, updateIncome, deleteIncome } from "@/lib/queries/income";
import type { IncomeInsertValues } from "@/lib/validations/income.schema";

export async function createIncomeAction(input: IncomeInsertValues) {
  await createIncome(input);
  revalidatePath("/income");
  revalidatePath("/dashboard");
}

export async function updateIncomeAction(id: string, input: Partial<IncomeInsertValues>) {
  await updateIncome(id, input);
  revalidatePath("/income");
  revalidatePath("/dashboard");
}

export async function deleteIncomeAction(id: string) {
  await deleteIncome(id);
  revalidatePath("/income");
  revalidatePath("/dashboard");
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add lib/actions/income.ts
git commit -m "feat(income): add Server Actions"
```

---

### Task 6: UI components — form, dialog, row, list

**Files:**
- Create: `components/income/income-form.tsx`
- Create: `components/income/add-income-dialog.tsx`
- Create: `components/income/income-row.tsx`
- Create: `components/income/income-list.tsx`

**Interfaces:**
- Consumes: `createIncomeAction`, `updateIncomeAction`, `deleteIncomeAction` (Task 5); `incomeFormSchema`, `formToIncomeInsertValues` (Task 3); `IncomeWithCategory` (Task 2); `formatINR` (`lib/money.ts`); `formatTime`/`groupLabel` (`lib/dates.ts`).
- Produces: `IncomeForm`, `AddIncomeDialog`, `IncomeRow`, `IncomeList`. Task 7 (page) imports `AddIncomeDialog` and `IncomeList`.

- [ ] **Step 1: `components/income/income-form.tsx`** (mirrors `components/expenses/expense-form.tsx`)

```tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { incomeFormSchema, formToIncomeInsertValues, type IncomeFormValues } from "@/lib/validations/income.schema";
import { createIncomeAction, updateIncomeAction } from "@/lib/actions/income";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category, IncomeWithCategory } from "@/types/domain";

interface IncomeFormProps {
  categories: Category[];
  income?: IncomeWithCategory;
  onSuccess: () => void;
}

export function IncomeForm({ categories, income, onSuccess }: IncomeFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const defaults: IncomeFormValues = income
    ? {
        amount: (income.amount_paise / 100).toString(),
        categoryId: income.category_id ?? undefined,
        description: income.description ?? "",
        date: format(new Date(income.received_at), "yyyy-MM-dd"),
        time: format(new Date(income.received_at), "HH:mm"),
        isRecurring: income.is_recurring,
      }
    : {
        amount: "",
        categoryId: undefined,
        description: "",
        date: format(now, "yyyy-MM-dd"),
        time: format(now, "HH:mm"),
        isRecurring: false,
      };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: defaults,
  });

  async function onSubmit(values: IncomeFormValues) {
    if (submitting) return;
    setSubmitting(true);

    try {
      const wire = formToIncomeInsertValues(values);

      if (income) {
        await updateIncomeAction(income.id, wire);
        toast.success("Income updated");
      } else {
        await createIncomeAction(wire);
        toast.success("Income added");
      }

      router.refresh();
      onSuccess();
    } catch (error) {
      logError("income-form-submit", error);
      toast.error(toFriendlyMessage(error, "Couldn't save this income. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">₹</span>
          <Input id="amount" inputMode="decimal" placeholder="0" className="h-14 pl-8 text-2xl font-semibold" autoFocus {...register("amount")} />
        </div>
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Source</Label>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" placeholder="e.g. March salary" {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time (optional)</Label>
          <Input id="time" type="time" {...register("time")} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isRecurring">Recurring income</Label>
        <Controller
          control={control}
          name="isRecurring"
          render={({ field }) => <Switch id="isRecurring" checked={field.value} onCheckedChange={field.onChange} />}
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : income ? "Save changes" : "Add income"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: `components/income/add-income-dialog.tsx`** (mirrors `components/expenses/add-expense-dialog.tsx`)

```tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IncomeForm } from "./income-form";
import type { Category, IncomeWithCategory } from "@/types/domain";

interface AddIncomeDialogProps {
  categories: Category[];
  income?: IncomeWithCategory;
  trigger?: React.ReactNode;
}

export function AddIncomeDialog({ categories, income, trigger }: AddIncomeDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger ?? (
          <Button>
            <Plus className="mr-1.5 size-4" />
            Add Income
          </Button>
        )}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{income ? "Edit income" : "Add income"}</DialogTitle>
          </DialogHeader>
          <IncomeForm categories={categories} income={income} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 3: `components/income/income-row.tsx`** (mirrors `components/expenses/expense-row.tsx`)

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { formatTime } from "@/lib/dates";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { deleteIncomeAction } from "@/lib/actions/income";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IncomeForm } from "./income-form";
import type { Category, IncomeWithCategory } from "@/types/domain";

export function IncomeRow({ income, categories }: { income: IncomeWithCategory; categories: Category[] }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteIncomeAction(income.id);
      toast.success("Income deleted");
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      logError("income-delete", error);
      toast.error(toFriendlyMessage(error, "Couldn't delete this income. Please try again."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 py-2.5">
        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditOpen(true)}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{income.description || income.category?.name || "Income"}</p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {income.category && <Badge variant="secondary" className="font-normal">{income.category.name}</Badge>}
              {income.is_recurring && <Badge variant="outline" className="font-normal">Recurring</Badge>}
              <span>· {formatTime(new Date(income.received_at))}</span>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-500">
            +{formatINR(income.amount_paise)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 size-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-2 size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit income</DialogTitle>
          </DialogHeader>
          <IncomeForm categories={categories} income={income} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this income?</AlertDialogTitle>
            <AlertDialogDescription>
              This income of {formatINR(income.amount_paise)} will be permanently deleted. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 4: `components/income/income-list.tsx`** (mirrors `components/expenses/expense-list.tsx`)

```tsx
import { Wallet } from "lucide-react";
import { groupLabel } from "@/lib/dates";
import { IncomeRow } from "./income-row";
import { EmptyState } from "@/components/shared/empty-state";
import type { Category, IncomeWithCategory } from "@/types/domain";

export function IncomeList({ income, categories }: { income: IncomeWithCategory[]; categories: Category[] }) {
  if (income.length === 0) {
    return <EmptyState icon={Wallet} title="No income logged yet" description="Log your salary or other income to see your savings rate." />;
  }

  const groups = new Map<string, IncomeWithCategory[]>();
  for (const item of income) {
    const label = groupLabel(new Date(item.received_at));
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([label, items]) => (
        <div key={label}>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <div className="divide-y">
            {items.map((item) => (
              <IncomeRow key={item.id} income={item} categories={categories} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit && npm run lint
```

Note: if `components/ui/switch.tsx` doesn't already exist, check `ls components/ui/switch.tsx` — it's listed in the existing project structure, so it should be present already; if not, run `npx shadcn@latest add switch` before verifying.

- [ ] **Step 6: Commit**

```bash
git add components/income
git commit -m "feat(income): add form, dialog, row, and list components"
```

---

### Task 7: Page, nav item, dashboard savings-rate card + comparison chart

**Files:**
- Create: `app/(app)/income/page.tsx`
- Create: `components/dashboard/income-expense-chart.tsx`
- Modify: `components/layout/nav-items.ts`
- Modify: `app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `listIncome`, `getIncomeStats` (Task 4); `getIncomeCategories` (Task 4); `AddIncomeDialog`, `IncomeList` (Task 6).
- Produces: `/income` route; an "Income" nav entry; a "Savings Rate" dashboard stat card; an `IncomeExpenseChart` component.

- [ ] **Step 1: `app/(app)/income/page.tsx`** (mirrors `app/(app)/expenses/page.tsx`, simplified — no search/payment-method filters since income has neither)

```tsx
import { listIncome } from "@/lib/queries/income";
import { getIncomeCategories } from "@/lib/queries/categories";
import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import { IncomeList } from "@/components/income/income-list";

export default async function IncomePage() {
  const [{ income }, categories] = await Promise.all([listIncome({ pageSize: 100 }), getIncomeCategories()]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Income</h1>
        <AddIncomeDialog categories={categories} />
      </div>

      <IncomeList income={income} categories={categories} />
    </div>
  );
}
```

- [ ] **Step 2: `components/dashboard/income-expense-chart.tsx`** (mirrors `components/analytics/category-bar-chart.tsx`'s Recharts usage and `chart-colors.ts` tokens)

```tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatINR } from "@/lib/money";

interface IncomeExpenseChartProps {
  incomePaise: number;
  expensePaise: number;
}

export function IncomeExpenseChart({ incomePaise, expensePaise }: IncomeExpenseChartProps) {
  const data = [
    { name: "Income", paise: incomePaise, fill: "var(--chart-2)" },
    { name: "Expenses", paise: expensePaise, fill: "var(--chart-1)" },
  ];

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid horizontal={false} strokeOpacity={0.3} />
        <XAxis type="number" tickFormatter={(v) => formatINR(v, { decimals: false })} fontSize={12} />
        <YAxis type="category" dataKey="name" width={70} fontSize={12} />
        <Tooltip formatter={(value) => formatINR(Number(value))} />
        <Bar dataKey="paise" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Add nav item to `components/layout/nav-items.ts`**

Follow the same treatment as `Recurring` (desktop-only, per the existing "keep to 5 max" mobile cap — if the lending-tracker plan already added a `Lending` entry, add `Income` alongside it the same way; the block below assumes this feature is applied on its own). `Income` uses the `Wallet` icon and `Budgets` is switched to `PiggyBank` so the two nav entries don't share an icon:

```typescript
import { LayoutDashboard, Receipt, Wallet, PieChart, PiggyBank, Repeat, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/income", label: "Income", icon: Wallet },
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/** Subset shown in the mobile bottom nav — keep to 5 max for tap-target width. */
export const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[3],
  NAV_ITEMS[4],
  NAV_ITEMS[6],
] as const;
```

- [ ] **Step 4: Add savings-rate stat card + comparison chart to `app/(app)/dashboard/page.tsx`**

Add the imports:

```typescript
import { getIncomeStats } from "@/lib/queries/income";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
```

Add `getIncomeStats(now)` to the existing `Promise.all` and destructure it as `incomeStats`:

```typescript
  const [stats, recentExpenses, categories, overallBudget, monthAnalytics, incomeStats] = await Promise.all([
    getDashboardStats(now),
    getRecentExpenses(6),
    getCategories(),
    getOverallBudget(now),
    getAnalytics(start, end),
    getIncomeStats(now),
  ]);
```

Add a "Savings Rate" stat card to the existing 4-card stat grid (change `grid-cols-4` to `grid-cols-5` on desktop to fit it, keep `grid-cols-2` on mobile):

```tsx
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Today" value={formatINR(stats.todayPaise)} />
        <StatCard label="This week" value={formatINR(stats.weekPaise)} />
        <StatCard label="Avg per day" value={formatINR(stats.avgDailyPaise)} />
        <StatCard label="Highest expense" value={formatINR(stats.highestExpensePaise)} />
        <StatCard
          label="Savings rate"
          value={incomeStats.savingsRatePercent === null ? "N/A" : `${incomeStats.savingsRatePercent}%`}
          sub={incomeStats.savingsRatePercent === null ? "Log income to see this" : undefined}
        />
      </div>
```

Add the income-vs-expense comparison card right after that grid, before the budget card:

```tsx
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Income vs Expenses — {monthLabel(now)}</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeExpenseChart incomePaise={incomeStats.monthIncomePaise} expensePaise={incomeStats.monthExpensePaise} />
        </CardContent>
      </Card>
```

`monthLabel` is already imported from `lib/dates` in this file's existing import list if it was used before — if not, add `import { monthLabel } from "@/lib/dates";` (check the existing import line for `lib/dates` in this file and merge into it rather than duplicating the import).

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit && npm run lint && npm run dev
```

Manually visit `/income` and `/dashboard`; confirm the savings-rate card shows "N/A" with no income logged, then log one income entry and confirm it recalculates to a real percentage and the bar chart renders both bars.

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/income/page.tsx" components/dashboard/income-expense-chart.tsx components/layout/nav-items.ts "app/(app)/dashboard/page.tsx"
git commit -m "feat(income): add /income page, nav item, savings-rate card, and comparison chart"
```

---

### Task 8: README testing checklist update

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add checklist items**

In the `## Testing checklist` section of `README.md`, add these bullets after the "Budget progress thresholds" line:

```markdown
- [ ] Add / edit / delete an income entry; totals on `/income` and the dashboard match manual sums
- [ ] Zero income logged this month shows Savings Rate as "N/A", never a crash, NaN, or Infinity
- [ ] Logging income updates the Savings Rate card and the Income vs Expenses chart immediately
- [ ] A second test account cannot see the first account's income (RLS)
- [ ] Default income categories (Salary, Freelance, etc.) appear in the income form's source picker
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add income tracking items to testing checklist"
```

---

## Self-Review Notes

- **Spec coverage:** `categories.type` extension (Task 1, per spec's explicit recommendation over a separate `income_sources` table), `income` table with `is_recurring`/`recurring_income_id` reserved fields (Task 1), income CRUD query/action/validation layers (Tasks 3–5), `/income` route mirroring `/expenses` (Task 7), dashboard Savings Rate stat card next to existing cards (Task 7), income vs. expense Recharts comparison (Task 7), null-safe divide-by-zero savings rate (Task 1 SQL `case` + Task 2 `IncomeStats.savingsRatePercent: number | null` + Task 7 UI "N/A" fallback), RLS isolation (Task 1 + Task 8 checklist). The spec's "Bottom nav / FAB: toggle within existing Add Expense FAB" option was **not** taken — this plan gives Income its own nav entry (desktop-only, same treatment as Recurring) instead, which the spec explicitly offered as the alternative.
- **Placeholder scan:** none — every step has real, complete code.
- **Type consistency:** `IncomeWithCategory`, `IncomeStats`, `IncomeInsertValues`, `IncomeFormValues` are defined once (Tasks 2–3) and reused with identical names/shapes through Tasks 4–7.
