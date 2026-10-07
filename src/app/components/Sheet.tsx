/**
 * Sheet — bottom sheet on phones, centred dialog from 640px. Closes on the
 * backdrop, Esc and the ✕; respects the home-indicator safe area. Shared by
 * the Target and Piutang screens (and anything else that needs a form).
 */
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

const CSS = `
  .msh-ov { position: fixed; inset: 0; z-index: 600; background: rgba(15,23,42,.45); display: flex; align-items: flex-end; justify-content: center;
    animation: msh-fade .15s ease-out; }
  @media (min-width: 640px) { .msh-ov { align-items: center; padding: 20px; } }
  @keyframes msh-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes msh-up { from { transform: translateY(24px); opacity: .6; } to { transform: none; opacity: 1; } }
  .msh { width: 100%; max-width: 480px; max-height: 92vh; max-height: 92dvh; overflow-y: auto; overscroll-behavior: contain;
    background: #fff; border-radius: 22px 22px 0 0; box-sizing: border-box; font-family: 'DM Sans', sans-serif; color: #111827;
    padding: 0 20px calc(18px + env(safe-area-inset-bottom,0px)); animation: msh-up .2s ease-out; }
  @media (min-width: 640px) { .msh { border-radius: 20px; padding-bottom: 20px; } }
  .msh-handle { width: 38px; height: 4px; border-radius: 99px; background: #E5E7EB; margin: 10px auto 4px; }
  @media (min-width: 640px) { .msh-handle { display: none; } }
  .msh-hd { position: sticky; top: 0; background: inherit; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0 12px; z-index: 1; }
  .msh-hd h3 { margin: 0; font: 700 16px 'Sora', sans-serif; }
  .msh-x { width: 34px; height: 34px; border-radius: 10px; border: 0; background: transparent; color: #6B7280; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .msh-x:hover { background: #F1F5F9; }
  .msh-field { margin-bottom: 12px; }
  .msh-label { display: block; font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .04em; }
  .msh-input { width: 100%; height: 44px; box-sizing: border-box; border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 0 12px;
    font: 16px 'DM Sans', sans-serif; color: #111827; background: #FAFBFF; outline: none; }
  .msh-input:focus { border-color: #2563EB; background: #fff; }
  .msh-amount { display: flex; align-items: center; border: 1.5px solid #E5E7EB; border-radius: 14px; background: #FAFBFF; padding: 0 14px; }
  .msh-amount:focus-within { border-color: #2563EB; background: #fff; }
  .msh-amount span { font: 700 18px 'Sora', sans-serif; color: #9CA3AF; margin-right: 6px; }
  .msh-amount input { flex: 1; min-width: 0; height: 54px; border: 0; background: transparent; outline: none; font: 800 24px 'Sora', sans-serif; color: #111827; }
  .msh-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .msh-chip { border: 1.5px solid #E5E7EB; background: #fff; border-radius: 999px; padding: 5px 12px; font: 600 12.5px 'DM Sans', sans-serif; color: #374151; cursor: pointer; }
  .msh-chip.on { border-color: #2563EB; background: #EFF6FF; color: #1D4ED8; }
  .msh-two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .msh-btns { display: flex; gap: 10px; margin-top: 4px; }
  .msh-btn { flex: 1; height: 46px; border-radius: 13px; border: 0; cursor: pointer; font: 700 14.5px 'DM Sans', sans-serif;
    display: inline-flex; align-items: center; justify-content: center; gap: 7px; }
  .msh-btn:disabled { opacity: .6; cursor: not-allowed; }
  .msh-btn.primary { background: #2563EB; color: #fff; }
  .msh-btn.green { background: #16A34A; color: #fff; }
  .msh-btn.ghost { background: #F1F5F9; color: #334155; }
  .msh-btn.danger { background: #FEF2F2; color: #DC2626; }
  .msh-btn.danger-solid { background: #DC2626; color: #fff; }
  .msh-err { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 12px; padding: 9px 12px; font-size: 13px; margin-bottom: 10px; }
  .msh-confirm { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 14px; padding: 12px 14px; margin-bottom: 10px; font-size: 13.5px; color: #7F1D1D; line-height: 1.5; }
  .dark .msh { background: #1E293B; color: #F1F5F9; }
  .dark .msh-handle { background: #475569; }
  .dark .msh-x:hover { background: #334155; }
  .dark .msh-input, .dark .msh-amount { background: #0F172A; border-color: rgba(255,255,255,.12); color: #F1F5F9; color-scheme: dark; }
  .dark .msh-amount input { color: #F1F5F9; }
  .dark .msh-chip { background: #0F172A; border-color: rgba(255,255,255,.12); color: #CBD5E1; }
  .dark .msh-chip.on { background: rgba(37,99,235,.18); border-color: #3B82F6; color: #93C5FD; }
  .dark .msh-btn.ghost { background: #334155; color: #E2E8F0; }
  .dark .msh-btn.danger { background: rgba(220,38,38,.15); color: #FCA5A5; }
  .dark .msh-confirm { background: rgba(220,38,38,.12); border-color: rgba(248,113,113,.3); color: #FECACA; }
`;

export function Sheet({ title, onClose, busy = false, children }: { title: ReactNode; onClose: () => void; busy?: boolean; children: ReactNode }) {
  useEffect(() => {
    if (!document.getElementById('msh-css')) {
      const s = document.createElement('style');
      s.id = 'msh-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [busy]);

  return (
    <div className="msh-ov" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="msh" role="dialog">
        <div className="msh-handle" />
        <div className="msh-hd">
          <h3>{title}</h3>
          <button className="msh-x" onClick={onClose} disabled={busy} aria-label="Tutup"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Rupiah input that shows thousands separators while typing. */
export function AmountInput({ value, onChange, placeholder = '0' }: { value: number; onChange: (n: number) => void; placeholder?: string }) {
  return (
    <div className="msh-amount">
      <span>Rp</span>
      <input inputMode="numeric" placeholder={placeholder} value={value ? value.toLocaleString('id-ID') : ''}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)} />
    </div>
  );
}
