-- =============================================================================
-- Reset — Health & Training Dashboard
-- Supabase schema + Row Level Security
-- =============================================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- It is idempotent: safe to run more than once.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Helper: keep updated_at fresh
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

-- ----------------------------------------------------------------------------
-- user_settings  (one row per user)
-- ----------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  calorie_target integer        not null default 2000,
  protein_target integer        not null default 160,
  goal_kg        numeric(5,1)   not null default 100.0,
  start_kg       numeric(5,1)   not null default 120.1,
  height_cm      numeric(5,1)   not null default 180.3,
  age            integer        not null default 56,
  created_at     timestamptz    not null default now(),
  updated_at     timestamptz    not null default now()
);

-- ----------------------------------------------------------------------------
-- weight_log  (one entry per date per user — upsert on (user_id, date))
-- ----------------------------------------------------------------------------
create table if not exists public.weight_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  kg         numeric(5,1) not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists weight_log_user_date_idx on public.weight_log (user_id, date);

-- ----------------------------------------------------------------------------
-- bp_log  (blood pressure)
-- ----------------------------------------------------------------------------
create table if not exists public.bp_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  systolic   integer not null,
  diastolic  integer not null,
  pulse      integer,
  created_at timestamptz not null default now()
);
create index if not exists bp_log_user_date_idx on public.bp_log (user_id, date);

-- ----------------------------------------------------------------------------
-- food_log
-- ----------------------------------------------------------------------------
create table if not exists public.food_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  name       text not null,
  qty        numeric(8,2) not null default 1,
  calories   numeric(8,1) not null default 0,
  protein    numeric(8,1) not null default 0,
  carbs      numeric(8,1) not null default 0,
  fat        numeric(8,1) not null default 0,
  barcode    text,
  created_at timestamptz not null default now()
);
create index if not exists food_log_user_date_idx on public.food_log (user_id, date);

-- ----------------------------------------------------------------------------
-- training_log
-- ----------------------------------------------------------------------------
create table if not exists public.training_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  type         text not null,
  duration_min integer not null default 0,
  rpe          integer,
  calories     integer,
  avg_hr       integer,
  distance_km  numeric(6,2),
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists training_log_user_date_idx on public.training_log (user_id, date);

-- ----------------------------------------------------------------------------
-- plan_completion  (weekly training-template tick-offs)
-- ----------------------------------------------------------------------------
create table if not exists public.plan_completion (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  day_index  integer not null,   -- 0 = Monday … 6 = Sunday
  done       boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, week_start, day_index)
);
create index if not exists plan_completion_user_week_idx on public.plan_completion (user_id, week_start);

-- ----------------------------------------------------------------------------
-- updated_at trigger for user_settings
-- ----------------------------------------------------------------------------
drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Row Level Security — each user sees ONLY their own rows
-- =============================================================================
alter table public.user_settings   enable row level security;
alter table public.weight_log       enable row level security;
alter table public.bp_log           enable row level security;
alter table public.food_log         enable row level security;
alter table public.training_log     enable row level security;
alter table public.plan_completion  enable row level security;

-- A small macro: drop-then-create policy for each verb.
-- user_settings -------------------------------------------------------------
drop policy if exists "settings_select_own" on public.user_settings;
drop policy if exists "settings_insert_own" on public.user_settings;
drop policy if exists "settings_update_own" on public.user_settings;
drop policy if exists "settings_delete_own" on public.user_settings;
create policy "settings_select_own" on public.user_settings for select using (auth.uid() = user_id);
create policy "settings_insert_own" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings_delete_own" on public.user_settings for delete using (auth.uid() = user_id);

-- weight_log ----------------------------------------------------------------
drop policy if exists "weight_select_own" on public.weight_log;
drop policy if exists "weight_insert_own" on public.weight_log;
drop policy if exists "weight_update_own" on public.weight_log;
drop policy if exists "weight_delete_own" on public.weight_log;
create policy "weight_select_own" on public.weight_log for select using (auth.uid() = user_id);
create policy "weight_insert_own" on public.weight_log for insert with check (auth.uid() = user_id);
create policy "weight_update_own" on public.weight_log for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weight_delete_own" on public.weight_log for delete using (auth.uid() = user_id);

-- bp_log --------------------------------------------------------------------
drop policy if exists "bp_select_own" on public.bp_log;
drop policy if exists "bp_insert_own" on public.bp_log;
drop policy if exists "bp_update_own" on public.bp_log;
drop policy if exists "bp_delete_own" on public.bp_log;
create policy "bp_select_own" on public.bp_log for select using (auth.uid() = user_id);
create policy "bp_insert_own" on public.bp_log for insert with check (auth.uid() = user_id);
create policy "bp_update_own" on public.bp_log for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bp_delete_own" on public.bp_log for delete using (auth.uid() = user_id);

-- food_log ------------------------------------------------------------------
drop policy if exists "food_select_own" on public.food_log;
drop policy if exists "food_insert_own" on public.food_log;
drop policy if exists "food_update_own" on public.food_log;
drop policy if exists "food_delete_own" on public.food_log;
create policy "food_select_own" on public.food_log for select using (auth.uid() = user_id);
create policy "food_insert_own" on public.food_log for insert with check (auth.uid() = user_id);
create policy "food_update_own" on public.food_log for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "food_delete_own" on public.food_log for delete using (auth.uid() = user_id);

-- training_log --------------------------------------------------------------
drop policy if exists "training_select_own" on public.training_log;
drop policy if exists "training_insert_own" on public.training_log;
drop policy if exists "training_update_own" on public.training_log;
drop policy if exists "training_delete_own" on public.training_log;
create policy "training_select_own" on public.training_log for select using (auth.uid() = user_id);
create policy "training_insert_own" on public.training_log for insert with check (auth.uid() = user_id);
create policy "training_update_own" on public.training_log for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "training_delete_own" on public.training_log for delete using (auth.uid() = user_id);

-- plan_completion -----------------------------------------------------------
drop policy if exists "plan_select_own" on public.plan_completion;
drop policy if exists "plan_insert_own" on public.plan_completion;
drop policy if exists "plan_update_own" on public.plan_completion;
drop policy if exists "plan_delete_own" on public.plan_completion;
create policy "plan_select_own" on public.plan_completion for select using (auth.uid() = user_id);
create policy "plan_insert_own" on public.plan_completion for insert with check (auth.uid() = user_id);
create policy "plan_update_own" on public.plan_completion for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "plan_delete_own" on public.plan_completion for delete using (auth.uid() = user_id);

-- =============================================================================
-- Auto-create a default settings row the first time a user signs in.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Done.
-- =============================================================================
