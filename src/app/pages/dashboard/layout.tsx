import { Outlet, useNavigate, useLocation } from 'react-router';
import { LogOut, Moon, Sun, Menu, Plus, X } from 'lucide-react';
import { MiraIcon, type IconName } from '../../components/icons/MiraIcon';
import { useState, useEffect } from 'react';
import { useTheme } from '../../components/theme-provider';
import { PendingAssessmentGate } from '../../components/PendingAssessmentGate';
import { AddTransactionModal } from '../../components/AddTransactionModal';
import { ChatWidget } from '../../components/ChatWidget';
import { clearAuthSession } from '../../lib/auth';
import { InstallHelpSheet, InstallNavButton } from '../../components/InstallApp';
import { RenewSheet, SubscriptionBanner } from '../../components/SubscriptionNotices';
import { RENEW_PATH, requireActive, setSubscriptionUser, subscriptionOf } from '../../lib/subscription';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const H = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };

/** Decode surrogate-pair unicode escapes like \uD83D\uDC4B → 👋 */
function decodeUnicode(str: string): string {
  if (!str) return str;
  try {
    // Handle JS unicode escape sequences in raw strings
    return str.replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  } catch {}
  return str;
}

// Phone chrome sizes. Everything that sits against the mobile top bar or the
// bottom menu (chat page, chat FAB, page padding) uses these variables plus the
// matching env(safe-area-inset-*), so notch / Dynamic Island / home-indicator
// phones and old square-screen ones all line up.
const LAYOUT_CSS = `
  :root { --mira-topbar-h: 60px; --mira-tabbar-h: 62px; }
  html:has(#mira-dash-layout), html:has(#mira-dash-layout) body { background: #F8F9FB; }
  html.dark:has(#mira-dash-layout), html.dark:has(#mira-dash-layout) body { background: #0F172A; }
  /* Installed app: no whole-page rubber band, like a native app shell. */
  html.pwa-standalone:has(#mira-dash-layout), html.pwa-standalone:has(#mira-dash-layout) body { overscroll-behavior-y: none; }
  #mira-dash-layout { -webkit-tap-highlight-color: transparent; }
  #mira-sidebar, #mira-mobile-topbar, #mira-mobile-nav {
    -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
  }
  .mira-wordmark {
    font-family: 'Sora', sans-serif; font-weight: 800; letter-spacing: -0.04em; line-height: 1;
    background: linear-gradient(135deg, #2D4BFF 0%, #22D3EE 100%);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
  }
  #mira-dash-layout {
    display: flex; min-height: 100vh;
    background: #F8F9FB; font-family: 'DM Sans', sans-serif;
  }
  #mira-sidebar {
    width: 220px; background: #fff; box-sizing: border-box;
    padding-bottom: env(safe-area-inset-bottom,0px);
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
    display: none; position: sticky; top: 0; z-index: 100; box-sizing: border-box;
    height: calc(var(--mira-topbar-h) + env(safe-area-inset-top,0px));
    background: rgba(248,249,251,0.96); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0,0,0,0.07);
    padding: env(safe-area-inset-top,0px) max(16px, env(safe-area-inset-right,0px)) 0 max(16px, env(safe-area-inset-left,0px));
  }
  #mira-mobile-topbar > div { height: 100%; }
  /* Bottom menu: fixed-height bar + the home-indicator area below it. */
  #mira-mobile-nav {
    display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 200; box-sizing: border-box;
    height: calc(var(--mira-tabbar-h) + env(safe-area-inset-bottom,0px));
    background: rgba(255,255,255,0.94); backdrop-filter: blur(24px) saturate(1.8); -webkit-backdrop-filter: blur(24px) saturate(1.8);
    border-top: 1px solid rgba(0,0,0,0.07);
    padding: 0 max(6px, env(safe-area-inset-right,0px)) env(safe-area-inset-bottom,0px) max(6px, env(safe-area-inset-left,0px));
  }
  #mira-mobile-nav > div { height: var(--mira-tabbar-h); max-width: 560px; margin: 0 auto; }
  .mira-page-pad { padding-bottom: calc(var(--mira-tabbar-h) + env(safe-area-inset-bottom,0px) + 16px); }
  @media (min-width: 901px) { .mira-page-pad { padding-bottom: 0; } }
  .mira-nav-btn {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 5px 8px; border-radius: 10px; border: none; cursor: pointer;
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    background: transparent; color: #6B7280;
    transition: background .15s, color .15s; text-align: left;
  }
  .mira-nav-btn:hover { background: #F8F9FB; color: #111827; }
  .mira-nav-btn.active { background: #EFF6FF; color: #1D4ED8; font-weight: 600; }
  .mira-mob-btn {
    flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 2px; padding: 0 2px; border: none; background: transparent;
    cursor: pointer; font-size: 10.5px; line-height: 1.2; font-family: 'DM Sans', sans-serif;
    color: #9CA3AF; user-select: none; transition: color .15s, transform .1s; white-space: nowrap;
  }
  .mira-mob-btn:active { transform: scale(.94); }
  .mira-mob-add {
    width: 48px; height: 48px; background: #2563EB; border-radius: 16px; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(37,99,235,0.45); transition: transform .1s;
  }
  .mira-mob-add:active { transform: scale(.9); }
  /* Phone on its side: shorter bars, icon beside the label (like iOS). */
  @media (max-width: 900px) and (max-height: 500px) and (orientation: landscape) {
    :root { --mira-topbar-h: 50px; --mira-tabbar-h: 48px; }
    .mira-mob-btn { flex-direction: row; gap: 6px; font-size: 12px; }
    .mira-mob-add { width: 40px; height: 36px; border-radius: 12px; }
  }
  .mira-mob-btn.active { color: #2563EB; font-weight: 600; }
  .mira-mob-btn svg { transition: filter .15s, opacity .15s; }
  .mira-mob-btn:not(.active) svg { filter: grayscale(1); opacity: .55; }
  .sb-x-btn { display: none !important; }
  @media (max-width: 900px) {
    #mira-sidebar { transform: translateX(-100%); }
    #mira-main { margin-left: 0; width: 100%; }
    .mira-page-pad { padding-left: env(safe-area-inset-left,0px); padding-right: env(safe-area-inset-right,0px); }
    #mira-sidebar { padding-top: env(safe-area-inset-top,0px); padding-left: env(safe-area-inset-left,0px); width: calc(220px + env(safe-area-inset-left,0px)); }
    #mira-topbar { display: none; }
    #mira-mobile-topbar { display: block; }
    #mira-mobile-nav { display: block; }
    .sb-x-btn { display: flex !important; }
  }
`;

const NAV_SECTIONS: { label: string; items: { path: string; label: string; icon: IconName }[] }[] = [
  { label: 'Overview', items: [
    { path: '/dashboard',              label: 'Dashboard',  icon: 'dashboard' },
    { path: '/dashboard/chat',         label: 'Chat MIRA',  icon: 'chat' },
    { path: '/dashboard/transactions', label: 'Transaksi',  icon: 'receipt' },
    { path: '/dashboard/split-bill',   label: 'Split Bill', icon: 'duo' },
  ]},
  { label: 'Analitik', items: [
    { path: '/dashboard/insights', label: 'Insight',          icon: 'growth' },
    { path: '/dashboard/goals',    label: 'Target',           icon: 'target' },
    { path: '/dashboard/assets',   label: 'Aset & Net Worth', icon: 'gem' },
  ]},
  { label: 'Akun', items: [
    { path: RENEW_PATH,             label: 'Langganan',   icon: 'card-clock' },
    { path: '/dashboard/affiliate', label: 'Affiliate',   icon: 'gift' },
    { path: '/dashboard/export',    label: 'Export Data', icon: 'report' },
    { path: '/dashboard/settings',  label: 'Pengaturan',  icon: 'gear' },
  ]},
];

const MOB_NAV: { path: string; label: string; icon: IconName }[] = [
  { path: '/dashboard',              label: 'Home',      icon: 'dashboard' },
  { path: '/dashboard/transactions', label: 'Transaksi', icon: 'receipt' },
  { path: '/dashboard/goals',        label: 'Target',    icon: 'target' },
  { path: '/dashboard/insights',     label: 'Insight',   icon: 'growth' },
];

const PAGE_META: Record<string, { title: string; sub: string }> = {
  '/dashboard':              { title: 'Dashboard',        sub: '' },
  '/dashboard/chat':         { title: 'Chat MIRA',        sub: 'Catat pengeluaran lewat chat' },
  '/dashboard/transactions': { title: 'Transaksi',        sub: 'Semua pemasukan & pengeluaran' },
  '/dashboard/split-bill':   { title: 'Split Bill',       sub: 'Bagi tagihan & catat piutang teman' },
  '/dashboard/insights':     { title: 'Insight',          sub: 'Analisis keuangan' },
  '/dashboard/goals':        { title: 'Target',           sub: 'Progress goal kamu' },
  '/dashboard/export':       { title: 'Export Data',      sub: 'Unduh data transaksi' },
  '/dashboard/settings':     { title: 'Pengaturan',       sub: 'Preferensi akun' },
  '/dashboard/affiliate':    { title: 'Affiliate',        sub: 'Program referral' },
  '/dashboard/assets':       { title: 'Aset & Net Worth', sub: 'Total kekayaan bersih' },
  [RENEW_PATH]:              { title: 'Langganan',        sub: 'Status paket & perpanjangan' },
};

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [sbOpen,  setSbOpen]  = useState(false);
  const [ready,   setReady]   = useState(false);
  const [phone,   setPhone]   = useState('');
  const [user,    setUser]    = useState<Record<string, any> | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const id = 'mira-layout-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = LAYOUT_CSS;
      document.head.appendChild(s);
    }
  }, []);

  // Browser / status-bar colour follows the dashboard background (Android
  // Chrome, installed app), back to white when leaving the dashboard.
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) return;
    // From the theme value, not the <html> class: ThemeProvider applies the
    // class in its own effect, which runs after this child effect.
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    meta.content = dark ? '#0F172A' : '#F8F9FB';
    return () => { meta.content = '#FFFFFF'; };
  }, [theme]);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    // Not logged in (e.g. first launch of the installed app) → straight to login.
    if (!ph) { navigate('/?login=1', { replace: true }); return; }
    setPhone(ph);

    // Hydrate from localStorage first for instant render
    try {
      const raw = localStorage.getItem('mira_user');
      if (raw) { const u = JSON.parse(raw); setUser(u); setSubscriptionUser(u); }
    } catch {}

    setReady(true);

    // Then fetch fresh user data from Supabase
    (async () => {
      try {
        const r = await fetch(
          `${SUPA_URL}/rest/v1/users?primary_phone=eq.${ph}&select=*`,
          { headers: H }
        );
        if (r.ok) {
          const a = await r.json();
          if (Array.isArray(a) && a.length > 0) {
            setUser(a[0]);
            setSubscriptionUser(a[0]);
            localStorage.setItem('mira_user', JSON.stringify(a[0]));
          }
        }
      } catch {}
    })();
  }, []);

  // Home-screen shortcut "Catat transaksi" → /dashboard?add=1
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('add') !== '1' || !localStorage.getItem('mira_phone')) return;
    openAdd();
    q.delete('add');
    navigate({ pathname: location.pathname, search: q.toString() ? `?${q}` : '' }, { replace: true });
  }, [location.search]);

  const openAdd = () => { if (requireActive('Catat transaksi butuh langganan aktif.')) setShowAdd(true); };

  // Fresh trial from signup: drop the marker param once the dashboard is open.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (!q.has('welcome')) return;
    q.delete('welcome');
    navigate({ pathname: location.pathname, search: q.toString() ? `?${q}` : '' }, { replace: true });
  }, [location.search]);

  const logout = () => {
    localStorage.removeItem('mira_phone');
    localStorage.removeItem('mira_user');
    setSubscriptionUser(null);
    clearAuthSession();
    navigate('/');
  };

  if (!ready) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FB' }}>
      <span className="mira-wordmark" style={{ fontSize: 28 }}>MIRA</span>
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

  // Decode unicode escape sequences in name (e.g. "Dio \uD83D\uDC4B" → "Dio 👋")
  const rawName = user?.name || 'User';
  const name    = decodeUnicode(rawName);
  const init    = name.charAt(0).toUpperCase();
  const sub = subscriptionOf(user);
  const planLabel = !sub.active ? 'Tidak aktif'
    : sub.trial ? `Trial · ${sub.daysLeft ?? 0} hari lagi`
    : user?.plan_name || 'Personal';
  const meta = { ...(PAGE_META[location.pathname] ?? { title: 'MIRA', sub: '' }) };
  if (meta.title === 'Dashboard')
    meta.sub = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) + ' · ' + planLabel;
  const on = (p: string) => location.pathname === p;

  const handleAddSuccess = () => {
    window.dispatchEvent(new CustomEvent('mira:tx-added'));
  };

  return (
    <div id="mira-dash-layout">

      {showAdd && (
        <AddTransactionModal
          onClose={() => setShowAdd(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      <div id="mira-sidebar-overlay" className={sbOpen ? 'visible' : ''} onClick={() => setSbOpen(false)} />

      <nav id="mira-sidebar" className={sbOpen ? 'mobile-open' : ''}>
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <span className="mira-wordmark" style={{ fontSize: 24 }}>MIRA</span>
          </div>
          <button className="sb-x-btn" onClick={() => setSbOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: '#6B7280', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {NAV_SECTIONS.map(sec => (
            <div key={sec.label} style={{ padding: '14px 12px 4px' }}>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#9CA3AF', padding: '0 8px', marginBottom: 4 }}>
                {sec.label}
              </div>
              {sec.items.map(({ path, label, icon }) => (
                <button key={path} className={`mira-nav-btn${on(path) ? ' active' : ''}`}
                  onClick={() => { navigate(path); setSbOpen(false); }}>
                  <MiraIcon name={icon} size={28} />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ padding: '10px 12px 0' }}>
            <InstallNavButton className="mira-nav-btn" />
          </div>
          <div style={{ padding: '4px 12px 10px' }}>
            <button className="mira-nav-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {theme === 'dark'
                  ? <Sun  style={{ width: 17, height: 17 }} strokeWidth={1.8} />
                  : <Moon style={{ width: 17, height: 17 }} strokeWidth={1.8} />}
              </span>
              {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            </button>
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 600, color: '#1D4ED8', flexShrink: 0 }}>
              {init}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827', margin: 0 }}>{name}</p>
              <span style={{ fontSize: 11, color: '#6B7280' }}>{planLabel}</span>
            </div>
            <button onClick={logout} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: '#6B7280', display: 'flex', alignItems: 'center' }}>
              <LogOut style={{ width: 16, height: 16 }} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </nav>

      <div id="mira-main">
        <div id="mira-topbar">
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>{meta.title}</h1>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0, marginTop: 1 }}>{meta.sub}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={openAdd}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
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

        <div id="mira-mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setSbOpen(true)}
                style={{ background: 'none', border: 'none', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111827' }}>
                <Menu style={{ width: 22, height: 22 }} strokeWidth={1.8} />
              </button>
              <span className="mira-wordmark" style={{ fontSize: 20 }}>MIRA</span>
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {theme === 'dark' ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>

        <div className="mira-page-pad" style={{ flex: 1 }}>
          <SubscriptionBanner />
          <Outlet />
        </div>
      </div>

      <div id="mira-mobile-nav">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {MOB_NAV.slice(0, 2).map(({ path, label, icon }) => (
            <button key={path} className={`mira-mob-btn${on(path) ? ' active' : ''}`} onClick={() => navigate(path)}>
              <MiraIcon name={icon} size={26} />
              {label}
            </button>
          ))}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <button className="mira-mob-add" onClick={openAdd} aria-label="Catat transaksi">
              <Plus style={{ width: 22, height: 22, stroke: '#fff' }} strokeWidth={2.5} />
            </button>
          </div>
          {MOB_NAV.slice(2).map(({ path, label, icon }) => (
            <button key={path} className={`mira-mob-btn${on(path) ? ' active' : ''}`} onClick={() => navigate(path)}>
              <MiraIcon name={icon} size={26} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <ChatWidget />
      <InstallHelpSheet />
      <RenewSheet />

    </div>
  );
}
