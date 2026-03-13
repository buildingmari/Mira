import { useEffect, useRef } from 'react';
import './ValueProps.css';

export function ValueProps() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reveals = sectionRef.current?.querySelectorAll('.vp-reveal');
    if (!reveals) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('vp-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.07 }
    );

    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="kenapa-section" id="fitur" ref={sectionRef}>
      <div className="kenapa-inner">

        {/* ── Intro headline ── */}
        <div className="kenapa-intro vp-reveal">
          <h2 className="kenapa-intro-hl">
            <strong>Solusi simpel untuk pembukuan harian.</strong>{' '}
            Kelola pengeluaran, pantau tren, dan ekspor laporan — semua dari WhatsApp yang sudah ada di HP kamu.
          </h2>
        </div>

        {/* ── Row 1: Large card (chat demo) + Dashboard card ── */}
        <div className="kenapa-grid-top vp-reveal">

          {/* Card 1 — Catat via WA (large) */}
          <div className="kcard">
            <div className="kcard-top kcard-top-chat">
              {/* gradient wash */}
              <div className="kcard-grad" style={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #2D4BFF 42%, #22D3EE 100%)'
              }} />
              <div className="kcard-top-content">
                <div className="kcard-chat-demo">
                  <div className="kcd-bubble kcd-user">Makan siang 45rb gopay 🍜</div>
                  <div className="kcd-bubble kcd-bot">
                    ✅ <strong>Makan Siang</strong> · Rp45.000 · GoPay
                  </div>
                  <div className="kcd-bubble kcd-user">Foto struk alfamart 📷</div>
                  <div className="kcd-bubble kcd-bot">
                    ✅ <strong>Belanja</strong> · Rp127.500 · Tunai
                  </div>
                </div>
              </div>
            </div>
            <div className="kcard-body">
              <span className="kcard-tag">Catat</span>
              <div className="kcard-title">Catat transaksi via chat, foto, atau suara</div>
              <div className="kcard-desc">Tinggal kirim pesan ke MIRA. Tidak perlu buka aplikasi lain atau isi form apapun.</div>
            </div>
          </div>

          {/* Card 2 — Dashboard mini */}
          <div className="kcard">
            <div className="kcard-top kcard-top-dash">
              <div className="kcard-grad" style={{
                background: 'linear-gradient(135deg, #2D4BFF 0%, #22D3EE 100%)',
                opacity: 0.1
              }} />
              <div className="kcard-dash-mini">
                <div className="kdm-row">
                  <div className="kdm-stat kdm-green">
                    <div className="kdm-lbl">Pemasukan</div>
                    <div className="kdm-val">Rp8,5jt</div>
                  </div>
                  <div className="kdm-stat kdm-red">
                    <div className="kdm-lbl">Pengeluaran</div>
                    <div className="kdm-val">Rp5,2jt</div>
                  </div>
                  <div className="kdm-stat kdm-blue">
                    <div className="kdm-lbl">Tabungan</div>
                    <div className="kdm-val">Rp3,3jt</div>
                  </div>
                </div>
                <div className="kdm-bars">
                  {[55, 72, 45, 88, 60, 78, 92].map((h, i) => (
                    <div
                      key={i}
                      className={`kdm-bar${i === 6 ? ' kdm-bar-active' : ''}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="kcard-body">
              <span className="kcard-tag">Dashboard</span>
              <div className="kcard-title">Semua keuanganmu dalam satu tampilan</div>
              <div className="kcard-desc">Dashboard real-time — lihat tren, analisis pengeluaran, dan insight personal kapanpun.</div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Three equal cards ── */}
        <div className="kenapa-grid-bottom vp-reveal">

          {/* Card 3 — AI kategorisasi */}
          <div className="kcard">
            <div className="kcard-top kcard-top-sm" style={{ justifyContent: 'center', padding: '20px' }}>
              <div className="kcard-grad" style={{
                background: 'linear-gradient(135deg, #0C4A6E 0%, #2D4BFF 100%)',
                opacity: 0.08
              }} />
              <div className="kchips-wrap">
                <span className="kchip kchip-green">🍜 Makan</span>
                <span className="kchip kchip-blue">🚗 Transport</span>
                <span className="kchip kchip-orange">🛍️ Belanja</span>
                <span className="kchip kchip-red">💡 Tagihan</span>
                <span className="kchip kchip-blue">💊 Kesehatan</span>
                <span className="kchip kchip-blue">✈️ Liburan</span>
              </div>
            </div>
            <div className="kcard-body">
              <span className="kcard-tag">AI</span>
              <div className="kcard-title">Kategorisasi otomatis tanpa manual</div>
              <div className="kcard-desc">AI MIRA memahami konteks transaksi Indonesia dan langsung mengelompokkan dengan akurat.</div>
            </div>
          </div>

          {/* Card 4 — Laporan Excel */}
          <div className="kcard">
            <div className="kcard-top kcard-top-sm" style={{ padding: '14px 16px' }}>
              <div className="kcard-grad" style={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #22D3EE 100%)',
                opacity: 0.08
              }} />
              <div className="ke-table">
                <div className="ke-row ke-header">
                  <div className="ke-cell">Tanggal</div>
                  <div className="ke-cell">Nominal</div>
                  <div className="ke-cell">Kategori</div>
                </div>
                <div className="ke-row">
                  <div className="ke-cell">1 Mar</div>
                  <div className="ke-cell">45.000</div>
                  <div className="ke-cell">Makan</div>
                </div>
                <div className="ke-row">
                  <div className="ke-cell">1 Mar</div>
                  <div className="ke-cell">185.000</div>
                  <div className="ke-cell">Belanja</div>
                </div>
                <div className="ke-row">
                  <div className="ke-cell">2 Mar</div>
                  <div className="ke-cell">250.000</div>
                  <div className="ke-cell">Tagihan</div>
                </div>
              </div>
            </div>
            <div className="kcard-body">
              <span className="kcard-tag">Laporan</span>
              <div className="kcard-title">Ekspor Excel bulanan otomatis</div>
              <div className="kcard-desc">Laporan siap pakai tiap bulan. Download kapan saja, bagikan ke akuntan, atau analisis sendiri.</div>
            </div>
          </div>

          {/* Card 5 — Indonesia-optimized */}
          <div className="kcard">
            <div className="kcard-top kcard-top-sm" style={{ justifyContent: 'center', padding: '20px' }}>
              <div className="kcard-grad" style={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #2D4BFF 100%)',
                opacity: 0.07
              }} />
              <div className="kchips-wrap">
                <span className="kchip" style={{ background: '#00AE11', color: '#fff' }}>GoPay</span>
                <span className="kchip" style={{ background: '#4C2082', color: '#fff' }}>OVO</span>
                <span className="kchip" style={{ background: '#118EEA', color: '#fff' }}>DANA</span>
                <span className="kchip" style={{ background: '#005BAA', color: '#fff' }}>BCA</span>
                <span className="kchip" style={{ background: '#E6502A', color: '#fff' }}>QRIS</span>
                <span className="kchip" style={{ background: '#EE4D2D', color: '#fff' }}>Shopee</span>
              </div>
            </div>
            <div className="kcard-body">
              <span className="kcard-tag">Lokal</span>
              <div className="kcard-title">Dioptimalkan untuk Indonesia</div>
              <div className="kcard-desc">GoPay, OVO, DANA, QRIS, transfer bank — MIRA mengerti semua metode pembayaran lokal.</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
