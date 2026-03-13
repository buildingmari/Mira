import { useEffect, useState } from 'react';
import './Hero.css';
import { HeroGradient } from './HeroGradient';

interface HeroProps {
  onCTAClick: () => void;
}

const headlines = [
  'Kelola uang dengan cerdas.',
  'Lihat ke mana uangmu pergi.',
  'Pengeluaran terpantau.',
];

/* ──────────────────────────────────────────────────
   SVG RIBBON — exact Q-curve paths from HTML mockup,
   colors swapped to MIRA blue-cyan palette
────────────────────────────────────────────────── */
function StripeWave() {
  return (
    <div className="stripe-wave" aria-hidden="true">
      <div className="hero-blob b1" />
      <div className="hero-blob b2" />
      <div className="hero-blob b3" />
      <div className="hero-blob b4" />
      <div className="hero-blob b5" />
    </div>
  );
}

/* ──────────────────────────────────────────────────
   iPHONE MOCKUP — exact structure from HTML
────────────────────────────────────────────────── */
function IPhoneMockup() {
  return (
    <div className="iphone-wrap">
      <div className="iphone-shell">
        {/* Hardware side buttons */}
        <div className="iphone-btn-vol1" />
        <div className="iphone-btn-vol2" />
        <div className="iphone-btn-power" />

        <div className="iphone-screen">
          {/* Dynamic Island */}
          <div className="iphone-island" />

          {/* WA Status bar */}
          <div className="wa-status-bar">
            <span className="wa-time">09:41</span>
            <div className="wa-status-icons">
              {/* Signal bars */}
              <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
                <rect x="0"    y="6" width="3" height="6"  rx=".5" />
                <rect x="4.5"  y="4" width="3" height="8"  rx=".5" />
                <rect x="9"    y="2" width="3" height="10" rx=".5" />
                <rect x="13.5" y="0" width="3" height="12" rx=".5" />
              </svg>
              {/* WiFi */}
              <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
                <path d="M8 9.5a1.2 1.2 0 110 2.4A1.2 1.2 0 018 9.5z" />
                <path d="M4.7 7.2a4.7 4.7 0 016.6 0" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                <path d="M2.1 4.6a8.3 8.3 0 0111.8 0" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" />
              </svg>
              {/* Battery */}
              <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
                <rect x=".5" y="1" width="21" height="10" rx="2.5" stroke="white" strokeWidth="1" />
                <rect x="22" y="4" width="2.5" height="4" rx="1" fill="white" opacity=".4" />
                <rect x="2" y="2.5" width="17" height="7" rx="1.5" fill="white" />
              </svg>
            </div>
          </div>

          {/* WA App header */}
          <div className="wa-app-header">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <div className="wa-contact-avatar">M</div>
            <div className="wa-contact-info">
              <div className="wa-contact-name">MIRA</div>
              <div className="wa-contact-status">Online</div>
            </div>
            <div className="wa-header-icons">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
            </div>
          </div>

          {/* WA Chat area */}
          <div className="wa-chat-area">
            <div className="wa-date-badge">HARI INI</div>

            {/* Outgoing 1 */}
            <div className="wa-bubble-row wa-outgoing">
              <div className="wa-bubble wa-bubble-out">
                <span>Belanja supermarket Rp185.000, Debit BCA 🛒</span>
                <div className="wa-bubble-meta">
                  <span className="wa-bubble-time">09:32</span>
                  <svg className="wa-check" width="14" height="9" viewBox="0 0 16 11">
                    <path d="M11.071.653L4.53 7.195 1.414 4.08 0 5.494l4.53 4.53 7.954-7.954L11.071.653z" fill="#53bdeb" />
                    <path d="M15.071.653L8.53 7.195 7.116 5.78l-1.414 1.414L8.53 10.024l7.954-7.954L15.071.653z" fill="#53bdeb" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Incoming 1 */}
            <div className="wa-bubble-row wa-incoming">
              <div className="wa-bubble wa-bubble-in">
                <div className="wa-bot-header">✅ Dicatat!</div>
                <div className="wa-bot-item"><span className="wa-label">Kategori</span> Belanja · Kebutuhan Rumah</div>
                <div className="wa-bot-item"><span className="wa-label">Nominal</span> Rp185.000</div>
                <div className="wa-bot-item"><span className="wa-label">Metode</span> Debit BCA</div>
                <div className="wa-bubble-meta"><span className="wa-bubble-time">09:32</span></div>
              </div>
            </div>

            {/* Outgoing 2 */}
            <div className="wa-bubble-row wa-outgoing">
              <div className="wa-bubble wa-bubble-out">
                <span>Bayar listrik 250rb 💡</span>
                <div className="wa-bubble-meta">
                  <span className="wa-bubble-time">09:38</span>
                  <svg className="wa-check" width="14" height="9" viewBox="0 0 16 11">
                    <path d="M11.071.653L4.53 7.195 1.414 4.08 0 5.494l4.53 4.53 7.954-7.954L11.071.653z" fill="#53bdeb" />
                    <path d="M15.071.653L8.53 7.195 7.116 5.78l-1.414 1.414L8.53 10.024l7.954-7.954L15.071.653z" fill="#53bdeb" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Incoming 2 */}
            <div className="wa-bubble-row wa-incoming">
              <div className="wa-bubble wa-bubble-in">
                <div className="wa-bot-header">✅ Masuk!</div>
                <div className="wa-bot-item"><span className="wa-label">Kategori</span> Tagihan Listrik</div>
                <div className="wa-bot-item"><span className="wa-label">Nominal</span> Rp250.000</div>
                <div className="wa-today-total">
                  Total hari ini: <strong style={{ color: '#25D366' }}>Rp435.000</strong>
                </div>
                <div className="wa-bubble-meta"><span className="wa-bubble-time">09:38</span></div>
              </div>
            </div>
          </div>

          {/* WA Input bar */}
          <div className="wa-input-bar-hero">
            <div className="wa-input-field-hero">
              <span className="wa-placeholder">Ketik pesan...</span>
            </div>
            <div className="wa-send-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </div>
          </div>

          {/* iPhone home bar */}
          <div className="iphone-home-bar" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   HERO — main export
────────────────────────────────────────────────── */
export function Hero({ onCTAClick }: HeroProps) {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setHeadlineIndex((prev) => (prev + 1) % headlines.length);
        setFading(false);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-wrap">
      <HeroGradient />

      <div className="hero" id="home">
        {/* ── Left: text content ── */}
        <div className="hero-left">
          <div className="hero-supertitle">
            <span className="supertitle-dot" />
            Asisten Keuangan AI via WhatsApp
          </div>

          <h1>
            <span className={`rotating-hl${fading ? ' hl-out' : ''}`}>
              {headlines[headlineIndex]}
            </span>
            <br />
            Pengeluaran terpantau,
            <br />
            keuangan terkendali.
          </h1>

          <p className="hero-sub">
            Catat pengeluaran tanpa ribet — 24/7. Cukup kirim lewat WhatsApp, sisanya MIRA yang urus.
          </p>

          <div className="hero-cta-row">
            <button className="btn-hero" onClick={onCTAClick}>
              Mulai sekarang
            </button>
            <a href="#cara-kerja" className="btn-hero-outline">
              Lihat cara kerja
            </a>
          </div>

          <p className="hero-trust">
            Tanpa download aplikasi baru · Langsung aktif di WhatsApp
          </p>
        </div>

        {/* ── Right: iPhone mockup ── */}
        <div className="hero-right">
          <IPhoneMockup />
        </div>
      </div>
    </div>
  );
}