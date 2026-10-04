/**
 * AccountPanel — last signup step: create the MIRA login, then pay.
 * Replaces WAPanel while WHATSAPP_AUTH_ENABLED is off.
 *
 *   1. Sign up / sign in with Google or email + password (Supabase Auth).
 *      Google leaves the page, so the whole signup (answers, plan, voucher)
 *      is saved first and restored when /auth/callback brings the user back.
 *   2. auth-account `start_signup` reserves the account ID (see that
 *      function for why web accounts get a "999…" primary_phone).
 *   3. Same n8n flow as the WhatsApp signup: register-mira (draft) →
 *      create-transaction (Midtrans) or, for a 100% voucher, the
 *      midtrans-notification settlement that activates the account.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { plans } from './pricingData';
import { buildPayload } from './buildPayload';
import { GoogleButton, useGoogleEnabled } from '../GoogleButton';
import { MiraIcon } from '../icons/MiraIcon';
import { SUPA_ANON, SUPA_URL, startGoogleAuth } from '../../lib/google-auth';
import {
  authAccount, clearAuthSession, clearSignupDraft, emailSignIn, emailSignUp, getAuthSession,
  getFreshAuthToken, resendConfirmation, saveMiraSession, saveSignupDraft, setAuthSession,
} from '../../lib/auth';
import type { AuthSession } from '../../lib/auth';

const N8N = 'https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook';
const REGISTER_URL              = `${N8N}/register-mira`;
const PAYMENT_URL               = `${N8N}/create-transaction`;
const MIDTRANS_NOTIFICATION_URL = `${N8N}/midtrans-notification`;

const CSS = `
  .acp-head { text-align: center; margin-bottom: 18px; }
  .acp-head h2 { font-family: 'Sora', sans-serif; font-size: 1.2rem; font-weight: 800; color: var(--text-dark); margin: 10px 0 4px; }
  .acp-head p { font-size: .86rem; color: #64748B; margin: 0; line-height: 1.55; }
  .acp-plan { display: flex; align-items: center; gap: 10px; background: #F8FAFF; border: 1.5px solid #DBEAFE; border-radius: 14px; padding: 10px 12px; margin-bottom: 18px; }
  .acp-plan-name { font-weight: 700; font-size: .88rem; color: var(--text-dark); }
  .acp-plan-sub { font-size: .78rem; color: #64748B; }
  .acp-plan-price { margin-left: auto; font-family: 'Sora', sans-serif; font-weight: 800; font-size: .95rem; color: var(--blue); white-space: nowrap; }
  .acp-or { display: flex; align-items: center; gap: 10px; margin: 16px 0 14px; font-size: .76rem; color: #94A3B8; }
  .acp-or::before, .acp-or::after { content: ''; flex: 1; height: 1px; background: #E2E8F0; }
  .acp-field { margin-bottom: 10px; }
  .acp-field label { display: block; font-size: .78rem; font-weight: 600; color: #475569; margin-bottom: 5px; }
  .acp-input { width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1.5px solid #E2E8F0; border-radius: 12px; font-size: 16px; font-family: 'DM Sans', sans-serif; color: #0F172A; background: #FAFBFF; outline: none; transition: border-color .2s; }
  .acp-input:focus { border-color: #2D4BFF; background: #fff; }
  .acp-pw { position: relative; }
  .acp-pw button { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748B; font-size: .78rem; font-weight: 600; cursor: pointer; padding: 6px; }
  .acp-err { display: flex; gap: 8px; align-items: center; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 9px 12px; font-size: .82rem; color: #B91C1C; margin-bottom: 12px; line-height: 1.45; }
  .acp-note { display: flex; gap: 10px; align-items: center; background: var(--blue-ultra); border-radius: 12px; padding: 10px 12px; font-size: .8rem; color: #334155; margin: 12px 0; line-height: 1.5; }
  .acp-link { background: none; border: none; padding: 0; cursor: pointer; font-size: .82rem; color: #2D4BFF; font-weight: 600; font-family: 'DM Sans', sans-serif; }
  .acp-muted { background: none; border: none; padding: 0; cursor: pointer; font-size: .82rem; color: #94A3B8; text-decoration: underline; font-family: 'DM Sans', sans-serif; }
  .acp-who { display: flex; align-items: center; gap: 12px; border: 1.5px solid #BBF7D0; background: #F0FDF4; border-radius: 14px; padding: 11px 12px; margin-bottom: 14px; }
  .acp-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .acp-initial { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#2D4BFF,#22D3EE); color: #fff; font-family: 'Sora', sans-serif; font-weight: 700; }
  .acp-who-main { min-width: 0; flex: 1; }
  .acp-who-name { font-weight: 700; font-size: .88rem; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .acp-who-mail { font-size: .78rem; color: #15803D; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .acp-center { text-align: center; margin-top: 12px; display: flex; flex-direction: column; gap: 10px; align-items: center; }
  @keyframes acp-spin { to { transform: rotate(360deg); } }
  .acp-spin { animation: acp-spin .85s linear infinite; flex-shrink: 0; }
`;

interface AccountPanelProps {
  selectedPlan: string;
  selectedDuration: string;
  voucherDiscount: number;
  activeVoucher: string;
  affiliateReferrerPhone: string;
  answers: Record<string, any>;
  onBack: () => void;
  /** Modal is open — Google's button is only rendered while visible. */
  active?: boolean;
}

type Mode = 'signup' | 'login';

const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="acp-spin">
    <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.4)" strokeWidth="2.2" />
    <path d="M9 2 A7 7 0 0 1 16 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AccountPanel(props: AccountPanelProps) {
  const { selectedPlan, selectedDuration, voucherDiscount, activeVoucher, affiliateReferrerPhone, answers, onBack, active = true } = props;
  const navigate = useNavigate();
  const googleEnabled = useGoogleEnabled();

  const plan     = plans[selectedPlan];
  const duration = plan.durations.find((d) => d.id === selectedDuration);
  const price    = duration?.price || 0;
  const final    = price - Math.round((price * voucherDiscount) / 100);
  const isFree   = final === 0;
  const nama     = answers.user_name || '';

  const [session, setSession]   = useState<AuthSession | null>(() => getAuthSession());
  const [checking, setChecking] = useState(() => !!getAuthSession());
  const [existing, setExisting] = useState<{ phone: string; user: any } | null>(null);
  const [mode, setMode]         = useState<Mode>('signup');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [busy, setBusy]         = useState<'' | 'auth' | 'pay'>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmFor, setConfirmFor] = useState('');      // waiting for the email confirmation link
  const [resent, setResent]     = useState(false);
  const [canResend, setCanResend] = useState(false);     // sign-in hit "email not confirmed"
  const [avatarFailed, setAvatarFailed] = useState(false);

  const draft = () => ({ answers, selectedPlan, selectedDuration, voucherDiscount, activeVoucher, affiliateReferrerPhone });

  /** Does this login already own a MIRA account? */
  const check = async (s: AuthSession) => {
    setChecking(true);
    const token = await getFreshAuthToken();
    if (!token) { clearAuthSession(); setSession(null); setChecking(false); return; }
    const r = await authAccount({ op: 'resolve', access_token: token });
    if (r.status === 401) { clearAuthSession(); setSession(null); }
    else if (r.data?.status === 'linked') setExisting({ phone: r.data.phone, user: r.data.user });
    else setSession({ ...s, name: s.name || r.data?.name || null, avatar_url: s.avatar_url || r.data?.avatar_url || null });
    setChecking(false);
  };

  useEffect(() => {
    const s = getAuthSession();
    if (s) void check(s);
  }, []);

  const signedIn = (s: AuthSession) => {
    setAuthSession(s);
    setSession(s);
    setErrorMsg('');
    setPassword('');
    void check(s);
  };

  const handleGoogle = () => {
    saveSignupDraft(draft());
    startGoogleAuth('signup');
  };

  const handleEmail = async () => {
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setErrorMsg('Format email-nya belum benar.'); return; }
    if (password.length < 6) { setErrorMsg('Password minimal 6 karakter.'); return; }
    setErrorMsg(''); setCanResend(false); setBusy('auth');

    if (mode === 'signup') {
      // Saved first: the confirmation link may open in a new tab.
      saveSignupDraft(draft());
      const r = await emailSignUp(em, password, nama);
      setBusy('');
      if (r.ok) { signedIn(r.session); return; }
      if (r.needsConfirm) { setConfirmFor(em); setResent(false); return; }
      if (r.exists) setMode('login');
      setErrorMsg(r.error);
      return;
    }

    const r = await emailSignIn(em, password);
    setBusy('');
    if (r.ok) { signedIn(r.session); return; }
    if (!r.needsConfirm) { setErrorMsg(r.error); setCanResend(!!r.unconfirmed); }
  };

  const handleResend = async (to: string) => {
    saveSignupDraft(draft());
    const err = await resendConfirmation(to);
    if (err) setErrorMsg(err);
    else { setResent(true); setErrorMsg(''); }
  };

  const switchAccount = () => {
    clearAuthSession();
    setSession(null);
    setExisting(null);
    setErrorMsg('');
    setAvatarFailed(false);
  };

  const openDashboard = (phone: string, user: unknown) => {
    saveMiraSession(phone, user);
    clearSignupDraft();
    navigate('/dashboard');
  };

  /* ── Create the account + pay ── */
  const handlePay = async () => {
    setErrorMsg(''); setBusy('pay');
    const fail = (msg: string) => { setBusy(''); setErrorMsg(msg); };

    const token = await getFreshAuthToken();
    if (!token) { switchAccount(); fail('Sesi login sudah habis. Masuk lagi ya.'); return; }

    const start = await authAccount({ op: 'start_signup', access_token: token, name: nama });
    if (start.data?.status === 'linked') { setBusy(''); setExisting({ phone: start.data.phone, user: start.data.user }); return; }
    if (start.data?.status !== 'ready' || !start.data.primary_phone) {
      fail(start.data?.message || 'Gagal menyiapkan akun. Coba lagi ya.');
      return;
    }
    const phone = String(start.data.primary_phone);

    const payload = buildPayload({
      phones: [phone],
      nama: nama || session?.name || '',
      selectedPlan, selectedDuration, voucherDiscount, activeVoucher,
      finalAmount: final,
      answers,
    });
    const submittedAt = (payload.submitted_at || new Date().toISOString()).replace(/[^0-9]/g, '');
    const savedPayload = { ...payload, subs_id: `${phone}_${submittedAt}` };

    let reg: any = {};
    try {
      const res = await fetch(REGISTER_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(savedPayload),
      });
      reg = await res.json().catch(() => ({}));
    } catch {
      fail('Gagal terhubung ke server. Coba lagi beberapa saat.');
      return;
    }
    if (reg?.registered === true || reg?.status === 'error' || reg?.status === 'already_registered' || reg?.error === 'already_registered') {
      fail(reg?.message || 'Akun ini sudah terdaftar di MIRA. Masuk aja ya.');
      return;
    }

    if (isFree) {
      // Same activation path as the WhatsApp signup's free voucher.
      try {
        const res = await fetch(MIDTRANS_NOTIFICATION_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: savedPayload.subs_id, transaction_status: 'settlement' }),
        });
        if (!res.ok) throw new Error('activation failed');
      } catch {
        fail('Gagal mengaktifkan akun gratis. Coba lagi atau hubungi support.');
        return;
      }
      // n8n creates the users row; log straight in once it's there.
      for (let i = 0; i < 6; i++) {
        const t = await getFreshAuthToken();
        const r = t ? await authAccount({ op: 'resolve', access_token: t }) : null;
        if (r?.data?.status === 'linked') { saveMiraSession(r.data.phone, r.data.user); break; }
        await sleep(1500);
      }
      clearSignupDraft();
      window.location.href = '/payment-success';
      return;
    }

    let pay: any = {};
    try {
      const res = await fetch(PAYMENT_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(savedPayload),
      });
      pay = await res.json().catch(() => ({}));
    } catch {
      fail('Gagal terhubung ke server pembayaran. Coba lagi beberapa saat.');
      return;
    }
    const redirectUrl = pay?.redirect_url || pay?.data?.redirect_url;
    if (!redirectUrl) { fail('Gagal mendapatkan link pembayaran. Silakan coba lagi atau hubungi support.'); return; }

    if (affiliateReferrerPhone) {
      try {
        await fetch(`${SUPA_URL}/rest/v1/affiliate_referrals`, {
          method: 'POST',
          headers: { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({
            referrer_phone: affiliateReferrerPhone, referee_phone: phone,
            referee_name: savedPayload.full_name || nama, affiliate_code: activeVoucher,
            plan_name: savedPayload.plan_name || selectedPlan, transaction_value: final,
            commission_amount: Math.round(final * 0.1), status: 'pending', created_at: new Date().toISOString(),
          }),
        });
      } catch {}
    }
    clearSignupDraft();
    window.location.href = redirectUrl;
  };

  const displayName = session?.name || nama || session?.email || 'Akun kamu';

  return (
    <div id="account-panel">
      <style>{CSS}</style>

      <div className="acp-head">
        <div style={{ display: 'flex', justifyContent: 'center' }}><MiraIcon name="lock" size={52} /></div>
        <h2>{existing ? 'Kamu sudah punya akun' : confirmFor ? 'Cek email kamu' : 'Buat Akun MIRA'}</h2>
        <p>
          {existing
            ? 'Login ini sudah terhubung ke akun MIRA yang aktif.'
            : confirmFor
              ? <>Link konfirmasi dikirim ke <strong>{confirmFor}</strong>. Klik link-nya, nanti kamu balik ke sini buat lanjut.</>
              : <>Satu langkah lagi{nama ? <>, <strong>{nama}</strong></> : ''}! Akun ini yang kamu pakai buat masuk ke MIRA.</>}
        </p>
      </div>

      {!existing && (
        <div className="acp-plan">
          <MiraIcon name={isFree ? 'sparkle' : 'gem'} size={36} />
          <div>
            <div className="acp-plan-name">Paket {plan.name}</div>
            <div className="acp-plan-sub">{duration?.label?.replace(/[^\p{L}\p{N}\s.,/+-]/gu, '').trim()}{activeVoucher ? ` · voucher ${activeVoucher}` : ''}</div>
          </div>
          <div className="acp-plan-price">{isFree ? 'Gratis' : `Rp${final.toLocaleString('id-ID')}`}</div>
        </div>
      )}

      {errorMsg && (
        <div className="acp-err">
          <MiraIcon name="alert" size={24} tile={false} />
          <span>
            {errorMsg}{' '}
            {canResend && <button className="acp-link" onClick={() => handleResend(email.trim().toLowerCase())}>Kirim ulang link</button>}
          </span>
        </div>
      )}

      {checking ? (
        <div className="acp-center" style={{ color: '#64748B', fontSize: '.85rem', padding: '18px 0' }}>Mengecek akun…</div>
      ) : existing ? (
        /* ── This login already owns an active account ── */
        <>
          <button className="btn btn-full btn-lg" onClick={() => openDashboard(existing.phone, existing.user)}>Buka Dashboard →</button>
          <div className="acp-center">
            <button className="acp-muted" onClick={switchAccount}>Daftar pakai akun lain</button>
          </div>
        </>
      ) : confirmFor ? (
        /* ── Waiting for the email confirmation link ── */
        <>
          <div className="acp-note">
            <MiraIcon name="mail" size={34} />
            <span>Nggak ketemu? Cek folder spam / promosi. Setelah konfirmasi, kamu juga bisa langsung masuk di sini pakai email & password tadi.</span>
          </div>
          <button className="btn btn-full btn-lg" onClick={() => { setConfirmFor(''); setMode('login'); setEmail(confirmFor); }}>
            Sudah konfirmasi? Masuk
          </button>
          <div className="acp-center">
            <button className="acp-link" onClick={() => handleResend(confirmFor)} disabled={resent}>
              {resent ? 'Link baru sudah dikirim' : 'Kirim ulang link'}
            </button>
            <button className="acp-muted" onClick={() => { setConfirmFor(''); setMode('signup'); }}>Ganti email</button>
          </div>
        </>
      ) : session ? (
        /* ── Signed in: confirm the account, then pay ── */
        <>
          <div className="acp-who">
            {session.avatar_url && !avatarFailed
              ? <img className="acp-avatar" src={session.avatar_url} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} />
              : <div className="acp-initial">{displayName.trim().charAt(0).toUpperCase()}</div>}
            <div className="acp-who-main">
              <div className="acp-who-name">{displayName}</div>
              <div className="acp-who-mail">{session.provider === 'google' ? 'Google · ' : ''}{session.email}</div>
            </div>
            <MiraIcon name="check-badge" size={28} tile={false} />
          </div>

          {plan.members > 1 && (
            <div className="acp-note">
              <MiraIcon name="family" size={34} />
              <span>Akun yang dibuat sekarang adalah akun utama. Anggota lain belum bisa ditambahkan lewat web untuk saat ini.</span>
            </div>
          )}

          <button
            className="btn btn-full btn-lg"
            onClick={handlePay}
            disabled={busy === 'pay'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: busy === 'pay' ? 0.75 : 1, background: 'linear-gradient(135deg, #16A34A, #15803D)' }}
          >
            {busy === 'pay' && <Spinner />}
            {busy === 'pay' ? (isFree ? 'Mengaktifkan akun…' : 'Menyiapkan pembayaran…') : (isFree ? 'Aktifkan Gratis' : 'Bayar Sekarang')}
          </button>
          <div className="acp-center">
            <button className="acp-muted" onClick={switchAccount} disabled={busy === 'pay'}>Pakai akun lain</button>
          </div>
        </>
      ) : (
        /* ── Not signed in: Google or email + password ── */
        <>
          {googleEnabled && active && (
            <>
              <GoogleButton
                label={mode === 'signup' ? 'Daftar dengan Google' : 'Masuk dengan Google'}
                mode={mode === 'signup' ? 'signup' : 'signin'}
                onClick={handleGoogle}
                onSession={signedIn}
                onError={setErrorMsg}
              />
              <div className="acp-or">atau pakai email</div>
            </>
          )}
          <div className="acp-field">
            <label htmlFor="acp-email">Email</label>
            <input id="acp-email" className="acp-input" type="email" autoComplete="email" placeholder="nama@email.com"
              value={email} onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }} />
          </div>
          <div className="acp-field">
            <label htmlFor="acp-pw">Password</label>
            <div className="acp-pw">
              <input id="acp-pw" className="acp-input" type={showPw ? 'text' : 'password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder={mode === 'signup' ? 'Minimal 6 karakter' : 'Password kamu'}
                value={password} onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleEmail()} style={{ paddingRight: 64 }} />
              <button type="button" onClick={() => setShowPw((v) => !v)}>{showPw ? 'Sembunyi' : 'Lihat'}</button>
            </div>
          </div>
          <button
            className="btn btn-full btn-lg"
            onClick={handleEmail}
            disabled={busy === 'auth'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6, opacity: busy === 'auth' ? 0.75 : 1 }}
          >
            {busy === 'auth' && <Spinner />}
            {mode === 'signup' ? 'Buat Akun' : 'Masuk'}
          </button>
          <div className="acp-center">
            {mode === 'signup'
              ? <span style={{ fontSize: '.82rem', color: '#64748B' }}>Sudah punya akun? <button className="acp-link" onClick={() => { setMode('login'); setErrorMsg(''); }}>Masuk</button></span>
              : <span style={{ fontSize: '.82rem', color: '#64748B' }}>Belum punya akun? <button className="acp-link" onClick={() => { setMode('signup'); setErrorMsg(''); }}>Daftar</button></span>}
          </div>
        </>
      )}

      {!busy && !existing && (
        <div className="acp-center" style={{ marginTop: 16 }}>
          <button className="acp-muted" onClick={onBack}>← Kembali ke pilihan paket</button>
        </div>
      )}
    </div>
  );
}
