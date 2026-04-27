import { useRef, useEffect } from 'react';
import './DashboardPreview.css';

interface DashboardPreviewProps {
  onCTAClick: () => void;
}

// ── static mock data that mirrors real dashboard ──
const TREND = [38, 55, 42, 70, 48, 82, 61];
const TREND_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const CATS = [
  { name: 'Makanan',   pct: 38, color: '#2563EB', val: 'Rp1,1jt' },
  { name: 'Transport', pct: 22, color: '#10B981', val: 'Rp640rb' },
  { name: 'Belanja',   pct: 18, color: '#8B5CF6', val: 'Rp520rb' },
  { name: 'Tagihan',   pct: 14, color: '#F59E0B', val: 'Rp410rb' },
  { name: 'Hiburan',   pct: 8,  color: '#EC4899', val: 'Rp230rb' },
];
const TXNS = [
  { emoji: '🍜', name: 'GrabFood',        cat: 'Makanan',   date: '27 Apr', amt: '−Rp45rb',   isIn: false },
  { emoji: '🚗', name: 'Grab Car',         cat: 'Transport', date: '27 Apr', amt: '−Rp32rb',   isIn: false },
  { emoji: '💰', name: 'Gaji Bulanan',     cat: 'Pemasukan', date: '25 Apr', amt: '+Rp8,5jt',  isIn: true  },
  { emoji: '🛒', name: 'Shopee',           cat: 'Belanja',   date: '24 Apr', amt: '−Rp210rb',  isIn: false },
  { emoji: '💡', name: 'PLN Token',        cat: 'Tagihan',   date: '23 Apr', amt: '−Rp150rb',  isIn: false },
];
const MOB_TXNS = TXNS.slice(0, 4);

const NAV_ITEMS = [
  { icon: '📊', label: 'Dashboard',   active: true  },
  { icon: '📋', label: 'Transaksi',   active: false },
  { icon: '📈', label: 'Insight',     active: false },
  { icon: '🎯', label: 'Target',      active: false },
  { icon: '💼', label: 'Aset',        active: false },
  { icon: '🤝', label: 'Affiliate',   active: false },
  { icon: '📤', label: 'Export',      active: false },
  { icon: '⚙️', label: 'Pengaturan',  active: false },
];

export function DashboardPreview({ onCTAClick }: DashboardPreviewProps) {
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.05 }
    );
    if (revealRef.current) observer.observe(revealRef.current);
    return () => observer.disconnect();
  }, []);

  const maxBar = Math.max(...TREND);

  return (
    <section className="dbprev-section" id="preview">
      <div className="dbprev-inner reveal" ref={revealRef}>

        <span className="section-label">Dashboard</span>
        <h2 className="section-title">Semua Keuanganmu<br />dalam Satu Tampilan</h2>
        <p className="section-desc">
          Dashboard real-time yang cerdas — lihat tren, analisis pengeluaran,<br />
          dan insight personal kapanpun kamu butuhkan.
        </p>

        {/* ══ DEVICE SHOWCASE ROW ══ */}
        <div className="dbprev-devices-row">

          {/* ── Desktop browser mockup ── */}
          <div className="dbprev-browser">
            {/* chrome bar */}
            <div className="dbprev-chrome">
              <div className="dbprev-dots"><span /><span /><span /></div>
              <div className="dbprev-url">app.halo-mira.com/dashboard</div>
            </div>

            {/* dashboard shell */}
            <div className="dbprev-shell">

              {/* sidebar */}
              <aside className="dbprev-sb">
                {/* logo */}
                <div className="dbprev-sb-logo">
                  <div className="dbprev-sb-logo-icon">M</div>
                  <div>
                    <div className="dbprev-sb-logo-name">MIRA</div>
                    <div className="dbprev-sb-logo-sub">FINANCE</div>
                  </div>
                </div>

                {/* nav */}
                <div className="dbprev-sb-nav">
                  <div className="dbprev-sb-section-label">Overview</div>
                  {NAV_ITEMS.slice(0, 2).map((item) => (
                    <div key={item.label} className={`dbprev-sb-item${item.active ? ' active' : ''}`}>
                      <span>{item.icon}</span> {item.label}
                    </div>
                  ))}
                  <div className="dbprev-sb-section-label" style={{ marginTop: 10 }}>Analitik</div>
                  {NAV_ITEMS.slice(2, 5).map((item) => (
                    <div key={item.label} className="dbprev-sb-item">
                      <span>{item.icon}</span> {item.label}
                    </div>
                  ))}
                  <div className="dbprev-sb-section-label" style={{ marginTop: 10 }}>Akun</div>
                  {NAV_ITEMS.slice(5).map((item) => (
                    <div key={item.label} className="dbprev-sb-item">
                      <span>{item.icon}</span> {item.label}
                    </div>
                  ))}
                </div>

                {/* user */}
                <div className="dbprev-sb-user">
                  <div className="dbprev-sb-avatar">R</div>
                  <div>
                    <div className="dbprev-sb-uname">Rizky P.</div>
                    <div className="dbprev-sb-uplan">Personal</div>
                  </div>
                </div>
              </aside>

              {/* main content */}
              <main className="dbprev-main">
                {/* topbar */}
                <div className="dbprev-topbar">
                  <div>
                    <div className="dbprev-topbar-title">Dashboard</div>
                    <div className="dbprev-topbar-sub">April 2026 · Personal</div>
                  </div>
                  <div className="dbprev-topbar-actions">
                    <div className="dbprev-catat-btn">+ Catat</div>
                  </div>
                </div>

                {/* scrollable content */}
                <div className="dbprev-content">
                  {/* greeting */}
                  <div className="dbprev-greeting">
                    <div className="dbprev-greeting-title">Selamat siang, Rizky 👋</div>
                    <div className="dbprev-greeting-sub">Senin, 27 April 2026</div>
                  </div>

                  {/* hero card */}
                  <div className="dbprev-hero-card">
                    <div className="dbprev-hero-bg-circle" style={{ right: -30, top: -50, width: 160, height: 160 }} />
                    <div className="dbprev-hero-bg-circle" style={{ right: 50, bottom: -60, width: 120, height: 120 }} />
                    <div>
                      <div className="dbprev-hero-label">Pengeluaran Bulan Ini</div>
                      <div className="dbprev-hero-amount">Rp2,9 jt</div>
                      <div className="dbprev-hero-track">
                        <span className="dbprev-track-ok">▲ On Track</span>
                        <span> dari Rp5,0 jt</span>
                      </div>
                    </div>
                    <div className="dbprev-hero-right">
                      <div className="dbprev-hero-stat">
                        <div className="dbprev-hero-stat-val">Rp2,1jt</div>
                        <div className="dbprev-hero-stat-lbl">Sisa limit</div>
                      </div>
                      <div className="dbprev-hero-stat">
                        <div className="dbprev-hero-stat-val">58%</div>
                        <div className="dbprev-hero-stat-lbl">Goal progress</div>
                      </div>
                    </div>
                  </div>

                  {/* 3-stat cards */}
                  <div className="dbprev-stat3">
                    <div className="dbprev-stat3-card">
                      <div className="dbprev-stat3-ico" style={{ background: '#EFF6FF' }}>📈</div>
                      <div className="dbprev-stat3-badge ok">▼ 58%</div>
                      <div className="dbprev-stat3-val">Rp2,9jt</div>
                      <div className="dbprev-stat3-lbl">Pengeluaran</div>
                    </div>
                    <div className="dbprev-stat3-card">
                      <div className="dbprev-stat3-ico" style={{ background: '#D1FAE5' }}>⭐</div>
                      <div className="dbprev-stat3-badge ok">▲ 58%</div>
                      <div className="dbprev-stat3-val">Rp870rb</div>
                      <div className="dbprev-stat3-lbl">Tabungan est.</div>
                    </div>
                    <div className="dbprev-stat3-card" style={{ borderColor: 'rgba(16,185,129,0.25)' }}>
                      <div className="dbprev-stat3-ico" style={{ background: '#D1FAE5', fontSize: 16 }}>✅</div>
                      <div className="dbprev-stat3-val" style={{ color: '#065F46', fontSize: 13 }}>On Track</div>
                      <div className="dbprev-stat3-lbl">Sesuai budget</div>
                    </div>
                  </div>

                  {/* 2-col charts */}
                  <div className="dbprev-2col">
                    {/* trend chart */}
                    <div className="dbprev-card">
                      <div className="dbprev-card-hdr">Tren 7 Hari</div>
                      <div className="dbprev-bar-chart">
                        {TREND.map((v, i) => (
                          <div key={i} className="dbprev-bar-col">
                            <div
                              className="dbprev-bar-fill"
                              style={{ height: `${(v / maxBar) * 100}%` }}
                            />
                            <div className="dbprev-bar-lbl">{TREND_LABELS[i]}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* category budget */}
                    <div className="dbprev-card">
                      <div className="dbprev-card-hdr">Budget Bulan Ini</div>
                      <div className="dbprev-cats">
                        {CATS.map((c) => (
                          <div key={c.name} className="dbprev-cat-row">
                            <div className="dbprev-cat-top">
                              <div className="dbprev-cat-name">
                                <div className="dbprev-cat-dot" style={{ background: c.color }} />
                                {c.name}
                              </div>
                              <div className="dbprev-cat-val">{c.val}</div>
                            </div>
                            <div className="dbprev-cat-track">
                              <div className="dbprev-cat-fill" style={{ width: `${c.pct}%`, background: c.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* transactions */}
                  <div className="dbprev-card">
                    <div className="dbprev-card-hdr">
                      Transaksi Terbaru
                      <span className="dbprev-see-all">Lihat semua →</span>
                    </div>
                    {TXNS.map((t, i) => (
                      <div key={i} className="dbprev-txn">
                        <div className="dbprev-txn-ico">{t.emoji}</div>
                        <div className="dbprev-txn-info">
                          <div className="dbprev-txn-name">{t.name}</div>
                          <div className="dbprev-txn-meta">
                            <span className="dbprev-txn-cat">{t.cat}</span>
                            {t.date}
                          </div>
                        </div>
                        <div className="dbprev-txn-amt" style={{ color: t.isIn ? '#16A34A' : '#111827' }}>
                          {t.amt}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>{/* end content */}
              </main>
            </div>{/* end shell */}
          </div>{/* end browser */}

          {/* ── Mobile phone mockup ── */}
          <div className="dbprev-phone">
            <div className="dbprev-phone-inner">
              {/* notch */}
              <div className="dbprev-notch" />

              {/* mobile topbar */}
              <div className="dbprev-mob-topbar">
                <div className="dbprev-mob-topbar-left">
                  <div className="dbprev-mob-logo">M</div>
                  <span className="dbprev-mob-logo-text">MIRA</span>
                </div>
              </div>

              {/* mobile content */}
              <div className="dbprev-mob-content">
                {/* greeting */}
                <div className="dbprev-mob-greeting">Selamat siang, Rizky 👋</div>
                <div className="dbprev-mob-date">Senin, 27 April 2026</div>

                {/* hero */}
                <div className="dbprev-mob-hero">
                  <div className="dbprev-hero-bg-circle" style={{ right: -20, top: -40, width: 120, height: 120 }} />
                  <div className="dbprev-mob-hero-lbl">Pengeluaran Bulan Ini</div>
                  <div className="dbprev-mob-hero-amt">Rp2,9 jt</div>
                  <div className="dbprev-mob-hero-track">
                    <span style={{ color: '#6EE7B7', fontWeight: 600 }}>▲ On Track</span>
                    <span style={{ opacity: 0.7 }}> · dari Rp5,0 jt</span>
                  </div>
                </div>

                {/* 2 quick stats */}
                <div className="dbprev-mob-stats">
                  <div className="dbprev-mob-stat">
                    <div className="dbprev-mob-stat-ico" style={{ background: '#EFF6FF' }}>📈</div>
                    <div className="dbprev-mob-stat-val">Rp2,9jt</div>
                    <div className="dbprev-mob-stat-lbl">Pengeluaran</div>
                  </div>
                  <div className="dbprev-mob-stat">
                    <div className="dbprev-mob-stat-ico" style={{ background: '#D1FAE5' }}>⭐</div>
                    <div className="dbprev-mob-stat-val">Rp870rb</div>
                    <div className="dbprev-mob-stat-lbl">Tabungan</div>
                  </div>
                </div>

                {/* mini bar chart */}
                <div className="dbprev-mob-card">
                  <div className="dbprev-mob-card-title">Tren 7 Hari</div>
                  <div className="dbprev-mob-bars">
                    {TREND.map((v, i) => (
                      <div key={i} className="dbprev-mob-bar-col">
                        <div className="dbprev-mob-bar-fill" style={{ height: `${(v / maxBar) * 100}%` }} />
                        <div className="dbprev-mob-bar-lbl">{TREND_LABELS[i]}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* recent txns */}
                <div className="dbprev-mob-card">
                  <div className="dbprev-mob-card-title">Transaksi Terbaru</div>
                  {MOB_TXNS.map((t, i) => (
                    <div key={i} className="dbprev-mob-txn">
                      <div className="dbprev-mob-txn-ico">{t.emoji}</div>
                      <div className="dbprev-mob-txn-info">
                        <div className="dbprev-mob-txn-name">{t.name}</div>
                        <div className="dbprev-mob-txn-sub">{t.cat}</div>
                      </div>
                      <div className="dbprev-mob-txn-amt" style={{ color: t.isIn ? '#16A34A' : '#111827' }}>
                        {t.amt}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* bottom nav */}
              <div className="dbprev-mob-nav">
                {[
                  { ico: '📊', lbl: 'Home',      active: true  },
                  { ico: '📋', lbl: 'Transaksi', active: false },
                  { ico: '+',  lbl: '',           active: false, fab: true },
                  { ico: '🎯', lbl: 'Target',    active: false },
                  { ico: '📈', lbl: 'Insight',   active: false },
                ].map((item, i) =>
                  item.fab ? (
                    <div key={i} className="dbprev-mob-fab">+</div>
                  ) : (
                    <div key={i} className={`dbprev-mob-nav-item${item.active ? ' active' : ''}`}>
                      <span>{item.ico}</span>
                      <span>{item.lbl}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>{/* end devices row */}

        {/* ── CTA strip ── */}
        <div className="dbprev-cta-strip">
          <div className="dbprev-cta-info">
            <div className="dbprev-cta-badge">🚀 Mulai Hari Ini</div>
            <h3>Chat biasa →<br />laporan langsung jadi</h3>
            <p>
              Kirim "makan siang 45rb gopay" ke MIRA —<br />
              langsung tercatat, terkategorisasi, dan masuk laporan.
            </p>
            <ul className="dbprev-cta-list">
              <li>✅ Tanpa input manual yang ribet</li>
              <li>✅ Bisa kirim foto struk &amp; voice note</li>
              <li>✅ Laporan Excel otomatis setiap bulan</li>
            </ul>
            <button className="btn btn-lg" onClick={onCTAClick}>
              Coba Gratis Sekarang →
            </button>
            <p className="dbprev-cta-note">Tanpa download aplikasi · Langsung aktif</p>
          </div>
        </div>

      </div>
    </section>
  );
}
