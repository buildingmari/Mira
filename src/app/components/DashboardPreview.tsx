import { useRef, useEffect } from 'react';
import './DashboardPreview.css';

interface DashboardPreviewProps {
  onCTAClick: () => void;
}

// ── static mock data that mirrors real dashboard ──
const TREND = [2, 3, 3, 3, 4, 100, 14];
const TREND_LABELS = ['21 Apr', '22 Apr', '23 Apr', '24 Apr', '25 Apr', '26 Apr', '27 Apr'];
const CATS = [
  { name: 'Makanan',   pct: 95, color: '#2563EB', val: 'Rp14.553.013' },
  { name: 'Kesehatan', pct: 90, color: '#EF4444', val: 'Rp8.000.000'  },
  { name: 'Hiburan',   pct: 8,  color: '#EC4899', val: 'Rp220.000'    },
  { name: 'Transport', pct: 2,  color: '#10B981', val: 'Rp10.000'     },
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
  { icon: '📊', label: 'Dashboard',        active: true  },
  { icon: '📋', label: 'Transaksi',        active: false },
  { icon: '📈', label: 'Insight',          active: false },
  { icon: '🎯', label: 'Target',           active: false },
  { icon: '💼', label: 'Aset & Net Worth', active: false },
  { icon: '🤝', label: 'Affiliate',        active: false },
  { icon: '📤', label: 'Export Data',      active: false },
  { icon: '⚙️', label: 'Pengaturan',       active: false },
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

  // SVG line chart helpers
  const svgW = 260;
  const svgH = 80;
  const padX = 10;
  const padTop = 8;
  const padBottom = 12;
  const chartH = svgH - padTop - padBottom;
  const pts = TREND.map((v, i) => ({
    x: padX + (i / (TREND.length - 1)) * (svgW - 2 * padX),
    y: padTop + chartH - (v / maxBar) * chartH,
  }));
  const linePoints = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = [
    ...pts.map(p => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${padTop + chartH}`,
    `${pts[0].x},${padTop + chartH}`,
  ].join(' ');

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
                  <div className="dbprev-sb-avatar">D</div>
                  <div>
                    <div className="dbprev-sb-uname">Dio</div>
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
                    <div className="dbprev-greeting-title">Selamat pagi, Dio 👋</div>
                    <div className="dbprev-greeting-sub">Senin, 27 April 2026</div>
                  </div>

                  {/* hero card */}
                  <div className="dbprev-hero-card">
                    <div className="dbprev-hero-bg-circle" style={{ right: -30, top: -50, width: 160, height: 160 }} />
                    <div className="dbprev-hero-bg-circle" style={{ right: 50, bottom: -60, width: 120, height: 120 }} />
                    <div>
                      <div className="dbprev-hero-label">Pengeluaran Bulan Ini</div>
                      <div className="dbprev-hero-amount">Rp22.783.013</div>
                      <div className="dbprev-hero-track">
                        <span style={{ color: '#FCA5A5', fontWeight: 600 }}>! Over Budget</span>
                        <span> dari Rp5.000.000</span>
                      </div>
                    </div>
                    <div className="dbprev-hero-right">
                      <div className="dbprev-hero-stat">
                        <div className="dbprev-hero-stat-val">Rp17.783.013</div>
                        <div className="dbprev-hero-stat-lbl">Sisa limit</div>
                      </div>
                      <div className="dbprev-hero-stat">
                        <div className="dbprev-hero-stat-val">100%</div>
                        <div className="dbprev-hero-stat-lbl">Goal progress</div>
                      </div>
                    </div>
                  </div>

                  {/* 3-stat cards */}
                  <div className="dbprev-stat3">
                    <div className="dbprev-stat3-card">
                      <div className="dbprev-stat3-ico" style={{ background: '#EFF6FF' }}>📈</div>
                      <div className="dbprev-stat3-badge" style={{ background: '#FEE2E2', color: '#DC2626' }}>▲ 100%</div>
                      <div className="dbprev-stat3-val">Rp22.783.013</div>
                      <div className="dbprev-stat3-lbl">Pengeluaran</div>
                    </div>
                    <div className="dbprev-stat3-card">
                      <div className="dbprev-stat3-ico" style={{ background: '#D1FAE5' }}>⭐</div>
                      <div className="dbprev-stat3-badge ok">▲ 100%</div>
                      <div className="dbprev-stat3-val">Rp6.834.904</div>
                      <div className="dbprev-stat3-lbl">Tabungan est.</div>
                    </div>
                    <div className="dbprev-stat3-card" style={{ borderColor: 'rgba(239,68,68,0.25)' }}>
                      <div className="dbprev-stat3-ico" style={{ background: '#FEE2E2', fontSize: 16 }}>⚠️</div>
                      <div className="dbprev-stat3-val" style={{ color: '#DC2626', fontSize: 13 }}>Over Budget</div>
                      <div className="dbprev-stat3-lbl">Melebihi budget</div>
                    </div>
                  </div>

                  {/* 2-col charts */}
                  <div className="dbprev-2col">
                    {/* trend LINE chart */}
                    <div className="dbprev-card">
                      <div className="dbprev-card-hdr">Tren 7 Hari</div>
                      <div style={{ padding: '8px 0 0' }}>
                        <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" style={{ display: 'block' }}>
                          <defs>
                            <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {[0.25, 0.5, 0.75].map(f => (
                            <line key={f} x1={padX} y1={padTop + chartH * (1 - f)} x2={svgW - padX} y2={padTop + chartH * (1 - f)} stroke="#F3F4F6" strokeWidth="1" />
                          ))}
                          <polygon fill="url(#lineAreaGrad)" points={areaPoints} />
                          <polyline fill="none" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={linePoints} />
                          {pts.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#2563EB" />
                          ))}
                        </svg>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px 0', marginBottom: '4px' }}>
                          {TREND_LABELS.map(l => <span key={l} style={{ fontSize: '8px', color: '#9CA3AF' }}>{l}</span>)}
                        </div>
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
                <div className="dbprev-mob-greeting">Selamat pagi, Dio 👋</div>
                <div className="dbprev-mob-date">Senin, 27 April 2026</div>

                {/* hero */}
                <div className="dbprev-mob-hero">
                  <div className="dbprev-hero-bg-circle" style={{ right: -20, top: -40, width: 120, height: 120 }} />
                  <div className="dbprev-mob-hero-lbl">Pengeluaran Bulan Ini</div>
                  <div className="dbprev-mob-hero-amt">Rp22.783.013</div>
                  <div className="dbprev-mob-hero-track">
                    <span style={{ color: '#FCA5A5', fontWeight: 600 }}>! Over Budget</span>
                    <span style={{ opacity: 0.7 }}> dari Rp5.000.000</span>
                  </div>
                </div>

                {/* 2 quick stats */}
                <div className="dbprev-mob-stats">
                  <div className="dbprev-mob-stat">
                    <div className="dbprev-mob-stat-ico" style={{ background: '#EFF6FF' }}>📈</div>
                    <div className="dbprev-mob-stat-val">Rp22.783.013</div>
                    <div className="dbprev-mob-stat-lbl">Pengeluaran</div>
                  </div>
                  <div className="dbprev-mob-stat">
                    <div className="dbprev-mob-stat-ico" style={{ background: '#D1FAE5' }}>⭐</div>
                    <div className="dbprev-mob-stat-val">Rp6.834.904</div>
                    <div className="dbprev-mob-stat-lbl">Tabungan</div>
                  </div>
                </div>

                {/* mini LINE chart */}
                <div className="dbprev-mob-card">
                  <div className="dbprev-mob-card-title">Tren 7 Hari</div>
                  <div style={{ padding: '4px 0 0' }}>
                    <svg width="100%" height="54" viewBox="0 0 220 54" preserveAspectRatio="none" style={{ display: 'block' }}>
                      <defs>
                        <linearGradient id="mobLineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon
                        fill="url(#mobLineAreaGrad)"
                        points={[
                          ...TREND.map((v, i) => `${8 + (i / 6) * 204},${6 + 42 - (v / maxBar) * 42}`),
                          '212,48', '8,48',
                        ].join(' ')}
                      />
                      <polyline
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={TREND.map((v, i) => `${8 + (i / 6) * 204},${6 + 42 - (v / maxBar) * 42}`).join(' ')}
                      />
                      {TREND.map((v, i) => (
                        <circle key={i} cx={8 + (i / 6) * 204} cy={6 + 42 - (v / maxBar) * 42} r="2" fill="#2563EB" />
                      ))}
                    </svg>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px 0', marginBottom: '4px' }}>
                      {TREND_LABELS.map(l => <span key={l} style={{ fontSize: '7px', color: '#9CA3AF' }}>{l}</span>)}
                    </div>
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
