/**
 * Langganan — status, renew / upgrade, voucher, pay.
 * auth-account `start_renewal` prices the order server-side, files it in
 * users_draft and returns the Midtrans link; n8n's midtrans-notification
 * then extends valid_to from max(now, valid_to), so days left never vanish.
 */
import { useEffect, useState } from 'react';
import { MiraIcon } from '../../components/icons/MiraIcon';
import { plans, TRIAL_DURATION, TRIAL_VOUCHER } from '../../components/modal/pricingData';
import { authAccount, getAuthSession, getFreshAuthToken } from '../../lib/auth';
import { RENEWAL_MARKER, useSubscription } from '../../lib/subscription';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const HR = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };

const DURATIONS = plans.personal.durations.filter((d) => d.id !== TRIAL_DURATION);
const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID');

const CSS = `
  .bil-wrap { padding: 28px 32px 80px; max-width: 680px; margin: 0 auto; font-family: 'DM Sans', sans-serif; }
  @media (max-width: 900px) { .bil-wrap { padding: 20px 16px 80px; } }
  .bil-card { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px; padding: 20px; margin-bottom: 16px; }
  .bil-status { display: flex; gap: 14px; align-items: center; }
  .bil-chip { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; letter-spacing: .3px; }
  .bil-chip.ok { background: #DCFCE7; color: #166534; } .bil-chip.trial { background: #DBEAFE; color: #1E40AF; }
  .bil-chip.bad { background: #FEE2E2; color: #991B1B; }
  .bil-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 17px; color: #0F172A; margin: 4px 0 2px; }
  .bil-sub { font-size: 13px; color: #64748B; }
  .bil-bar { height: 6px; border-radius: 99px; background: #EEF2F7; margin-top: 16px; overflow: hidden; }
  .bil-bar > div { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #2563EB, #22D3EE); }
  .bil-h { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
  .bil-hint { font-size: 12.5px; color: #64748B; margin: 0 0 14px; line-height: 1.5; }
  .bil-opt { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 14px; border-radius: 14px;
    border: 1.5px solid #E5E7EB; background: #fff; cursor: pointer; margin-bottom: 10px; font-family: 'DM Sans', sans-serif; color: #0F172A; }
  .bil-opt.sel { border-color: #2563EB; background: #F5F8FF; box-shadow: 0 0 0 3px rgba(37,99,235,.08); }
  .bil-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #CBD5E1; flex-shrink: 0; position: relative; }
  .bil-opt.sel .bil-radio { border-color: #2563EB; }
  .bil-opt.sel .bil-radio::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: #2563EB; }
  .bil-opt-main { flex: 1; min-width: 0; }
  .bil-opt-name { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .bil-opt-per { font-size: 12px; color: #64748B; margin-top: 2px; }
  .bil-opt-price { font-family: 'Sora', sans-serif; font-weight: 800; font-size: 15px; white-space: nowrap; }
  .bil-badge { font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #DCFCE7; color: #166534; }
  .bil-vrow { display: flex; gap: 8px; }
  .bil-input { flex: 1; min-width: 0; padding: 11px 13px; border: 1.5px solid #E5E7EB; border-radius: 12px; font-size: 16px;
    font-family: 'DM Sans', sans-serif; text-transform: uppercase; background: #FAFBFF; color: #0F172A; outline: none; }
  .bil-input:focus { border-color: #2563EB; }
  .bil-btn2 { border: 1.5px solid #CBD5E1; background: #fff; color: #334155; border-radius: 12px; padding: 0 14px; font-weight: 600;
    font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .bil-msg { font-size: 12.5px; margin-top: 8px; display: flex; gap: 6px; align-items: center; }
  .bil-msg.ok { color: #15803D; } .bil-msg.err { color: #B91C1C; }
  .bil-sum { display: flex; justify-content: space-between; font-size: 13.5px; color: #475569; padding: 4px 0; }
  .bil-sum.total { font-weight: 800; color: #0F172A; font-size: 15px; border-top: 1px solid #F1F5F9; margin-top: 6px; padding-top: 10px; }
  .bil-pay { width: 100%; margin-top: 14px; border: 0; border-radius: 14px; padding: 15px; background: #2563EB; color: #fff;
    font-family: 'Sora', sans-serif; font-weight: 700; font-size: 15px; cursor: pointer; }
  .bil-pay:disabled { opacity: .7; cursor: wait; }
  .bil-note { display: flex; gap: 10px; align-items: flex-start; font-size: 12.5px; color: #64748B; line-height: 1.55; margin-top: 14px; }
  .bil-err { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 12px; padding: 10px 12px; font-size: 13px; margin-top: 12px; }
  .dark #mira-dash-layout .bil-card, .dark #mira-dash-layout .bil-opt { background: #1E293B; border-color: rgba(255,255,255,0.08); color: #F1F5F9; }
  .dark #mira-dash-layout .bil-opt.sel { background: rgba(37,99,235,.14); border-color: #3B82F6; }
  .dark #mira-dash-layout .bil-title, .dark #mira-dash-layout .bil-h, .dark #mira-dash-layout .bil-sum.total { color: #F1F5F9; }
  .dark #mira-dash-layout .bil-bar { background: rgba(255,255,255,.08); }
  .dark #mira-dash-layout .bil-input, .dark #mira-dash-layout .bil-btn2 { background: #0F172A; border-color: rgba(255,255,255,.12); color: #E2E8F0; }
  .dark #mira-dash-layout .bil-sum { color: #A3B0C2; }
  .dark #mira-dash-layout .bil-sum.total { border-top-color: rgba(255,255,255,.08); }
`;

export function DashboardBilling() {
  const sub = useSubscription();
  const [duration, setDuration] = useState('12');
  const [voucherInput, setVoucherInput] = useState('');
  const [voucher, setVoucher] = useState<{ code: string; pct: number } | null>(null);
  const [vMsg, setVMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (document.getElementById('mira-bil-css')) return;
    const s = document.createElement('style');
    s.id = 'mira-bil-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  const picked = DURATIONS.find((d) => d.id === duration) || DURATIONS[DURATIONS.length - 1];
  const discount = voucher ? Math.round((picked.price * voucher.pct) / 100) : 0;
  const total = picked.price - discount;

  const applyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    if (code === TRIAL_VOUCHER) { setVoucher(null); setVMsg({ ok: false, text: `${TRIAL_VOUCHER} khusus buat trial pertama.` }); return; }
    setChecking(true); setVMsg(null);
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent&limit=1`, { headers: HR });
      const rows = r.ok ? await r.json() : [];
      const pct = Number(rows?.[0]?.discount_percent || 0);
      if (!rows?.length || pct <= 0 || pct >= 100) { setVoucher(null); setVMsg({ ok: false, text: 'Kode voucher nggak valid atau sudah nggak aktif.' }); }
      else { setVoucher({ code, pct }); setVMsg({ ok: true, text: `Voucher ${code} dipakai — diskon ${pct}%.` }); }
    } catch {
      setVMsg({ ok: false, text: 'Gagal cek voucher. Coba lagi ya.' });
    }
    setChecking(false);
  };

  const pay = async () => {
    setErr(''); setBusy(true);
    const token = getAuthSession() ? await getFreshAuthToken() : null;
    if (!token) {
      setBusy(false);
      setErr('Sesi login kamu perlu diperbarui. Keluar lalu masuk lagi pakai Google / email kamu, habis itu coba lagi.');
      return;
    }
    const r = await authAccount({ op: 'start_renewal', access_token: token, duration: picked.id, voucher: voucher?.code });
    if (r.data?.redirect_url) {
      try { localStorage.setItem(RENEWAL_MARKER, String(Date.now())); } catch {}
      window.location.href = r.data.redirect_url;
      return;
    }
    setBusy(false);
    setErr(r.data?.message || 'Gagal membuat link pembayaran. Coba lagi sebentar ya.');
  };

  const chip = !sub.active ? { cls: 'bad', text: 'Tidak aktif' } : sub.trial ? { cls: 'trial', text: 'Trial' } : { cls: 'ok', text: 'Aktif' };
  const endText = sub.validTo
    ? sub.validTo.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  // Progress through the current period, roughly (trial = 7 days, else 30 per month).
  const spanDays = sub.trial ? 7 : 30;
  const pct = sub.daysLeft === null ? 100 : Math.max(4, Math.min(100, (sub.daysLeft / spanDays) * 100));
  const extending = sub.active && sub.validTo;

  return (
    <div className="bil-wrap">
      <div className="bil-card">
        <div className="bil-status">
          <MiraIcon name={sub.active ? (sub.trial ? 'gift' : 'gem') : 'lock'} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className={`bil-chip ${chip.cls}`}>{chip.text}</span>
            <div className="bil-title">{sub.trial ? 'Trial gratis MIRA' : `Paket ${sub.planLabel}`}</div>
            <div className="bil-sub">
              {!endText ? 'Masa aktif belum tercatat.'
                : sub.active ? <>Aktif sampai <strong>{endText}</strong> · {sub.daysLeft === 1 ? 'hari terakhir' : `${sub.daysLeft} hari lagi`}</>
                : <>Berakhir {endText} — sekarang mode baca saja. Riwayatmu tetap aman.</>}
            </div>
          </div>
        </div>
        {sub.active && sub.daysLeft !== null && <div className="bil-bar"><div style={{ width: `${pct}%` }} /></div>}
      </div>

      <div className="bil-card">
        <h3 className="bil-h">{sub.trial || !sub.active ? 'Pilih paket' : 'Perpanjang langganan'}</h3>
        <p className="bil-hint">
          {extending
            ? <>Masa aktif baru ditambahkan setelah <strong>{endText}</strong> — sisa harimu nggak hangus.</>
            : 'Langsung aktif lagi setelah pembayaran berhasil.'}
        </p>
        {DURATIONS.map((d) => (
          <button key={d.id} className={`bil-opt${d.id === picked.id ? ' sel' : ''}`} onClick={() => setDuration(d.id)}>
            <span className="bil-radio" />
            <span className="bil-opt-main">
              <span className="bil-opt-name">{d.label}{d.save && <span className="bil-badge">{d.save}</span>}</span>
              <span className="bil-opt-per" style={{ display: 'block' }}>{d.per}</span>
            </span>
            <span className="bil-opt-price">{rp(d.price)}</span>
          </button>
        ))}

        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Kode voucher (opsional)</div>
          <div className="bil-vrow">
            <input className="bil-input" placeholder="KODEVOUCHER" value={voucherInput}
              onChange={(e) => { setVoucherInput(e.target.value); setVMsg(null); }}
              onKeyDown={(e) => e.key === 'Enter' && void applyVoucher()} />
            <button className="bil-btn2" onClick={() => void applyVoucher()} disabled={checking}>{checking ? 'Cek…' : 'Pakai'}</button>
          </div>
          {vMsg && (
            <div className={`bil-msg ${vMsg.ok ? 'ok' : 'err'}`}>
              <MiraIcon name={vMsg.ok ? 'check-badge' : 'alert'} size={18} tile={false} />{vMsg.text}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="bil-sum"><span>MIRA Personal · {picked.label}</span><span>{rp(picked.price)}</span></div>
          {discount > 0 && <div className="bil-sum" style={{ color: '#15803D' }}><span>Voucher {voucher?.code}</span><span>- {rp(discount)}</span></div>}
          <div className="bil-sum total"><span>Total</span><span>{rp(total)}</span></div>
        </div>

        <button className="bil-pay" onClick={() => void pay()} disabled={busy}>
          {busy ? 'Menyiapkan pembayaran…' : `Bayar ${rp(total)}`}
        </button>
        {err && <div className="bil-err">{err}</div>}

        <div className="bil-note">
          <MiraIcon name="shield" size={26} />
          <span>Pembayaran aman lewat Midtrans — QRIS, GoPay, ShopeePay, transfer bank (VA), atau kartu. Nggak ada tagihan otomatis: kamu yang pilih kapan perpanjang.</span>
        </div>
      </div>
    </div>
  );
}
