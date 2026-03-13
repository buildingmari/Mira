import { useEffect, useRef } from 'react';
import './Upsell.css';

interface UpsellProps {
  onCTAClick: () => void;
}

export function Upsell({ onCTAClick }: UpsellProps) {
  const revealRef = useRef<HTMLDivElement>(null);

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

    if (revealRef.current) observer.observe(revealRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="upsell2" id="coba">
      <div className="upsell2-inner reveal" ref={revealRef}>
        <span className="section-label">Mulai Sekarang</span>
        <h2 className="section-title">Pembukuan tanpa effort.</h2>
        <p className="section-desc">
          Ngobrol aja dengan MIRA lewat chat, foto, atau suara. Semudah chatting di WhatsApp.
        </p>
        <button className="btn btn-lg" onClick={onCTAClick}>
          Gabung Sekarang →
        </button>
        <p style={{ marginTop: '12px', fontSize: '0.8rem', color: '#94A3B8' }}>
          Tanpa download aplikasi baru. Langsung aktif di WhatsApp.
        </p>
      </div>
    </section>
  );
}
