/**
 * Subscription UI shared by the dashboard (state lives in lib/subscription):
 *   <SubscriptionBanner />  trial / ending soon / expired strip above every page
 *   <RenewSheet />          "perpanjang" sheet — opened by requireActive() when a
 *                           read-only account tries to record something, and
 *                           once a day on open when the plan is about to end
 *   <ReadOnlyNotice />      inline card for pages whose main action is writing
 * Mount the banner + sheet once, in the dashboard layout.
 */
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { X } from 'lucide-react';
import { MiraIcon } from './icons/MiraIcon';
import { RENEW_PATH, useSubscription, type Subscription } from '../lib/subscription';

const CSS = `
  .sub-banner { display: flex; align-items: center; gap: 12px; padding: 11px 14px; margin: 16px 32px 0; border-radius: 14px;
    font-size: 13px; line-height: 1.45; border: 1px solid; }
  .sub-banner.info { background: #EFF6FF; border-color: #BFDBFE; color: #1E3A8A; }
  .sub-banner.warn { background: #FFFBEB; border-color: #FDE68A; color: #78350F; }
  .sub-banner.bad  { background: #FEF2F2; border-color: #FECACA; color: #7F1D1D; }
  .sub-banner-txt { flex: 1; min-width: 0; }
  .sub-banner-txt strong { font-weight: 700; }
  .sub-btn { border: 0; border-radius: 999px; padding: 8px 14px; font-weight: 700; font-size: 12.5px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; white-space: nowrap; background: #2563EB; color: #fff; }
  .sub-banner.bad .sub-btn { background: #DC2626; }
  .sub-x { background: none; border: 0; padding: 4px; cursor: pointer; color: inherit; opacity: .55; display: flex; }
  @media (max-width: 900px) { .sub-banner { margin: 12px 16px 0; } }
  @media (max-width: 480px) { .sub-banner { flex-wrap: wrap; } .sub-banner .sub-btn { flex: 1 1 100%; padding: 10px 14px; } }
  .dark .sub-banner.info { background: rgba(37,99,235,.14); border-color: rgba(96,165,250,.3); color: #BFDBFE; }
  .dark .sub-banner.warn { background: rgba(245,158,11,.12); border-color: rgba(251,191,36,.3); color: #FDE68A; }
  .dark .sub-banner.bad  { background: rgba(220,38,38,.14); border-color: rgba(248,113,113,.3); color: #FECACA; }

  .rs-overlay { position: fixed; inset: 0; z-index: 420; background: rgba(15,23,42,.5); display: flex; align-items: flex-end;
    justify-content: center; animation: rs-fade .15s ease-out; }
  @media (min-width: 640px) { .rs-overlay { align-items: center; } }
  @keyframes rs-fade { from { opacity: 0; } to { opacity: 1; } }
  .rs-sheet { position: relative; width: 100%; max-width: 420px; background: #fff; border-radius: 22px 22px 0 0; box-sizing: border-box;
    padding: 26px 22px calc(22px + env(safe-area-inset-bottom,0px)); font-family: 'DM Sans', sans-serif; color: #0F172A; text-align: center; }
  @media (min-width: 640px) { .rs-sheet { border-radius: 22px; } }
  .rs-sheet .sub-x { position: absolute; top: 12px; right: 12px; color: #94A3B8; opacity: 1; }
  .rs-sheet h3 { font-family: 'Sora', sans-serif; font-size: 18px; margin: 14px 0 6px; }
  .rs-sheet p { font-size: 14px; line-height: 1.6; color: #64748B; margin: 0 0 18px; }
  .rs-points { text-align: left; background: #F8FAFC; border-radius: 14px; padding: 10px 14px; margin-bottom: 18px; }
  .rs-point { display: flex; align-items: center; gap: 10px; font-size: 13.5px; padding: 5px 0; color: #334155; }
  .rs-cta { width: 100%; border: 0; border-radius: 14px; padding: 14px; font-family: 'Sora', sans-serif; font-weight: 700;
    font-size: 15px; background: #2563EB; color: #fff; cursor: pointer; }
  .rs-later { background: none; border: 0; margin-top: 10px; font-size: 13px; color: #94A3B8; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .dark .rs-sheet { background: #1E293B; color: #F1F5F9; }
  .dark .rs-sheet p { color: #94A3B8; }
  .dark .rs-points { background: #0F172A; }
  .dark .rs-point { color: #CBD5E1; }

  .ro-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; background: #F8FAFC;
    border: 1px dashed #CBD5E1; font-size: 13px; line-height: 1.5; color: #475569; font-family: 'DM Sans', sans-serif; }
  .ro-card-txt { flex: 1; min-width: 0; }
  .ro-card-txt strong { color: #0F172A; }
  .dark .ro-card { background: #1E293B; border-color: rgba(255,255,255,.12); color: #94A3B8; }
  .dark .ro-card-txt strong { color: #F1F5F9; }
`;

function Styles() {
  useEffect(() => {
    if (document.getElementById('sub-css')) return;
    const s = document.createElement('style');
    s.id = 'sub-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }, []);
  return null;
}

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

const today = () => new Date().toISOString().slice(0, 10);
const storage = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} },
};

type Tone = 'info' | 'warn' | 'bad';

function bannerFor(sub: Subscription): { tone: Tone; text: JSX.Element; cta: string; dismissible: boolean } | null {
  const d = sub.daysLeft ?? 0;
  if (!sub.active) {
    return {
      tone: 'bad', dismissible: false,
      cta: sub.trial ? 'Pilih paket' : 'Perpanjang',
      text: <><strong>{sub.trial ? 'Trial gratismu sudah selesai.' : 'Langgananmu sudah berakhir.'}</strong> Akun sekarang mode baca saja — riwayatmu tetap aman, tapi belum bisa catat transaksi baru.</>,
    };
  }
  if (sub.daysLeft === null) return null;
  if (sub.trial) {
    return {
      tone: d <= 2 ? 'warn' : 'info', dismissible: d > 2, cta: 'Pilih paket',
      text: <><strong>Trial gratis: {d === 1 ? 'hari terakhir' : `${d} hari lagi`}.</strong> Lanjut langganan mulai Rp20 ribuan/bulan biar nyatatnya nggak putus.</>,
    };
  }
  if (d <= 7) {
    return {
      tone: d <= 2 ? 'warn' : 'info', dismissible: d > 2, cta: 'Perpanjang',
      text: <><strong>Langgananmu berakhir {d <= 1 ? 'besok' : `${d} hari lagi`}</strong> ({fmtDate(sub.validTo)}). Perpanjang sekarang — sisa harinya nggak hangus.</>,
    };
  }
  return null;
}

export function SubscriptionBanner() {
  const sub = useSubscription();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [hiddenOn, setHiddenOn] = useState(() => storage.get('mira_sub_banner_hidden'));
  const b = bannerFor(sub);
  if (!b || pathname === RENEW_PATH || (b.dismissible && hiddenOn === today())) return null;
  return (
    <>
      <Styles />
      <div className={`sub-banner ${b.tone}`} role="status">
        <MiraIcon name={b.tone === 'bad' ? 'lock' : sub.trial ? 'gift' : 'hourglass'} size={30} />
        <div className="sub-banner-txt">{b.text}</div>
        <button className="sub-btn" onClick={() => navigate(RENEW_PATH)}>{b.cta}</button>
        {b.dismissible && (
          <button className="sub-x" aria-label="Tutup" onClick={() => { storage.set('mira_sub_banner_hidden', today()); setHiddenOn(today()); }}>
            <X size={15} />
          </button>
        )}
      </div>
    </>
  );
}

export function RenewSheet() {
  const sub = useSubscription();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>();

  useEffect(() => {
    const show = (e: Event) => { setReason((e as CustomEvent).detail?.reason); setOpen(true); };
    window.addEventListener('mira:renew', show);
    return () => window.removeEventListener('mira:renew', show);
  }, []);

  // The login-time reminder: once a day when the plan has ended or is about to.
  const due = !sub.active || (sub.daysLeft !== null && sub.daysLeft <= (sub.trial ? 2 : 3));
  useEffect(() => {
    if (!due || pathname === RENEW_PATH || storage.get('mira_renew_sheet_shown') === today()) return;
    storage.set('mira_renew_sheet_shown', today());
    setReason(undefined);
    setOpen(true);
  }, [due]);

  if (!open) return null;
  const close = () => setOpen(false);
  const go = () => { close(); navigate(RENEW_PATH); };
  const d = sub.daysLeft ?? 0;

  const title = !sub.active
    ? (sub.trial ? 'Trial gratismu sudah selesai' : 'Langgananmu sudah berakhir')
    : sub.trial ? `Trial tinggal ${d <= 1 ? 'hari ini' : `${d} hari`}` : `Langganan berakhir ${d <= 1 ? 'besok' : `${d} hari lagi`}`;
  const body = !sub.active
    ? `${reason ? reason + ' ' : ''}Akunmu sekarang mode baca saja. Riwayat transaksimu tetap aman dan bisa dilihat — perpanjang buat catat lagi.`
    : sub.trial
      ? 'Pilih paket sekarang biar nyatat keuanganmu nggak putus. Sisa hari trial-mu tetap kepakai — masa aktif baru ditambahkan setelahnya.'
      : 'Perpanjang sekarang biar nyatat keuanganmu nggak putus. Sisa hari aktifmu nggak hangus.';

  return (
    <>
      <Styles />
      <div className="rs-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="rs-sheet" role="dialog" aria-label="Perpanjang langganan MIRA">
          <button className="sub-x" onClick={close} aria-label="Tutup"><X size={18} /></button>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <MiraIcon name={sub.active ? 'buddy-happy' : 'buddy-worried'} size={72} />
          </div>
          <h3>{title}</h3>
          <p>{body}</p>
          <div className="rs-points">
            <div className="rs-point"><MiraIcon name="chat" size={26} />Catat lewat chat, foto struk & voice note</div>
            <div className="rs-point"><MiraIcon name="sparkle" size={26} />Kategori otomatis & insight dari AI</div>
            <div className="rs-point"><MiraIcon name="piggy" size={26} />Tahunan cuma ≈ Rp20.750/bulan</div>
          </div>
          <button className="rs-cta" onClick={go}>{sub.trial ? 'Pilih paket' : 'Perpanjang sekarang'}</button>
          <div><button className="rs-later" onClick={close}>{sub.active ? 'Nanti aja' : 'Lihat riwayat aja dulu'}</button></div>
        </div>
      </div>
    </>
  );
}

/** Inline "mode baca saja" card; renders nothing while the account is active. */
export function ReadOnlyNotice({ what = 'mencatat', style }: { what?: string; style?: React.CSSProperties }) {
  const sub = useSubscription();
  const navigate = useNavigate();
  if (sub.active) return null;
  return (
    <>
      <Styles />
      <div className="ro-card" style={style}>
        <MiraIcon name="lock" size={30} />
        <div className="ro-card-txt">
          <strong>Mode baca saja.</strong> {sub.trial ? 'Trial gratismu sudah selesai' : 'Langgananmu sudah berakhir'} — perpanjang dulu buat {what} lagi.
        </div>
        <button className="sub-btn" onClick={() => navigate(RENEW_PATH)}>Perpanjang</button>
      </div>
    </>
  );
}
