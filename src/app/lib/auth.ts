/**
 * auth — web accounts (Google / email + password)
 * ─────────────────────────────────────────────────────────────────────
 * Supabase Auth proves who the person is; the `auth-account` Edge Function
 * maps that login to a MIRA account. The app session itself is unchanged:
 * `mira_phone` / `mira_user` in localStorage, same as the WhatsApp login
 * (for web accounts mira_phone holds the internal "999…" account ID).
 *
 * The Supabase tokens are kept in localStorage (`mira_auth`) only so pages
 * can re-check the account after a redirect (Google, email confirmation,
 * Midtrans) — this deliberately doesn't use supabase-js sessions.
 * ─────────────────────────────────────────────────────────────────────
 */

import { SUPA_ANON, SUPA_URL } from './google-auth';

/** WhatsApp-number signup / login (OTP via WhatsApp). Hidden for now — flip
 *  to true to bring back the old WAPanel + phone login exactly as they were. */
export const WHATSAPP_AUTH_ENABLED = false;

/* ── Login session (Supabase Auth tokens) ────────────────────────── */

export type AuthProvider = 'google' | 'email';

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  provider: AuthProvider;
}

const SESSION_KEY = 'mira_auth';

export function getAuthSession(): AuthSession | null {
  try {
    const p = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!p || typeof p.access_token !== 'string' || !p.access_token) return null;
    return {
      access_token: p.access_token,
      refresh_token: typeof p.refresh_token === 'string' ? p.refresh_token : '',
      expires_at: Number(p.expires_at) || 0,
      email: p.email ?? null,
      name: p.name ?? null,
      avatar_url: p.avatar_url ?? null,
      provider: p.provider === 'google' ? 'google' : 'email',
    };
  } catch {
    return null;
  }
}

export function setAuthSession(s: AuthSession): void {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
}

export function clearAuthSession(): void {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

/** Access token, refreshed first when it expires within 60s. null = sign in again. */
export async function getFreshAuthToken(): Promise<string | null> {
  const s = getAuthSession();
  if (!s) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  if (s.expires_at - nowSec > 60) return s.access_token;
  if (!s.refresh_token) return null;

  const r = await gotrue('/token?grant_type=refresh_token', { refresh_token: s.refresh_token });
  const next = r.ok ? sessionFrom(r.data, s.provider) : null;
  if (!next) return null;
  setAuthSession({ ...next, name: next.name || s.name, avatar_url: next.avatar_url || s.avatar_url });
  return next.access_token;
}

/* ── Supabase Auth REST (GoTrue) ─────────────────────────────────── */

async function gotrue(path: string, body: unknown, opts: { method?: string; token?: string } = {}) {
  try {
    const res = await fetch(`${SUPA_URL}/auth/v1${path}`, {
      method: opts.method || 'POST',
      headers: {
        apikey: SUPA_ANON,
        'Content-Type': 'application/json',
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: data && typeof data === 'object' ? data : {} };
  } catch {
    return { ok: false, status: 0, data: {} as Record<string, any> };
  }
}

/** Builds an AuthSession from a GoTrue token response (or a callback URL). */
export function sessionFrom(d: any, provider: AuthProvider): AuthSession | null {
  if (!d || typeof d.access_token !== 'string' || !d.access_token) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  const expiresAt = Number(d.expires_at);
  const expiresIn = Number(d.expires_in);
  const meta = d.user?.user_metadata || {};
  return {
    access_token: d.access_token,
    refresh_token: typeof d.refresh_token === 'string' ? d.refresh_token : '',
    expires_at: expiresAt > 0 ? expiresAt : nowSec + (expiresIn > 0 ? expiresIn : 3600),
    email: d.user?.email ?? null,
    name: meta.full_name || meta.name || null,
    avatar_url: meta.avatar_url || meta.picture || null,
    provider,
  };
}

const callbackUrl = () => `${window.location.origin}/auth/callback`;

/** Translates GoTrue errors into friendly Indonesian copy. */
function authError(d: any, status: number): string {
  const code = String(d?.error_code || d?.code || d?.error || '');
  const msg = String(d?.msg || d?.message || d?.error_description || '');
  if (status === 0) return 'Gagal terhubung ke server. Periksa koneksi internetmu.';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) return 'Email atau password salah.';
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) return 'Email kamu belum dikonfirmasi. Cek inbox (atau folder spam) untuk link konfirmasinya.';
  if (code === 'user_already_exists' || /already registered/i.test(msg)) return 'Email ini sudah terdaftar. Masuk pakai password-nya ya.';
  if (code === 'same_password' || /different from the old/i.test(msg)) return 'Password baru harus beda dari password lama.';
  if (code === 'weak_password' || /password should be/i.test(msg)) return 'Password minimal 6 karakter.';
  if (code === 'email_address_invalid' || /invalid.*email|email.*invalid/i.test(msg)) return 'Format email-nya belum benar.';
  if (status === 429 || /rate limit/i.test(msg)) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  return msg || 'Ada gangguan. Coba lagi ya.';
}

export type EmailAuthResult =
  | { ok: true; session: AuthSession }
  | { ok: false; needsConfirm: true; email: string }
  | { ok: false; needsConfirm?: false; exists?: boolean; error: string; unconfirmed?: boolean };

export async function emailSignUp(email: string, password: string, name: string): Promise<EmailAuthResult> {
  const r = await gotrue(`/signup?redirect_to=${encodeURIComponent(callbackUrl())}`, {
    email, password, data: { full_name: name || undefined },
  });
  if (!r.ok) {
    const error = authError(r.data, r.status);
    return { ok: false, error, exists: /sudah terdaftar/.test(error) };
  }
  const session = sessionFrom(r.data, 'email');
  if (session) return { ok: true, session: { ...session, name: session.name || name || null } };
  // With email-enumeration protection an existing address comes back as a
  // user with no identities instead of an error.
  const user = r.data.user || r.data;
  if (Array.isArray(user?.identities) && user.identities.length === 0) {
    return { ok: false, exists: true, error: 'Email ini sudah terdaftar. Masuk pakai password-nya ya.' };
  }
  return { ok: false, needsConfirm: true, email };
}

export async function emailSignIn(email: string, password: string): Promise<EmailAuthResult> {
  const r = await gotrue('/token?grant_type=password', { email, password });
  const session = r.ok ? sessionFrom(r.data, 'email') : null;
  if (session) return { ok: true, session };
  const error = authError(r.data, r.status);
  return { ok: false, error, unconfirmed: /belum dikonfirmasi/.test(error) };
}

/** Google ID token (from the GIS button) → Supabase session. */
export async function googleIdTokenSignIn(idToken: string, nonce: string): Promise<{ session: AuthSession | null; error?: string }> {
  const r = await gotrue('/token?grant_type=id_token', { provider: 'google', id_token: idToken, nonce });
  const session = r.ok ? sessionFrom(r.data, 'google') : null;
  return session ? { session } : { session: null, error: authError(r.data, r.status) };
}

export async function resendConfirmation(email: string): Promise<string | null> {
  const r = await gotrue(`/resend?redirect_to=${encodeURIComponent(callbackUrl())}`, { type: 'signup', email });
  return r.ok ? null : authError(r.data, r.status);
}

export async function requestPasswordReset(email: string): Promise<string | null> {
  const r = await gotrue(`/recover?redirect_to=${encodeURIComponent(callbackUrl())}`, { email });
  return r.ok ? null : authError(r.data, r.status);
}

export async function updatePassword(token: string, password: string): Promise<string | null> {
  const r = await gotrue('/user', { password }, { method: 'PUT', token });
  return r.ok ? null : authError(r.data, r.status);
}

/** Email login: checks the current password (a fresh sign-in), then sets the new one. */
export async function changePassword(email: string, current: string, next: string): Promise<string | null> {
  const r = await gotrue('/token?grant_type=password', { email, password: current });
  const fresh = r.ok ? sessionFrom(r.data, 'email') : null;
  if (!fresh) return r.status === 400 ? 'Password lama salah.' : authError(r.data, r.status);
  const err = await updatePassword(fresh.access_token, next);
  if (err) return err;
  const old = getAuthSession();
  setAuthSession({ ...fresh, name: fresh.name || old?.name || null, avatar_url: fresh.avatar_url || old?.avatar_url || null });
  return null;
}

/* ── auth-account Edge Function ──────────────────────────────────── */

export type AuthAccountBody =
  | { op: 'resolve'; access_token: string }
  | { op: 'start_signup'; access_token: string; name?: string }
  | { op: 'start_trial'; access_token: string; payload: Record<string, unknown> }
  | { op: 'start_renewal'; access_token: string; duration: string; voucher?: string }
  | { op: 'delete_account'; access_token: string; confirm: 'HAPUS' };

/** Never throws: a network failure comes back as { status: 0, data: {} }. */
export async function authAccount(body: AuthAccountBody): Promise<{ status: number; data: any }> {
  try {
    const res = await fetch(`${SUPA_URL}/functions/v1/auth-account`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SUPA_ANON}`, apikey: SUPA_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data: data && typeof data === 'object' ? data : {} };
  } catch {
    return { status: 0, data: {} };
  }
}

/* ── App session ─────────────────────────────────────────────────── */

export function saveMiraSession(phone: string, user: unknown): void {
  if (user) localStorage.setItem('mira_user', JSON.stringify(user));
  localStorage.setItem('mira_phone', phone);
}

/* ── Signup in progress (survives the Google / email-confirm redirect) ── */

export interface SignupDraft {
  answers: Record<string, any>;
  selectedPlan: string;
  selectedDuration: string;
  voucherDiscount: number;
  activeVoucher: string;
  affiliateReferrerPhone: string;
}

const DRAFT_KEY = 'mira_signup_draft';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export function saveSignupDraft(d: SignupDraft): void {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, savedAt: Date.now() })); } catch {}
}

export function getSignupDraft(): SignupDraft | null {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (!d || typeof d.answers !== 'object' || Date.now() - Number(d.savedAt) > DRAFT_TTL_MS) return null;
    return d;
  } catch {
    return null;
  }
}

export function clearSignupDraft(): void {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}
