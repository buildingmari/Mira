/**
 * billing-reminders
 * ─────────────────────────────────────────────────────────────────────────
 * Daily email nudges so nobody's MIRA quietly stops working:
 *
 *   trial_ending  trial has ≤ 2 days left        trial_ended  trial just ran out
 *   h7            paid plan ends within 7 days   h1           ends within ~1 day
 *   expired       paid plan ended in the last 3 days
 *
 * Each (account, kind, valid_to) is emailed once — billing_reminders holds
 * the log, so a renewal (new valid_to) starts a fresh cycle. Only accounts
 * with an email (web signups) get one.
 *
 * Called by pg_cron job "mira-billing-reminders" (09:00 WIB) with header
 * x-cron-secret = Vault secret "billing_cron_secret". Deployed with
 * verify_jwt off; that header is the auth.
 * Resend key: RESEND_API_KEY env, else Vault secret "resend_api_key".
 * ─────────────────────────────────────────────────────────────────────────
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const FROM = 'MIRA <noreply@halo-mira.com>';
const RENEW_URL = 'https://halo-mira.com/subscription';
const DAY = 86_400_000;

type Kind = 'trial_ending' | 'trial_ended' | 'h7' | 'h1' | 'expired';

async function secret(name: string): Promise<string> {
  const { data, error } = await sb.rpc('mira_vault_secret', { p_name: name });
  if (error) throw new Error(`vault_${name}: ${error.message}`);
  return String(data || '');
}

function kindFor(isTrial: boolean, msLeft: number): Kind | null {
  if (isTrial) {
    if (msLeft <= 0) return msLeft > -3 * DAY ? 'trial_ended' : null;
    return msLeft <= 2 * DAY ? 'trial_ending' : null;
  }
  if (msLeft <= 0) return msLeft > -3 * DAY ? 'expired' : null;
  if (msLeft <= 1.5 * DAY) return 'h1';
  return msLeft <= 7 * DAY ? 'h7' : null;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

function message(kind: Kind, name: string, validTo: string, msLeft: number) {
  const days = Math.max(1, Math.ceil(msLeft / DAY));
  const end = fmtDate(validTo);
  const hi = name ? `Hai ${name},` : 'Hai,';
  const keep = 'Riwayat transaksimu tetap aman dan bisa kamu lihat kapan aja.';
  switch (kind) {
    case 'trial_ending':
      return {
        subject: `Trial MIRA kamu tinggal ${days} hari`,
        title: `Trial gratismu tinggal ${days} hari`,
        body: `${hi} masa coba MIRA kamu berakhir <strong>${end}</strong>. Lanjut langganan biar tetap bisa catat pakai chat, foto struk, dan voice note — mulai Rp20 ribuan/bulan dengan paket tahunan.`,
        cta: 'Lanjut langganan',
        foot: `Kalau nggak diperpanjang, akunmu jadi mode baca saja. ${keep}`,
      };
    case 'trial_ended':
      return {
        subject: 'Trial MIRA kamu sudah selesai',
        title: 'Trial gratismu sudah selesai',
        body: `${hi} masa coba MIRA kamu berakhir <strong>${end}</strong>. Akunmu sekarang mode baca saja — belum bisa catat transaksi baru. Pilih paket buat lanjut, cuma butuh semenit.`,
        cta: 'Pilih paket',
        foot: keep,
      };
    case 'h7':
      return {
        subject: `Langganan MIRA kamu berakhir ${days} hari lagi`,
        title: `Langgananmu berakhir ${days} hari lagi`,
        body: `${hi} paket MIRA kamu aktif sampai <strong>${end}</strong>. Perpanjang sekarang — sisa harinya nggak hangus, langsung ditambahkan ke masa aktif baru.`,
        cta: 'Perpanjang sekarang',
        foot: keep,
      };
    case 'h1':
      return {
        subject: 'Langganan MIRA kamu berakhir besok',
        title: 'Langgananmu berakhir besok',
        body: `${hi} paket MIRA kamu aktif sampai <strong>${end}</strong>. Perpanjang hari ini biar nyatat keuanganmu nggak putus.`,
        cta: 'Perpanjang sekarang',
        foot: keep,
      };
    case 'expired':
      return {
        subject: 'Langganan MIRA kamu sudah berakhir',
        title: 'Langgananmu sudah berakhir',
        body: `${hi} paket MIRA kamu berakhir <strong>${end}</strong>. Akunmu sekarang mode baca saja — perpanjang buat catat lagi pakai chat, foto struk, dan voice note.`,
        cta: 'Perpanjang langganan',
        foot: keep,
      };
  }
}

// Same look as supabase/email-templates/*.html.
function html(m: ReturnType<typeof message>): string {
  return `<div style="background:#F4F6FF;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;color:#0F172A">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px 28px;box-shadow:0 8px 30px rgba(45,75,255,.08)">
    <div style="font-weight:800;font-size:24px;letter-spacing:-0.5px;color:#2D4BFF;margin-bottom:20px">MIRA</div>
    <h1 style="font-size:20px;line-height:1.35;margin:0 0 10px">${m.title}</h1>
    <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 24px">${m.body}</p>
    <a href="${RENEW_URL}" style="display:inline-block;background:#2D4BFF;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:999px">${m.cta}</a>
    <p style="font-size:13px;line-height:1.6;color:#94A3B8;margin:24px 0 0">${m.foot}</p>
  </div>
  <p style="text-align:center;font-size:12px;color:#94A3B8;margin:18px 0 0">MIRA · halo-mira.com</p>
</div>`;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405 });
  try {
    const expected = await secret('billing_cron_secret');
    if (!expected || req.headers.get('x-cron-secret') !== expected) return new Response('forbidden', { status: 403 });

    const resendKey = Deno.env.get('RESEND_API_KEY') || (await secret('resend_api_key'));
    if (!resendKey) throw new Error('resend_not_configured');

    const now = Date.now();
    const { data: users, error } = await sb.from('users')
      .select('primary_phone, name, email, plan_id, valid_to, account_status')
      .not('email', 'is', null)
      .gte('valid_to', new Date(now - 3 * DAY).toISOString())
      .lte('valid_to', new Date(now + 7 * DAY).toISOString());
    if (error) throw new Error('users_query: ' + error.message);

    const sent: string[] = [];
    for (const u of users || []) {
      if (!['pro', 'paid'].includes(String(u.account_status || '').toLowerCase())) continue;
      const msLeft = new Date(u.valid_to).getTime() - now;
      const kind = kindFor(u.plan_id === 'trial', msLeft);
      if (!kind) continue;

      // Claim first so overlapping runs never double-send.
      const { data: claimed } = await sb.from('billing_reminders')
        .upsert({ phone_number: u.primary_phone, kind, valid_to: u.valid_to, email: u.email },
          { onConflict: 'phone_number,kind,valid_to', ignoreDuplicates: true })
        .select('id');
      if (!claimed?.length) continue;

      const m = message(kind, escapeHtml(String(u.name || '').split(' ')[0]), u.valid_to, msLeft);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: [u.email], subject: m.subject, html: html(m) }),
      });
      if (!res.ok) {
        console.error('resend failed', u.primary_phone, kind, res.status, (await res.text().catch(() => '')).slice(0, 200));
        await sb.from('billing_reminders').delete().eq('id', claimed[0].id); // retry on the next run
        continue;
      }
      sent.push(`${u.primary_phone}:${kind}`);
    }
    return new Response(JSON.stringify({ checked: users?.length || 0, sent }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('billing-reminders error:', err);
    return new Response(JSON.stringify({ error: 'internal' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
