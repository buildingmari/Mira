import { useEffect, useRef } from 'react';
import './Process.css';

export function Process() {
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
    <section className="process" id="cara-kerja">
      <div className="center reveal" ref={addRef}>
        <span className="section-label">Cara Kerja</span>
        <h2 className="section-title">Semudah Chat Biasa</h2>
        <p className="section-desc">4 langkah sederhana dan keuanganmu langsung terkelola rapi.</p>
      </div>
      <div className="process-steps reveal" ref={addRef}>
        <div className="step">
          <div className="step-num">1</div>
          <h3>Kirim Resi / Teks / Audio</h3>
          <p>Chat natural atau foto struk ke MIRA</p>
        </div>
        <div className="step">
          <div className="step-num">2</div>
          <h3>MIRA Merespons</h3>
          <p>AI membaca dan memahami transaksimu</p>
        </div>
        <div className="step">
          <div className="step-num">3</div>
          <h3>Kategorisasi Otomatis</h3>
          <p>MIRA mengelompokkan berdasarkan jenis pengeluaran</p>
        </div>
        <div className="step">
          <div className="step-num">4</div>
          <h3>Pembukuan Tersimpan</h3>
          <p>Laporan Excel siap unduh kapan saja</p>
        </div>
      </div>
    </section>
  );
}
