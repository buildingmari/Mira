/**
 * "Pasang MIRA" — install the dashboard as a home-screen app.
 *   <InstallBanner />    dismissible card (Overview)
 *   <InstallNavButton /> sidebar entry
 *   <InstallHelpSheet /> how-to sheet (mount once, in the dashboard layout),
 *                        opened when the browser has no native install prompt
 *                        — always the case on iPhone.
 * All of them hide themselves when MIRA already runs as the installed app.
 */
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { MiraIcon } from './icons/MiraIcon';
import { isIOS, isMobile, openInstall, usePwaInstall } from '../lib/pwa';

const DISMISS_KEY = 'mira_install_dismissed';
const DISMISS_DAYS = 14;

const CSS = `
  .pwa-banner { position: relative; display: flex; align-items: center; gap: 14px; padding: 14px 44px 14px 16px; margin-bottom: 20px;
    border-radius: 18px; background: linear-gradient(135deg, #EEF2FF 0%, #ECFEFF 100%); border: 1px solid rgba(45,75,255,.14); }
  .pwa-banner img { width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0; box-shadow: 0 6px 16px rgba(45,75,255,.25); }
  .pwa-banner-txt { flex: 1; min-width: 0; }
  .pwa-banner-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 14px; color: #0F172A; }
  .pwa-banner-sub { font-size: 12.5px; color: #475569; margin-top: 2px; line-height: 1.45; }
  .pwa-btn { background: #2D4BFF; color: #fff; border: 0; border-radius: 999px; padding: 9px 16px; font-weight: 700;
    font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; white-space: nowrap; }
  .pwa-x { background: none; border: 0; color: #94A3B8; cursor: pointer; padding: 4px; display: flex; }
  .pwa-banner .pwa-x { position: absolute; top: 10px; right: 10px; }
  @media (max-width: 560px) {
    .pwa-banner { flex-wrap: wrap; padding-right: 40px; }
    .pwa-banner .pwa-banner-txt { flex: 1 1 0; }
    .pwa-banner .pwa-btn { flex: 1 1 100%; padding: 11px 16px; margin-right: -24px; }
  }
  .dark .pwa-banner { background: linear-gradient(135deg, rgba(45,75,255,.18), rgba(34,211,238,.10)); border-color: rgba(255,255,255,.08); }
  .dark .pwa-banner-title { color: #F1F5F9; }
  .dark .pwa-banner-sub { color: #94A3B8; }

  .pwa-overlay { position: fixed; inset: 0; z-index: 400; background: rgba(15,23,42,.5); display: flex;
    align-items: flex-end; justify-content: center; animation: pwa-fade .15s ease-out; }
  @media (min-width: 640px) { .pwa-overlay { align-items: center; } }
  @keyframes pwa-fade { from { opacity: 0; } to { opacity: 1; } }
  .pwa-sheet { width: 100%; max-width: 420px; background: #fff; border-radius: 22px 22px 0 0; padding: 22px 22px calc(22px + env(safe-area-inset-bottom,0px));
    box-sizing: border-box; font-family: 'DM Sans', sans-serif; color: #0F172A; }
  @media (min-width: 640px) { .pwa-sheet { border-radius: 22px; } }
  .pwa-sheet-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .pwa-sheet-head img { width: 48px; height: 48px; border-radius: 13px; }
  .pwa-sheet h3 { margin: 0; font-family: 'Sora', sans-serif; font-size: 17px; }
  .pwa-sheet-sub { font-size: 12.5px; color: #64748B; margin-top: 2px; }
  .pwa-step { display: flex; gap: 12px; align-items: flex-start; padding: 11px 0; border-top: 1px solid #F1F5F9; font-size: 14px; line-height: 1.5; }
  .pwa-num { width: 26px; height: 26px; border-radius: 50%; background: #EEF2FF; color: #2D4BFF; font-weight: 800; font-size: 13px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: 'Sora', sans-serif; }
  .pwa-glyph { display: inline-flex; vertical-align: -5px; margin: 0 3px; color: #2D4BFF; }
  .pwa-note { font-size: 12.5px; color: #64748B; background: #F8FAFC; border-radius: 12px; padding: 10px 12px; margin-top: 8px; line-height: 1.5; }
  .dark .pwa-sheet { background: #1E293B; color: #F1F5F9; }
  .dark .pwa-step { border-top-color: rgba(255,255,255,.07); }
  .dark .pwa-note { background: #0F172A; color: #94A3B8; }
`;

function Styles() {
  useEffect(() => {
    if (document.getElementById('pwa-css')) return;
    const s = document.createElement('style');
    s.id = 'pwa-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }, []);
  return null;
}

/* iOS share glyph (square + arrow) and "add" glyph, drawn like Safari's. */
const ShareGlyph = () => (
  <span className="pwa-glyph"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M8 7l4-4 4 4" /><path d="M8 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2" /></svg></span>
);
const AddGlyph = () => (
  <span className="pwa-glyph"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" /></svg></span>
);
const DotsGlyph = () => (
  <span className="pwa-glyph"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg></span>
);

const dismissedRecently = () => {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY));
    return t > 0 && Date.now() - t < DISMISS_DAYS * 86400000;
  } catch { return false; }
};

export function InstallBanner() {
  const { installed } = usePwaInstall();
  const [hidden, setHidden] = useState(dismissedRecently);
  if (installed || hidden) return null;
  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setHidden(true);
  };
  return (
    <>
      <Styles />
      <div className="pwa-banner">
        <img src="/icons/icon-192.png" alt="" />
        <div className="pwa-banner-txt">
          <div className="pwa-banner-title">Pasang MIRA di {isMobile() ? 'HP' : 'perangkat'} kamu</div>
          <div className="pwa-banner-sub">Buka dari layar utama kayak aplikasi, tetap login — tanpa App Store / Play Store.</div>
        </div>
        <button className="pwa-btn" onClick={() => void openInstall()}>Pasang sekarang</button>
        <button className="pwa-x" onClick={dismiss} aria-label="Tutup"><X size={16} /></button>
      </div>
    </>
  );
}

export function InstallNavButton({ className }: { className?: string }) {
  const { installed } = usePwaInstall();
  if (installed) return null;
  return (
    <button className={className} onClick={() => void openInstall()}>
      <MiraIcon name="gadget" size={28} />
      Pasang Aplikasi
    </button>
  );
}

export function InstallHelpSheet() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('mira:install-help', show);
    return () => window.removeEventListener('mira:install-help', show);
  }, []);
  if (!open) return null;

  const ios = isIOS();
  const android = !ios && /android/i.test(navigator.userAgent);

  return (
    <>
      <Styles />
      <div className="pwa-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        <div className="pwa-sheet" role="dialog" aria-label="Pasang MIRA">
          <div className="pwa-sheet-head">
            <img src="/icons/icon-192.png" alt="" />
            <div style={{ flex: 1 }}>
              <h3>Pasang MIRA</h3>
              <div className="pwa-sheet-sub">Ikon MIRA bakal muncul di layar utama {ios || android ? 'HP' : 'perangkat'} kamu.</div>
            </div>
            <button className="pwa-x" onClick={() => setOpen(false)} aria-label="Tutup"><X size={18} /></button>
          </div>

          {ios ? (
            <>
              <div className="pwa-step"><span className="pwa-num">1</span><span>Tap tombol <strong>Share</strong><ShareGlyph />di Safari (bawah layar, atau kanan atas di iPad).</span></div>
              <div className="pwa-step"><span className="pwa-num">2</span><span>Scroll, lalu pilih <strong>Add to Home Screen</strong><AddGlyph />(Tambahkan ke Layar Utama).</span></div>
              <div className="pwa-step"><span className="pwa-num">3</span><span>Tap <strong>Add</strong>. Selesai — buka MIRA dari ikon di layar utama.</span></div>
              <div className="pwa-note">Di iPhone, pertama kali buka dari ikon kamu perlu masuk sekali lagi — habis itu tetap login.</div>
            </>
          ) : android ? (
            <>
              <div className="pwa-step"><span className="pwa-num">1</span><span>Tap menu<DotsGlyph />di pojok kanan atas browser.</span></div>
              <div className="pwa-step"><span className="pwa-num">2</span><span>Pilih <strong>Install app</strong> atau <strong>Tambahkan ke layar utama</strong>.</span></div>
              <div className="pwa-step"><span className="pwa-num">3</span><span>Konfirmasi <strong>Install</strong>. Ikon MIRA langsung muncul di layar utama.</span></div>
            </>
          ) : (
            <>
              <div className="pwa-step"><span className="pwa-num">1</span><span>Di Chrome atau Edge, klik ikon <strong>Install</strong> di ujung kanan address bar — atau menu<DotsGlyph />→ <strong>Install MIRA</strong>.</span></div>
              <div className="pwa-step"><span className="pwa-num">2</span><span>Di Safari Mac: menu <strong>File → Add to Dock</strong>.</span></div>
              <div className="pwa-note">Mau di HP? Buka <strong>halo-mira.com/dashboard</strong> dari browser HP kamu, lalu tap Pasang.</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
