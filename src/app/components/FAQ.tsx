import { useState, useEffect, useRef } from 'react';
import './FAQ.css';

const faqs = [
  {
    q: 'Apakah AI-nya akurat? Bisa salah?',
    a: 'Pencatatan MIRA sudah dioptimalkan dengan training data khusus keuangan harian Indonesia. Tentu, masih ada kemungkinan kesalahan. Oleh karena itu, untuk hasil terbaik, kirim data yang jelas + info tambahan.<br><br><strong>Contoh:</strong> "Belanja supermarket Rp1.500.000, Debit BCA" → hasil pencatatan jadi lebih presisi.'
  },
  {
    q: 'Bisa export data keuangan?',
    a: 'Bisa banget! Setiap ada transaksi baru, MIRA membagikan link laporan terbaru dalam format <strong>Excel (XLS)</strong>.<br><br>Cocok untuk pembukuan, laporan bisnis, atau analisis lanjutan di tools favoritmu.'
  },
  {
    q: 'Berapa banyak transaksi per hari?',
    a: 'Tidak ada batasan transaksi untuk pengguna berlangganan. Catat sepuasnya, praktis dan hemat.'
  },
  {
    q: 'Bagaimana cara kerja MIRA di WhatsApp?',
    a: 'Setelah daftar & berlangganan, kamu akan menerima pesan selamat datang dari MIRA.<br><br>Selanjutnya, cukup:<ul><li>kirim chat transaksi</li><li>foto struk</li><li>atau voice note</li></ul><br>MIRA langsung mencatat dan merapikan keuanganmu.'
  },
  {
    q: 'Apa bedanya MIRA dengan aplikasi money manager lain?',
    a: '<strong>MIRA:</strong><ul><li>✅ Lewat WhatsApp — tanpa download aplikasi</li><li>✅ Dibuat untuk kebiasaan finansial orang Indonesia</li><li>✅ Input bebas: chat, foto, voice note</li><li>✅ Harga jauh lebih terjangkau</li></ul><br><strong>Aplikasi lain:</strong><ul><li>❌ Harus install & setup aplikasi</li><li>❌ Kurang optimal untuk rupiah</li><li>❌ Input transaksi kaku & ribet</li><li>❌ Biaya premium bisa Rp600rb–Rp1jt/tahun</li></ul>'
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
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
    <section className="faq-section" id="faq">
      <div className="center reveal" ref={addRef}>
        <span className="section-label">FAQ</span>
        <h2 className="section-title">Pertanyaan yang Sering Ditanyakan</h2>
      </div>
      <div className="faq-grid">
        {faqs.map((faq, i) => (
          <div key={i} className={`faq-item ${openIndex === i ? 'open' : ''}`}>
            <div className="faq-q" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
              {faq.q}
              <span className="faq-icon">+</span>
            </div>
            <div className="faq-a" dangerouslySetInnerHTML={{ __html: faq.a }} />
          </div>
        ))}
      </div>
    </section>
  );
}