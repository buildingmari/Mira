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
    if (user) return json({ status: 'linked', phone: user.primary_phone, user });

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
