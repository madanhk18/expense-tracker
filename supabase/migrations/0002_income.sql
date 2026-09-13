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
  -- table.
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

drop policy if exists "income_select_own" on public.income;
drop policy if exists "income_insert_own" on public.income;
drop policy if exists "income_update_own" on public.income;
drop policy if exists "income_delete_own" on public.income;

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
