import { useEffect, useRef } from 'react';
import './Compare.css';
import { MiraIcon } from './icons/MiraIcon';

const ROWS: { text: string; ai?: boolean }[] = [
  { text: 'Foto struk / bukti transfer langsung tercatat', ai: true },
  { text: 'Voice note jadi catatan transaksi', ai: true },
  { text: 'Ketik santai ("kopi 25rb pake gopay"), otomatis dikategorikan', ai: true },
  { text: 'Tanya keuanganmu: "bulan ini jajan habis berapa?"', ai: true },
  { text: 'Split bill: foto struk, langsung dibagi per orang', ai: true },
  { text: 'Tanpa install — langsung di browser HP & laptop' },
  { text: 'Dibuat untuk Rupiah & kebiasaan orang Indonesia' },
  { text: 'Transaksi tak terbatas + laporan Excel' },
  { text: 'Mulai Rp20 ribuan/bulan, coba gratis 7 hari' },
];

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
        <p className="section-desc compare-desc">
          Aplikasi keuangan biasa nyuruh kamu isi form satu-satu. MIRA punya <strong>AI</strong> yang ngerjain bagian ribetnya —
          kamu tinggal cerita, foto, atau ngomong.
        </p>
      </div>
      <div className="compare-table reveal" ref={addRef}>
        <div className="compare-header">
          <span>Fitur</span>
          <span className="col-mira">MIRA</span>
          <span className="col-other">Aplikasi Lain</span>
        </div>
        {ROWS.map(({ text, ai }) => (
          <div className="compare-row" key={text}>
            <span className="feature">{ai && <span className="ai-tag">AI</span>}{text}</span>
            <span className="check"><MiraIcon name="check-badge" size={28} tile={false} /></span>
            <span className="cross"><MiraIcon name="nope" size={28} tile={false} /></span>
          </div>
        ))}
      </div>
    </section>
  );
}
