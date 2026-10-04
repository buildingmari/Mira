/**
 * LoginModal — popup login di landing page
 * Desktop : centered card  |  Mobile : bottom sheet
 *
 * Google or email + password (Supabase Auth → auth-account). The WhatsApp
 * OTP login below is kept intact but only reachable while
 * WHATSAPP_AUTH_ENABLED is on.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { GoogleButton, useGoogleEnabled } from './GoogleButton';
import { MiraIcon } from './icons/MiraIcon';
import { startGoogleAuth } from '../lib/google-auth';
import {
  WHATSAPP_AUTH_ENABLED, authAccount, clearAuthSession, emailSignIn, requestPasswordReset,
  resendConfirmation, saveMiraSession, setAuthSession,
} from '../lib/auth';
import './LoginModal.css';

interface Props { isOpen: boolean; onClose: () => void; onSignup?: () => void; }

type Step = 'email' | 'forgot' | 'forgot-sent' | 'unregistered' | 'phone' | 'otp' | 'loading';

// MIRA's WhatsApp Business number, used to build the "Login OTP" deep link.
// Set VITE_MIRA_WHATSAPP_NUMBER in your .env / hosting dashboard (digits
// only, international format without "+", e.g. 6281234567890).
const MIRA_WHATSAPP_NUMBER = import.meta.env.VITE_MIRA_WHATSAPP_NUMBER || '';

const buildLoginWhatsAppLink = (prefilledText: string) =>
  `https://wa.me/${MIRA_WHATSAPP_NUMBER}?text=${encodeURIComponent(prefilledText)}`;

export function LoginModal({ isOpen, onClose, onSignup }: Props) {
  const navigate = useNavigate();
  const [step, setStep]       = useState<Step>('email');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [info, setInfo]       = useState('');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState(['', '', '', '']);
  const [loadTxt, setLoadTxt] = useState('Mengirim OTP...');
  const [err, setErr]         = useState('');
  const googleEnabled         = useGoogleEnabled();
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const reset = () => {
    setStep('email'); setPhone(''); setOtp(['','','','']); setErr('');
    setPassword(''); setShowPw(false); setCanResend(false); setInfo('');
  };
  const close = () => { reset(); onClose(); };

  /* ── Email + password ── */
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const signIn = async () => {
    if (!emailOk) { setErr('Format email-nya belum benar.'); return; }
    if (!password) { setErr('Masukkan password kamu.'); return; }
    setErr(''); setInfo(''); setCanResend(false);
    setStep('loading'); setLoadTxt('Masuk...');

    const r = await emailSignIn(email.trim().toLowerCase(), password);
    if (!r.ok) {
      setStep('email');
      setErr('error' in r ? r.error : 'Gagal masuk. Coba lagi ya.');
      setCanResend('unconfirmed' in r && !!r.unconfirmed);
      return;
    }
    setAuthSession(r.session);
    setLoadTxt('Membuka akun MIRA...');
    const a = await authAccount({ op: 'resolve', access_token: r.session.access_token });
    if (a.data?.status === 'linked' && a.data.phone) {
      saveMiraSession(String(a.data.phone), a.data.user);
      close();
      navigate('/dashboard');
      return;
    }
    if (a.status === 200) { setStep('unregistered'); return; }
    setStep('email');
    setErr(a.data?.message || 'Gagal membuka akun. Coba lagi ya.');
  };

  const resend = async () => {
    const e = await resendConfirmation(email.trim().toLowerCase());
    setCanResend(false);
    if (e) setErr(e); else { setErr(''); setInfo('Link konfirmasi baru sudah dikirim. Cek inbox kamu ya.'); }
  };

  const sendReset = async () => {
    if (!emailOk) { setErr('Masukkan email yang terdaftar.'); return; }
    setErr(''); setStep('loading'); setLoadTxt('Mengirim link...');
    const e = await requestPasswordReset(email.trim().toLowerCase());
    if (e) { setStep('forgot'); setErr(e); return; }
    setStep('forgot-sent');
  };

  const startSignup = () => { close(); onSignup?.(); };

  const normalizePhone = (raw: string): string => {
    let p = raw.replace(/[^\d]/g, '');
    if (p.startsWith('0')) p = '62' + p.slice(1);
    else if (p.startsWith('8') || p.startsWith('9')) p = '62' + p;
    else if (!p.startsWith('62')) p = '62' + p;
    return p;
  };

  /* ── Send OTP ──
   * The backend (/webhook/login-mira) only validates the phone number and
   * responds { status: "ok", next_step: "open_whatsapp", ... } — it no
   * longer pushes the OTP directly. The OTP itself is sent as a WhatsApp
   * reply once the user actually sends "Login OTP" from their own number
   * (required by WhatsApp Business API's messaging rules). So on success we
   * must (1) open WhatsApp with that pre-filled message, then (2) move the
   * modal to the OTP-entry step ourselves — the backend response is only a
   * "number is registered, go ahead" signal, not a "message delivered" one.
   */
  const sendOTP = async () => {
    if (phone.length < 9) { setErr('Nomor minimal 9 digit'); return; }
    setErr('');

    const normalized = normalizePhone(phone);

    // Open a blank tab synchronously — still inside the click's user
    // gesture — then point it at WhatsApp once the number is confirmed
    // valid. Opening it AFTER the awaited fetch below gets blocked by most
    // browsers' popup blockers (Safari in particular).
    const waWindow = window.open('', '_blank');

    setStep('loading'); setLoadTxt('Memeriksa nomor...');
    try {
      const res  = await fetch('https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/login-mira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: normalized }),
      });
      const data = await res.json().catch(() => ({}));

      if (data.status === 'ok') {
        const waLink = buildLoginWhatsAppLink(data.whatsapp_prefilled_text || 'Login OTP');
        if (waWindow) waWindow.location.href = waLink;
        else window.open(waLink, '_blank'); // popup was blocked — try once more anyway
        setStep('otp');
        setTimeout(() => refs[0].current?.focus(), 60);
      } else {
        if (waWindow) waWindow.close();
        setErr(data.message || 'Nomor tidak terdaftar. Silakan daftar terlebih dahulu.');
        setStep('phone');
      }
    } catch {
      if (waWindow) waWindow.close();
      setErr('Gagal terhubung ke server. Periksa koneksi internetmu.');
      setStep('phone');
    }
  };

  /* ── OTP input handlers ── */
  const otpIn = (i: number, val: string) => {
    const c = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[i] = c; setOtp(next);
    if (c && i < 3) refs[i + 1].current?.focus();
    // Auto-submit when all 4 digits filled
    if (c && i === 3) {
      const filled = [...next];
      if (filled.every(d => d !== '')) {
        verifyWithCode(filled.join(''));
      }
    }
  };
  const otpKd = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs[i - 1].current?.focus();
  };

  /* ── Verify OTP — STRICT: only data.status === 'success' is accepted ── */
  const verifyWithCode = async (code: string) => {
    if (code.length < 4) { setErr('Masukkan kode OTP lengkap'); return; }
    setErr(''); setStep('loading'); setLoadTxt('Memverifikasi...');
    const normalized = normalizePhone(phone);
    try {
      const res = await fetch('https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: normalized, otp: code }),
      });
      const raw = await res.text();
      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }

      // STRICT CHECK: only status === 'success' is a valid login.
      // Do NOT use response.ok — n8n always returns HTTP 200
      // for both success and failure, so response.ok is meaningless here.
      if (data.status === 'success') {
        const userData    = data.user || data.profile || data.data?.user || null;
        const phoneNumber = userData?.primary_phone || userData?.phone_number || normalized;
        if (userData) localStorage.setItem('mira_user', JSON.stringify(userData));
        localStorage.setItem('mira_phone', phoneNumber);
        close();
        navigate('/dashboard');
      } else {
        // Treat everything else (including HTTP 200 with status !== 'success') as failure
        setErr(data.message || 'Kode OTP salah atau kadaluarsa.');
        setOtp(['','','','']); setStep('otp');
        refs[0].current?.focus();
      }
    } catch {
      setErr('Verifikasi gagal. Coba lagi.');
      setOtp(['','','','']); setStep('otp');
    }
  };

  const verify = () => verifyWithCode(otp.join(''));

  /* ── Resend: reopen WhatsApp with the "Login OTP" trigger so the user can
   * send it again (a fresh OTP is only generated when that message actually
   * arrives on WhatsApp) ── */
  const resendOtp = () => {
    setOtp(['','','','']);
    refs[0].current?.focus();
    window.open(buildLoginWhatsAppLink('Login OTP'), '_blank');
  };

  /* ── Shared styles ── */
  const mainBtn = (disabled = false): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '13px 26px', borderRadius: 100,
    background: disabled
      ? '#E2E8F0'
      : 'linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%)',
    color: disabled ? '#94A3B8' : '#fff', border: 'none',
    fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '0.95rem',
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .2s',
    touchAction: 'manipulation',
  });

  const getTitle = () => {
    if (step === 'otp') return 'Masukkan Kode OTP';
    if (step === 'loading') return 'MIRA';
    if (step === 'forgot' || step === 'forgot-sent') return 'Reset Password';
    if (step === 'unregistered') return 'Belum ada akun';
    return 'Masuk ke Akun';
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '13px 14px',
    border: '1.5px solid #E2E8F0', borderRadius: 12, fontSize: '16px',
    fontFamily: "'DM Sans',sans-serif", color: '#0F172A', background: '#FAFBFF', outline: 'none',
  };
  const linkStyle: React.CSSProperties = {
    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
    color: '#2D4BFF', fontWeight: 600, fontSize: '.8rem', fontFamily: "'DM Sans',sans-serif", touchAction: 'manipulation',
  };
  const errorBox = err ? (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.81rem', color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '9px 12px', marginBottom: 12, lineHeight: 1.45 }}>
      <MiraIcon name="alert" size={22} tile={false} />
      <span>{err}{canResend && <> <button style={linkStyle} onClick={resend}>Kirim ulang link</button></>}</span>
    </div>
  ) : null;

  return (
    <div className={`lm-overlay ${isOpen ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && close()}>
      <div className="lm-box">

        <div className="lm-handle" aria-hidden="true" />

        <div className="lm-header">
          <div className="lm-title">{getTitle()}</div>
          <button className="lm-close" onClick={close}>✕</button>
        </div>

        <div className="lm-body">

          {/* ── STEP: EMAIL (default) ── */}
          {step === 'email' && <>
            {googleEnabled && <>
              <div style={{ marginTop: 6 }}>
                <GoogleButton label="Masuk dengan Google" onClick={() => startGoogleAuth('login')} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
                <span style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                <span style={{ fontSize: '.76rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>atau pakai email</span>
                <span style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              </div>
            </>}

            <input
              type="email" autoComplete="email" placeholder="Email" value={email}
              onChange={e => { setEmail(e.target.value); setErr(''); setInfo(''); }}
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <input
                type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" value={password}
                onChange={e => { setPassword(e.target.value); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && signIn()}
                style={{ ...inputStyle, paddingRight: 70 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ ...linkStyle, position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>
                {showPw ? 'Sembunyi' : 'Lihat'}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginBottom: 14 }}>
              <button style={linkStyle} onClick={() => { setErr(''); setStep('forgot'); }}>Lupa password?</button>
            </div>

            {errorBox}
            {info && <div style={{ fontSize: '.81rem', color: '#15803D', marginBottom: 12 }}>{info}</div>}

            <button style={mainBtn(!emailOk || !password)} onClick={signIn} disabled={!emailOk || !password}>
              Masuk
            </button>

            <p style={{ marginTop: 16, fontSize: '.79rem', color: '#64748B', textAlign: 'center' }}>
              Belum punya akun?{' '}
              <span
                style={{ color: '#2D4BFF', cursor: 'pointer', textDecoration: 'underline', touchAction: 'manipulation' }}
                onClick={startSignup}
              >Daftar sekarang</span>
            </p>

            {WHATSAPP_AUTH_ENABLED && (
              <button style={{ ...linkStyle, display: 'block', margin: '4px auto 0', color: '#64748B' }} onClick={() => { setErr(''); setStep('phone'); }}>
                Masuk pakai nomor WhatsApp
              </button>
            )}
          </>}

          {/* ── STEP: FORGOT PASSWORD ── */}
          {step === 'forgot' && <>
            <p style={{ fontSize: '.86rem', color: '#64748B', marginBottom: 16, marginTop: 6 }}>
              Masukkan email akun MIRA kamu. Kami kirim link buat bikin password baru.
            </p>
            <input
              type="email" autoComplete="email" placeholder="Email" value={email}
              onChange={e => { setEmail(e.target.value); setErr(''); }}
              onKeyDown={e => e.key === 'Enter' && sendReset()}
              style={{ ...inputStyle, marginBottom: 14 }}
            />
            {errorBox}
            <button style={mainBtn(!emailOk)} onClick={sendReset} disabled={!emailOk}>Kirim link reset</button>
            <button style={{ ...linkStyle, display: 'block', margin: '14px auto 0', color: '#64748B' }} onClick={() => { setErr(''); setStep('email'); }}>
              ← Kembali
            </button>
          </>}

          {step === 'forgot-sent' && (
            <div style={{ textAlign: 'center', padding: '6px 0 4px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><MiraIcon name="mail" size={60} /></div>
              <p style={{ fontSize: '.88rem', color: '#334155', lineHeight: 1.6, marginBottom: 18 }}>
                Kalau <strong>{email.trim()}</strong> terdaftar, link reset password sudah dikirim. Cek inbox atau folder spam ya.
              </p>
              <button style={mainBtn()} onClick={() => setStep('email')}>Kembali ke login</button>
            </div>
          )}

          {/* ── STEP: login OK but no MIRA account yet ── */}
          {step === 'unregistered' && (
            <div style={{ textAlign: 'center', padding: '6px 0 4px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><MiraIcon name="buddy-think" size={64} /></div>
              <p style={{ fontSize: '.88rem', color: '#334155', lineHeight: 1.6, marginBottom: 18 }}>
                <strong>{email.trim()}</strong> belum punya akun MIRA yang aktif. Yuk cek kesehatan finansialmu dulu (2 menit) — akunnya langsung dibuat di akhir.
              </p>
              <button style={mainBtn()} onClick={startSignup}>Daftar sekarang</button>
              <button
                style={{ ...linkStyle, display: 'block', margin: '14px auto 0', color: '#64748B' }}
                onClick={() => { clearAuthSession(); setPassword(''); setStep('email'); }}
              >Pakai akun lain</button>
            </div>
          )}

          {/* ── STEP: PHONE (WhatsApp login, hidden unless WHATSAPP_AUTH_ENABLED) ── */}
          {step === 'phone' && <>
            <p style={{ fontSize: '.86rem', color: '#64748B', marginBottom: 22, marginTop: 6 }}>
              Masukkan nomor WhatsApp yang terdaftar di MIRA.
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
              }}>+62</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="81234567890"
                maxLength={13}
                value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && sendOTP()}
                style={{
                  flex: 1, padding: '13px 14px', border: 'none',
                  fontSize: '16px',
                  fontFamily: "'DM Sans',sans-serif", color: '#0F172A',
                  background: 'transparent', outline: 'none',
                }}
              />
            </div>

            {errorBox}

            <button style={mainBtn(phone.length < 9)} onClick={sendOTP} disabled={phone.length < 9}>
              Kirim OTP →
            </button>

            <p style={{ marginTop: 16, fontSize: '.79rem', color: '#64748B', textAlign: 'center' }}>
              Belum punya akun?{' '}
              <span
                style={{ color: '#2D4BFF', cursor: 'pointer', textDecoration: 'underline', touchAction: 'manipulation' }}
                onClick={startSignup}
              >Daftar sekarang</span>
            </p>
            <button style={{ ...linkStyle, display: 'block', margin: '4px auto 0', color: '#64748B' }} onClick={() => { setErr(''); setStep('email'); }}>
              ← Masuk pakai email
            </button>
          </>}

          {/* ── STEP: OTP ── */}
          {step === 'otp' && <>
            <p style={{ fontSize: '.86rem', color: '#64748B', marginBottom: 24, marginTop: 6 }}>
              Kode 4 digit dikirim ke +62 {phone.slice(0, 4)}****{phone.slice(-2)}
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
              {otp.map((v, i) => (
                <input
                  key={i}
                  ref={refs[i]}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={v}
                  className="lm-otp-input"
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

            {errorBox}

            <button style={mainBtn()} onClick={verify}>Verifikasi & Masuk</button>

            <button
              onClick={resendOtp}
              style={{
                display: 'block', width: '100%', textAlign: 'center',
                fontSize: '.82rem', color: '#2D4BFF', cursor: 'pointer',
                background: 'none', border: 'none', textDecoration: 'underline',
                marginTop: 14, fontFamily: "'DM Sans',sans-serif", touchAction: 'manipulation',
              }}
            >Kirim ulang kode</button>

            <button
              onClick={() => { setStep('phone'); setOtp(['','','','']); setErr(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: '.82rem', color: '#64748B', cursor: 'pointer',
                background: 'none', border: 'none', marginTop: 12,
                fontFamily: "'DM Sans',sans-serif", touchAction: 'manipulation',
              }}
            >← Ganti nomor</button>
          </>}

          {/* ── STEP: LOADING ── */}
          {step === 'loading' && (
            <div style={{ textAlign: 'center', padding: '36px 0 24px' }}>
              <div style={{
                width: 38, height: 38,
                border: '3px solid #E2E8F0', borderTopColor: '#2D4BFF',
                borderRadius: '50%', animation: 'lmSpin .8s linear infinite',
                margin: '0 auto 14px',
              }} />
              <div style={{ fontSize: '.88rem', color: '#64748B' }}>{loadTxt}</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
