import { useRef, useEffect, useState } from 'react';
import './DashboardPreview.css';

interface DashboardPreviewProps {
  onCTAClick: () => void;
}

const BARS = [38, 62, 45, 78, 54, 82, 66, 42, 71, 58, 88, 64, 50, 74, 60];
const TXNS = [
  { icon: '🍜', name: 'Makan Siang', merchant: 'GrabFood', amt: '−Rp45rb', isIn: false },
  { icon: '🚗', name: 'Grab Car', merchant: 'Grab', amt: '−Rp32rb', isIn: false },
  { icon: '💰', name: 'Gaji Bulanan', merchant: 'Transfer Masuk', amt: '+Rp8,5jt', isIn: true },
  { icon: '🛍️', name: 'Belanja Online', merchant: 'Shopee', amt: '−Rp210rb', isIn: false },
  { icon: '💡', name: 'Token Listrik', merchant: 'PLN', amt: '−Rp150rb', isIn: false },
];

export function DashboardPreview({ onCTAClick }: DashboardPreviewProps) {
  const revealRef = useRef<HTMLDivElement>(null);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.06 }
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

        {/* ── Browser Mockup ── */}
        <div className="dbprev-mockup-wrap">
          <div className="dbprev-chrome">
            <div className="dbprev-dots"><span /><span /><span /></div>
            <div className="dbprev-url">app.getmira.id/dashboard</div>
          </div>
          <div className="dbprev-body">
            {/* Sidebar */}
            <div className="dbprev-sidebar">
              <div className="dbprev-logo">MIRA</div>
              <div className="dbprev-nav">
                {[
                  { icon: '📊', label: 'Dasbor', active: true },
                  { icon: '📋', label: 'Transaksi' },
                  { icon: '⚙️', label: 'Pengaturan' },
                  { icon: '🤝', label: 'Affiliate' },
                  { icon: '👤', label: 'Profil' },
                ].map((item, i) => (
                  <div key={i} className={`dbprev-navitem${item.active ? ' active' : ''}`}>
                    <span>{item.icon}</span> {item.label}
                  </div>
                ))}
              </div>
              <div className="dbprev-user">
                <div className="dbprev-avatar">R</div>
                <div className="dbprev-uname">Rizky P.</div>
              </div>
            </div>

            {/* Main */}
            <div className="dbprev-main">
              {/* Topbar */}
              <div className="dbprev-topbar">
                <span className="dbprev-page-title">Dasbor Utama</span>
                <div className="dbprev-pills">
                  <span>7H</span><span className="active">30H</span><span>3B</span>
                </div>
                <span className="dbprev-notif">🔔</span>
              </div>

              {/* Stats */}
              <div className="dbprev-stats">
                {[
                  { lbl: 'Pemasukan', val: 'Rp8,5 jt', color: '#16A34A', bg: '#F0FDF4', ico: '💰' },
                  { lbl: 'Pengeluaran', val: 'Rp5,2 jt', color: '#DC2626', bg: '#FFF7ED', ico: '💸' },
                  { lbl: 'Tabungan', val: 'Rp3,3 jt', color: '#2D4BFF', bg: '#E9EDFF', ico: '🏦' },
                  { lbl: 'Transaksi', val: '47', color: '#8B5CF6', bg: '#F5F3FF', ico: '📊' },
                ].map((s, i) => (
                  <div key={i} className="dbprev-stat">
                    <div className="dbprev-stat-ico" style={{ background: s.bg }}>{s.ico}</div>
                    <div className="dbprev-stat-lbl">{s.lbl}</div>
                    <div className="dbprev-stat-val" style={{ color: s.color }}>{s.val}</div>
                    <div className="dbprev-stat-trend" style={{ color: s.color }}>▲ +12%</div>
                  </div>
                ))}
              </div>

              {/* Chart + Transactions */}
              <div className="dbprev-row">
                <div className="dbprev-chart-card">
                  <div className="dbprev-card-title">📈 Tren Pengeluaran 30 Hari</div>
                  <div className="dbprev-bars">
                    {BARS.map((h, i) => (
                      <div key={i} className="dbprev-bar" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="dbprev-txn-card">
                  <div className="dbprev-card-title">📋 Transaksi Terkini</div>
                  {TXNS.map((t, i) => (
                    <div key={i} className="dbprev-txn-row">
                      <span className="dbprev-txn-ico">{t.icon}</span>
                      <div className="dbprev-txn-info">
                        <div className="dbprev-txn-name">{t.name}</div>
                        <div className="dbprev-txn-merchant">{t.merchant}</div>
                      </div>
                      <span className="dbprev-txn-amt" style={{ color: t.isIn ? '#16A34A' : '#DC2626' }}>
                        {t.amt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Video + CTA row ── */}
        <div className="dbprev-video-row">
          <div className="dbprev-video-card" onClick={() => setVideoOpen(true)}>
            <div className="dbprev-video-thumb">
              <div className="dbprev-play-btn">
                <span>▶</span>
              </div>
              <div className="dbprev-video-meta">
                <div className="dbprev-video-tag">VIDEO DEMO</div>
                <div className="dbprev-video-title">Cara Pakai MIRA — 2 Menit</div>
              </div>
            </div>
          </div>

          <div className="dbprev-cta-info">
            <div className="dbprev-cta-badge">🚀 Mulai Hari Ini</div>
            <h3>Chat biasa →<br />laporan langsung jadi</h3>
            <p>
              Kirim "makan siang 45rb gopay" ke MIRA —<br />
              langsung tercatat, terkategorisasi, dan masuk laporan.
            </p>
            <ul className="dbprev-cta-list">
              <li>✅ Tanpa input manual yang ribet</li>
              <li>✅ Bisa kirim foto struk & voice note</li>
              <li>✅ Laporan Excel otomatis setiap bulan</li>
            </ul>
            <button className="btn btn-lg" onClick={onCTAClick}>
              Coba Gratis Sekarang →
            </button>
            <p className="dbprev-cta-note">Tanpa download aplikasi · Langsung aktif</p>
          </div>
        </div>
      </div>

      {/* ── Video Modal ── */}
      {videoOpen && (
        <div className="dbprev-vmodal" onClick={() => setVideoOpen(false)}>
          <div className="dbprev-vmodal-box" onClick={(e) => e.stopPropagation()}>
            <button className="dbprev-vmodal-close" onClick={() => setVideoOpen(false)}>✕</button>
            <div className="dbprev-vmodal-body">
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎬</div>
              <h3>Video Demo MIRA</h3>
              <p>Lihat bagaimana MIRA membantu ribuan pengguna Indonesia<br />mencatat keuangan tanpa effort setiap harinya.</p>
              <button
                className="btn btn-lg"
                style={{ marginTop: '24px' }}
                onClick={() => { setVideoOpen(false); onCTAClick(); }}
              >
                Coba Sendiri Sekarang →
              </button>
              <p style={{ marginTop: '10px', fontSize: '0.78rem', color: 'rgba(255,255,255,.5)' }}>
                Video demo segera hadir — daftar & dapatkan akses pertama!
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
