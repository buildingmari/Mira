/**
 * google-auth — "Masuk / Daftar dengan Google" helpers
 * ─────────────────────────────────────────────────────────────────────
 * MIRA accounts stay keyed by WhatsApp number. Google is only an extra
 * way into the SAME account, so this deliberately does NOT use
 * supabase-js sessions: we run Supabase Auth's Google provider in the
 * implicit flow (plain redirect), keep the returned tokens in
 * sessionStorage just long enough to talk to the `auth-google` Edge
 * Function, and the real app session is still `mira_phone` / `mira_user`
 * in localStorage, exactly like the WhatsApp OTP login.
 *
 * Every Google entry point must be hidden unless isGoogleEnabled()
 * resolves true (Supabase → Auth → Providers → Google switched on).
 * ─────────────────────────────────────────────────────────────────────
 */

export const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
export const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';

export type GoogleIntent = 'login' | 'signup';

const INTENT_KEY  = 'mira_google_intent';
const PENDING_KEY = 'mira_google_pending';
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
  | { ok: true; access_token: string; refresh_token: string; expires_at: number }
  | { ok: false; error: string; error_description: string };

/**
 * Reads Supabase's implicit-flow result from the URL hash
 * (#access_token=…&refresh_token=…&expires_at=…) or an error
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
  };
}

/* ── Pending Google identity (signed in with Google, not linked yet) ── */

export interface GooglePending {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  email: string | null;
  name: string | null;
  avatar_url: string | null;
}

export function getGooglePending(): GooglePending | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p.access_token !== 'string' || !p.access_token) return null;
    return {
      access_token: p.access_token,
      refresh_token: typeof p.refresh_token === 'string' ? p.refresh_token : '',
      expires_at: Number(p.expires_at) || 0,
      email: p.email ?? null,
      name: p.name ?? null,
      avatar_url: p.avatar_url ?? null,
    };
  } catch {
    return null;
  }
}

export function setGooglePending(p: GooglePending): void {
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch {}
}

export function clearGooglePending(): void {
  try { sessionStorage.removeItem(PENDING_KEY); } catch {}
}

/**
 * Access token for the pending Google identity, refreshed first when it
 * expires within 60s. Returns null if there is no pending identity or it
 * can't be refreshed (caller should then fall back / ask to sign in again).
 */
export async function getFreshGoogleToken(): Promise<string | null> {
  const p = getGooglePending();
  if (!p) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (p.expires_at - nowSec > 60) return p.access_token;
  if (!p.refresh_token) return null;

  try {
    const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: SUPA_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: p.refresh_token }),
    });
    if (!res.ok) return null;
    const d = await res.json().catch(() => null);
    if (!d || typeof d.access_token !== 'string' || !d.access_token) return null;

    const expiresAt = Number(d.expires_at);
    const expiresIn = Number(d.expires_in);
    setGooglePending({
      ...p,
      access_token: d.access_token,
      refresh_token: typeof d.refresh_token === 'string' && d.refresh_token ? d.refresh_token : p.refresh_token,
      expires_at: expiresAt > 0 ? expiresAt : nowSec + (expiresIn > 0 ? expiresIn : 3600),
    });
    return d.access_token;
  } catch {
    return null;
  }
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
