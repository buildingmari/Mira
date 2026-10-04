-- Billing: trial / renewal / read-only mode / reminder emails.
-- Applied to project vhwissutkmxyzlyzkhyt on 2026-10-04 via the Supabase MCP
-- (migrations billing_guards_and_plan_sync, billing_reminders_cron,
-- billing_guards_hardening). Kept here as the record of what's live.
-- Not in this file: Vault secret "resend_api_key" (set by hand, never commit it).

-- ── Who is calling ──────────────────────────────────────────────────────
-- Role of the API caller (anon / authenticated / service_role). NULL for direct
-- database connections (migrations, SQL editor, pg_cron) — those are trusted.
create or replace function public.mira_request_role() returns text
language sql stable set search_path = public as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  )
$$;

-- Same rule as isActiveMember() in the Edge Functions.
create or replace function public.mira_is_active(p_phone text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
     where u.primary_phone = p_phone
       and lower(coalesce(u.account_status, '')) in ('pro', 'paid')
       and (u.valid_to is null or u.valid_to > now())
  )
$$;

-- ── Read-only mode ──────────────────────────────────────────────────────
-- Expired / unpaid accounts are read-only from the browser: no new or edited
-- transactions, goals, assets or split bills. Deletes stay allowed so people
-- can always remove their data. n8n and Edge Functions (service role) are not
-- affected — they run their own membership checks.
create or replace function public.mira_guard_member_writes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.mira_request_role() in ('anon', 'authenticated')
     and not public.mira_is_active(new.phone_number) then
    raise exception 'MIRA_READ_ONLY'
      using errcode = 'P0001',
            hint = 'Langganan MIRA kamu sudah tidak aktif. Perpanjang dulu untuk mencatat lagi.';
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['expenses', 'split_bills', 'user_goals', 'user_assets', 'user_liabilities'] loop
    execute format('drop trigger if exists trg_guard_member_writes on public.%I', t);
    execute format('create trigger trg_guard_member_writes before insert or update on public.%I
                    for each row execute function public.mira_guard_member_writes()', t);
  end loop;
end $$;

-- ── users: billing columns + renewal plan sync ─────────────────────────
-- (1) the browser may only edit profile fields — billing and identity
-- columns are kept as they were; (2) when the backend moves the account to a
-- new subs_id (n8n's recurring payment), copy the plan the user actually paid
-- for from that order's users_draft row — n8n only updates plan_id/plan_name.
create or replace function public.users_billing_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare d public.users_draft%rowtype;
begin
  if public.mira_request_role() in ('anon', 'authenticated') then
    new.primary_phone            := old.primary_phone;
    new.plan_id                  := old.plan_id;
    new.plan_name                := old.plan_name;
    new.plan_duration_months     := old.plan_duration_months;
    new.plan_duration_label      := old.plan_duration_label;
    new.price_original           := old.price_original;
    new.voucher_code             := old.voucher_code;
    new.voucher_discount_percent := old.voucher_discount_percent;
    new.price_final              := old.price_final;
    new.subs_id                  := old.subs_id;
    new.valid_from               := old.valid_from;
    new.valid_to                 := old.valid_to;
    new.account_status           := old.account_status;
    new.affiliate_code           := old.affiliate_code;
    new.registered_by            := old.registered_by;
    new.email                    := old.email;
    new.google_id                := old.google_id;
    new.auth_user_id             := old.auth_user_id;
    return new;
  end if;

  if new.subs_id is not null and new.subs_id is distinct from old.subs_id then
    select * into d from public.users_draft
     where subs_id = new.subs_id
     order by created_at desc nulls last
     limit 1;
    if found then
      new.plan_id                  := coalesce(d.plan_id, new.plan_id);
      new.plan_name                := coalesce(d.plan_name, new.plan_name);
      new.plan_duration_months     := coalesce(d.plan_duration_months, new.plan_duration_months);
      new.plan_duration_label      := coalesce(d.plan_duration_label, new.plan_duration_label);
      new.price_original           := d.price_original;
      new.voucher_code             := d.voucher_code;
      new.voucher_discount_percent := d.voucher_discount_percent;
      new.price_final              := d.price_final;
      if lower(coalesce(new.account_status, '')) not in ('pro', 'paid') then
        new.account_status := 'pro';
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_users_billing_guard on public.users;
create trigger trg_users_billing_guard before update on public.users
  for each row execute function public.users_billing_guard();

-- Not callable through /rest/v1/rpc (triggers still fire).
revoke all on function public.mira_is_active(text) from public, anon, authenticated;
revoke all on function public.mira_guard_member_writes() from public, anon, authenticated;
revoke all on function public.users_billing_guard() from public, anon, authenticated;
revoke all on function public.mira_request_role() from public, anon, authenticated;

-- ── Reminder emails (Edge Function billing-reminders) ──────────────────
-- One email per user, kind and subscription period.
create table if not exists public.billing_reminders (
  id           bigint generated always as identity primary key,
  phone_number text        not null,
  kind         text        not null,
  valid_to     timestamptz not null,
  email        text,
  sent_at      timestamptz not null default now(),
  unique (phone_number, kind, valid_to)
);
alter table public.billing_reminders enable row level security;
-- No policies: only the service role uses it.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Vault secrets for Edge Functions. Service role only.
create or replace function public.mira_vault_secret(p_name text) returns text
language sql stable security definer set search_path = public, vault as $$
  select decrypted_secret from vault.decrypted_secrets
   where name = p_name and p_name in ('billing_cron_secret', 'resend_api_key')
   limit 1
$$;
revoke all on function public.mira_vault_secret(text) from public, anon, authenticated;
grant execute on function public.mira_vault_secret(text) to service_role;

-- Shared secret between pg_cron and billing-reminders; generated here and
-- never leaves the database.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'billing_cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'billing_cron_secret',
                                'x-cron-secret for the billing-reminders Edge Function');
  end if;
end $$;

-- Daily at 09:00 WIB (02:00 UTC).
select cron.unschedule('mira-billing-reminders')
 where exists (select 1 from cron.job where jobname = 'mira-billing-reminders');
select cron.schedule(
  'mira-billing-reminders',
  '0 2 * * *',
  $job$
  select net.http_post(
    url := 'https://vhwissutkmxyzlyzkhyt.supabase.co/functions/v1/billing-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'billing_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);
