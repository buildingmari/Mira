import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { MessageCircle, X } from 'lucide-react';
import { MiraChat } from './MiraChat';

// Same measured offset dashboard/layout.tsx reserves for its fixed mobile
// bottom-nav (69px + safe-area) — the FAB sits just above it so neither
// overlaps the other.
const WIDGET_CSS = `
  .mcw-fab {
    position: fixed; z-index: 250;
    right: 20px; bottom: calc(24px + env(safe-area-inset-bottom,0px));
    width: 54px; height: 54px; border-radius: 50%;
    background: #2563EB; color: #fff; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(37,99,235,0.45);
    transition: transform .15s;
  }
  .mcw-fab:hover { transform: scale(1.06); }
  @media (max-width: 900px) {
    .mcw-fab { bottom: calc(69px + 16px + env(safe-area-inset-bottom,0px)); right: 16px; }
  }
  .mcw-panel {
    position: fixed; z-index: 240;
    right: 20px; bottom: calc(90px + env(safe-area-inset-bottom,0px));
    width: 380px; height: 580px; max-height: calc(100vh - 130px);
    border-radius: 18px; overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.22);
    border: 1px solid rgba(0,0,0,0.08);
    animation: mcw-pop .18s ease-out;
  }
  @keyframes mcw-pop { from { opacity:0; transform: translateY(8px) scale(.98); } to { opacity:1; transform: translateY(0) scale(1); } }
  @media (max-width: 900px) {
    .mcw-panel {
      right: 0; left: 0; bottom: 0; top: 0;
      width: auto; height: auto; max-height: none;
      border-radius: 0; border: none; z-index: 260;
    }
  }
`;

export function ChatWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = 'mcw-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = WIDGET_CSS;
      document.head.appendChild(s);
    }
  }, []);

  // MiraChat asks to close when it hands off to a full page (e.g. "Atur
  // detail" opening the Split Bill editor), so the panel doesn't cover it.
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('mira:chat-close', close);
    return () => window.removeEventListener('mira:chat-close', close);
  }, []);

  // The full chat page (/dashboard/chat) already IS this experience,
  // full-screen — no redundant floating duplicate on top of it.
  if (location.pathname === '/dashboard/chat') return null;

  return (
    <>
      {open && (
        <div className="mcw-panel">
          <MiraChat />
        </div>
      )}
      <button className="mcw-fab" onClick={() => setOpen((v) => !v)} title={open ? 'Tutup chat' : 'Chat MIRA'}>
        {open ? <X size={22} /> : <MessageCircle size={23} />}
      </button>
    </>
  );
}
