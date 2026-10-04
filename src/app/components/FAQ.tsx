import { useState, useEffect, useRef } from 'react';
import './FAQ.css';

const faqs = [
  {
    q: 'Apakah AI-nya akurat? Bisa salah?',
    a: 'Pencatatan MIRA sudah dioptimalkan dengan training data khusus keuangan harian Indonesia. Tentu, masih ada kemungkinan kesalahan. Oleh karena itu, untuk hasil terbaik, kirim data yang jelas + info tambahan.<br><br><strong>Contoh:</strong> "Belanja supermarket Rp1.500.000, Debit BCA" → hasil pencatatan jadi lebih presisi.'
  },
  {
    q: 'Bisa export data keuangan?',
    a: 'Bisa banget! Download laporan <strong>Excel (.xlsx)</strong> atau CSV kapan saja dari menu <strong>Export Data</strong> di dashboard — lengkap dengan ringkasan bulanan.<br><br>Cocok untuk pembukuan, laporan bisnis, atau analisis lanjutan di tools favoritmu.'
  },
  {
    q: 'Berapa banyak transaksi per hari?',
    a: 'Tidak ada batasan transaksi untuk pengguna berlangganan. Catat sepuasnya, praktis dan hemat.'
  },
  {
    q: 'Bagaimana cara pakai MIRA?',
    a: 'Daftar pakai Google atau email, lalu kamu langsung masuk ke dashboard MIRA — bisa dibuka dari browser HP maupun laptop, tanpa install aplikasi.<br><br>Selanjutnya, cukup buka <strong>Chat MIRA</strong> lalu:<ul><li>ketik transaksi seperti chat biasa</li><li>kirim foto struk</li><li>atau rekam voice note</li></ul><br>MIRA langsung mencatat, mengelompokkan, dan merapikan keuanganmu.'
  },
  {
    q: 'Apa bedanya MIRA dengan aplikasi money manager lain?',
    a: 'Bedanya ada di <strong>AI</strong>. Di aplikasi lain kamu isi form satu-satu: nominal, kategori, dompet, tanggal. Di MIRA kamu cukup:<ul><li><strong>Foto struk / bukti transfer</strong> — AI baca total, toko, dan metode bayarnya</li><li><strong>Kirim voice note</strong> — "tadi makan siang 35 ribu pake GoPay" langsung tercatat</li><li><strong>Ketik santai</strong> — beberapa transaksi sekaligus, kategorinya diisi otomatis</li><li><strong>Tanya</strong> — "bulan ini jajan kopi habis berapa?" dijawab dari datamu</li><li><strong>Split bill</strong> — foto struk, bilang siapa makan apa, tagihan dibagi per orang</li></ul><br>Plus: tanpa install (langsung di browser), dibuat untuk Rupiah, dan harganya mulai Rp20 ribuan/bulan — aplikasi premium lain bisa Rp600rb–Rp1jt/tahun.'
  },
  {
    q: 'Bisa coba gratis dulu?',
    a: 'Bisa! Selesaikan assessment singkatnya, lalu di halaman paket pakai kode <strong>MIRA100</strong> untuk <strong>trial gratis 7 hari</strong> — semua fitur, tanpa kartu kredit.<br><br>Menjelang trial habis, MIRA ingetin kamu lewat dashboard dan email. Nggak ada tagihan otomatis.'
  },
  {
    q: 'Berapa harga langganannya?',
    a: '<ul><li><strong>Bulanan</strong> — Rp39.000</li><li><strong>3 Bulan</strong> — Rp99.000 (≈ Rp33.000/bulan)</li><li><strong>Tahunan</strong> — Rp249.000 (≈ Rp20.750/bulan, paling hemat)</li></ul><br>Perpanjang kapan aja dari menu <strong>Langganan</strong> di dashboard — sisa hari aktifmu nggak hangus, langsung ditambahkan. Bayar pakai QRIS, e-wallet, transfer bank, atau kartu.'
  },
  {
    q: 'Kalau langganan habis, data saya gimana?',
    a: 'Tetap aman. Kamu masih bisa login dan lihat semua riwayat transaksi, insight, dan export data — cuma belum bisa catat transaksi baru (mode baca saja). Begitu diperpanjang, semuanya langsung jalan lagi.'
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