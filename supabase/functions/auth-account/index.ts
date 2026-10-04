/**
 * auth-account
 * ─────────────────────────────────────────────────────────────────────────
 * Web accounts: a MIRA account owned by a Supabase Auth login (Google or
 * email + password) instead of a verified WhatsApp number.
 *
 * Every MIRA table is keyed by users.primary_phone, so a web account gets an
 * internal account ID in that column: "999" + 10 digits. +999 is not an
 * assigned country code, so it can never collide with a real number, and it
 * stays digits-only for subs_id / Midtrans. The n8n signup + payment
 * webhooks (register-mira, create-transaction, midtrans-notification) take
 * it as-is; the login is attached when the users row is created through
 * pending_google_links + trg_apply_pending_google_link, which also marks the
 * account 'pro' (WhatsApp signups get that from the OTP-verified draft).
 *
 *   { op: 'resolve', access_token }
 *     -> { status: 'linked', phone, user }       login owns an active account
 *      | { status: 'pending', email, name, avatar_url }   signup started, not activated yet
 *      | { status: 'new', email, name, avatar_url }
 *
 *   { op: 'start_signup', access_token, name? }
 *     -> { status: 'ready', primary_phone }       use as primary_phone in the signup payload
 *      | { status: 'linked', phone, user }        already has an account → just log in
 *
 *   { op: 'start_trial', access_token, payload }  payload = buildPayload() output
 *     -> { status: 'linked', phone, user }        7-day trial (voucher MIRA100) created
 *     Creates the users row directly — no Midtrans order for a free trial.
 *
 *   { op: 'start_renewal', access_token, duration: '1'|'3'|'12', voucher? }
 *     -> { status: 'payment', redirect_url, subs_id, price_final }
 *     Existing account pays for more time. register-mira refuses existing
 *     users, so the order goes into users_draft here; n8n's
 *     midtrans-notification then extends valid_to from max(now, valid_to)
 *     ("recurring_extended") and trg_users_billing_guard copies the plan.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CREATE_TRANSACTION_URL = 'https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/create-transaction';

const TRIAL_VOUCHER = 'MIRA100';
const TRIAL_DAYS = 7;

// Personal plan prices — src/app/components/modal/pricingData.ts shows the same.
const RENEWAL_PLANS: Record<string, { months: number; price: number; label: string }> = {
  '1':  { months: 1,  price: 39000,  label: '1 Bulan' },
  '3':  { months: 3,  price: 99000,  label: '3 Bulan' },
  '12': { months: 12, price: 249000, label: 'Tahunan' },
};

// Assessment answers copied from the signup payload into a trial account
// (n8n copies the same columns from users_draft for paid signups).
const PROFILE_FIELDS = [
  'score_total', 'score_income_stability', 'score_expense_pressure', 'score_spending_control',
  'score_saving_discipline', 'score_emergency_fund', 'score_investment', 'score_debt', 'score_behavior',
  'income_range', 'income_range_raw', 'income_estimated_idr', 'income_type', 'income_type_raw',
  'payday_pattern', 'payday_pattern_raw', 'mandatory_expenses', 'mandatory_expenses_raw', 'mandatory_expense_count',
  'biggest_spend_category', 'biggest_spend_raw', 'impulse_buy_frequency', 'impulse_buy_raw',
  'expense_allocation_pct', 'saving_allocation_pct', 'saving_goals', 'saving_goals_raw',
  'emergency_fund_duration', 'emergency_fund_raw', 'investment_status', 'investment_status_raw',
  'investment_instruments', 'investment_instruments_raw', 'debt_status', 'debt_status_raw',
  'paylater_habit', 'paylater_habit_raw', 'banks_used', 'banks_used_raw', 'ewallets_used', 'ewallets_used_raw',
  'paylater_active', 'paylater_active_raw', 'payment_method_ranking', 'submitted_at',
];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

interface Identity {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  googleId: string | null;
  name: string | null;
  avatar_url: string | null;
}

async function identity(accessToken: string): Promise<Identity | null> {
  if (!accessToken) return null;
  const { data, error } = await sb.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  const u = data.user;
  const g = (u.identities || []).find((i) => i.provider === 'google');
  // deno-lint-ignore no-explicit-any
  const meta: Record<string, any> = { ...(g?.identity_data || {}), ...(u.user_metadata || {}) };
  return {
    uid: u.id,
    email: u.email ? u.email.toLowerCase() : null,
    emailVerified: !!u.email_confirmed_at || !!g,
    googleId: g ? String(g.identity_data?.sub || g.id) : null,
    name: meta.full_name || meta.name || null,
    avatar_url: meta.avatar_url || meta.picture || null,
  };
}

/** The MIRA account this login owns, attaching the login to it on first use. */
// deno-lint-ignore no-explicit-any
async function linkedUser(id: Identity): Promise<any | null> {
  const { data: byAuth } = await sb.from('users').select('*').eq('auth_user_id', id.uid).maybeSingle();
  if (byAuth) return byAuth;

  // Accounts linked before auth_user_id existed (Google via auth-google), or
  // whose email was set some other way. Email only counts once it's verified.
  // deno-lint-ignore no-explicit-any
  let user: any = null;
  if (id.googleId) {
    const { data } = await sb.from('users').select('*').eq('google_id', id.googleId).maybeSingle();
    user = data;
  }
  if (!user && id.email && id.emailVerified) {
    const { data } = await sb.from('users').select('*').eq('email', id.email).maybeSingle();
    user = data;
  }
  if (!user || (user.auth_user_id && user.auth_user_id !== id.uid)) return null;

  const { data: updated } = await sb.from('users').update({ auth_user_id: id.uid }).eq('id', user.id).select('*').maybeSingle();
  return updated || user;
}

async function pendingPhone(id: Identity): Promise<string | null> {
  const { data } = await sb.from('pending_google_links').select('phone_number')
    .eq('auth_user_id', id.uid).order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data?.phone_number ?? null;
}

async function idTaken(phone: string): Promise<boolean> {
  const checks = await Promise.all([
    sb.from('users').select('id', { count: 'exact', head: true }).eq('primary_phone', phone),
    sb.from('users_draft').select('id', { count: 'exact', head: true }).eq('primary_phone', phone),
    sb.from('pending_google_links').select('phone_number', { count: 'exact', head: true }).eq('phone_number', phone),
  ]);
  return checks.some((r) => (r.count ?? 0) > 0);
}

async function newAccountId(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const r = new Uint32Array(2);
    crypto.getRandomValues(r);
    const n = ((BigInt(r[0]) << 32n) | BigInt(r[1])) % 10_000_000_000n;
    const id = '999' + n.toString().padStart(10, '0');
    if (!(await idTaken(id))) return id;
  }
  throw new Error('account_id_exhausted');
}

async function voucherPercent(code: string): Promise<number | null> {
  const { data } = await sb.from('vouchers').select('discount_percent')
    .eq('code', code).eq('is_active', true).maybeSingle();
  return data ? Number(data.discount_percent) || 0 : null;
}

/** Same shape n8n gives new accounts: 4 letters of the name + last 4 digits. */
async function affiliateCode(name: string, phone: string): Promise<string> {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4).padEnd(4, 'X');
  let code = letters + phone.slice(-4);
  for (let i = 0; i < 5; i++) {
    const { count } = await sb.from('users').select('id', { count: 'exact', head: true }).eq('affiliate_code', code);
    if (!count) return code;
    code = letters + phone.slice(-4) + String(Math.floor(Math.random() * 90) + 10);
  }
  return code;
}

async function takenBy(column: 'email' | 'google_id', value: string | null): Promise<boolean> {
  if (!value) return false;
  const { count } = await sb.from('users').select('id', { count: 'exact', head: true }).eq(column, value);
  return (count ?? 0) > 0;
}

// deno-lint-ignore no-explicit-any
async function startTrial(id: Identity, body: any): Promise<Response> {
  if ((await voucherPercent(TRIAL_VOUCHER)) !== 100) {
    return json({ error: 'voucher_inactive', message: `Kode ${TRIAL_VOUCHER} lagi nggak aktif. Pilih paket berbayar dulu ya.` }, 400);
  }
  const phone = (await pendingPhone(id)) || (await newAccountId());
  // deno-lint-ignore no-explicit-any
  const p: Record<string, any> = body.payload && typeof body.payload === 'object' ? body.payload : {};
  const name = String(p.full_name || body.name || id.name || '').replace(/^-$/, '').trim().slice(0, 80) || 'Sobat MIRA';
  const now = new Date();

  const profile: Record<string, unknown> = {};
  for (const k of PROFILE_FIELDS) {
    const v = p[k];
    if (v === null || typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v))) profile[k] = v;
  }
  const account = {
    primary_phone: phone, name, additional_phones: '-', total_phones: 1,
    plan_id: 'trial', plan_name: 'Trial', plan_duration_months: 0, plan_duration_label: `Trial ${TRIAL_DAYS} Hari`,
    price_original: 0, voucher_code: TRIAL_VOUCHER, voucher_discount_percent: 100, price_final: 0,
    subs_id: `${phone}_trial`,
    valid_from: now.toISOString(),
    valid_to: new Date(now.getTime() + TRIAL_DAYS * 86_400_000).toISOString(),
    account_status: 'pro', limit_nominal: 0,
    affiliate_code: await affiliateCode(name, phone),
    auth_user_id: id.uid,
    email: id.email && !(await takenBy('email', id.email)) ? id.email : null,
    google_id: id.googleId && !(await takenBy('google_id', id.googleId)) ? id.googleId : null,
    avatar_url: id.avatar_url,
    created_at: now.toISOString(), updated_at: now.toISOString(),
  };

  let { data: user, error } = await sb.from('users').insert({ ...profile, ...account }).select('*').single();
  if (error) {
    // A malformed answer must not block the trial — retry without them.
    console.error('start_trial insert with profile failed:', error.message);
    ({ data: user, error } = await sb.from('users').insert(account).select('*').single());
  }
  if (error || !user) throw new Error('trial_insert_failed: ' + (error?.message || 'no row'));
  await sb.from('pending_google_links').delete().eq('auth_user_id', id.uid);
  return json({ status: 'linked', phone, user });
}

// deno-lint-ignore no-explicit-any
async function startRenewal(user: any, body: any): Promise<Response> {
  const plan = RENEWAL_PLANS[String(body.duration || '')];
  if (!plan) return json({ error: 'invalid_duration', message: 'Pilih durasi paketnya dulu ya.' }, 400);

  const code = String(body.voucher || '').trim().toUpperCase();
  let discount = 0;
  if (code) {
    const pct = await voucherPercent(code);
    if (pct === null) return json({ error: 'invalid_voucher', message: 'Kode voucher nggak ditemukan atau sudah nggak aktif.' }, 400);
    if (pct >= 100) return json({ error: 'trial_only', message: `${code} cuma buat trial pertama. Pakai kode lain atau bayar normal ya.` }, 400);
    discount = Math.max(0, pct);
  }
  const priceFinal = plan.price - Math.round((plan.price * discount) / 100);
  const phone = String(user.primary_phone);
  const now = new Date();
  const subsId = `${phone}_${now.toISOString().replace(/[^0-9]/g, '')}`;

  const order = {
    primary_phone: phone, name: user.name || 'Sobat MIRA', additional_phones: '-', total_phones: 1,
    plan_id: 'personal', plan_name: 'Personal',
    plan_duration_months: plan.months, plan_duration_label: plan.label,
    price_original: plan.price, voucher_code: code || '-', voucher_discount_percent: discount, price_final: priceFinal,
    subs_id: subsId, account_status: 'pro', submitted_at: now.toISOString(),
  };
  const { error } = await sb.from('users_draft').insert(order);
  if (error) throw new Error('renewal_draft_failed: ' + error.message);

  const res = await fetch(CREATE_TRANSACTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...order, full_name: order.name, email: user.email || undefined, source: 'mira-dashboard-renewal' }),
  });
  // deno-lint-ignore no-explicit-any
  const pay: any = await res.json().catch(() => ({}));
  const redirectUrl = pay?.redirect_url || pay?.data?.redirect_url;
  if (!redirectUrl) {
    console.error('create-transaction failed:', res.status, JSON.stringify(pay).slice(0, 300));
    await sb.from('users_draft').delete().eq('subs_id', subsId);
    return json({ error: 'payment_failed', message: 'Gagal membuat link pembayaran. Coba lagi sebentar ya.' }, 502);
  }
  return json({ status: 'payment', redirect_url: redirectUrl, subs_id: subsId, price_final: priceFinal });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // deno-lint-ignore no-explicit-any
  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'invalid_json' }, 400); }
  const op = String(body.op || '');

  try {
    const id = await identity(String(body.access_token || ''));
    if (!id) return json({ error: 'invalid_token', message: 'Sesi login sudah habis. Masuk lagi ya.' }, 401);

    const user = await linkedUser(id);
    if (op === 'start_renewal') {
      if (!user) return json({ error: 'no_account', message: 'Akun MIRA untuk login ini belum ada.' }, 404);
      return await startRenewal(user, body);
    }
    if (user) return json({ status: 'linked', phone: user.primary_phone, user });

    if (op === 'start_trial') return await startTrial(id, body);

    if (op === 'resolve') {
      const pending = await pendingPhone(id);
      return json({ status: pending ? 'pending' : 'new', email: id.email, name: id.name, avatar_url: id.avatar_url });
    }

    if (op === 'start_signup') {
      const phone = (await pendingPhone(id)) || (await newAccountId());
      const name = String(body.name || id.name || '').trim().slice(0, 80) || null;
      const { error } = await sb.from('pending_google_links').upsert({
        phone_number: phone, auth_user_id: id.uid, google_id: id.googleId,
        email: id.email, avatar_url: id.avatar_url, name, created_at: new Date().toISOString(),
      }, { onConflict: 'phone_number' });
      if (error) throw new Error('pending_upsert_failed: ' + error.message);
      return json({ status: 'ready', primary_phone: phone });
    }

    return json({ error: 'unknown_op' }, 400);
  } catch (err) {
    console.error('auth-account error:', op, err);
    return json({ error: 'internal', message: 'Waduh, ada gangguan. Coba lagi ya 🙏' }, 500);
  }
});
