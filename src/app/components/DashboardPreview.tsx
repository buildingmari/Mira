import { useRef, useEffect } from 'react';
import './DashboardPreview.css';

interface DashboardPreviewProps {
  onCTAClick: () => void;
}

export function DashboardPreview({ onCTAClick }: DashboardPreviewProps) {
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.05 }
    );
    if (revealRef.current) observer.observe(revealRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="dbprev-section" id="preview">
      <div className="dbprev-inner reveal" ref={revealRef}>

        <span className="section-label">Dashboard</span>
        <h2 className="section-title">Semua Keuanganmu<br />dalam Satu Tampilan</h2>
        <p className="section-desc">
          Dashboard real-time yang cerdas — lihat tren, analisis pengeluaran,<br />
          dan insight personal kapanpun kamu butuhkan.
        </p>

        <div className="dbprev-devices-row">

          {/* ── Desktop: browser chrome frame ── */}
          <div className="dbprev-browser-frame">
            <div className="dbprev-chrome">
              <div className="dbprev-dots">
                <span /><span /><span />
              </div>
            </div>
            <div className="dbprev-browser-body">
              <img
                src="/assets/Desktop MIRA.png"
                alt="MIRA Dashboard — Desktop"
                className="dbprev-img-desktop"
                draggable={false}
              />
            </div>
          </div>

          {/* ── Mobile screenshot ── */}
          <img
            src="/assets/Mobile MIRA.png"
            alt="MIRA Dashboard — Mobile"
            className="dbprev-img-mobile"
            draggable={false}
          />

        </div>

        {/* ── CTA strip ── */}
        <div className="dbprev-cta-strip">
          <div className="dbprev-cta-info">
            <div className="dbprev-cta-badge">🚀 Mulai Hari Ini</div>
            <h3>Chat biasa →<br />laporan langsung jadi</h3>
            <p>
              Kirim "makan siang 45rb gopay" ke MIRA —<br />
              langsung tercatat, terkategorisasi, dan masuk laporan.
            </p>
            <ul className="dbprev-cta-list">
              <li>✅ Tanpa input manual yang ribet</li>
              <li>✅ Bisa kirim foto struk &amp; voice note</li>
              <li>✅ Laporan Excel otomatis setiap bulan</li>
            </ul>
            <button className="btn btn-lg" onClick={onCTAClick}>
              Coba Gratis Sekarang →
            </button>
            <p className="dbprev-cta-note">Tanpa download aplikasi · Langsung aktif</p>
          </div>
        </div>

      </div>
    </section>
  );
}
