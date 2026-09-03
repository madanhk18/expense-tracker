# Udhaar / Lending Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user track informal lending/borrowing with friends and family — who owes them, who they owe, running balances per person, and partial-settlement history.

**Architecture:** Two new Postgres tables (`lending_records`, `lending_settlements`) with RLS, a query layer that computes remaining balance and per-person net totals in JS (no new Postgres functions needed — this is simple aggregation, consistent with the project's existing preference to keep DB functions minimal), Server Actions for all mutations, and a new `/lending` route mirroring the structure of `/expenses`.

**Tech Stack:** Next.js App Router, Supabase (Postgres + RLS), Zod, React Hook Form, shadcn/ui, date-fns.

**Spec:** Section "2. Udhaar / Lending Tracker" of the upgrade-plan handoff document discussed in conversation (not a separate file — the relevant section is reproduced in full inside Task 1 below).

## Global Constraints

- Money is always **integer paise (bigint)** in DB and app state. Conversion to/from rupees happens **only** in `lib/money.ts`, only at the UI boundary. Never use floats for money.
- Every new table gets **Row Level Security**, added in the *same* migration as the table, following the exact policy-naming pattern in `supabase/migrations/0001_init.sql` (`<table>_select_own`, `<table>_insert_own`, `<table>_update_own`, `<table>_delete_own`).
- Reads go in `lib/queries/<domain>.ts`. Mutations go in `lib/actions/<domain>.ts` as Server Actions (`"use server"`). Validation schemas go in `lib/validations/<domain>.schema.ts`.
- Derive app-level types from `types/database.types.ts` in `types/domain.ts` — never hand-roll parallel types.
- Use `date-fns` via `lib/dates.ts`, Zod, React Hook Form, shadcn/ui + Tailwind for all UI.
- **This repo has no automated test suite** (`package.json` defines only `dev`/`build`/`start`/`lint` — no `test` script). Every "verify" step in this plan therefore means: `npx tsc --noEmit` (types clean), `npm run lint` (no lint errors), and a manual QA pass against the README checklist item(s) added for this feature — not an automated test run.
- After the feature is complete, add corresponding entries to the README testing checklist (`## Testing checklist`), matching its existing bullet style.

---

### Task 1: Migration — `lending_records` + `lending_settlements` tables, RLS

**Files:**
- Create: `supabase/migrations/0002_lending.sql`

**Interfaces:**
- Produces: tables `public.lending_records` (`id`, `user_id`, `person_name`, `direction`, `amount_paise`, `description`, `date`, `due_date`, `status`, `created_at`, `updated_at`) and `public.lending_settlements` (`id`, `user_id`, `lending_record_id`, `amount_paise`, `settled_at`, `note`, `created_at`). Later tasks read/write these exact column names.

- [ ] **Step 1: Write the migration file**

```sql
-- ============================================================================
-- Lending / Udhaar tracker
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- lending_records: one row per lend/borrow event with an informal contact
-- (person_name is free text — the other party is not necessarily an app user)
-- ----------------------------------------------------------------------------
create table if not exists public.lending_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  person_name text not null,
  direction text not null check (direction in ('lent', 'borrowed')),
  amount_paise bigint not null check (amount_paise > 0),
  description text,
  date timestamptz not null default now(),
  due_date timestamptz,
  status text not null default 'open' check (status in ('open', 'settled', 'partially_settled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lending_records_user_status_idx
  on public.lending_records (user_id, status);

create index if not exists lending_records_user_person_idx
  on public.lending_records (user_id, lower(person_name));

-- ----------------------------------------------------------------------------
-- lending_settlements: append-only ledger of (partial) repayments against a
-- lending_records row. user_id is duplicated here (not derived via join) so
-- RLS policies stay identical in shape to every other table in this schema.
-- ----------------------------------------------------------------------------
create table if not exists public.lending_settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lending_record_id uuid not null references public.lending_records (id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  settled_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists lending_settlements_record_idx
  on public.lending_settlements (lending_record_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger (reuses public.set_updated_at() from 0001_init.sql)
-- ----------------------------------------------------------------------------
drop trigger if exists set_updated_at on public.lending_records;
create trigger set_updated_at before update on public.lending_records
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.lending_records enable row level security;
alter table public.lending_settlements enable row level security;

create policy "lending_records_select_own" on public.lending_records
  for select using (user_id = auth.uid());
create policy "lending_records_insert_own" on public.lending_records
  for insert with check (user_id = auth.uid());
create policy "lending_records_update_own" on public.lending_records
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "lending_records_delete_own" on public.lending_records
  for delete using (user_id = auth.uid());

create policy "lending_settlements_select_own" on public.lending_settlements
  for select using (user_id = auth.uid());
create policy "lending_settlements_insert_own" on public.lending_settlements
  for insert with check (user_id = auth.uid());
create policy "lending_settlements_delete_own" on public.lending_settlements
  for delete using (user_id = auth.uid());

commit;
```

- [ ] **Step 2: Run the migration**

Open the Supabase dashboard SQL Editor for this project, paste the file contents, run it. (Or `npx supabase db push` if the Supabase CLI is linked.) Confirm in **Table Editor** that both tables exist and RLS shows **Enabled**.

- [ ] **Step 3: Regenerate types**

```bash
npx supabase gen types typescript --project-id <project-ref> > types/database.types.ts
```

If no live Supabase project is linked yet in this environment, skip this and hand-author the types in Task 2 instead (matching the header comment already in `types/database.types.ts` that documents this fallback).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_lending.sql
git commit -m "feat(db): add lending_records and lending_settlements tables with RLS"
```

---

### Task 2: `types/database.types.ts` + `types/domain.ts` additions

**Files:**
- Modify: `types/database.types.ts`
- Modify: `types/domain.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `Database["public"]["Tables"]["lending_records"]`, `Database["public"]["Tables"]["lending_settlements"]`; domain types `LendingRecord`, `LendingSettlement`, `LendingDirection`, `LendingStatus`, `LendingRecordWithSettlements`, `PersonBalance`. Later tasks import these exact names.

- [ ] **Step 1: Add table types to `types/database.types.ts`**

Add near the top, alongside the existing `PaymentMethod`/`RecurringFrequency`/`Theme` unions:

```typescript
export type LendingDirection = "lent" | "borrowed";
export type LendingStatus = "open" | "settled" | "partially_settled";
```

Then add two entries inside `Database["public"]["Tables"]`, in the same shape as the existing `expenses` and `budgets` entries (insert after the `recurring_expenses` entry, before the closing `};` of `Tables`):

```typescript
      lending_records: {
        Row: {
          id: string;
          user_id: string;
          person_name: string;
          direction: LendingDirection;
          amount_paise: number;
          description: string | null;
          date: string;
          due_date: string | null;
          status: LendingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["lending_records"]["Row"]> & {
          user_id: string;
          person_name: string;
          direction: LendingDirection;
          amount_paise: number;
        };
        Update: Partial<Database["public"]["Tables"]["lending_records"]["Row"]>;
        Relationships: [];
      };
      lending_settlements: {
        Row: {
          id: string;
          user_id: string;
          lending_record_id: string;
          amount_paise: number;
          settled_at: string;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["lending_settlements"]["Row"]> & {
          user_id: string;
          lending_record_id: string;
          amount_paise: number;
        };
        Update: Partial<Database["public"]["Tables"]["lending_settlements"]["Row"]>;
        Relationships: [];
      };
```

- [ ] **Step 2: Add domain types to `types/domain.ts`**

Add at the end of the file:

```typescript
export type LendingRecord = Database["public"]["Tables"]["lending_records"]["Row"];
export type LendingSettlement = Database["public"]["Tables"]["lending_settlements"]["Row"];

export type LendingRecordWithSettlements = LendingRecord & {
  settlements: LendingSettlement[];
  remainingPaise: number;
};

/** Net balance for one person across all their lending_records with the user.
 * Positive netPaise = they owe the user. Negative = the user owes them. */
export interface PersonBalance {
  personName: string;
  netPaise: number;
  openRecordCount: number;
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
```

Expected: no new errors (existing unrelated errors, if any, are out of scope).

- [ ] **Step 4: Commit**

```bash
git add types/database.types.ts types/domain.ts
git commit -m "feat(types): add lending domain types"
```

---

### Task 3: `lib/validations/lending.schema.ts`

**Files:**
- Create: `lib/validations/lending.schema.ts`

**Interfaces:**
- Consumes: `parseToPaise` from `lib/money.ts`, `LendingDirection` from `types/database.types.ts`.
- Produces: `lendingFormSchema`, `LendingFormValues`, `formToLendingInsertValues`, `LendingInsertValues`, `settlementFormSchema`, `SettlementFormValues`, `formToSettlementInsertValues`, `SettlementInsertValues`. Task 4 (queries) and Task 6 (forms) import these exact names.

- [ ] **Step 1: Write the schema file**

```typescript
import { z } from "zod";
import { parseToPaise } from "@/lib/money";
import type { LendingDirection } from "@/types/database.types";

/** Form-shape schema — what the add-record form collects (rupees as string). */
export const lendingFormSchema = z.object({
  direction: z.enum(["lent", "borrowed"]),
  personName: z.string().trim().min(1, "Person's name is required").max(100),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => parseToPaise(val) !== null, "Enter a valid amount greater than 0"),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"), // yyyy-MM-dd
  dueDate: z.string().optional().or(z.literal("")), // yyyy-MM-dd
});

export type LendingFormValues = z.infer<typeof lendingFormSchema>;

/** Wire-shape schema — what actually gets sent to Supabase (amount as integer paise). */
export const lendingInsertSchema = z.object({
  direction: z.enum(["lent", "borrowed"]),
  person_name: z.string().trim().min(1).max(100),
  amount_paise: z.number().int().positive(),
  description: z.string().trim().max(200).nullable(),
  date: z.string(), // ISO timestamp
  due_date: z.string().nullable(), // ISO timestamp
});

export type LendingInsertValues = z.infer<typeof lendingInsertSchema>;

export function formToLendingInsertValues(values: LendingFormValues): LendingInsertValues {
  const paise = parseToPaise(values.amount);
  if (paise === null) throw new Error("Invalid amount");

  return {
    direction: values.direction as LendingDirection,
    person_name: values.personName,
    amount_paise: paise,
    description: values.description ? values.description : null,
    date: new Date(`${values.date}T00:00:00`).toISOString(),
    due_date: values.dueDate ? new Date(`${values.dueDate}T00:00:00`).toISOString() : null,
  };
}

/** Form-shape schema for recording a settlement against an existing record. */
export const settlementFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => parseToPaise(val) !== null, "Enter a valid amount greater than 0"),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export type SettlementFormValues = z.infer<typeof settlementFormSchema>;

export const settlementInsertSchema = z.object({
  amount_paise: z.number().int().positive(),
  note: z.string().trim().max(200).nullable(),
});

export type SettlementInsertValues = z.infer<typeof settlementInsertSchema>;

export function formToSettlementInsertValues(values: SettlementFormValues): SettlementInsertValues {
  const paise = parseToPaise(values.amount);
  if (paise === null) throw new Error("Invalid amount");

  return {
    amount_paise: paise,
    note: values.note ? values.note : null,
  };
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add lib/validations/lending.schema.ts
git commit -m "feat(lending): add Zod validation schemas"
```

---

### Task 4: `lib/queries/lending.ts`

**Files:**
- Create: `lib/queries/lending.ts`

**Interfaces:**
- Consumes: `createClient` from `lib/supabase/server`, `LendingInsertValues`/`SettlementInsertValues` from `lib/validations/lending.schema`, `LendingRecordWithSettlements`/`PersonBalance` from `types/domain`.
- Produces: `listLendingRecords(filters?)`, `getLendingRecord(id)`, `getPersonBalances()`, `createLendingRecord(input)`, `addSettlement(recordId, input)`, `deleteLendingRecord(id)`. Task 5 (actions) and Task 6 (UI, via actions) rely on these exact names and signatures.

- [ ] **Step 1: Write the query file**

```typescript
import { createClient } from "@/lib/supabase/server";
import type { LendingInsertValues, SettlementInsertValues } from "@/lib/validations/lending.schema";
import type { LendingRecordWithSettlements, PersonBalance } from "@/types/domain";

export interface LendingFilters {
  status?: "open" | "settled" | "partially_settled";
  direction?: "lent" | "borrowed";
}

const SELECT_WITH_SETTLEMENTS = "*, settlements:lending_settlements(*)";

function withRemaining(record: LendingRecordWithSettlements): LendingRecordWithSettlements {
  const settledPaise = record.settlements.reduce((sum, s) => sum + s.amount_paise, 0);
  return { ...record, remainingPaise: record.amount_paise - settledPaise };
}

export async function listLendingRecords(filters: LendingFilters = {}): Promise<LendingRecordWithSettlements[]> {
  const supabase = await createClient();
  let query = supabase.from("lending_records").select(SELECT_WITH_SETTLEMENTS).order("date", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.direction) query = query.eq("direction", filters.direction);

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as unknown as LendingRecordWithSettlements[]).map(withRemaining);
}

export async function getLendingRecord(id: string): Promise<LendingRecordWithSettlements> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lending_records")
    .select(SELECT_WITH_SETTLEMENTS)
    .eq("id", id)
    .single();

  if (error) throw error;
  return withRemaining(data as unknown as LendingRecordWithSettlements);
}

/**
 * Net balance per person, grouped case-insensitively on person_name so
 * "Rahul" and "rahul K" don't silently merge (that's a different name),
 * but "Rahul" and "rahul" do (same name, different casing). Only records
 * that aren't fully settled contribute to openRecordCount.
 */
export async function getPersonBalances(): Promise<PersonBalance[]> {
  const records = await listLendingRecords();
  const byPerson = new Map<string, PersonBalance & { displayName: string }>();

  for (const record of records) {
    const key = record.person_name.trim().toLowerCase();
    const signedRemaining = record.direction === "lent" ? record.remainingPaise : -record.remainingPaise;

    const existing = byPerson.get(key);
    if (existing) {
      existing.netPaise += signedRemaining;
      if (record.status !== "settled") existing.openRecordCount += 1;
    } else {
      byPerson.set(key, {
        personName: record.person_name.trim(),
        displayName: record.person_name.trim(),
        netPaise: signedRemaining,
        openRecordCount: record.status !== "settled" ? 1 : 0,
      });
    }
  }

  return [...byPerson.values()]
    .map(({ personName, netPaise, openRecordCount }) => ({ personName, netPaise, openRecordCount }))
    .sort((a, b) => Math.abs(b.netPaise) - Math.abs(a.netPaise));
}

export async function createLendingRecord(input: LendingInsertValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("lending_records")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Adds a settlement and updates the parent record's status. Throws if the
 * settlement would push total settled above the original amount — partial
 * repayments are allowed, overpayment is not (edge case decided: block).
 */
export async function addSettlement(recordId: string, input: SettlementInsertValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const record = await getLendingRecord(recordId);
  if (input.amount_paise > record.remainingPaise) {
    throw new Error("Settlement amount exceeds the remaining balance on this record");
  }

  const { error: insertError } = await supabase
    .from("lending_settlements")
    .insert({ ...input, user_id: user.id, lending_record_id: recordId });
  if (insertError) throw insertError;

  const newRemaining = record.remainingPaise - input.amount_paise;
  const newStatus = newRemaining === 0 ? "settled" : "partially_settled";

  const { error: updateError } = await supabase
    .from("lending_records")
    .update({ status: newStatus })
    .eq("id", recordId);
  if (updateError) throw updateError;

  return newStatus;
}

/** Deletes a record and, via ON DELETE CASCADE, all its settlements. */
export async function deleteLendingRecord(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lending_records").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/queries/lending.ts
git commit -m "feat(lending): add query layer with balance computation"
```

---

### Task 5: `lib/actions/lending.ts`

**Files:**
- Create: `lib/actions/lending.ts`

**Interfaces:**
- Consumes: `createLendingRecord`, `addSettlement`, `deleteLendingRecord` from `lib/queries/lending`; `LendingInsertValues`/`SettlementInsertValues` from `lib/validations/lending.schema`.
- Produces: `createLendingRecordAction(input)`, `addSettlementAction(recordId, input)`, `deleteLendingRecordAction(id)`. Task 6 (UI) imports these.

- [ ] **Step 1: Write the actions file**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createLendingRecord, addSettlement, deleteLendingRecord } from "@/lib/queries/lending";
import type { LendingInsertValues, SettlementInsertValues } from "@/lib/validations/lending.schema";

export async function createLendingRecordAction(input: LendingInsertValues) {
  await createLendingRecord(input);
  revalidatePath("/lending");
  revalidatePath("/dashboard");
}

export async function addSettlementAction(recordId: string, input: SettlementInsertValues) {
  await addSettlement(recordId, input);
  revalidatePath("/lending");
  revalidatePath("/dashboard");
}

export async function deleteLendingRecordAction(id: string) {
  await deleteLendingRecord(id);
  revalidatePath("/lending");
  revalidatePath("/dashboard");
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add lib/actions/lending.ts
git commit -m "feat(lending): add Server Actions"
```

---

### Task 6: UI components — form, dialog, row, list

**Files:**
- Create: `components/lending/lending-form.tsx`
- Create: `components/lending/lending-dialog.tsx`
- Create: `components/lending/settlement-dialog.tsx`
- Create: `components/lending/lending-row.tsx`
- Create: `components/lending/lending-list.tsx`

**Interfaces:**
- Consumes: `createLendingRecordAction`, `addSettlementAction`, `deleteLendingRecordAction` (Task 5); `lendingFormSchema`, `formToLendingInsertValues`, `settlementFormSchema`, `formToSettlementInsertValues` (Task 3); `LendingRecordWithSettlements`, `PersonBalance` (Task 2); `formatINR` (`lib/money.ts`); `formatDate` (`lib/dates.ts`).
- Produces: `LendingForm`, `LendingDialog`, `SettlementDialog`, `LendingRow`, `LendingList`. Task 7 (page) imports `LendingDialog` and `LendingList`.

- [ ] **Step 1: `components/lending/lending-form.tsx`** (mirrors `components/expenses/expense-form.tsx`)

```tsx
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { lendingFormSchema, formToLendingInsertValues, type LendingFormValues } from "@/lib/validations/lending.schema";
import { createLendingRecordAction } from "@/lib/actions/lending";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LendingFormProps {
  personNames: string[];
  onSuccess: () => void;
}

export function LendingForm({ personNames, onSuccess }: LendingFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LendingFormValues>({
    resolver: zodResolver(lendingFormSchema),
    defaultValues: {
      direction: "lent",
      personName: "",
      amount: "",
      description: "",
      date: format(now, "yyyy-MM-dd"),
      dueDate: "",
    },
  });

  async function onSubmit(values: LendingFormValues) {
    if (submitting) return;
    setSubmitting(true);

    try {
      await createLendingRecordAction(formToLendingInsertValues(values));
      toast.success(values.direction === "lent" ? "Recorded — you lent this" : "Recorded — you borrowed this");
      router.refresh();
      onSuccess();
    } catch (error) {
      logError("lending-form-submit", error);
      toast.error(toFriendlyMessage(error, "Couldn't save this record. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Direction</Label>
        <Controller
          control={control}
          name="direction"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={field.value === "lent" ? "default" : "outline"} onClick={() => field.onChange("lent")}>
                I lent money
              </Button>
              <Button type="button" variant={field.value === "borrowed" ? "default" : "outline"} onClick={() => field.onChange("borrowed")}>
                I borrowed money
              </Button>
            </div>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="personName">Person</Label>
        <Input id="personName" placeholder="e.g. Rahul" list="lending-person-names" {...register("personName")} />
        <datalist id="lending-person-names">
          {personNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        {errors.personName && <p className="text-sm text-destructive">{errors.personName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">₹</span>
          <Input id="amount" inputMode="decimal" placeholder="0" className="h-14 pl-8 text-2xl font-semibold" autoFocus {...register("amount")} />
        </div>
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" placeholder="e.g. Dinner split, cab fare" {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date (optional)</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : "Save record"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: `components/lending/lending-dialog.tsx`** (mirrors `components/expenses/add-expense-dialog.tsx`)

```tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LendingForm } from "./lending-form";

export function LendingDialog({ personNames }: { personNames: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 size-4" />
        Add record
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add lending record</DialogTitle>
          </DialogHeader>
          <LendingForm personNames={personNames} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 3: `components/lending/settlement-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins } from "lucide-react";
import {
  settlementFormSchema,
  formToSettlementInsertValues,
  type SettlementFormValues,
} from "@/lib/validations/lending.schema";
import { addSettlementAction } from "@/lib/actions/lending";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { formatINR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { LendingRecordWithSettlements } from "@/types/domain";

export function SettlementDialog({ record }: { record: LendingRecordWithSettlements }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementFormSchema),
    defaultValues: { amount: "", note: "" },
  });

  async function onSubmit(values: SettlementFormValues) {
    setSubmitting(true);
    try {
      await addSettlementAction(record.id, formToSettlementInsertValues(values));
      toast.success("Settlement recorded");
      reset();
      setOpen(false);
      router.refresh();
    } catch (error) {
      logError("lending-settlement-submit", error);
      toast.error(toFriendlyMessage(error, "Couldn't record this settlement. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HandCoins className="mr-1.5 size-3.5" />
          Settle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record settlement — {record.person_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">Remaining: {formatINR(record.remainingPaise)}</p>
          <div className="space-y-2">
            <Label htmlFor="settle-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input id="settle-amount" inputMode="decimal" className="pl-7" autoFocus {...register("amount")} />
            </div>
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="settle-note">Note (optional)</Label>
            <Input id="settle-note" placeholder="e.g. Paid via UPI" {...register("note")} />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Record settlement"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: `components/lending/lending-row.tsx`** (mirrors `components/expenses/expense-row.tsx`, minus edit-in-place — records are settled via `SettlementDialog`, not edited)

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { deleteLendingRecordAction } from "@/lib/actions/lending";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { SettlementDialog } from "./settlement-dialog";
import type { LendingRecordWithSettlements } from "@/types/domain";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  partially_settled: "Partially settled",
  settled: "Settled",
};

export function LendingRow({ record }: { record: LendingRecordWithSettlements }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteLendingRecordAction(record.id);
      toast.success("Record deleted");
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      logError("lending-delete", error);
      toast.error(toFriendlyMessage(error, "Couldn't delete this record. Please try again."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {record.direction === "lent" ? "Lent to" : "Borrowed from"} {record.person_name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-normal">{STATUS_LABEL[record.status]}</Badge>
            <span>{formatDate(new Date(record.date))}</span>
            {record.description && <span>· {record.description}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium tabular-nums">{formatINR(record.remainingPaise)}</span>
          {record.status !== "settled" && <SettlementDialog record={record} />}
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This record with {record.person_name} for {formatINR(record.amount_paise)}
              {record.settlements.length > 0 ? ` and its ${record.settlements.length} settlement(s)` : ""} will be
              permanently deleted. This can&apos;t be undone.
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

- [ ] **Step 5: `components/lending/lending-list.tsx`** (grouped by person, mirrors `components/expenses/expense-list.tsx`'s grouping pattern)

```tsx
import { HandCoins } from "lucide-react";
import { formatINR } from "@/lib/money";
import { EmptyState } from "@/components/shared/empty-state";
import { LendingRow } from "./lending-row";
import type { LendingRecordWithSettlements, PersonBalance } from "@/types/domain";

interface LendingListProps {
  records: LendingRecordWithSettlements[];
  balances: PersonBalance[];
}

export function LendingList({ records, balances }: LendingListProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={HandCoins}
        title="No lending records yet"
        description="Track money you lend to or borrow from friends and family."
      />
    );
  }

  const byPerson = new Map<string, LendingRecordWithSettlements[]>();
  for (const record of records) {
    const key = record.person_name.trim().toLowerCase();
    if (!byPerson.has(key)) byPerson.set(key, []);
    byPerson.get(key)!.push(record);
  }

  return (
    <div className="space-y-6">
      {balances.map((balance) => {
        const key = balance.personName.trim().toLowerCase();
        const personRecords = byPerson.get(key) ?? [];
        const summary =
          balance.netPaise === 0
            ? "Settled up"
            : balance.netPaise > 0
              ? `${balance.personName} owes you ${formatINR(balance.netPaise)}`
              : `You owe ${balance.personName} ${formatINR(Math.abs(balance.netPaise))}`;

        return (
          <div key={key}>
            <p className="mb-1 text-sm font-medium">{summary}</p>
            <div className="divide-y">
              {personRecords.map((record) => (
                <LendingRow key={record.id} record={record} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add components/lending
git commit -m "feat(lending): add form, dialog, settlement dialog, row, and list components"
```

---

### Task 7: Page, nav item, dashboard summary card

**Files:**
- Create: `app/(app)/lending/page.tsx`
- Modify: `components/layout/nav-items.ts`
- Modify: `app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `listLendingRecords`, `getPersonBalances` (Task 4); `LendingDialog`, `LendingList` (Task 6).
- Produces: `/lending` route; a "Lending" nav entry; an optional dashboard card.

- [ ] **Step 1: `app/(app)/lending/page.tsx`**

```tsx
import { listLendingRecords, getPersonBalances } from "@/lib/queries/lending";
import { LendingDialog } from "@/components/lending/lending-dialog";
import { LendingList } from "@/components/lending/lending-list";

export default async function LendingPage() {
  const [records, balances] = await Promise.all([listLendingRecords(), getPersonBalances()]);
  const personNames = [...new Set(records.map((r) => r.person_name))];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Lending</h1>
        <LendingDialog personNames={personNames} />
      </div>

      <LendingList records={records} balances={balances} />
    </div>
  );
}
```

- [ ] **Step 2: Add nav item to `components/layout/nav-items.ts`**

Follow the existing treatment of `Recurring` — present in the desktop `NAV_ITEMS`, excluded from `MOBILE_NAV_ITEMS` (which is capped at 5 entries per its own comment). Replace the file's full contents with:

```typescript
import { LayoutDashboard, Receipt, PieChart, Wallet, HandCoins, Repeat, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/lending", label: "Lending", icon: HandCoins },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/** Subset shown in the mobile bottom nav — keep to 5 max for tap-target width. */
export const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
  NAV_ITEMS[6],
] as const;
```

- [ ] **Step 3: Add optional dashboard summary card**

In `app/(app)/dashboard/page.tsx`, add the import:

```typescript
import { getPersonBalances } from "@/lib/queries/lending";
```

Add `getPersonBalances()` to the existing `Promise.all` and destructure it:

```typescript
  const [stats, recentExpenses, categories, overallBudget, monthAnalytics, personBalances] = await Promise.all([
    getDashboardStats(now),
    getRecentExpenses(6),
    getCategories(),
    getOverallBudget(now),
    getAnalytics(start, end),
    getPersonBalances(),
  ]);
```

Then, after the "Top Categories" card and before the "Recent Expenses" card, add (only rendered when there's something to show, per the spec's "avoid clutter" instruction):

```tsx
      {personBalances.some((b) => b.openRecordCount > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lending</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total to collect</span>
              <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-500">
                {formatINR(personBalances.filter((b) => b.netPaise > 0).reduce((sum, b) => sum + b.netPaise, 0))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total to pay back</span>
              <span className="font-medium tabular-nums text-destructive">
                {formatINR(personBalances.filter((b) => b.netPaise < 0).reduce((sum, b) => sum + Math.abs(b.netPaise), 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit && npm run lint && npm run dev
```

Manually visit `/lending` and `/dashboard` in the browser; confirm both render without errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/lending/page.tsx" components/layout/nav-items.ts "app/(app)/dashboard/page.tsx"
git commit -m "feat(lending): add /lending page, nav item, and dashboard summary card"
```

---

### Task 8: README testing checklist update

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add checklist items**

In the `## Testing checklist` section of `README.md`, add these bullets (matching the existing style) after the "CSV import" line:

```markdown
- [ ] Add a lending record (lent/borrowed), verify it appears grouped under the right person on `/lending`
- [ ] Add a partial settlement; remaining balance and status ("Open" → "Partially settled" → "Settled") update correctly
- [ ] Settling more than the remaining balance is rejected with a clear error, not a silent overpayment
- [ ] Two records with the same person name in different casing ("Rahul" / "rahul") net together into one balance
- [ ] Deleting a lending record also removes its settlement history
- [ ] A second test account cannot see the first account's lending records or settlements (RLS)
- [ ] Dashboard "Lending" card only appears when there's an open record, and its totals match `/lending`
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add lending tracker items to testing checklist"
```

---

## Self-Review Notes

- **Spec coverage:** schema (Task 1), backend query/action/validation layers (Tasks 3–5), add-record form with direction toggle and person autocomplete (Task 6, spec's "person name (autocomplete from previous entries)"), list grouped by person with net balance (Task 6/7, spec's "Rahul owes you ₹2,400" wording), settlement history via `SettlementDialog` + `record.settlements`, optional dashboard card gated on open records (Task 7), all three edge cases from the spec (overpayment blocked in Task 4, case-insensitive person grouping in Task 4 `getPersonBalances`/Task 6 `LendingList`, cascade delete documented in Task 4 comment + Task 8 checklist) are covered.
- **Placeholder scan:** none — every step has real, complete code.
- **Type consistency:** `LendingRecordWithSettlements`, `PersonBalance`, `LendingInsertValues`, `SettlementInsertValues` are defined once (Tasks 2–3) and reused with identical names/shapes through Tasks 4–7.
