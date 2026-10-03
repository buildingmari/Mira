/**
 * auth-google
 * ─────────────────────────────────────────────────────────────────────────
 * Connects a Google sign-in (Supabase Auth, provider "google") to a MIRA
 * account. MIRA accounts stay keyed by WhatsApp number — a Google identity
 * is an extra way into the SAME account (users.google_id / email /
 * avatar_url), never a separate one.
 *
 *   { op: 'resolve', access_token }
 *     -> { status: 'linked', phone, user }
 *      | { status: 'not_linked', email, name, avatar_url, pending_phone }
 *
 *   { op: 'link', access_token, phone_number, otp }
 *     Proves ownership of BOTH the Google account (valid Supabase session
 *     token) and the WhatsApp number (the same n8n verify-otp check the
 *     phone login uses), then:
 *       - existing MIRA user  -> linked immediately     { otp_ok, linked: 'now', user }
 *       - number not yet a user (mid-signup) -> parked in pending_google_links;
 *         the trg_apply_pending_google_link trigger applies it when the
 *         users row is created after payment       { otp_ok, linked: 'pending' }
 *     A wrong OTP returns { otp_ok: false, message } with HTTP 200, exactly
 *     like n8n, so the UI can keep the user on the OTP step.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const VERIFY_OTP_URL = 'https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/verify-otp';

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

// Same normalization as LoginModal.tsx.
function normalizePhone(raw: string): string {
  let p = String(raw || '').replace(/[^\d]/g, '');
  if (!p) return '';
  if (p.startsWith('0')) p = '62' + p.slice(1);
  else if (p.startsWith('8') || p.startsWith('9')) p = '62' + p;
  else if (!p.startsWith('62')) p = '62' + p;
  return p;
}

const maskPhone = (p: string) => (p.length > 6 ? `+${p.slice(0, 5)}****${p.slice(-2)}` : p);

interface GoogleIdentity { google_id: string; email: string | null; name: string | null; avatar_url: string | null }

async function googleIdentity(accessToken: string): Promise<GoogleIdentity | null> {
  if (!accessToken) return null;
  const { data, error } = await sb.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  const u = data.user;
  const ident = (u.identities || []).find((i) => i.provider === 'google');
  if (!ident) return null;
  // deno-lint-ignore no-explicit-any
  const meta: Record<string, any> = { ...(ident.identity_data || {}), ...(u.user_metadata || {}) };
  const sub = ident.identity_data?.sub || ident.id;
  if (!sub) return null;
  return {
    google_id: String(sub),
    email: (u.email || meta.email || null)?.toLowerCase?.() ?? null,
    name: meta.full_name || meta.name || null,
    avatar_url: meta.avatar_url || meta.picture || null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // deno-lint-ignore no-explicit-any
  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'invalid_json' }, 400); }
  const op = String(body.op || '');

  try {
    const g = await googleIdentity(String(body.access_token || ''));
    if (!g) return json({ error: 'invalid_token', message: 'Sesi Google sudah habis. Coba masuk dengan Google lagi ya.' }, 401);

    if (op === 'resolve') {
      const { data: user } = await sb.from('users').select('*').eq('google_id', g.google_id).maybeSingle();
      if (user) {
        // Keep the profile picture fresh; never let this block a login.
        if (g.avatar_url && g.avatar_url !== user.avatar_url) {
          await sb.from('users').update({ avatar_url: g.avatar_url }).eq('id', user.id).then(() => {}, () => {});
        }
        return json({ status: 'linked', phone: user.primary_phone, user });
      }
      const { data: pend } = await sb.from('pending_google_links').select('phone_number')
        .eq('google_id', g.google_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      return json({
        status: 'not_linked', email: g.email, name: g.name, avatar_url: g.avatar_url,
        pending_phone: pend?.phone_number ?? null,
      });
    }

    if (op === 'link') {
      const phone = normalizePhone(body.phone_number);
      const otp = String(body.otp || '').replace(/\D/g, '');
      if (phone.length < 10) return json({ error: 'invalid_phone', message: 'Nomor WhatsApp tidak valid.' }, 400);
      if (otp.length < 4) return json({ error: 'invalid_otp', message: 'Masukkan kode OTP lengkap.' }, 400);

      // Conflicts are checked BEFORE the OTP is spent.
      const { data: owner } = await sb.from('users').select('primary_phone').eq('google_id', g.google_id).maybeSingle();
      if (owner && owner.primary_phone !== phone) {
        return json({
          otp_ok: false, linked: false, error: 'google_linked_elsewhere',
          message: `Akun Google ini sudah terhubung ke nomor lain (${maskPhone(owner.primary_phone)}). Masuk pakai nomor itu ya.`,
        }, 409);
      }
      const { data: existing } = await sb.from('users').select('*').eq('primary_phone', phone).maybeSingle();
      if (existing?.google_id && existing.google_id !== g.google_id) {
        return json({
          otp_ok: false, linked: false, error: 'phone_linked_other_google',
          message: 'Nomor ini sudah terhubung dengan akun Google lain.',
        }, 409);
      }

      const r = await fetch(VERIFY_OTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, otp }),
      });
      const raw = await r.text();
      // deno-lint-ignore no-explicit-any
      let v: any = {};
      try { v = raw ? JSON.parse(raw) : {}; } catch { v = {}; }
      // Same STRICT rule as the phone login: only status === 'success' counts.
      if (v?.status !== 'success') {
        return json({ otp_ok: false, linked: false, message: v?.message || 'Kode OTP salah atau kadaluarsa.' });
      }
      const n8nUser = v.user || v.profile || v.data?.user || null;

      if (existing) {
        // Email is unique across users — only take Google's if nobody else has it.
        let email = existing.email || null;
        if (!email && g.email) {
          const { data: clash } = await sb.from('users').select('id').eq('email', g.email).maybeSingle();
          if (!clash) email = g.email;
        }
        const { data: updated, error } = await sb.from('users')
          .update({ google_id: g.google_id, email, avatar_url: existing.avatar_url || g.avatar_url })
          .eq('id', existing.id).select('*').single();
        if (error) throw new Error('link_update_failed: ' + error.message);
        return json({
          otp_ok: true, linked: 'now', phone, user: n8nUser || updated,
          message: 'Akun Google berhasil terhubung ke MIRA kamu 🎉',
        });
      }

      // Mid-signup: the users row doesn't exist until payment completes.
      await sb.from('pending_google_links').delete().eq('google_id', g.google_id).neq('phone_number', phone);
      const { error: pendErr } = await sb.from('pending_google_links').upsert({
        phone_number: phone, google_id: g.google_id, email: g.email, avatar_url: g.avatar_url, name: g.name,
        created_at: new Date().toISOString(),
      }, { onConflict: 'phone_number' });
      if (pendErr) throw new Error('pending_upsert_failed: ' + pendErr.message);
      return json({ otp_ok: true, linked: 'pending', phone, user: n8nUser });
    }

    return json({ error: 'unknown_op' }, 400);
  } catch (err) {
    console.error('auth-google error:', op, err);
    return json({ error: 'internal', message: 'Waduh, ada gangguan. Coba lagi ya 🙏' }, 500);
  }
});
