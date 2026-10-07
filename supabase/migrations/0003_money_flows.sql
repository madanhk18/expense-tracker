-- ============================================================================
-- Money flows: savings & investments (with repeating SIPs) + lending (Udhaar)
-- Run after 0001_init.sql and 0002_income.sql.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- recurring_investments: SIP-style rules. Mirrors recurring_expenses — one rule
-- generates a real `investments` row on each due date.
-- ----------------------------------------------------------------------------
create table if not exists public.recurring_investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  investment_type text not null check (
    investment_type in ('SIP', 'Mutual Fund', 'Stocks', 'FD', 'RD', 'Gold', 'PPF / EPF', 'NPS', 'Other')
  ),
  name text not null,
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  interval_count int not null default 1 check (interval_count > 0),
  start_date date not null,
  next_due_date date not null,
  is_active boolean not null default true,
  last_generated_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recurring_investments_user_due_idx
  on public.recurring_investments (user_id, next_due_date);

-- ----------------------------------------------------------------------------
-- investments: money moved into savings. Not spending — kept out of every
-- expense total so the savings rate and budgets stay honest.
-- ----------------------------------------------------------------------------
create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_paise bigint not null check (amount_paise > 0),
  investment_type text not null check (
    investment_type in ('SIP', 'Mutual Fund', 'Stocks', 'FD', 'RD', 'Gold', 'PPF / EPF', 'NPS', 'Other')
  ),
  name text not null,
  invested_at timestamptz not null default now(),
  -- Plain stored column set by trigger, for the same reason as
  -- expenses.expense_date in 0001: a timestamptz::date cast can't be indexed.
  invested_date date,
  notes text,
  recurring_investment_id uuid references public.recurring_investments (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists investments_user_invested_at_idx
  on public.investments (user_id, invested_at desc);

create or replace function public.set_invested_date()
returns trigger
language plpgsql
as $$
begin
  new.invested_date := (new.invested_at at time zone 'utc')::date;
  return new;
end;
$$;

drop trigger if exists set_invested_date on public.investments;
create trigger set_invested_date before insert or update of invested_at on public.investments
  for each row execute function public.set_invested_date();

-- One auto-generated investment per rule per day, enforced at the DB level.
create unique index if not exists investments_recurring_dedup_uq
  on public.investments (recurring_investment_id, invested_date)
  where recurring_investment_id is not null;

-- ----------------------------------------------------------------------------
-- lending_records: money lent to / borrowed from someone (free-text name —
-- the other party doesn't need an account).
-- ----------------------------------------------------------------------------
create table if not exists public.lending_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  person_name text not null,
  direction text not null check (direction in ('lent', 'borrowed')),
  amount_paise bigint not null check (amount_paise > 0),
  description text,
  lent_at timestamptz not null default now(),
  due_date date,
  status text not null default 'open' check (status in ('open', 'partially_settled', 'settled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lending_records_user_status_idx
  on public.lending_records (user_id, status);
create index if not exists lending_records_user_person_idx
  on public.lending_records (user_id, lower(person_name));

-- ----------------------------------------------------------------------------
-- lending_settlements: append-only ledger of (partial) repayments.
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
-- updated_at triggers (reuse public.set_updated_at() from 0001)
-- ----------------------------------------------------------------------------
drop trigger if exists set_updated_at on public.recurring_investments;
create trigger set_updated_at before update on public.recurring_investments
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.investments;
create trigger set_updated_at before update on public.investments
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.lending_records;
create trigger set_updated_at before update on public.lending_records
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.recurring_investments enable row level security;
alter table public.investments enable row level security;
alter table public.lending_records enable row level security;
alter table public.lending_settlements enable row level security;

drop policy if exists "recurring_investments_select_own" on public.recurring_investments;
drop policy if exists "recurring_investments_insert_own" on public.recurring_investments;
drop policy if exists "recurring_investments_update_own" on public.recurring_investments;
drop policy if exists "recurring_investments_delete_own" on public.recurring_investments;
create policy "recurring_investments_select_own" on public.recurring_investments
  for select using (user_id = auth.uid());
create policy "recurring_investments_insert_own" on public.recurring_investments
  for insert with check (user_id = auth.uid());
create policy "recurring_investments_update_own" on public.recurring_investments
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recurring_investments_delete_own" on public.recurring_investments
  for delete using (user_id = auth.uid());

drop policy if exists "investments_select_own" on public.investments;
drop policy if exists "investments_insert_own" on public.investments;
drop policy if exists "investments_update_own" on public.investments;
drop policy if exists "investments_delete_own" on public.investments;
create policy "investments_select_own" on public.investments
  for select using (user_id = auth.uid());
create policy "investments_insert_own" on public.investments
  for insert with check (user_id = auth.uid());
create policy "investments_update_own" on public.investments
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "investments_delete_own" on public.investments
  for delete using (user_id = auth.uid());

drop policy if exists "lending_records_select_own" on public.lending_records;
drop policy if exists "lending_records_insert_own" on public.lending_records;
drop policy if exists "lending_records_update_own" on public.lending_records;
drop policy if exists "lending_records_delete_own" on public.lending_records;
create policy "lending_records_select_own" on public.lending_records
  for select using (user_id = auth.uid());
create policy "lending_records_insert_own" on public.lending_records
  for insert with check (user_id = auth.uid());
create policy "lending_records_update_own" on public.lending_records
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "lending_records_delete_own" on public.lending_records
  for delete using (user_id = auth.uid());

drop policy if exists "lending_settlements_select_own" on public.lending_settlements;
drop policy if exists "lending_settlements_insert_own" on public.lending_settlements;
drop policy if exists "lending_settlements_delete_own" on public.lending_settlements;
create policy "lending_settlements_select_own" on public.lending_settlements
  for select using (user_id = auth.uid());
-- A settlement may only point at one of the user's own lending records.
create policy "lending_settlements_insert_own" on public.lending_settlements
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.lending_records r
      where r.id = lending_record_id and r.user_id = auth.uid()
    )
  );
create policy "lending_settlements_delete_own" on public.lending_settlements
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RPC: generate_due_recurring_investments — same contract as
-- generate_due_recurring_expenses: idempotent, dedup-safe, current user only.
-- ----------------------------------------------------------------------------
create or replace function public.generate_due_recurring_investments()
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
    select * from public.recurring_investments
    where user_id = auth.uid()
      and is_active
      and next_due_date <= current_date
    for update
  loop
    next_date := rec.next_due_date;
    guard := 0;

    while next_date <= current_date and guard < 24 loop
      begin
        insert into public.investments (
          user_id, amount_paise, investment_type, name, invested_at, recurring_investment_id
        ) values (
          rec.user_id, rec.amount_paise, rec.investment_type, rec.name, next_date::timestamptz, rec.id
        );
        generated_count := generated_count + 1;
      exception when unique_violation then
        null;
      end;

      next_date := case rec.frequency
        when 'weekly' then next_date + (rec.interval_count || ' weeks')::interval
        when 'monthly' then next_date + (rec.interval_count || ' months')::interval
        when 'yearly' then next_date + (rec.interval_count || ' years')::interval
      end;

      guard := guard + 1;
    end loop;

    update public.recurring_investments
    set next_due_date = next_date, last_generated_date = current_date
    where id = rec.id;
  end loop;

  return generated_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: get_money_flow — where a month's money went, one round trip.
--   left = earned + borrowed + repaid_to_you − spent − invested − lent − repaid_by_you
-- Computed in the app from these columns so the formula lives in one place.
-- ----------------------------------------------------------------------------
create or replace function public.get_money_flow(ref_date date default current_date)
returns table (
  earned_paise bigint,
  spent_paise bigint,
  invested_paise bigint,
  lent_paise bigint,
  borrowed_paise bigint,
  repaid_to_you_paise bigint,
  repaid_by_you_paise bigint
)
language sql
security definer set search_path = public
stable
as $$
  with bounds as (
    select
      date_trunc('month', ref_date::timestamp)::date as month_start,
      (date_trunc('month', ref_date::timestamp) + interval '1 month')::date as next_month
  )
  select
    (select coalesce(sum(amount_paise), 0) from public.income, bounds
       where user_id = auth.uid() and received_at::date >= month_start and received_at::date < next_month)::bigint,
    (select coalesce(sum(amount_paise), 0) from public.expenses, bounds
       where user_id = auth.uid() and expense_at::date >= month_start and expense_at::date < next_month)::bigint,
    (select coalesce(sum(amount_paise), 0) from public.investments, bounds
       where user_id = auth.uid() and invested_at::date >= month_start and invested_at::date < next_month)::bigint,
    (select coalesce(sum(amount_paise), 0) from public.lending_records, bounds
       where user_id = auth.uid() and direction = 'lent'
         and lent_at::date >= month_start and lent_at::date < next_month)::bigint,
    (select coalesce(sum(amount_paise), 0) from public.lending_records, bounds
       where user_id = auth.uid() and direction = 'borrowed'
         and lent_at::date >= month_start and lent_at::date < next_month)::bigint,
    (select coalesce(sum(s.amount_paise), 0)
       from public.lending_settlements s
       join public.lending_records r on r.id = s.lending_record_id, bounds
       where s.user_id = auth.uid() and r.direction = 'lent'
         and s.settled_at::date >= month_start and s.settled_at::date < next_month)::bigint,
    (select coalesce(sum(s.amount_paise), 0)
       from public.lending_settlements s
       join public.lending_records r on r.id = s.lending_record_id, bounds
       where s.user_id = auth.uid() and r.direction = 'borrowed'
         and s.settled_at::date >= month_start and s.settled_at::date < next_month)::bigint;
$$;

commit;
