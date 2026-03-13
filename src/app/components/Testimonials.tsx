import { useEffect, useRef } from 'react';
import './Testimonials.css';

const testimonials = [
  {
    stars: 5,
    text: '"Akhirnya nemu cara catat keuangan yang beneran aku lakuin tiap hari. Tinggal kirim pesan ke MIRA, udah beres. Ga perlu buka aplikasi lain!"',
    name: 'Anisa R.',
    role: 'Jakarta · Karyawan Swasta',
    avatar: 'A',
    color: '#2D4BFF',
  },
  {
    stars: 5,
    text: '"Laporan Excel-nya detail banget. Baru sadar selama ini pengeluaran makan siang aku udah gila-gilaan 😅 Sekarang jadi lebih terkontrol."',
    name: 'Budi S.',
    role: 'Surabaya · Freelancer',
    avatar: 'B',
    color: '#22D3EE',
  },
  {
    stars: 5,
    text: '"Foto struk kasir langsung terbaca otomatis, ga perlu ketik manual. MIRA ini beneran ngerti konteks transaksi orang Indonesia."',
    name: 'Clara W.',
    role: 'Bandung · Ibu Rumah Tangga',
    avatar: 'C',
    color: '#6C82FF',
  },
  {
    stars: 5,
    text: '"UMKM saya sekarang pembukuannya rapi banget. Export XLS-nya langsung bisa dikirim ke akuntan. Hemat waktu banget!"',
    name: 'Dian P.',
    role: 'Yogyakarta · Pemilik UMKM',
    avatar: 'D',
    color: '#16A34A',
  },
  {
    stars: 5,
    text: '"Voice note pun bisa langsung dicatat. Lagi nyetir pun bisa sambil laporan pengeluaran. Ini yang aku cari selama ini!"',
    name: 'Eko F.',
    role: 'Medan · Sales Executive',
    avatar: 'E',
    color: '#1F35B8',
  },
  {
    stars: 5,
    text: '"Harganya jauh lebih masuk akal dibanding aplikasi lain. Fiturnya lengkap, bisa export kapan aja tanpa batasan transaksi."',
    name: 'Fanny K.',
    role: 'Semarang · Guru',
    avatar: 'F',
    color: '#0891B2',
  },
  {
    stars: 5,
    text: '"Baru 2 minggu pakai MIRA, langsung ketahuan bocor di mana. Ternyata GoFood aku 40% dari pengeluaran 😂 Game changer banget!"',
    name: 'Galih M.',
    role: 'Depok · Software Engineer',
    avatar: 'G',
    color: '#7C3AED',
  },
  {
    stars: 5,
    text: '"Cocok banget buat yang males buka aplikasi tambahan. Kirim chat biasa, semua ke-track otomatis. Laporan bulanannya juga keren."',
    name: 'Hana S.',
    role: 'Tangerang · Marketing Manager',
    avatar: 'H',
    color: '#BE185D',
  },
  {
    stars: 5,
    text: '"Saya coba beberapa aplikasi keuangan, MIRA yang paling sering aku pakai. Karena pakai WA, jadi ga kerasa lagi pakai aplikasi baru."',
    name: 'Ivan T.',
    role: 'Makassar · Wiraswasta',
    avatar: 'I',
    color: '#B45309',
  },
  {
    stars: 5,
    text: '"Fitur spending alert-nya mantap. Langsung dapat notif kalau udah mau lewat batas harian. Bantu banget ngontrol impulsif beli-beli."',
    name: 'Julia R.',
    role: 'Bali · Content Creator',
    avatar: 'J',
    color: '#047857',
  },
];

export function Testimonials() {
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
        });
      },
      { threshold: 0.08 }
    );
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  // Duplicate for seamless infinite loop
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="testimonials" id="testimoni">
      <div className="center reveal" ref={headerRef}>
        <span className="section-label">Cerita dari Pengguna MIRA</span>
        <h2 className="section-title">Mereka Sudah Merasakan Manfaatnya</h2>
      </div>

      {/* ── Marquee track ── */}
      <div className="testi-marquee-outer">
        {/* fade edges */}
        <div className="testi-fade-left" />
        <div className="testi-fade-right" />

        <div className="testi-marquee-track">
          {doubled.map((t, i) => (
            <div key={i} className="testi-card">
              <div className="testi-stars">{'★'.repeat(t.stars)}</div>
              <p className="testi-text">{t.text}</p>
              <div className="testi-author">
                <div className="testi-avatar" style={{ background: t.color }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-handle">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
