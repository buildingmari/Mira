-- Target history + piutang lunas history. Applied to vhwissutkmxyzlyzkhyt on
-- 2026-10-07 via the Supabase MCP (migration goal_entries_and_piutang_history).
-- Both tables are only read/written by the mira-tools Edge Function.

-- Target (user_goals) history: every deposit (+) / withdrawal (−).
create table if not exists public.user_goal_entries (
  id           uuid primary key default gen_random_uuid(),
  goal_id      uuid not null references public.user_goals(id) on delete cascade,
  phone_number text not null,
  amount       bigint not null,
  note         text,
  date         date not null default current_date,
  created_at   timestamptz not null default now()
);
create index if not exists user_goal_entries_goal_idx on public.user_goal_entries (goal_id, date desc, created_at desc);
alter table public.user_goal_entries enable row level security;

-- Keep user_goals.achieved_amount equal to "what was there before + entries".
create or replace function public.goal_entries_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.user_goals set achieved_amount = achieved_amount + new.amount, updated_at = now() where id = new.goal_id;
  elsif tg_op = 'UPDATE' then
    update public.user_goals set achieved_amount = achieved_amount + (new.amount - old.amount), updated_at = now() where id = new.goal_id;
  else
    -- On a cascaded goal delete the goal row is already gone; this updates nothing.
    update public.user_goals set achieved_amount = achieved_amount - old.amount, updated_at = now() where id = old.goal_id;
  end if;
  return null;
end $$;
revoke all on function public.goal_entries_sync() from public, anon, authenticated;

drop trigger if exists trg_goal_entries_sync on public.user_goal_entries;
create trigger trg_goal_entries_sync after insert or update of amount or delete on public.user_goal_entries
  for each row execute function public.goal_entries_sync();

-- Piutang marked lunas. Active ones stay in user_assets (category 'piutang',
-- counted in net worth); settling moves the row here so it can still be
-- seen, edited or re-opened.
create table if not exists public.piutang_history (
  id            uuid primary key default gen_random_uuid(),
  phone_number  text not null,
  name          text not null,
  amount        bigint not null default 0,
  subtype       text,
  split_bill_id uuid,
  opened_on     date,
  settled_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists piutang_history_phone_idx on public.piutang_history (phone_number, settled_at desc);
alter table public.piutang_history enable row level security;
