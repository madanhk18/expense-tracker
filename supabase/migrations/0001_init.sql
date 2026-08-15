-- ============================================================================
-- Expense Tracker — initial schema
-- Run once in Supabase SQL Editor, or via `supabase db push`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  currency text not null default 'INR',
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  date_format text not null default 'dd/MM/yyyy',
  monthly_budget_paise bigint check (monthly_budget_paise > 0),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- categories: user_id null = shared system category (read-only to clients)
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  icon text,
  color text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists categories_system_name_uq
  on public.categories (lower(name)) where user_id is null;

create unique index if not exists categories_user_name_uq
  on public.categories (user_id, lower(name)) where user_id is not null;

create index if not exists categories_user_id_idx on public.categories (user_id);

-- ----------------------------------------------------------------------------
-- recurring_expenses (created before expenses, which references it)
-- ----------------------------------------------------------------------------
create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  description text not null,
  category_id uuid references public.categories (id) on delete set null,
  merchant text,
  payment_method text not null check (
    payment_method in ('UPI', 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Net Banking', 'Other')
  ),
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  interval_count int not null default 1 check (interval_count > 0),
  start_date date not null,
  next_due_date date not null,
  is_active boolean not null default true,
  last_generated_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recurring_user_next_due_idx
  on public.recurring_expenses (user_id, next_due_date);

create index if not exists recurring_active_next_due_idx
  on public.recurring_expenses (is_active, next_due_date);

-- ----------------------------------------------------------------------------
-- expenses
-- ----------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  description text not null,
  category_id uuid references public.categories (id) on delete set null,
  merchant text,
  payment_method text not null check (
    payment_method in ('UPI', 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Net Banking', 'Other')
  ),
  expense_at timestamptz not null default now(),
  notes text,
  recurring_expense_id uuid references public.recurring_expenses (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_expense_at_idx
  on public.expenses (user_id, expense_at desc);

create index if not exists expenses_user_category_idx
  on public.expenses (user_id, category_id);

create index if not exists expenses_user_payment_method_idx
  on public.expenses (user_id, payment_method);

-- Duplicate-safety net for recurring generation: only one auto-generated
-- expense per recurring rule per calendar day, enforced at the DB level.
create unique index if not exists expenses_recurring_dedup_uq
  on public.expenses (recurring_expense_id, (expense_at::date))
  where recurring_expense_id is not null;

-- ----------------------------------------------------------------------------
-- budgets: category_id null = overall monthly budget for that period
-- ----------------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_month date not null, -- always first-of-month, e.g. 2026-08-01
  category_id uuid references public.categories (id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists budgets_overall_uq
  on public.budgets (user_id, period_month) where category_id is null;

create unique index if not exists budgets_category_uq
  on public.budgets (user_id, period_month, category_id) where category_id is not null;

create index if not exists budgets_user_period_idx on public.budgets (user_id, period_month);

-- ----------------------------------------------------------------------------
-- updated_at trigger (shared)
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.expenses;
create trigger set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.recurring_expenses;
create trigger set_updated_at before update on public.recurring_expenses
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.budgets;
create trigger set_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- auto-create profile row on signup
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_expenses enable row level security;

-- profiles
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- categories: everyone can read system rows + their own; only mutate own
create policy "categories_select" on public.categories
  for select using (user_id = auth.uid() or user_id is null);
create policy "categories_insert_own" on public.categories
  for insert with check (user_id = auth.uid() and is_system = false);
create policy "categories_update_own" on public.categories
  for update using (user_id = auth.uid() and is_system = false)
  with check (user_id = auth.uid() and is_system = false);
create policy "categories_delete_own" on public.categories
  for delete using (user_id = auth.uid() and is_system = false);

-- expenses
create policy "expenses_select_own" on public.expenses
  for select using (user_id = auth.uid());
create policy "expenses_insert_own" on public.expenses
  for insert with check (user_id = auth.uid());
create policy "expenses_update_own" on public.expenses
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "expenses_delete_own" on public.expenses
  for delete using (user_id = auth.uid());

-- budgets
create policy "budgets_select_own" on public.budgets
  for select using (user_id = auth.uid());
create policy "budgets_insert_own" on public.budgets
  for insert with check (user_id = auth.uid());
create policy "budgets_update_own" on public.budgets
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "budgets_delete_own" on public.budgets
  for delete using (user_id = auth.uid());

-- recurring_expenses
create policy "recurring_select_own" on public.recurring_expenses
  for select using (user_id = auth.uid());
create policy "recurring_insert_own" on public.recurring_expenses
  for insert with check (user_id = auth.uid());
create policy "recurring_update_own" on public.recurring_expenses
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recurring_delete_own" on public.recurring_expenses
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RPC: generate_due_recurring_expenses
-- Idempotent, dedup-safe (relies on expenses_recurring_dedup_uq). Call once
-- per session (e.g. on dashboard mount) scoped to the current user.
-- ----------------------------------------------------------------------------
create or replace function public.generate_due_recurring_expenses()
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  rec record;
  generated_count int := 0;
  guard int := 0;
  next_date date;
begin
  for rec in
    select * from public.recurring_expenses
    where user_id = auth.uid()
      and is_active
      and next_due_date <= current_date
    for update
  loop
    next_date := rec.next_due_date;
    guard := 0;

    while next_date <= current_date and guard < 24 loop
      begin
        insert into public.expenses (
          user_id, amount_paise, description, category_id, merchant,
          payment_method, expense_at, recurring_expense_id
        ) values (
          rec.user_id, rec.amount_paise, rec.description, rec.category_id, rec.merchant,
          rec.payment_method, next_date::timestamptz, rec.id
        );
        generated_count := generated_count + 1;
      exception when unique_violation then
        -- already generated for this date (e.g. concurrent call) — skip safely
        null;
      end;

      next_date := case rec.frequency
        when 'weekly' then next_date + (rec.interval_count || ' weeks')::interval
        when 'monthly' then next_date + (rec.interval_count || ' months')::interval
        when 'yearly' then next_date + (rec.interval_count || ' years')::interval
      end;

      guard := guard + 1;
    end loop;

    update public.recurring_expenses
    set next_due_date = next_date, last_generated_date = current_date
    where id = rec.id;
  end loop;

  return generated_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: get_dashboard_stats — one round trip for the dashboard summary cards
-- ----------------------------------------------------------------------------
create or replace function public.get_dashboard_stats(ref_date date default current_date)
returns table (
  today_paise bigint,
  week_paise bigint,
  month_paise bigint,
  previous_month_paise bigint,
  month_transaction_count bigint,
  avg_daily_paise bigint,
  highest_expense_paise bigint
)
language sql
security definer set search_path = public
stable
as $$
  select
    coalesce(sum(amount_paise) filter (where expense_at::date = ref_date), 0)::bigint as today_paise,
    coalesce(sum(amount_paise) filter (
      where expense_at::date >= date_trunc('week', ref_date::timestamp)::date
        and expense_at::date < (date_trunc('week', ref_date::timestamp) + interval '7 days')::date
    ), 0)::bigint as week_paise,
    coalesce(sum(amount_paise) filter (
      where expense_at::date >= date_trunc('month', ref_date::timestamp)::date
        and expense_at::date <= ref_date
    ), 0)::bigint as month_paise,
    coalesce(sum(amount_paise) filter (
      where expense_at::date >= date_trunc('month', ref_date::timestamp - interval '1 month')::date
        and expense_at::date < date_trunc('month', ref_date::timestamp)::date
    ), 0)::bigint as previous_month_paise,
    count(*) filter (
      where expense_at::date >= date_trunc('month', ref_date::timestamp)::date
        and expense_at::date <= ref_date
    ) as month_transaction_count,
    coalesce(
      (sum(amount_paise) filter (
        where expense_at::date >= date_trunc('month', ref_date::timestamp)::date
          and expense_at::date <= ref_date
      )) / greatest(extract(day from ref_date - date_trunc('month', ref_date::timestamp)::date) + 1, 1),
      0
    )::bigint as avg_daily_paise,
    coalesce(max(amount_paise) filter (
      where expense_at::date >= date_trunc('month', ref_date::timestamp)::date
        and expense_at::date <= ref_date
    ), 0)::bigint as highest_expense_paise
  from public.expenses
  where user_id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- Seed default system categories (user_id null, is_system true)
-- ----------------------------------------------------------------------------
insert into public.categories (name, icon, is_system, user_id)
values
  ('Food', 'Utensils', true, null),
  ('Groceries', 'ShoppingBasket', true, null),
  ('Transportation', 'Bus', true, null),
  ('Shopping', 'ShoppingBag', true, null),
  ('Bills', 'Receipt', true, null),
  ('Entertainment', 'Clapperboard', true, null),
  ('Healthcare', 'HeartPulse', true, null),
  ('Education', 'GraduationCap', true, null),
  ('Travel', 'Plane', true, null),
  ('Rent', 'Home', true, null),
  ('Subscriptions', 'Repeat', true, null),
  ('Personal', 'User', true, null),
  ('Other', 'MoreHorizontal', true, null)
on conflict do nothing;
