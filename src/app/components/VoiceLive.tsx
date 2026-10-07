/**
 * VoiceLive — what the user sees while talking (pairs with useVoiceInput):
 *   live dictation  → the words as they're recognised (settled + in-progress)
 *   voice note      → a live level meter, MIRA transcribes after
 * Rendered in place of the text box by the chat, the "+" AI mode and Split Bill.
 */
import { useEffect } from 'react';
import { Square, X } from 'lucide-react';
import { fmtSeconds, type useVoiceInput } from '../lib/voice';

type Voice = ReturnType<typeof useVoiceInput>;

const CSS = `
  .vl { border: 1.5px solid rgba(239,68,68,.35); background: #FFF7F7; border-radius: 16px; padding: 12px 12px 10px; font-family: 'DM Sans', sans-serif; }
  .vl-top { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; color: #B91C1C; }
  .vl-dot { width: 9px; height: 9px; border-radius: 50%; background: #EF4444; animation: vl-pulse 1.1s ease-in-out infinite; flex-shrink: 0; }
  @keyframes vl-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: .45; } }
  .vl-time { margin-left: auto; font-variant-numeric: tabular-nums; color: #6B7280; font-weight: 600; }
  .vl-text { margin: 8px 2px 10px; min-height: 44px; max-height: 132px; overflow-y: auto; font-size: 15.5px; line-height: 1.5; color: #111827; word-break: break-word; }
  .vl-text .vl-int { color: #9CA3AF; }
  .vl-text .vl-ph { color: #9CA3AF; font-style: italic; }
  .vl-caret { display: inline-block; width: 2px; height: 1.05em; background: #EF4444; vertical-align: -2px; margin-left: 2px; animation: vl-blink 1s steps(1) infinite; }
  @keyframes vl-blink { 50% { opacity: 0; } }
  .vl-meter { display: flex; align-items: center; justify-content: center; gap: 4px; height: 44px; margin: 6px 0 10px; }
  .vl-meter span { width: 5px; border-radius: 3px; background: #EF4444; transition: height .08s linear; }
  .vl-acts { display: flex; gap: 8px; }
  .vl-btn { height: 40px; border-radius: 12px; border: 0; cursor: pointer; font: 700 13.5px 'DM Sans', sans-serif; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 14px; }
  .vl-btn.stop { flex: 1; background: #DC2626; color: #fff; }
  .vl-btn.cancel { background: #F1F5F9; color: #475569; }
  .vl-hint { font-size: 11.5px; color: #9CA3AF; margin-top: 8px; }
  .dark .vl { background: rgba(239,68,68,.08); border-color: rgba(248,113,113,.35); }
  .dark .vl-top { color: #FCA5A5; }
  .dark .vl-text { color: #F1F5F9; }
  .dark .vl-btn.cancel { background: #334155; color: #E2E8F0; }
`;

const BARS = [0.45, 0.75, 1, 0.75, 0.45, 0.6, 0.9];

export function VoiceLive({ voice, hint }: { voice: Voice; hint?: string }) {
  useEffect(() => {
    if (document.getElementById('vl-css')) return;
    const s = document.createElement('style');
    s.id = 'vl-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  if (!voice.listening && voice.mode !== 'preparing') return null;
  const live = voice.mode === 'live';

  return (
    <div className="vl" role="status" aria-live="polite">
      <div className="vl-top">
        <span className="vl-dot" />
        {voice.mode === 'preparing' ? 'Nyiapin voice note…' : live ? 'MIRA lagi dengerin…' : 'Merekam voice note…'}
        <span className="vl-time">{fmtSeconds(voice.seconds)}</span>
      </div>

      {live ? (
        <div className="vl-text">
          {voice.finalText || voice.interim
            ? <>{voice.finalText}{voice.finalText && voice.interim ? ' ' : ''}<span className="vl-int">{voice.interim}</span><span className="vl-caret" /></>
            : <span className="vl-ph">Ngomong aja, misal "makan siang 35 ribu pakai GoPay"…</span>}
        </div>
      ) : (
        <div className="vl-meter" aria-hidden="true">
          {BARS.map((b, i) => <span key={i} style={{ height: `${8 + Math.round(36 * Math.min(1, voice.level * b * 1.6))}px` }} />)}
        </div>
      )}

      {voice.mode !== 'preparing' && (
        <div className="vl-acts">
          <button className="vl-btn cancel" onClick={voice.cancel} aria-label="Batal"><X size={15} />Batal</button>
          <button className="vl-btn stop" onClick={voice.stop}><Square size={13} fill="currentColor" />Selesai</button>
        </div>
      )}
      <div className="vl-hint">
        {live ? (hint || 'Teksnya masuk ke kolom ketik — cek dulu sebelum dikirim.') : 'Browser ini belum bisa teks langsung — MIRA yang dengerin rekamannya.'}
      </div>
    </div>
  );
}
