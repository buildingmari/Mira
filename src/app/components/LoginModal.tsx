/**
 * LoginModal — popup login di landing page
 * Desktop : centered card  |  Mobile : bottom sheet
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import './LoginModal.css';

interface Props { isOpen: boolean; onClose: () => void; }

export function LoginModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep]       = useState<'phone' | 'otp' | 'loading'>('phone');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState(['', '', '', '']);
  const [loadTxt, setLoadTxt] = useState('Mengirim OTP...');
  const [err, setErr]         = useState('');
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

  const reset = () => { setStep('phone'); setPhone(''); setOtp(['','','','']); setErr(''); };
  const close = () => { reset(); onClose(); };

  const normalizePhone = (raw: string): string => {
    let p = raw.replace(/[^\d]/g, '');
    if (p.startsWith('0')) p = '62' + p.slice(1);
    else if (p.startsWith('8') || p.startsWith('9')) p = '62' + p;
    else if (!p.startsWith('62')) p = '62' + p;
    return p;
  };

  /* ── Send OTP ── */
  const sendOTP = async () => {
    if (phone.length < 9) { setErr('Nomor minimal 9 digit'); return; }
    setErr(''); setStep('loading'); setLoadTxt('Mengirim OTP...');
    try {
      const normalized = normalizePhone(phone);
      const res  = await fetch('https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/login-mira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.status === 'otp_sent') {
        setStep('otp');
        setTimeout(() => refs[0].current?.focus(), 60);
      } else {
        setErr(data.message || 'Nomor tidak terdaftar. Silakan daftar terlebih dahulu.');
        setStep('phone');
      }
    } catch {
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
      // Do NOT use response.ok or broad fallbacks — n8n always returns HTTP 200
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
    if (step === 'otp') return '🔐 Masukkan Kode OTP';
    if (step === 'loading') return 'MIRA';
    return 'Masuk ke Akun';
  };

  return (
    <div className={`lm-overlay ${isOpen ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && close()}>
      <div className="lm-box">

        <div className="lm-handle" aria-hidden="true" />

        <div className="lm-header">
          <div className="lm-title">{getTitle()}</div>
          <button className="lm-close" onClick={close}>✕</button>
        </div>

        <div className="lm-body">

          {/* ── STEP: PHONE ── */}
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
              }}>🇮🇩 +62</span>
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

            {err && (
              <div style={{ fontSize: '.81rem', color: '#DC2626', marginBottom: 12 }}>⚠ {err}</div>
            )}

            <button style={mainBtn(phone.length < 9)} onClick={sendOTP} disabled={phone.length < 9}>
              Kirim OTP →
            </button>

            <p style={{ marginTop: 16, fontSize: '.79rem', color: '#64748B', textAlign: 'center' }}>
              Belum punya akun?{' '}
              <span
                style={{ color: '#2D4BFF', cursor: 'pointer', textDecoration: 'underline', touchAction: 'manipulation' }}
                onClick={close}
              >Daftar sekarang</span>
            </p>
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

            {err && (
              <div style={{ fontSize: '.81rem', color: '#DC2626', marginBottom: 12, textAlign: 'center' }}>⚠ {err}</div>
            )}

            <button style={mainBtn()} onClick={verify}>Verifikasi & Masuk</button>

            <button
              onClick={() => { setOtp(['','','','']); refs[0].current?.focus(); }}
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
