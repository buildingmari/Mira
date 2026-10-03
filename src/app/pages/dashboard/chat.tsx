import { useEffect } from 'react';
import { MiraChat } from '../../components/MiraChat';

// This dashboard layout (dashboard/layout.tsx) uses normal page scroll, not
// a fixed-height app shell, so a full-bleed immersive chat view has to
// opt itself out via position:fixed rather than relying on the parent to
// size it. The offsets below are exact, measured against the live site
// (not guessed): desktop topbar 58px / sidebar 220px; mobile topbar 61px /
// bottom-nav 69px, each plus the matching safe-area-inset for notched
// devices — same values dashboard/layout.tsx itself reserves.
const PAGE_CSS = `
  .mira-chat-page {
    position: fixed;
    top: 58px; left: 220px; right: 0; bottom: 0;
    z-index: 20;
  }
  @media (max-width: 900px) {
    .mira-chat-page {
      top: calc(61px + env(safe-area-inset-top,0px));
      left: 0;
      bottom: calc(69px + env(safe-area-inset-bottom,0px));
    }
  }
`;

export function DashboardChat() {
  useEffect(() => {
    const id = 'mira-chat-page-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = PAGE_CSS;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div className="mira-chat-page">
      <MiraChat />
    </div>
  );
}

/**
 * STATUS: LIVE. chat-send Edge Function deployed, secrets configured, and
 * verified end-to-end (text, photo, voice, store/confirm/edit/cancel via
 * both typed commands and the in-bubble action buttons, a spending query)
 * before this page was linked into routes.tsx and dashboard/layout.tsx's
 * NAV_SECTIONS. Also rendered as a floating widget (ChatWidget.tsx) on
 * every other dashboard page, sharing this same MiraChat engine.
 *
 * Known v1 gaps (the model declines these via chat_response rather than
 * emitting an action this backend can't handle): split bill, investment
 * logging, reminders, export, insight reports — WhatsApp still has these,
 * the web chat doesn't yet.
 */
