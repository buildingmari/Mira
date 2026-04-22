import { Outlet, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, Receipt, TrendingUp, Target,
  Download, Settings, LogOut, Moon, Sun, Menu, Plus, X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '../../components/theme-provider';
import { PendingAssessmentGate } from '../../components/PendingAssessmentGate';
import { AddTransactionModal } from '../../components/AddTransactionModal';

const LAYOUT_CSS = `
  #mira-dash-layout {
    display: flex; min-height: 100vh;
    background: #F8F9FB; font-family: 'DM Sans', sans-serif;
  }
  #mira-sidebar {
    width: 220px; background: #fff;
    border-right: 1px solid rgba(0,0,0,0.07);
    position: fixed; top: 0; left: 0; bottom: 0;
    display: flex; flex-direction: column;
    z-index: 300; transition: transform .28s cubic-bezier(.4,0,.2,1);
  }
  #mira-sidebar.mobile-open { transform: translateX(0) !important; }
  #mira-sidebar-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,.3); z-index: 299; backdrop-filter: blur(2px);
  }
  #mira-sidebar-overlay.visible { display: block; }
  #mira-main {
    margin-left: 220px; flex: 1; min-width: 0;
    display: flex; flex-direction: column;
  }
  #mira-topbar {
    position: sticky; top: 0; z-index: 50;
    background: rgba(248,249,251,0.92); backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(0,0,0,0.07);
    padding: 14px 32px; display: flex; align-items: center;
    justify-content: space-between; height: 58px; box-sizing: border-box;
  }
  #mira-mobile-topbar {
    display: none; position: sticky; top: 0; z-index: 100;
    background: rgba(248,249,251,0.96); backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0,0,0,0.07);
    padding: calc(env(safe-area-inset-top,0px) + 12px) 20px 12px;
  }
  #mira-mobile-nav {
    display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
    background: rgba(255,255,255,0.94); backdrop-filter: blur(24px) saturate(1.8);
    border-top: 1px solid rgba(0,0,0,0.07);
    padding: 8px 8px calc(8px + env(safe-area-inset-bottom,0px));
  }
  .mira-nav-btn {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 8px; border: none; cursor: pointer;
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    background: transparent; color: #6B7280;
    transition: background .15s, color .15s; text-align: left;
  }
  .mira-nav-btn:hover { background: #F8F9FB; color: #111827; }
  .mira-nav-btn.active { background: #EFF6FF; color: #1D4ED8; font-weight: 600; }
  .mira-mob-btn {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    gap: 3px; padding: 6px 4px; border: none; background: transparent;
    cursor: pointer; font-size: 10px; font-family: 'DM Sans', sans-serif;
    color: #9CA3AF; user-select: none; transition: color .15s;
  }
  .mira-mob-btn.active { color: #2563EB; font-weight: 600; }
  .sb-x-btn { display: none !important; }
  @media (max-width: 900px) {
    #mira-sidebar { transform: translateX(-220px); }
    #mira-main { margin-left: 0; width: 100%; }
    #mira-topbar { display: none; }
    #mira-mobile-topbar { display: block; }
    #mira-mobile-nav { display: block; }
    .sb-x-btn { display: flex !important; }
  }
`;

const NAV_SECTIONS = [
  { label: 'Overview', items: [
    { path: '/dashboard',              label: 'Dashboard', Icon: LayoutDashboard },
    { path: '/dashboard/transactions', label: 'Transaksi', Icon: Receipt },
  ]},
  { label: 'Analitik', items: [
    { path: '/dashboard/insights', label: 'Insight', Icon: TrendingUp },
    { path: '/dashboard/goals',    label: 'Target',  Icon: Target },
  ]},
  { label: 'Akun', items: [
    { path: '/dashboard/export',   label: 'Export Data', Icon: Download },
    { path: '/dashboard/settings', label: 'Pengaturan',  Icon: Settings },
  ]},
];

const MOB_NAV = [
  { path: '/dashboard',              label: 'Home',      Icon: LayoutDashboard },
  { path: '/dashboard/transactions', label: 'Transaksi', Icon: Receipt },
  { path: '/dashboard/goals',        label: 'Target',    Icon: Target },
  { path: '/dashboard/insights',     label: 'Insight',   Icon: TrendingUp },
];

const PAGE_META: Record<string, { title: string; sub: string }> = {
  '/dashboard':              { title: 'Dashboard',   sub: '' },
  '/dashboard/transactions': { title: 'Transaksi',   sub: 'Riwayat pengeluaran' },
  '/dashboard/insights':     { title: 'Insight',     sub: 'Analisis keuangan' },
  '/dashboard/goals':        { title: 'Target',      sub: 'Progress goal kamu' },
  '/dashboard/export':       { title: 'Export Data', sub: 'Unduh data transaksi' },
  '/dashboard/settings':     { title: 'Pengaturan',  sub: 'Preferensi akun' },
};

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [sbOpen,   setSbOpen]   = useState(false);
  const [ready,    setReady]    = useState(false);
  const [phone,    setPhone]    = useState('');
  const [user,     setUser]     = useState<Record<string, any> | null>(null);
  const [showAdd,  setShowAdd]  = useState(false);

  useEffect(() => {
    const id = 'mira-layout-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = LAYOUT_CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }
    setPhone(ph);
    try { const r = localStorage.getItem('mira_user'); if (r) setUser(JSON.parse(r)); } catch {}
    setReady(true);
  }, []);

  const logout = () => {
    localStorage.removeItem('mira_phone');
    localStorage.removeItem('mira_user');
    navigate('/');
  };

  if (!ready) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FB' }}>
      <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 24, color: '#2563EB' }}>MIRA</div>
    </div>
  );

  if (user?.account_status === 'pending_assessment') {
    return (
      <PendingAssessmentGate
        phone={phone}
        user={user ? { plan_name: user.plan_name, expiry: user.expiry } : null}
        onComplete={() => {
          try {
            const r = localStorage.getItem('mira_user');
            if (r) {
              const c = JSON.parse(r);
              c.account_status = 'active';
              localStorage.setItem('mira_user', JSON.stringify(c));
            }
          } catch {}
          window.location.reload();
        }}
      />
    );
  }

  const name = user?.name || 'User';
  const init = name.charAt(0).toUpperCase();
  const meta = { ...(PAGE_META[location.pathname] ?? { title: 'MIRA', sub: '' }) };
  if (meta.title === 'Dashboard')
    meta.sub = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) + ' \u00b7 Personal';
  const on = (p: string) => location.pathname === p;

  // Refresh page data after successful add
  const handleAddSuccess = () => {
    window.dispatchEvent(new CustomEvent('mira:tx-added'));
  };

  return (
    <div id="mira-dash-layout">

      {/* Add Transaction Modal */}
      {showAdd && (
        <AddTransactionModal
          onClose={() => setShowAdd(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* overlay */}
      <div id="mira-sidebar-overlay" className={sbOpen ? 'visible' : ''} onClick={() => setSbOpen(false)} />

      {/* sidebar */}
      <nav id="mira-sidebar" className={sbOpen ? 'mobile-open' : ''}>
        {/* logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#2563EB', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: -0.5 }}>M</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 16, letterSpacing: -0.5, color: '#111827' }}>MIRA</div>
            <div style={{ fontWeight: 300, fontSize: 10, letterSpacing: 0.5, color: '#6B7280' }}>FINANCE</div>
          </div>
          <button className="sb-x-btn" onClick={() => setSbOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: '#6B7280', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {NAV_SECTIONS.map(sec => (
            <div key={sec.label} style={{ padding: '14px 12px 4px' }}>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#9CA3AF', padding: '0 8px', marginBottom: 4 }}>
                {sec.label}
              </div>
              {sec.items.map(({ path, label, Icon }) => (
                <button key={path} className={`mira-nav-btn${on(path) ? ' active' : ''}`}
                  onClick={() => { navigate(path); setSbOpen(false); }}>
                  <Icon style={{ width: 17, height: 17, flexShrink: 0 }} strokeWidth={on(path) ? 2.2 : 1.8} />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* footer */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ padding: '10px 12px' }}>
            <button className="mira-nav-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark'
                ? <Sun  style={{ width: 17, height: 17, flexShrink: 0 }} strokeWidth={1.8} />
                : <Moon style={{ width: 17, height: 17, flexShrink: 0 }} strokeWidth={1.8} />}
              {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            </button>
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 600, color: '#1D4ED8', flexShrink: 0 }}>
              {init}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827', margin: 0 }}>{name}</p>
              <span style={{ fontSize: 11, color: '#6B7280' }}>Personal</span>
            </div>
            <button onClick={logout} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: '#6B7280', display: 'flex', alignItems: 'center' }}>
              <LogOut style={{ width: 16, height: 16 }} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </nav>

      {/* main */}
      <div id="mira-main">

        {/* desktop topbar */}
        <div id="mira-topbar">
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>{meta.title}</h1>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0, marginTop: 1 }}>{meta.sub}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* + Catat button (desktop) */}
            <button
              onClick={() => setShowAdd(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#2563EB', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 16px', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
              }}
            >
              <Plus style={{ width: 15, height: 15 }} strokeWidth={2.5} /> Catat
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {theme === 'dark' ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
            </button>
            <button onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: '#6B7280', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              <LogOut style={{ width: 14, height: 14 }} strokeWidth={2} /> Logout
            </button>
          </div>
        </div>

        {/* mobile topbar */}
        <div id="mira-mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setSbOpen(true)}
                style={{ background: 'none', border: 'none', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111827' }}>
                <Menu style={{ width: 22, height: 22 }} strokeWidth={1.8} />
              </button>
              <div style={{ width: 28, height: 28, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 12 }}>M</span>
              </div>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 600, letterSpacing: -0.5, color: '#111827' }}>MIRA</span>
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {theme === 'dark' ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>

        {/* page outlet */}
        <div style={{ flex: 1, paddingBottom: 'calc(68px + env(safe-area-inset-bottom,0px))' }}>
          <Outlet />
        </div>
      </div>

      {/* mobile bottom nav */}
      <div id="mira-mobile-nav">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {MOB_NAV.slice(0, 2).map(({ path, label, Icon }) => (
            <button key={path} className={`mira-mob-btn${on(path) ? ' active' : ''}`} onClick={() => navigate(path)}>
              <Icon style={{ width: 22, height: 22, stroke: on(path) ? '#2563EB' : '#9CA3AF' }} strokeWidth={on(path) ? 2.2 : 1.7} />
              {label}
            </button>
          ))}
          {/* Centre FAB — opens Add Transaction modal */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setShowAdd(true)}
              style={{ width: 50, height: 50, background: '#2563EB', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.45)' }}
              onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; }}
              onTouchEnd={e   => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
            >
              <Plus style={{ width: 22, height: 22, stroke: '#fff' }} strokeWidth={2.5} />
            </button>
          </div>
          {MOB_NAV.slice(2).map(({ path, label, Icon }) => (
            <button key={path} className={`mira-mob-btn${on(path) ? ' active' : ''}`} onClick={() => navigate(path)}>
              <Icon style={{ width: 22, height: 22, stroke: on(path) ? '#2563EB' : '#9CA3AF' }} strokeWidth={on(path) ? 2.2 : 1.7} />
              {label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
