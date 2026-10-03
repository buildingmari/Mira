/**
 * AuthCallback — landing spot after "Masuk / Daftar dengan Google"
 * Route: /auth/callback
 *
 * Supabase Auth (implicit flow) sends the browser back here with
 * #access_token=… (or #error=…). We ask the auth-google Edge Function who
 * this Google account belongs to:
 *   - linked      → set the normal MIRA session (mira_phone / mira_user) → /dashboard
 *   - not_linked  → signup intent: continue the signup flow (/?signup=1)
 *                   login intent : let the user link their WhatsApp number
 *                                  (Login OTP) or start a signup instead
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  authGoogle,
  clearGoogleIntent,
  clearGooglePending,
  getFreshGoogleToken,
  getGoogleIntent,
  getGooglePending,
  parseAuthHash,
  setGooglePending,
  startGoogleAuth,
} from '../lib/google-auth';
import type { GoogleIntent, GooglePending } from '../lib/google-auth';

const LOGIN_URL = 'https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/login-mira';

// Same number/env var as LoginModal.tsx (digits only, e.g. 6281234567890).
const MIRA_WHATSAPP_NUMBER = import.meta.env.VITE_MIRA_WHATSAPP_NUMBER || '';

const buildLoginWhatsAppLink = (prefilledText: string) =>
  `https://wa.me/${MIRA_WHATSAPP_NUMBER}?text=${encodeURIComponent(prefilledText)}`;

// Same normalization as LoginModal.tsx.
const normalizePhone = (raw: string): string => {
  let p = raw.replace(/[^\d]/g, '');
  if (p.startsWith('0')) p = '62' + p.slice(1);
  else if (p.startsWith('8') || p.startsWith('9')) p = '62' + p;
  else if (!p.startsWith('62')) p = '62' + p;
  return p;
};

// Same app session as the WhatsApp OTP login in LoginModal.tsx.
const saveMiraSession = (phone: string, user: any) => {
  if (user) localStorage.setItem('mira_user', JSON.stringify(user));
  localStorage.setItem('mira_phone', phone);
};

type TokenSet = Pick<GooglePending, 'access_token' | 'refresh_token' | 'expires_at'>;
type Phase = 'loading' | 'choose' | 'phone' | 'otp' | 'error';

const ACB_CSS = `
  @keyframes acbSpin { to { transform: rotate(360deg); } }
  @keyframes acbIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .acb-page {
    min-height: 100vh; min-height: 100dvh;
    display: flex; align-items: center; justify-content: center;
    padding: 32px 16px;
    background: radial-gradient(ellipse at top, #EEF2FF 0%, #F8FAFF 45%, #FFFFFF 100%);
    font-family: 'DM Sans', sans-serif; color: #0F172A;
    box-sizing: border-box;
  }
  .acb-card {
    width: 100%; max-width: 420px; box-sizing: border-box;
    background: #fff; border-radius: 24px;
    padding: 32px 28px 28px;
    box-shadow: 0 20px 60px rgba(45,75,255,.12), 0 4px 16px rgba(0,0,0,.06);
    animation: acbIn .35s ease both;
  }
  .acb-title {
    font-family: 'Sora', sans-serif; font-weight: 800; font-size: 1.2rem;
    line-height: 1.3; text-align: center; margin: 0 0 8px; color: #0F172A;
  }
  .acb-sub { font-size: .88rem; color: #64748B; line-height: 1.6; text-align: center; margin: 0 0 22px; }
  .acb-otp:focus { border-color: #2D4BFF !important; box-shadow: 0 0 0 3px rgba(45,75,255,.12) !important; }
  .acb-btn { transition: opacity .2s, transform .1s, background .2s, border-color .2s; }
  .acb-btn:not(:disabled):active { transform: scale(.98); }
  .acb-btn-primary:not(:disabled):hover { opacity: .92; }
  .acb-btn-secondary:not(:disabled):hover { background: #F8FAFC !important; border-color: #CBD5E1 !important; }
  .acb-link:hover { opacity: .8; }
  @media (max-width: 480px) {
    .acb-page { align-items: flex-start; padding: 24px 16px; }
    .acb-card { padding: 26px 20px 22px; border-radius: 20px; }
    .acb-otp { width: 56px !important; height: 62px !important; font-size: 1.5rem !important; }
  }
`;

/* ── Shared styles (same look as LoginModal) ── */
const mainBtn = (disabled = false): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
  width: '100%', padding: '13px 22px', borderRadius: 100,
  background: disabled ? '#E2E8F0' : 'linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)',
  color: disabled ? '#94A3B8' : '#fff', border: 'none',
  fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.93rem', lineHeight: 1.35,
  cursor: disabled ? 'not-allowed' : 'pointer', touchAction: 'manipulation',
  boxShadow: disabled ? 'none' : '0 8px 22px rgba(45,75,255,.22)',
});

const secondaryBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
  width: '100%', padding: '12px 22px', borderRadius: 100,
  background: '#fff', border: '1.5px solid #E2E8F0', color: '#0F172A',
  fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: '.9rem', lineHeight: 1.35,
  cursor: 'pointer', touchAction: 'manipulation',
};

const linkBtn = (color = '#2D4BFF'): React.CSSProperties => ({
  display: 'block', width: '100%', textAlign: 'center',
  fontSize: '.82rem', color, cursor: 'pointer',
  background: 'none', border: 'none', padding: 0,
  fontFamily: "'DM Sans',sans-serif", touchAction: 'manipulation',
});

function MiraLogo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 18 }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: 'linear-gradient(135deg, #2D4BFF 0%, #22D3EE 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 8px', boxShadow: '0 8px 24px rgba(45,75,255,0.25)',
      }}>
        <svg viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32 }}>
          <path
            d="M4 40 C4 40 9 10 17 13 C21.5 14.5 21.5 30 28 30 C34.5 30 34.5 14.5 39 13 C47 10 52 40 52 40"
            stroke="white" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round"
          />
          <circle cx="17" cy="13" r="3.8" fill="white" />
          <circle cx="39" cy="13" r="3.8" fill="white" />
          <circle cx="28" cy="30" r="2.6" fill="white" fillOpacity="0.6" />
          <circle cx="4" cy="40" r="2.2" fill="white" fillOpacity="0.4" />
          <circle cx="52" cy="40" r="2.2" fill="white" fillOpacity="0.4" />
        </svg>
      </div>
      <div style={{
        fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: '.95rem', letterSpacing: '.04em',
        background: 'linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>MIRA</div>
    </div>
  );
}

export function AuthCallback() {
  const navigate = useNavigate();
  const [intent] = useState<GoogleIntent>(() => getGoogleIntent());
  const [phase, setPhase]       = useState<Phase>('loading');
  const [loadTxt, setLoadTxt]   = useState('Menghubungkan akun Google…');
  const [errTitle, setErrTitle] = useState('');
  const [errText, setErrText]   = useState('');
  const [profile, setProfile]   = useState<GooglePending | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [phone, setPhone]       = useState('');
  const [otp, setOtp]           = useState(['', '', '', '']);
  const [err, setErr]           = useState('');
  const started = useRef(false);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const showError = (title: string, text: string) => {
    setErrTitle(title);
    setErrText(text);
    setPhase('error');
  };

  const showExpired = () => {
    clearGooglePending();
    showError('Sesi Google sudah habis', 'Masuk dengan Google sekali lagi ya, habis itu kita lanjut dari sini.');
  };

  const goHome = () => {
    clearGooglePending();
    clearGoogleIntent();
    navigate('/', { replace: true });
  };

  const goSignup = () => {
    const p = getGooglePending() || profile;
    if (p) setGooglePending(p);
    clearGoogleIntent();
    navigate('/?signup=1', { replace: true });
  };

  const retryGoogle = () => startGoogleAuth(intent);

  /* ── Who does this Google account belong to? ── */
  const resolve = async (tokens: TokenSet) => {
    setPhase('loading');
    setLoadTxt('Menghubungkan akun Google…');

    const r = await authGoogle({ op: 'resolve', access_token: tokens.access_token });
    const d = r.data || {};

    if (r.status === 200 && d.status === 'linked') {
      const phoneNumber = String(d.phone || d.user?.primary_phone || d.user?.phone_number || '');
      if (phoneNumber) {
        saveMiraSession(phoneNumber, d.user || null);
        clearGooglePending();
        clearGoogleIntent();
        navigate('/dashboard', { replace: true });
        return;
      }
    }

    if (r.status === 200 && d.status === 'not_linked') {
      const pending: GooglePending = {
        access_token : tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at   : tokens.expires_at,
        email        : d.email ?? null,
        name         : d.name ?? null,
        avatar_url   : d.avatar_url ?? null,
      };
      setGooglePending(pending);
      if (intent === 'signup') {
        clearGoogleIntent();
        navigate('/?signup=1', { replace: true });
        return;
      }
      setProfile(pending);
      setAvatarFailed(false);
      setPhase('choose');
      return;
    }

    if (r.status === 401) { showExpired(); return; }

    showError(
      'Waduh, ada gangguan',
      d.message || 'Gagal menghubungkan akun Google. Coba lagi beberapa saat ya.',
    );
  };

  /* ── On mount: read the URL hash, then strip it from the address bar ── */
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const result = parseAuthHash();
    if (window.location.hash || window.location.search) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }

    if (result && !result.ok) {
      if (result.error === 'access_denied') {
        showError('Login Google dibatalkan', 'Nggak apa-apa! Kamu bisa coba lagi, atau masuk pakai nomor WhatsApp.');
      } else {
        showError('Login Google gagal', 'Ada kendala waktu masuk dengan Google. Coba lagi ya, atau masuk pakai nomor WhatsApp.');
      }
      return;
    }

    if (result && result.ok) {
      void resolve({
        access_token : result.access_token,
        refresh_token: result.refresh_token,
        expires_at   : result.expires_at,
      });
      return;
    }

    // No tokens in the URL (e.g. the page was refreshed) → resume from the
    // Google identity we stored earlier in this tab, if any.
    if (getGooglePending()) {
      void (async () => {
        setPhase('loading');
        const token = await getFreshGoogleToken();
        const fresh = getGooglePending();
        if (!token || !fresh) { showExpired(); return; }
        await resolve({ access_token: token, refresh_token: fresh.refresh_token, expires_at: fresh.expires_at });
      })();
      return;
    }

    showError('Sesi login nggak ketemu', 'Coba masuk dengan Google sekali lagi ya.');
  }, []);

  /* ── Link step 1: phone → login-mira check → open WhatsApp "Login OTP" ── */
  const sendOTP = async () => {
    if (phone.length < 9) { setErr('Nomor minimal 9 digit'); return; }
    setErr('');

    const normalized = normalizePhone(phone);

    // Open a blank tab synchronously — still inside the click's user
    // gesture — then point it at WhatsApp once the number is confirmed
    // (popup blockers kill window.open after an await; Safari especially).
    const waWindow = window.open('', '_blank');

    setPhase('loading'); setLoadTxt('Memeriksa nomor...');
    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: normalized }),
      });
      const data = await res.json().catch(() => ({}));

      if (data.status === 'ok') {
        const waLink = buildLoginWhatsAppLink(data.whatsapp_prefilled_text || 'Login OTP');
        if (waWindow) waWindow.location.href = waLink;
        else window.open(waLink, '_blank'); // popup was blocked — try once more anyway
        setOtp(['', '', '', '']);
        setPhase('otp');
        setTimeout(() => refs[0].current?.focus(), 60);
      } else {
        if (waWindow) waWindow.close();
        setErr(data.message || 'Nomor tidak terdaftar di MIRA. Kalau belum punya akun, daftar pakai Google aja.');
        setPhase('phone');
      }
    } catch {
      if (waWindow) waWindow.close();
      setErr('Gagal terhubung ke server. Periksa koneksi internetmu.');
      setPhase('phone');
    }
  };

  /* ── OTP input handlers (same as LoginModal) ── */
  const otpIn = (i: number, val: string) => {
    const c = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[i] = c; setOtp(next);
    if (err) setErr('');
    if (c && i < 3) refs[i + 1].current?.focus();
    if (c && i === 3 && next.every(d => d !== '')) verifyWithCode(next.join(''));
  };
  const otpKd = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs[i - 1].current?.focus();
  };

  const backToOtp = (message: string) => {
    setErr(message);
    setOtp(['', '', '', '']);
    setPhase('otp');
    setTimeout(() => refs[0].current?.focus(), 60);
  };

  /* ── Link step 2: auth-google `link` verifies the Google token AND the OTP
   * (it calls verify-otp itself — never call verify-otp here too, or the
   * code is spent twice) ── */
  const verifyWithCode = async (code: string) => {
    if (code.length < 4) { setErr('Masukkan kode OTP lengkap'); return; }
    setErr(''); setPhase('loading'); setLoadTxt('Memverifikasi...');

    const token = await getFreshGoogleToken();
    if (!token) { showExpired(); return; }

    const normalized = normalizePhone(phone);
    const r = await authGoogle({ op: 'link', access_token: token, phone_number: normalized, otp: code });
    const d = r.data || {};

    if (r.status === 200 && d.otp_ok === true) {
      if (d.linked === 'now') {
        const phoneNumber = String(d.phone || d.user?.primary_phone || d.user?.phone_number || normalized);
        saveMiraSession(phoneNumber, d.user || null);
        clearGooglePending();
        clearGoogleIntent();
        navigate('/dashboard', { replace: true });
        return;
      }
      // linked === 'pending': the number is verified but has no active MIRA
      // account yet — the link is applied once the signup is completed.
      setErr('Nomor ini belum punya akun MIRA yang aktif. Selesaikan pendaftaran dulu lewat "Daftar pakai Google" ya.');
      setOtp(['', '', '', '']);
      setPhase('phone');
      return;
    }

    if (r.status === 200 && d.otp_ok === false) {
      backToOtp(d.message || 'Kode OTP salah atau kadaluarsa.');
      return;
    }
    if (r.status === 401) { showExpired(); return; }
    if (r.status === 409 || r.status === 400) {
      backToOtp(d.message || 'Nomor ini nggak bisa dihubungkan ke akun Google ini.');
      return;
    }
    backToOtp(d.message || 'Verifikasi gagal. Coba lagi.');
  };

  const verify = () => verifyWithCode(otp.join(''));

  /* ── Resend: reopen WhatsApp with the "Login OTP" trigger ── */
  const resend = () => {
    setOtp(['', '', '', '']);
    setErr('');
    refs[0].current?.focus();
    window.open(buildLoginWhatsAppLink('Login OTP'), '_blank');
  };

  const errorLine = (center = false) => err ? (
    <div style={{ fontSize: '.81rem', color: '#DC2626', marginBottom: 12, textAlign: center ? 'center' : 'left', lineHeight: 1.5 }}>
      ⚠ {err}
    </div>
  ) : null;

  const displayName = profile?.name || profile?.email || 'Akun Google';
  const initial = (displayName.trim().charAt(0) || 'G').toUpperCase();

  return (
    <div className="acb-page">
      <style>{ACB_CSS}</style>
      <div className="acb-card">
        <MiraLogo />

        {/* ── LOADING ── */}
        {phase === 'loading' && (
          <div style={{ textAlign: 'center', padding: '18px 0 10px' }}>
            <div style={{
              width: 38, height: 38,
              border: '3px solid #E2E8F0', borderTopColor: '#2D4BFF',
              borderRadius: '50%', animation: 'acbSpin .8s linear infinite',
              margin: '0 auto 14px',
            }} />
            <div style={{ fontSize: '.88rem', color: '#64748B' }}>{loadTxt}</div>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && <>
          <h1 className="acb-title">{errTitle}</h1>
          <p className="acb-sub">{errText}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="acb-btn acb-btn-primary" style={mainBtn()} onClick={retryGoogle}>
              Coba lagi
            </button>
            <button className="acb-btn acb-btn-secondary" style={secondaryBtn} onClick={goHome}>
              Kembali
            </button>
          </div>
          <button
            className="acb-link"
            style={{ ...linkBtn(), marginTop: 16, textDecoration: 'underline' }}
            onClick={() => { clearGooglePending(); clearGoogleIntent(); navigate('/?login=1', { replace: true }); }}
          >
            Masuk pakai nomor WhatsApp
          </button>
        </>}

        {/* ── CHOOSE: Google account isn't linked to MIRA yet ── */}
        {phase === 'choose' && <>
          <h1 className="acb-title">Satu langkah lagi 👋</h1>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#F8FAFF', border: '1.5px solid #DBEAFE', borderRadius: 16,
            padding: '12px 14px', margin: '14px 0 16px',
          }}>
            {profile?.avatar_url && !avatarFailed ? (
              <img
                src={profile.avatar_url}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '1.1rem',
              }}>{initial}</div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '.92rem', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              {profile?.email && profile.email !== displayName && (
                <div style={{ fontSize: '.8rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile.email}
                </div>
              )}
            </div>
          </div>

          <p className="acb-sub" style={{ marginBottom: 18 }}>
            Akun Google ini belum terhubung ke akun MIRA mana pun. Kamu yang mana?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="acb-btn acb-btn-primary"
              style={mainBtn()}
              onClick={() => { setErr(''); setPhase('phone'); }}
            >
              Aku udah punya akun MIRA — hubungkan nomor WhatsApp
            </button>
            <button className="acb-btn acb-btn-secondary" style={secondaryBtn} onClick={goSignup}>
              Belum punya akun — daftar pakai Google
            </button>
          </div>

          <button className="acb-link" style={{ ...linkBtn('#64748B'), marginTop: 18 }} onClick={goHome}>
            ← Kembali ke beranda
          </button>
        </>}

        {/* ── PHONE: which MIRA account (WhatsApp number) to link ── */}
        {phase === 'phone' && <>
          <h1 className="acb-title">Hubungkan nomor WhatsApp</h1>
          <p className="acb-sub">
            Masukkan nomor WhatsApp yang terdaftar di MIRA. Cukup sekali — habis ini kamu bisa langsung masuk pakai Google.
          </p>

          <div style={{
            display: 'flex',
            border: `1.5px solid ${phone.length > 0 ? '#2D4BFF' : '#E2E8F0'}`,
            borderRadius: 12, overflow: 'hidden', marginBottom: 14,
            transition: 'border-color .2s',
          }}>
            <span style={{
              padding: '13px 14px', background: '#F8FAFC', fontSize: '1rem',
              color: '#64748B', borderRight: '1px solid #E2E8F0',
              whiteSpace: 'nowrap', fontWeight: 500,
            }}>🇮🇩 +62</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="81234567890"
              maxLength={13}
              value={phone}
              autoFocus
              onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setErr(''); }}
              onKeyDown={e => e.key === 'Enter' && sendOTP()}
              style={{
                flex: 1, minWidth: 0, padding: '13px 14px', border: 'none',
                fontSize: '16px',
                fontFamily: "'DM Sans',sans-serif", color: '#0F172A',
                background: 'transparent', outline: 'none',
              }}
            />
          </div>

          {errorLine()}

          <button
            className="acb-btn acb-btn-primary"
            style={mainBtn(phone.length < 9)}
            onClick={sendOTP}
            disabled={phone.length < 9}
          >
            Kirim OTP →
          </button>

          <p style={{ marginTop: 16, marginBottom: 0, fontSize: '.8rem', color: '#64748B', textAlign: 'center' }}>
            Belum punya akun?{' '}
            <span
              className="acb-link"
              style={{ color: '#2D4BFF', cursor: 'pointer', textDecoration: 'underline', touchAction: 'manipulation' }}
              onClick={goSignup}
            >Daftar pakai Google</span>
          </p>

          <button
            className="acb-link"
            style={{ ...linkBtn('#64748B'), marginTop: 14 }}
            onClick={() => { setErr(''); setPhase('choose'); }}
          >
            ← Kembali
          </button>
        </>}

        {/* ── OTP ── */}
        {phase === 'otp' && <>
          <h1 className="acb-title">🔐 Masukkan Kode OTP</h1>
          <p className="acb-sub" style={{ marginBottom: 16 }}>
            Kode 4 digit dikirim ke +62 {phone.slice(0, 4)}****{phone.slice(-2)}
          </p>

          <div style={{
            background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12,
            padding: '10px 14px', marginBottom: 18,
            fontSize: '.8rem', color: '#166534', lineHeight: 1.55,
          }}>
            📲 Di tab WhatsApp yang barusan kebuka, tekan <strong>Kirim</strong> — MIRA bakal balas dengan kode OTP. Lalu balik ke sini dan masukkan kodenya.
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
            {otp.map((v, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={v}
                className="acb-otp"
                onChange={e => otpIn(i, e.target.value)}
                onKeyDown={e => otpKd(i, e)}
                style={{
                  width: 64, height: 70,
                  border: `1.5px solid ${v ? '#2D4BFF' : '#E2E8F0'}`,
                  borderRadius: 14, textAlign: 'center',
                  fontFamily: "'Sora',sans-serif",
                  fontSize: '1.75rem',
                  fontWeight: 700, color: '#0F172A', outline: 'none',
                  background: v ? '#E9EDFF' : '#F8FAFC',
                  transition: 'all .15s',
                }}
              />
            ))}
          </div>

          {errorLine(true)}

          <button
            className="acb-btn acb-btn-primary"
            style={mainBtn(otp.some(d => !d))}
            onClick={verify}
            disabled={otp.some(d => !d)}
          >
            Verifikasi & Hubungkan
          </button>

          <button
            className="acb-link"
            style={{ ...linkBtn(), marginTop: 14, textDecoration: 'underline' }}
            onClick={resend}
          >
            Kirim ulang kode
          </button>

          <button
            className="acb-link"
            style={{ ...linkBtn('#64748B'), marginTop: 12 }}
            onClick={() => { setPhase('phone'); setOtp(['', '', '', '']); setErr(''); }}
          >
            ← Ganti nomor
          </button>
        </>}
      </div>
    </div>
  );
}
