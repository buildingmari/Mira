import { useEffect, useRef } from 'react';
import './Compare.css';

export function Compare() {
  const revealRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addRef = (el: HTMLDivElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  return (
    <section className="compare-section">
      <div className="center reveal" ref={addRef}>
        <span className="section-label">Perbandingan</span>
        <h2 className="section-title">Apa Bedanya MIRA dengan Aplikasi Lain?</h2>
      </div>
      <div className="compare-table reveal" ref={addRef}>
        <div className="compare-header">
          <span>Fitur</span>
          <span className="col-mira">MIRA</span>
          <span className="col-other">Aplikasi Lain</span>
        </div>
        <div className="compare-row">
          <span className="feature">Tanpa install aplikasi</span>
          <span className="check">✅</span>
          <span className="cross">❌</span>
        </div>
        <div className="compare-row">
          <span className="feature">Lewat WhatsApp</span>
          <span className="check">✅</span>
          <span className="cross">❌</span>
        </div>
        <div className="compare-row">
          <span className="feature">Optimal untuk Rupiah (IDR)</span>
          <span className="check">✅</span>
          <span className="cross">❌</span>
        </div>
        <div className="compare-row">
          <span className="feature">Input bebas: chat, foto, voice note</span>
          <span className="check">✅</span>
          <span className="cross">❌</span>
        </div>
        <div className="compare-row">
          <span className="feature">Harga jauh lebih terjangkau</span>
          <span className="check">✅</span>
          <span className="cross">❌</span>
        </div>
        <div className="compare-row">
          <span className="feature">Transaksi tak terbatas</span>
          <span className="check">✅</span>
          <span className="cross">❌</span>
        </div>
        <div className="compare-row">
          <span className="feature">Laporan Excel otomatis</span>
          <span className="check">✅</span>
          <span className="cross">❌</span>
        </div>
      </div>
    </section>
  );
}
