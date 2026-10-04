/**
 * GoogleButton — "Masuk / Daftar dengan Google"
 *
 * With `onSession`, renders Google's own Sign in with Google button (Google
 * Identity Services) on our origin — the account chooser then says "to
 * continue to halo-mira.com" — and hands back a Supabase session. If the GIS
 * script can't load, it falls back to our pill button calling `onClick`
 * (the Supabase redirect flow). Only render it when useGoogleEnabled() is true.
 */
import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID, createNonce, isGoogleEnabled, loadGis, peekGoogleEnabled } from '../lib/google-auth';
import { googleIdTokenSignIn } from '../lib/auth';
import type { AuthSession } from '../lib/auth';

const GBTN_CSS = `
  .mira-gbtn { transition: background .2s, border-color .2s, box-shadow .2s, transform .1s; }
  .mira-gbtn:not(:disabled):hover { background: #F8FAFC !important; border-color: #CBD5E1 !important; box-shadow: 0 2px 10px rgba(15,23,42,.06); }
  .mira-gbtn:not(:disabled):active { transform: scale(.98); }
  .mira-gbtn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(45,75,255,.18); }
  .mira-gis { display: flex; justify-content: center; min-height: 44px; }
`;

export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}

interface GoogleButtonProps {
  label: string;
  /** Redirect fallback (also used when `onSession` isn't given). */
  onClick: () => void;
  /** GIS mode: called with the Supabase session after Google sign-in. */
  onSession?: (session: AuthSession) => void;
  onError?: (message: string) => void;
  mode?: 'signin' | 'signup';
  disabled?: boolean;
}

export function GoogleButton({ label, onClick, onSession, onError, mode = 'signin', disabled = false }: GoogleButtonProps) {
  const slot = useRef<HTMLDivElement>(null);
  const [gis, setGis] = useState<'loading' | 'ready' | 'failed'>(onSession ? 'loading' : 'failed');
  const [busy, setBusy] = useState(false);
  // Latest callbacks without re-rendering Google's button on every render.
  const cb = useRef({ onSession, onError });
  cb.current = { onSession, onError };

  useEffect(() => {
    if (!onSession) return;
    let alive = true;
    (async () => {
      try {
        const google = await loadGis();
        const nonce = await createNonce();
        if (!alive || !slot.current) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: nonce.hashed,
          ux_mode: 'popup',
          context: mode === 'signup' ? 'signup' : 'signin',
          itp_support: true,
          callback: async (resp: { credential?: string }) => {
            if (!resp?.credential) return;
            setBusy(true);
            const r = await googleIdTokenSignIn(resp.credential, nonce.raw);
            setBusy(false);
            if (r.session) cb.current.onSession?.(r.session);
            else cb.current.onError?.(r.error || 'Gagal masuk dengan Google. Coba lagi ya.');
          },
        });
        const width = Math.max(220, Math.min(400, Math.round(slot.current.getBoundingClientRect().width || 320)));
        slot.current.innerHTML = '';
        google.accounts.id.renderButton(slot.current, {
          type: 'standard', theme: 'outline', size: 'large', shape: 'pill',
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
          logo_alignment: 'center', width, locale: 'id',
        });
        setGis('ready');
        // Google's iframe only becomes visible when this origin is allowed for
        // the client ID (Authorized JavaScript origins). Otherwise a dead
        // placeholder stays — fall back to the redirect flow instead.
        for (let i = 0; i < 40 && alive; i++) {
          await new Promise((r) => setTimeout(r, 250));
          const frame = slot.current?.querySelector('iframe');
          if (frame && frame.getBoundingClientRect().height > 0) return;
        }
        if (alive) setGis('failed');
      } catch {
        if (alive) setGis('failed');
      }
    })();
    return () => { alive = false; };
  }, [mode, !!onSession]);

  if (gis !== 'failed') {
    return (
      <>
        <style>{GBTN_CSS}</style>
        <div style={{ position: 'relative', opacity: busy || disabled ? 0.6 : 1, pointerEvents: busy || disabled ? 'none' : undefined }}>
          <div ref={slot} className="mira-gis" />
          {gis === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: 100, border: '1.5px solid #E2E8F0', background: '#fff' }} />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{GBTN_CSS}</style>
      <button
        type="button"
        className="mira-gbtn"
        onClick={onClick}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          width: '100%', padding: '12px 22px', borderRadius: 100,
          background: '#fff', border: '1.5px solid #E2E8F0',
          color: disabled ? '#94A3B8' : '#0F172A',
          fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.92rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          touchAction: 'manipulation',
        }}
      >
        <GoogleIcon />
        <span>{label}</span>
      </button>
    </>
  );
}

/** true once the Google provider is confirmed switched on in Supabase Auth. */
export function useGoogleEnabled(): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => peekGoogleEnabled() === true);
  useEffect(() => {
    let alive = true;
    isGoogleEnabled().then((on) => { if (alive) setEnabled(on); });
    return () => { alive = false; };
  }, []);
  return enabled;
}
