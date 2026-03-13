import { useEffect, useRef, useState } from 'react';
import './Stats.css';

interface StatsProps {
  onCTAClick: () => void;
}

function useCountUp(target: number, duration = 1800, started = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(target);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return value;
}

function formatThousand(n: number) {
  // Indonesian format: dot as thousands separator
  return n.toLocaleString('id-ID');
}

function formatMillion(n: number) {
  // n is raw value in millions × 10 (e.g. 111 = 11,1M)
  const millions = n / 10;
  const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1).replace('.', ',');
  return `Rp${formatted}M+`;
}

export function Stats({ onCTAClick }: StatsProps) {
  const revealRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            setStarted(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    if (revealRef.current) observer.observe(revealRef.current);
    return () => observer.disconnect();
  }, []);

  const users = useCountUp(12732, 1800, started);
  // 111 represents 11,1 — we store ×10 to handle decimal
  const spending = useCountUp(111, 2000, started);

  return (
    <section className="stats-section">
      <div className="stats-inner reveal" ref={revealRef}>
        <div className="stats-text">
          <span className="section-label">Bergabung Sekarang</span>
          <h2 className="section-title">
            Cara sederhana untuk melacak pengeluaran dan membantu kamu menabung lebih banyak setiap hari.
          </h2>
          <div className="stats-cta">
            <button className="btn btn-white" onClick={onCTAClick}>
              Mulai Sekarang →
            </button>
          </div>
        </div>
        <div className="stats-numbers">
          <div className="stat-item">
            <div className="stat-num">
              {started ? `${formatThousand(users)}+` : '0'}
            </div>
            <div className="stat-label">Pengguna Aktif</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">
              {started ? formatMillion(spending) : 'Rp0M+'}
            </div>
            <div className="stat-label">Pengeluaran Terdokumentasi</div>
          </div>
        </div>
      </div>
    </section>
  );
}