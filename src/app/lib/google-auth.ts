/**
 * google-auth — "Masuk / Daftar dengan Google" helpers
 * ─────────────────────────────────────────────────────────────────────
 * Supabase Auth's Google provider in the implicit flow (plain redirect, no
 * supabase-js). /auth/callback stores the returned tokens as the login
 * session (lib/auth.ts) and asks the `auth-account` Edge Function which
 * MIRA account they belong to; the app session is still `mira_phone` /
 * `mira_user` in localStorage.
 *
 * Every Google entry point must be hidden unless isGoogleEnabled()
 * resolves true (Supabase → Auth → Providers → Google switched on).
 * ─────────────────────────────────────────────────────────────────────
 */

export const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
export const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';

export type GoogleIntent = 'login' | 'signup';

const INTENT_KEY  = 'mira_google_intent';
const ENABLED_KEY = 'mira_google_enabled';
const ENABLED_TTL_MS = 10 * 60 * 1000; // re-check the provider switch every 10 min

/* ── Provider status ─────────────────────────────────────────────── */

let enabledCache: boolean | null = null;
let enabledPromise: Promise<boolean> | null = null;

function readEnabledFromSession(): boolean | null {
  try {
    const raw = sessionStorage.getItem(ENABLED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.v !== 'boolean' || typeof parsed?.t !== 'number') return null;
    if (Date.now() - parsed.t > ENABLED_TTL_MS) return null;
    return parsed.v;
  } catch {
    return null;
  }
}

/** Synchronous peek at the cached provider status (null = not known yet). */
export function peekGoogleEnabled(): boolean | null {
  if (enabledCache !== null) return enabledCache;
  const fromSession = readEnabledFromSession();
  if (fromSession !== null) enabledCache = fromSession;
  return fromSession;
}

async function fetchGoogleEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPA_URL}/auth/v1/settings`, {
      headers: { apikey: SUPA_ANON },
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    const on = data?.external?.google === true;
    enabledCache = on;
    try { sessionStorage.setItem(ENABLED_KEY, JSON.stringify({ v: on, t: Date.now() })); } catch {}
    return on;
  } catch {
    // Network hiccup: hide Google for now, but don't cache it so the next
    // mount can try again.
    return false;
  }
}

/** Is the Google provider switched on in Supabase Auth? Never throws. */
export function isGoogleEnabled(): Promise<boolean> {
  const cached = peekGoogleEnabled();
  if (cached !== null) return Promise.resolve(cached);

  // Concurrent callers (LoginModal + AssessmentPanel mount together) share
  // one request.
  if (!enabledPromise) {
    enabledPromise = fetchGoogleEnabled().then((on) => {
      enabledPromise = null;
      return on;
    });
  }
  return enabledPromise;
}

/* ── Redirect to Google ──────────────────────────────────────────── */

export function startGoogleAuth(intent: GoogleIntent): void {
  try { sessionStorage.setItem(INTENT_KEY, intent); } catch {}
  const redirectTo = `${window.location.origin}/auth/callback`;
  window.location.assign(
    `${SUPA_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`
  );
}

/** What the user was doing when they clicked a Google button (default: login). */
export function getGoogleIntent(): GoogleIntent {
  try {
    return sessionStorage.getItem(INTENT_KEY) === 'signup' ? 'signup' : 'login';
  } catch {
    return 'login';
  }
}

export function clearGoogleIntent(): void {
  try { sessionStorage.removeItem(INTENT_KEY); } catch {}
}

/* ── Parse the /auth/callback URL ────────────────────────────────── */

export type AuthHashResult =
  | { ok: true; access_token: string; refresh_token: string; expires_at: number; type: string }
  | { ok: false; error: string; error_description: string };

/**
 * Reads Supabase's implicit-flow result from the URL hash
 * (#access_token=…&refresh_token=…&expires_at=…&type=…) or an error
 * (#error=…&error_description=…, sometimes sent as ?error=… instead).
 * Returns null when the URL carries neither.
 */
export function parseAuthHash(
  hash: string = window.location.hash,
  search: string = window.location.search,
): AuthHashResult | null {
  const h = new URLSearchParams(hash.replace(/^#/, ''));
  const q = new URLSearchParams(search.replace(/^\?/, ''));

  const error = h.get('error') || q.get('error');
  if (error) {
    const desc = h.get('error_description') || q.get('error_description') || '';
    return { ok: false, error, error_description: desc.replace(/\+/g, ' ') };
  }

  const access_token = h.get('access_token');
  if (!access_token) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const expiresAt = Number(h.get('expires_at'));
  const expiresIn = Number(h.get('expires_in'));
  return {
    ok: true,
    access_token,
    refresh_token: h.get('refresh_token') || '',
    expires_at: expiresAt > 0 ? expiresAt : nowSec + (expiresIn > 0 ? expiresIn : 3600),
    type: h.get('type') || '',
  };
}

/* ── auth-google Edge Function ───────────────────────────────────── */

export type AuthGoogleBody =
  | { op: 'resolve'; access_token: string }
  | { op: 'link'; access_token: string; phone_number: string; otp: string };

/**
 * POST to the auth-google Edge Function. Never throws: a network failure
 * comes back as { status: 0, data: {} }.
 */
export async function authGoogle(body: AuthGoogleBody): Promise<{ status: number; data: any }> {
  try {
    const res = await fetch(`${SUPA_URL}/functions/v1/auth-google`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPA_ANON}`,
        apikey: SUPA_ANON,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    let data: any = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
    return { status: res.status, data: data && typeof data === 'object' ? data : {} };
  } catch {
    return { status: 0, data: {} };
  }
}
