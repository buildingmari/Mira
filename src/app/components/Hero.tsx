import { useEffect, useState } from 'react';
import './Hero.css';
import { HeroGradient } from './HeroGradient';
import { MiraIcon } from './icons/MiraIcon';

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
   iPHONE MOCKUP — MIRA web app chat (dummy conversation)
────────────────────────────────────────────────── */
const WAVE = [5, 9, 13, 7, 11, 15, 8, 12, 6, 10, 14, 7, 9, 5];

function IPhoneMockup() {
  return (
    <div className="iphone-wrap" aria-label="Contoh chat dengan MIRA di web app">
      <div className="iphone-shell">
        {/* Hardware side buttons */}
        <div className="iphone-btn-vol1" />
        <div className="iphone-btn-vol2" />
        <div className="iphone-btn-power" />

        <div className="iphone-screen">
          {/* Dynamic Island */}
          <div className="iphone-island" />

          {/* Status bar */}
          <div className="mc-status-bar">
            <span className="mc-time">09:41</span>
            <div className="mc-status-icons">
              <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
                <rect x="0"    y="6" width="3" height="6"  rx=".5" />
                <rect x="4.5"  y="4" width="3" height="8"  rx=".5" />
                <rect x="9"    y="2" width="3" height="10" rx=".5" />
                <rect x="13.5" y="0" width="3" height="12" rx=".5" />
              </svg>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
                <path d="M8 9.5a1.2 1.2 0 110 2.4A1.2 1.2 0 018 9.5z" />
                <path d="M4.7 7.2a4.7 4.7 0 016.6 0" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                <path d="M2.1 4.6a8.3 8.3 0 0111.8 0" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
              </svg>
              <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
                <rect x=".5" y="1" width="21" height="10" rx="2.5" stroke="currentColor" strokeWidth="1" />
                <rect x="22" y="4" width="2.5" height="4" rx="1" fill="currentColor" opacity=".4" />
                <rect x="2" y="2.5" width="17" height="7" rx="1.5" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Chat MIRA header */}
          <div className="mc-head">
            <div className="mc-head-avatar">M</div>
            <div className="mc-head-info">
              <div className="mc-head-name">Chat MIRA</div>
              <div className="mc-head-status"><span className="mc-head-dot" />Online · halo-mira.com</div>
            </div>
          </div>

          {/* Conversation */}
          <div className="mc-log">
            <div className="mc-row user">
              <div className="mc-bubble user mc-voice">
                <span className="mc-voice-play">
                  <svg width="9" height="10" viewBox="0 0 9 10" fill="white"><path d="M0 0l9 5-9 5z" /></svg>
                </span>
                <span className="mc-wave">{WAVE.map((h, i) => <i key={i} style={{ height: h }} />)}</span>
                <span className="mc-voice-len">0:06</span>
              </div>
            </div>

            <div className="mc-row mira">
              <div className="mc-bubble mira">
                Gajian Rp7.500.000 masuk ke BCA — udah aku catat.
                <div className="mc-total">Pemasukan bulan ini: <strong>Rp7.500.000</strong></div>
              </div>
            </div>

            <div className="mc-row user">
              <div className="mc-bubble user">makan siang 45rb pake gopay, parkir 5rb</div>
            </div>

            <div className="mc-row mira">
              <div className="mc-bubble mira">
                Siap, ada 2 pengeluaran nih:
                <div className="mc-draft">
                  <div className="mc-draft-item">
                    <MiraIcon name="noodles" size={22} />
                    <span className="mc-draft-name">Makan siang<span className="mc-draft-meta">Makanan · GoPay</span></span>
                    <span className="mc-draft-amt">-Rp45.000</span>
                  </div>
                  <div className="mc-draft-item">
                    <MiraIcon name="scooter" size={22} />
                    <span className="mc-draft-name">Parkir<span className="mc-draft-meta">Transport · GoPay</span></span>
                    <span className="mc-draft-amt">-Rp5.000</span>
                  </div>
                </div>
              </div>
              <div className="mc-actions">
                <span className="mc-btn primary">✓ Simpan</span>
                <span className="mc-btn">Edit</span>
                <span className="mc-btn danger">Batal</span>
              </div>
            </div>
          </div>

          {/* Composer */}
          <div className="mc-composer">
            <span className="mc-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </span>
            <span className="mc-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 19v3" />
              </svg>
            </span>
            <span className="mc-input">Tulis pesan ke MIRA...</span>
            <span className="mc-send">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </span>
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
            Asisten Keuangan AI · Web App
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
            Catat pengeluaran tanpa ribet — 24/7. Cukup chat, kirim foto struk, atau voice note ke MIRA, sisanya MIRA yang urus.
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
            Tanpa download aplikasi · Buka dari HP atau laptop
          </p>
        </div>

        {/* ── Right: MIRA web chat mockup ── */}
        <div className="hero-right">
          <IPhoneMockup />
        </div>
      </div>
    </div>
  );
}
