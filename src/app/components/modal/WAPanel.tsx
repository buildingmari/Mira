import { useRef, useState } from 'react';
import { plans } from './pricingData';
import { buildPayload } from './buildPayload';
import './WAPanel.css';

const REGISTER_URL             = 'https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/register-mira';
const REGISTER_REQUEST_OTP_URL = 'https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/register-request-otp';
const VERIFY_OTP_URL           = 'https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/verify-otp';
const PAYMENT_URL              = 'https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/create-transaction';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';

// MIRA's WhatsApp Business number, used to build the "Register OTP" deep
// link. Same number/env var as LoginModal.tsx — set VITE_MIRA_WHATSAPP_NUMBER
// in your .env / hosting dashboard (digits only, international format
// without "+", e.g. 6281234567890).
const MIRA_WHATSAPP_NUMBER = import.meta.env.VITE_MIRA_WHATSAPP_NUMBER || '';

const buildRegisterWhatsAppLink = (prefilledText: string) =>
  `https://wa.me/${MIRA_WHATSAPP_NUMBER}?text=${encodeURIComponent(prefilledText)}`;

// Always use this exact trigger text for the REGISTER flow's WhatsApp
// message. We deliberately do NOT use whatever whatsapp_prefilled_text the
// backend happens to return here — if that field is ever missing, stale,
// or (as seen in testing) mistakenly set to "Login OTP" by the backend,
// hardcoding it on the frontend guarantees users registering always see
// the correct "Register OTP" trigger message, regardless of backend state.
const REGISTER_OTP_TRIGGER_TEXT = 'Register OTP';

interface WAPanelProps {
  selectedPlan: string;
  selectedDuration: string;
  voucherDiscount: number;
  activeVoucher: string;
  affiliateReferrerPhone: string;
  answers: Record<string, any>;
  onBack: () => void;
}

// idle           → phone number form
// checking       → calling register-request-otp
// awaiting_otp   → WA opened, waiting for the 4-digit code
// verifying      → calling verify-otp, then register-mira
// verified       → account created, ready to pay
// paying / done  → calling create-transaction / redirecting
// error          → something failed, shown inline
type Step = 'idle' | 'checking' | 'awaiting_otp' | 'verifying' | 'verified' | 'paying' | 'done' | 'error';

export function WAPanel({
  selectedPlan,
  selectedDuration,
  voucherDiscount,
  activeVoucher,
  affiliateReferrerPhone,
  answers,
  onBack
}: WAPanelProps) {
  const plan     = plans[selectedPlan];
  const duration = plan.durations.find((d) => d.id === selectedDuration);
  const price    = duration?.price || 0;
  const discount = Math.round((price * voucherDiscount) / 100);
  const final    = price - discount;

  // Nama diambil dari assessment (answers.user_name)
  const nama = answers.user_name || '';

  const [waNumbers, setWaNumbers] = useState<string[]>(Array(plan.members).fill(''));
  const [step, setStep]           = useState<Step>('idle');
  const [errorMsg, setErrorMsg]   = useState('');
  const [savedPayload, setSavedPayload] = useState<any>(null);

  // ── OTP entry state ────────────────────────────────────────────
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  // Holds the WA tab opened synchronously (inside the click gesture) so we
  // can point it at the wa.me link once the phone number is confirmed valid.
  const waWindowRef = useRef<Window | null>(null);

  const handleNumberChange = (index: number, value: string) => {
    const cleaned    = value.replace(/[^0-9]/g, '');
    const newNumbers = [...waNumbers];
    newNumbers[index] = cleaned;
    setWaNumbers(newNumbers);
    if (step !== 'idle') {
      setStep('idle');
      setSavedPayload(null);
      setOtp(['', '', '', '']);
    }
    if (errorMsg) setErrorMsg('');
  };

  const shakeField = (i: number) => {
    const el = document.getElementById(`wa-input-${i}`);
    if (!el) return;
    el.style.borderColor = 'var(--error)';
    setTimeout(() => { el.style.borderColor = ''; }, 2200);
  };

  // ── STEP 1: Minta OTP untuk nomor utama ─────────────────────────
  const handleDaftar = async () => {
    setErrorMsg('');

    const required = plan.members === 5 ? 2 : plan.members;
    const validNumbers: string[] = [];

    for (let i = 0; i < plan.members; i++) {
      const num = waNumbers[i].trim();
      if (i < required && (!num || num.length < 9)) {
        shakeField(i);
        setErrorMsg('Harap isi nomor WhatsApp yang valid (min. 9 digit).');
        return;
      }
      // Tanpa tanda + (62xxx)
      if (num) validNumbers.push('62' + num);
    }

    const payload = buildPayload({
      phones          : validNumbers,
      nama,
      selectedPlan,
      selectedDuration,
      voucherDiscount,
      activeVoucher,
      finalAmount     : final,
      answers,
    });

    // Generate subs_id sebelum kirim ke register
    const phoneDigits  = (payload.primary_phone || '').replace(/\D/g, '');
    const submittedAt  = (payload.submitted_at  || new Date().toISOString()).replace(/[^0-9]/g, '');
    const payloadFinal = { ...payload, subs_id: `${phoneDigits}_${submittedAt}` };

    // Open a blank tab synchronously — still inside the click's user
    // gesture — then point it at WhatsApp once the number is confirmed
    // available. Opening it AFTER the awaited fetch below gets blocked by
    // most browsers' popup blockers (Safari in particular).
    const waWindow = window.open('', '_blank');
    waWindowRef.current = waWindow;

    setStep('checking');

    /* register-request-otp only checks whether the phone is already
     * registered and responds { status: "ok", next_step: "open_whatsapp",
     * whatsapp_prefilled_text: "Register OTP" } — it does not push an OTP
     * itself. The OTP is only generated once the user actually sends that
     * pre-filled message from their own WhatsApp (required by WhatsApp
     * Business API's messaging rules). So on success we (1) open WhatsApp
     * with that message, then (2) move the panel to the OTP-entry step —
     * the response is a "number is available, go ahead" signal, not a
     * "code delivered" one.
     */
    let otpReqData: any = {};
    try {
      const res = await fetch(REGISTER_REQUEST_OTP_URL, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ phone_number: payloadFinal.primary_phone }),
      });
      otpReqData = await res.json().catch(() => ({}));
    } catch {
      if (waWindow) waWindow.close();
      setStep('error');
      setErrorMsg('Gagal terhubung ke server. Coba lagi beberapa saat.');
      return;
    }

    if (otpReqData?.status !== 'ok') {
      if (waWindow) waWindow.close();
      setStep('error');
      setErrorMsg(
        otpReqData?.message ||
        'Nomor WhatsApp ini sudah terdaftar di MIRA. Gunakan nomor lain atau hubungi support.'
      );
      return;
    }

    const waLink = buildRegisterWhatsAppLink(REGISTER_OTP_TRIGGER_TEXT);
    if (waWindow) waWindow.location.href = waLink;
    else window.open(waLink, '_blank'); // popup was blocked — try once more anyway

    setSavedPayload(payloadFinal);
    setOtp(['', '', '', '']);
    setStep('awaiting_otp');
    setTimeout(() => otpRefs[0].current?.focus(), 60);
  };

  // ── STEP 2: Verifikasi OTP, lalu buat akun ──────────────────────
  const verifyOtpAndRegister = async (code: string) => {
    if (code.length < 4 || !savedPayload) {
      setErrorMsg('Masukkan 4 digit kode OTP.');
      return;
    }
    setErrorMsg('');
    setStep('verifying');

    // STRICT: only data.status === 'success' counts as verified. n8n
    // always answers HTTP 200 for both success and failure here, so
    // response.ok on its own is meaningless.
    let verifyData: any = {};
    try {
      const res = await fetch(VERIFY_OTP_URL, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ phone_number: savedPayload.primary_phone, otp: code }),
      });
      const raw = await res.text();
      try { verifyData = raw ? JSON.parse(raw) : {}; } catch { verifyData = {}; }
    } catch {
      setErrorMsg('Verifikasi gagal. Coba lagi.');
      setOtp(['', '', '', '']);
      setStep('awaiting_otp');
      otpRefs[0].current?.focus();
      return;
    }

    if (verifyData?.status !== 'success') {
      setErrorMsg(verifyData?.message || 'Kode OTP salah atau sudah kadaluarsa.');
      setOtp(['', '', '', '']);
      setStep('awaiting_otp');
      otpRefs[0].current?.focus();
      return;
    }

    // OTP verified — now actually create the account.
    let regData: any = {};
    try {
      const regRes = await fetch(REGISTER_URL, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(savedPayload),
      });
      regData = await regRes.json().catch(() => ({}));
    } catch {
      setStep('error');
      setErrorMsg('OTP terverifikasi, tapi gagal menyimpan pendaftaran. Coba lagi.');
      return;
    }

    if (
      regData?.registered === true ||
      regData?.status === 'error' ||
      regData?.status === 'already_registered' ||
      regData?.error   === 'already_registered'
    ) {
      setStep('error');
      setErrorMsg(
        regData?.message ||
        'Nomor WhatsApp ini sudah terdaftar di MIRA. Gunakan nomor lain atau hubungi support.'
      );
      return;
    }

    setStep('verified');
  };

  const handleOtpChange = (i: number, value: string) => {
    const c = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = c;
    setOtp(next);
    if (errorMsg) setErrorMsg('');
    if (c && i < 3) otpRefs[i + 1].current?.focus();
    if (c && i === 3 && next.every((d) => d !== '')) {
      verifyOtpAndRegister(next.join(''));
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs[i - 1].current?.focus();
  };

  // Reopen WhatsApp with the same pre-filled trigger message — a fresh OTP
  // is only generated server-side once that message is actually sent, so
  // resend does not call the backend again.
  const resendOtp = () => {
    setOtp(['', '', '', '']);
    setErrorMsg('');
    window.open(buildRegisterWhatsAppLink(REGISTER_OTP_TRIGGER_TEXT), '_blank');
    otpRefs[0].current?.focus();
  };

  const changeNumber = () => {
    setStep('idle');
    setSavedPayload(null);
    setOtp(['', '', '', '']);
    setErrorMsg('');
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 6) return phone;
    return `+${phone.slice(0, 4)}${'•'.repeat(Math.max(phone.length - 6, 4))}${phone.slice(-2)}`;
  };

  // ── STEP 3: Bayar sekarang ───────────────────────────────────────
  const handleBayar = async () => {
    setErrorMsg('');
    setStep('paying');

    let payData: any = {};
    try {
      const payRes = await fetch(PAYMENT_URL, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(savedPayload),
      });
      payData = await payRes.json().catch(() => ({}));
    } catch {
      setStep('error');
      setErrorMsg('Gagal terhubung ke server pembayaran. Coba lagi beberapa saat.');
      return;
    }

    const redirectUrl =
      payData?.redirect_url ||
      payData?.data?.redirect_url;

    if (redirectUrl) {
      // Insert affiliate referral record jika pakai kode affiliate
      if (affiliateReferrerPhone && savedPayload?.primary_phone) {
        try {
          await fetch(`${SUPA_URL}/rest/v1/affiliate_referrals`, {
            method: 'POST',
            headers: {
              'apikey'       : SUPA_ANON,
              'Authorization': 'Bearer ' + SUPA_ANON,
              'Content-Type' : 'application/json',
              'Prefer'       : 'return=minimal',
            },
            body: JSON.stringify({
              referrer_phone    : affiliateReferrerPhone,
              referee_phone     : savedPayload.primary_phone,
              referee_name      : savedPayload.name || answers.user_name || '',
              affiliate_code    : activeVoucher,
              plan_name         : savedPayload.plan_name || selectedPlan,
              transaction_value : final,
              commission_amount : Math.round(final * 0.1),
              status            : 'pending',
              created_at        : new Date().toISOString(),
            }),
          });
        } catch {}
      }
      setStep('done');
      window.location.href = redirectUrl;
    } else {
      setStep('error');
      setErrorMsg('Gagal mendapatkan link pembayaran. Silakan coba lagi atau hubungi support.');
    }
  };

  // ── Labels & helpers ─────────────────────────────────────────────
  const labels = [
    'Kamu (Pengguna Utama)',
    'Anggota 2',
    'Anggota 3 (opsional)',
    'Anggota 4 (opsional)',
    'Anggota 5 (opsional)',
  ];

  const getSubLabel = () => {
    if (plan.members === 1) return 'Masukkan nomor WhatsApp kamu';
    if (plan.members === 2) return 'Masukkan nomor WhatsApp kamu & pasangan / teman';
    return `Masukkan nomor WhatsApp untuk ${plan.members} anggota (minimal 2)`;
  };

  const showOtpPanel = step === 'awaiting_otp' || step === 'verifying';
  const isVerified   = step === 'verified';
  const isPaying     = step === 'paying' || step === 'done';
  const isChecking   = step === 'checking';
  const isBusy       = isChecking || isPaying;
  const inputLocked  = isVerified || isBusy || showOtpPanel;

  // Label & handler tombol utama (panel nomor WA)
  const btnLabel =
    isChecking  ? 'Memeriksa nomor…'
    : isVerified  ? 'Bayar Sekarang 🔒'
    : isPaying    ? (step === 'done' ? 'Mengalihkan ke pembayaran…' : 'Memproses pembayaran…')
    : 'Daftar & Verifikasi Nomor';

  const handleBtn = isVerified ? handleBayar : handleDaftar;

  return (
    <div id="wa-panel" className="show">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="12" fill="#25D366"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M24 10C16.268 10 10 16.268 10 24C10 26.726 10.762 29.28 12.09 31.462L10.08 38L16.8 36.022C18.906 37.22 21.372 37.91 24 37.91C31.732 37.91 38 31.642 38 23.91C38 16.178 31.732 10 24 10ZM24 35.456C21.6 35.456 19.366 34.764 17.478 33.558L13.098 34.82L14.378 30.548C13.038 28.594 12.252 26.226 12.252 23.664C12.252 17.416 17.394 12.274 23.642 12.274C29.89 12.274 35.032 17.416 35.032 23.664C35.032 29.912 30.248 35.456 24 35.456ZM29.89 26.564C29.554 26.396 27.836 25.552 27.528 25.44C27.22 25.328 26.996 25.272 26.772 25.608C26.548 25.944 25.872 26.732 25.676 26.956C25.48 27.18 25.284 27.208 24.948 27.04C24.612 26.872 23.52 26.508 22.232 25.356C21.222 24.458 20.546 23.348 20.35 23.012C20.154 22.676 20.33 22.494 20.498 22.328C20.652 22.176 20.834 21.932 21.002 21.736C21.17 21.54 21.226 21.4 21.338 21.176C21.45 20.952 21.394 20.756 21.31 20.588C21.226 20.42 20.55 18.7 20.27 18.02C20.004 17.36 19.726 17.444 19.52 17.432C19.324 17.42 19.1 17.42 18.876 17.42C18.652 17.42 18.288 17.504 17.98 17.84C17.672 18.176 16.8 18.992 16.8 20.712C16.8 22.432 18.008 24.096 18.176 24.32C18.344 24.544 20.54 27.936 23.912 29.432C24.718 29.78 25.342 29.988 25.83 30.14C26.636 30.392 27.374 30.36 27.96 30.276C28.608 30.18 29.974 29.46 30.254 28.672C30.534 27.884 30.534 27.204 30.45 27.04C30.366 26.876 30.142 26.732 29.806 26.564H29.89Z" fill="white"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
          {showOtpPanel ? 'Verifikasi Kode OTP' : 'Daftarkan Nomor WhatsApp'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
          {showOtpPanel
            ? `Kode dikirim ke WhatsApp ${savedPayload ? maskPhone(savedPayload.primary_phone) : ''}`
            : getSubLabel()}
        </p>
      </div>

      {/* Error message — shared across both panels */}
      {errorMsg && (
        <div style={{
          background  : '#FEE2E2',
          border      : '1px solid #FECACA',
          borderRadius: '10px',
          padding     : '11px 14px',
          fontSize    : '0.83rem',
          color       : '#DC2626',
          marginBottom: '14px',
          display     : 'flex',
          gap         : '8px',
          alignItems  : 'flex-start',
        }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {showOtpPanel ? (
        <>
          {/* ── OTP entry ── */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={otpRefs[i]}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={step === 'verifying'}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                style={{
                  width: 56, height: 64,
                  border: `1.5px solid ${digit ? '#2D4BFF' : '#E2E8F0'}`,
                  borderRadius: 14, textAlign: 'center',
                  fontSize: '1.5rem', fontWeight: 700,
                  color: '#0F172A', outline: 'none',
                  background: digit ? '#E9EDFF' : '#F8FAFC',
                  transition: 'all .15s',
                  opacity: step === 'verifying' ? 0.6 : 1,
                }}
              />
            ))}
          </div>

          <button
            className="btn btn-full btn-lg"
            onClick={() => verifyOtpAndRegister(otp.join(''))}
            disabled={step === 'verifying' || otp.some((d) => !d)}
            style={{
              opacity: step === 'verifying' ? 0.75 : 1,
              cursor : step === 'verifying' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {step === 'verifying' && (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'wa-spin 0.85s linear infinite', flexShrink: 0 }}>
                <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.4)" strokeWidth="2.2"/>
                <path d="M9 2 A7 7 0 0 1 16 9" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            )}
            {step === 'verifying' ? 'Memverifikasi…' : 'Verifikasi & Daftar'}
          </button>

          {step !== 'verifying' && (
            <div style={{ textAlign: 'center', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={resendOtp}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: '#2D4BFF', fontWeight: 600 }}
              >
                Kirim ulang kode
              </button>
              <button
                onClick={changeNumber}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: '#94A3B8', textDecoration: 'underline' }}
              >
                ← Ubah nomor WhatsApp
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Input fields */}
          <div id="wa-fields">
            {/* Nama ditampilkan sebagai info, bukan input (sudah dari assessment) */}
            {nama && (
              <div style={{
                background : '#F8FAFF',
                border     : '1.5px solid #DBEAFE',
                borderRadius: '10px',
                padding    : '10px 14px',
                marginBottom: '12px',
                fontSize   : '0.88rem',
                color      : '#334155',
                display    : 'flex',
                alignItems : 'center',
                gap        : '8px',
              }}>
                <span>👤</span>
                <span>Halo, <strong>{nama}</strong>! Masukkan nomor WA yang akan didaftarkan.</span>
              </div>
            )}
            {waNumbers.map((num, i) => {
              const isRequired = i < (plan.members === 5 ? 2 : plan.members);
              return (
                <div key={i} className="wa-field">
                  <label>
                    {labels[i]}
                    {isRequired && <span style={{ color: 'var(--error)' }}> *</span>}
                  </label>
                  {i === 0 && (
                    <div className="wa-hint">Akun utama yang menerima akses MIRA</div>
                  )}
                  <div
                    className="wa-input-wrap"
                    id={`wa-input-${i}`}
                    style={isVerified && num ? { borderColor: '#16A34A', background: '#F0FDF4' } : {}}
                  >
                    <span className="wa-prefix">🇮🇩 +62</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="81234567890"
                      value={num}
                      onChange={(e) => handleNumberChange(i, e.target.value)}
                      required={isRequired}
                      disabled={inputLocked}
                    />
                    {/* Centang hijau saat verified */}
                    {isVerified && num && (
                      <span style={{
                        marginLeft: '8px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <circle cx="9" cy="9" r="9" fill="#16A34A"/>
                          <path d="M5 9.5L7.5 12L13 6.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Badge verified */}
          {isVerified && (
            <div style={{
              background  : '#F0FDF4',
              border      : '1px solid #BBF7D0',
              borderRadius: '10px',
              padding     : '10px 14px',
              fontSize    : '0.82rem',
              color       : '#15803D',
              marginTop   : '4px',
              marginBottom: '12px',
              display     : 'flex',
              gap         : '8px',
              alignItems  : 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="8" fill="#16A34A"/>
                <path d="M4.5 8.5L6.5 10.5L11.5 5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Nomor terverifikasi! Klik <strong style={{ marginLeft: '3px' }}>Bayar Sekarang</strong> untuk melanjutkan pembayaran.
            </div>
          )}

          {/* Info box (hanya saat idle / checking / error) */}
          {!isVerified && !isPaying && (
            <div style={{ background: 'var(--blue-ultra)', borderRadius: '10px', padding: '12px 14px', fontSize: '0.82rem', color: '#334155', marginTop: '4px', marginBottom: '20px' }}>
              ℹ️ MIRA akan mengirim kode OTP via WhatsApp untuk verifikasi nomor sebelum akun dibuat.
            </div>
          )}

          {/* Progress bar saat loading */}
          {isBusy && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
              {['checking', 'paying', 'done'].map((s) => {
                const steps: Step[] = ['checking', 'paying', 'done'];
                const currentIdx   = steps.indexOf(step);
                const active       = steps.indexOf(s as Step) <= currentIdx;
                return (
                  <div
                    key={s}
                    style={{
                      height      : '3px',
                      flex        : 1,
                      borderRadius: '99px',
                      background  : active ? 'var(--gradient)' : '#E2E8F0',
                      transition  : 'background 0.4s ease',
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Tombol utama */}
          <button
            className="btn btn-full btn-lg"
            onClick={handleBtn}
            disabled={isBusy}
            style={{
              opacity   : isBusy ? 0.75 : 1,
              cursor    : isBusy ? 'not-allowed' : 'pointer',
              display   : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap       : '8px',
              background: isVerified ? 'linear-gradient(135deg, #16A34A, #15803D)' : undefined,
            }}
          >
            {isBusy && (
              <svg
                width="18" height="18" viewBox="0 0 18 18" fill="none"
                style={{ animation: 'wa-spin 0.85s linear infinite', flexShrink: 0 }}
              >
                <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.4)" strokeWidth="2.2"/>
                <path d="M9 2 A7 7 0 0 1 16 9" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            )}
            {btnLabel}
          </button>

          {/* Back link */}
          {!isBusy && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: '#94A3B8', textDecoration: 'underline' }}
                onClick={onBack}
              >
                ← Kembali ke pilihan paket
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
