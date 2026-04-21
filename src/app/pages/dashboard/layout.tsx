import { Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  Target,
  Download,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  Plus,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "../../components/theme-provider";
import { motion, AnimatePresence } from "motion/react";
import { useUserSession } from "../../context/user-session-context";
import { PendingAssessmentGate } from "../../components/PendingAssessmentGate";

// ── Nav config ──────────────────────────────────────────────────
const SIDEBAR_SECTIONS = [
  {
    label: "Overview",
    items: [
      { path: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { path: "/dashboard/transactions", label: "Transaksi", Icon: Receipt },
    ],
  },
  {
    label: "Analitik",
    items: [
      { path: "/dashboard/insights", label: "Insight", Icon: TrendingUp },
      { path: "/dashboard/goals", label: "Target", Icon: Target },
    ],
  },
  {
    label: "Akun",
    items: [
      { path: "/dashboard/export", label: "Export Data", Icon: Download },
      { path: "/dashboard/settings", label: "Pengaturan", Icon: Settings },
    ],
  },
];

const MOBILE_NAV = [
  { path: "/dashboard", label: "Home", Icon: LayoutDashboard },
  { path: "/dashboard/transactions", label: "Transaksi", Icon: Receipt },
  { path: "/dashboard/goals", label: "Target", Icon: Target },
  { path: "/dashboard/insights", label: "Insight", Icon: TrendingUp },
];

const PAGE_META: Record<string, { title: string; sub: string }> = {
  "/dashboard":               { title: "Dashboard",    sub: "" },
  "/dashboard/transactions":  { title: "Transaksi",    sub: "Riwayat pengeluaran" },
  "/dashboard/insights":      { title: "Insight",      sub: "Analisis keuangan" },
  "/dashboard/goals":         { title: "Target",       sub: "Progress goal kamu" },
  "/dashboard/export":        { title: "Export Data",  sub: "Unduh data transaksi" },
  "/dashboard/settings":      { title: "Pengaturan",   sub: "Preferensi akun" },
};

export function DashboardLayout() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, userSession } = useUserSession();

  // Auth guard: redirect to landing (login modal) if no session
  useEffect(() => {
    if (!userSession) navigate("/");
  }, [userSession, navigate]);

 // TEMP FIX: bypass auth & assessment gate

const userObj = userSession?.user as any;

// Optional: kalau mau tetep ada loading dikit
if (!userSession) {
  return <div>Loading...</div>;
}

// LANGSUNG LANJUT RENDER (NO GATE)
  const handleLogout = () => { logout(); navigate("/"); };

  const userName    = userObj?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const meta = { ...(PAGE_META[location.pathname] ?? { title: "MIRA", sub: "" }) };
  if (meta.title === "Dashboard") {
    meta.sub = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }) + " \u00B7 Personal";
  }

  const isActive = (p: string) => location.pathname === p;

  return (
    <div
      className="min-h-screen bg-background flex"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── SIDEBAR OVERLAY (mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 z-[299] bg-black/30 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR */}
      <aside
        style={{
          width: 220,
          background: "var(--color-sidebar)",
          borderRight: "1px solid var(--color-sidebar-border)",
          position: "fixed", top: 0, left: 0, bottom: 0,
          display: "flex", flexDirection: "column",
          zIndex: 300,
          transition: "transform .28s cubic-bezier(.4,0,.2,1)",
          transform: sidebarOpen ? "translateX(0)" : undefined,
        }}
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid var(--color-sidebar-border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: -0.5 }}>M</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 16, letterSpacing: -0.5, color: "var(--color-sidebar-foreground)" }}>MIRA</div>
            <div style={{ fontWeight: 300, fontSize: 10, letterSpacing: 0.5, color: "var(--color-muted-foreground)" }}>FINANCE</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--color-muted-foreground)" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.label} style={{ padding: "14px 12px 4px" }}>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--color-muted-foreground)", padding: "0 8px", marginBottom: 4 }}>
                {section.label}
              </div>
              {section.items.map(({ path, label, Icon }) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); setSidebarOpen(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 14, fontWeight: isActive(path) ? 600 : 400,
                    fontFamily: "'DM Sans', sans-serif",
                    background: isActive(path) ? "#EFF6FF" : "transparent",
                    color: isActive(path) ? "#1D4ED8" : "var(--color-muted-foreground)",
                    transition: "background .15s, color .15s",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => { if (!isActive(path)) { (e.currentTarget as HTMLButtonElement).style.background = "var(--color-sidebar-accent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-sidebar-foreground)"; } }}
                  onMouseLeave={e => { if (!isActive(path)) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-muted-foreground)"; } }}
                >
                  <Icon style={{ width: 17, height: 17, flexShrink: 0 }} strokeWidth={isActive(path) ? 2.2 : 1.8} />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--color-sidebar-border)" }}>
          <div style={{ padding: "10px 12px" }}>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, background: "transparent", color: "var(--color-muted-foreground)", fontFamily: "'DM Sans',sans-serif", textAlign: "left" }}
            >
              {theme === "dark" ? <Sun style={{ width: 17, height: 17 }} strokeWidth={1.8} /> : <Moon style={{ width: 17, height: 17 }} strokeWidth={1.8} />}
              {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            </button>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--color-sidebar-border)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 600, color: "#1D4ED8", flexShrink: 0 }}>
              {userInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-sidebar-foreground)", margin: 0 }}>{userName}</p>
              <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>Personal</span>
            </div>
            <button onClick={handleLogout} title="Logout" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--color-muted-foreground)" }}>
              <LogOut style={{ width: 16, height: 16 }} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", marginLeft: 0 }} className="lg:ml-[220px]">

        {/* Desktop topbar */}
        <div
          className="hidden lg:flex"
          style={{
            position: "sticky", top: 0, zIndex: 50,
            background: "rgba(248,249,251,0.92)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--color-border)",
            padding: "14px 32px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 600, margin: 0, color: "var(--color-foreground)" }}>{meta.title}</h1>
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: 0, marginTop: 1 }}>{meta.sub}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "var(--color-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {theme === "dark" ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
            </button>
            <button
              onClick={handleLogout}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#2563EB", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
            >
              <LogOut style={{ width: 14, height: 14 }} strokeWidth={2} />
              Logout
            </button>
          </div>
        </div>

        {/* Mobile topbar */}
        <div
          className="lg:hidden"
          style={{
            position: "sticky", top: 0, zIndex: 100,
            background: "rgba(248,249,251,0.96)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--color-border)",
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
            paddingBottom: 12, paddingLeft: 20, paddingRight: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-foreground)" }}>
                <Menu style={{ width: 22, height: 22 }} strokeWidth={1.8} />
              </button>
              <div style={{ width: 28, height: 28, background: "#2563EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 12 }}>M</span>
              </div>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 600, letterSpacing: -0.5, color: "var(--color-foreground)" }}>MIRA</span>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "var(--color-card)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-foreground)" }}
            >
              {theme === "dark" ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>

        {/* Page */}
        <main style={{ flex: 1, paddingBottom: "calc(68px + env(safe-area-inset-bottom, 0px))" }} className="lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV */}
      <nav
        className="lg:hidden"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(24px) saturate(1.8)",
          borderTop: "1px solid var(--color-border)",
          paddingTop: 8, paddingLeft: 8, paddingRight: 8,
          paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {MOBILE_NAV.slice(0, 2).map(({ path, label, Icon }) => (
            <button key={path} onClick={() => navigate(path)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 4px", border: "none", background: "transparent", cursor: "pointer", fontSize: 10, fontWeight: isActive(path) ? 600 : 400, color: isActive(path) ? "#2563EB" : "#9CA3AF", transition: "color 0.15s", userSelect: "none", fontFamily: "'DM Sans',sans-serif" }}>
              <Icon style={{ width: 22, height: 22, stroke: isActive(path) ? "#2563EB" : "#9CA3AF" }} strokeWidth={isActive(path) ? 2.2 : 1.7} />
              {label}
            </button>
          ))}

          {/* Center FAB */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => navigate("/dashboard/transactions")}
              style={{ width: 50, height: 50, background: "#2563EB", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,0.45)", transition: "transform 0.15s" }}
              onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.9)"; }}
              onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
            >
              <Plus style={{ width: 22, height: 22, stroke: "#fff" }} strokeWidth={2.5} />
            </button>
          </div>

          {MOBILE_NAV.slice(2).map(({ path, label, Icon }) => (
            <button key={path} onClick={() => navigate(path)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 4px", border: "none", background: "transparent", cursor: "pointer", fontSize: 10, fontWeight: isActive(path) ? 600 : 400, color: isActive(path) ? "#2563EB" : "#9CA3AF", transition: "color 0.15s", userSelect: "none", fontFamily: "'DM Sans',sans-serif" }}>
              <Icon style={{ width: 22, height: 22, stroke: isActive(path) ? "#2563EB" : "#9CA3AF" }} strokeWidth={isActive(path) ? 2.2 : 1.7} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
