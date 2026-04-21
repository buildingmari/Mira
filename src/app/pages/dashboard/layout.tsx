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
  Bell,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../components/theme-provider";
import { motion, AnimatePresence } from "motion/react";
import logo from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";
import { useUserSession } from "../../context/user-session-context";

// ── Nav config ────────────────────────────────────────────────────
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

// Bottom nav (mobile) — 4 items + 1 center button = 5 slots
const MOBILE_NAV = [
  { path: "/dashboard", label: "Home", Icon: LayoutDashboard },
  { path: "/dashboard/transactions", label: "Transaksi", Icon: Receipt },
  { path: "/dashboard/goals", label: "Target", Icon: Target },
  { path: "/dashboard/insights", label: "Insight", Icon: TrendingUp },
];

// Page title/subtitle map
const PAGE_META: Record<string, { title: string; sub: string }> = {
  "/dashboard": { title: "Dashboard", sub: "" },
  "/dashboard/transactions": { title: "Transaksi", sub: "Riwayat pengeluaran" },
  "/dashboard/insights": { title: "Insight", sub: "Analisis keuangan" },
  "/dashboard/goals": { title: "Target", sub: "Progress goal kamu" },
  "/dashboard/export": { title: "Export Data", sub: "Unduh data transaksi" },
  "/dashboard/settings": { title: "Pengaturan", sub: "Preferensi akun" },
};

const monthSub = () =>
  new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }) +
  " \u00B7 Personal";

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, userSession } = useUserSession();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userName = (userSession?.user as any)?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const meta = PAGE_META[location.pathname] || {
    title: "MIRA",
    sub: "",
  };
  if (meta.title === "Dashboard") meta.sub = monthSub();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── SIDEBAR OVERLAY (mobile) ─────────────────────────────── */}
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

      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-[300] flex flex-col
          w-[220px] bg-sidebar border-r border-sidebar-border
          transition-transform duration-[280ms] ease-[cubic-bezier(.4,0,.2,1)]
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="px-5 py-[22px] pb-[18px] border-b border-sidebar-border flex items-center gap-[10px]">
          <div
            style={{
              width: 32, height: 32,
              background: "#2563EB",
              borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#fff", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: -0.5 }}>M</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 16, letterSpacing: -0.5 }} className="text-sidebar-foreground">
              MIRA
            </div>
            <div style={{ fontWeight: 300, fontSize: 10, letterSpacing: 0.5, marginTop: -1 }} className="text-muted-foreground">
              FINANCE
            </div>
          </div>
          {/* Close on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-2">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.label} className="px-3 py-5 pb-1">
              <div
                style={{
                  fontSize: 10, fontWeight: 500, letterSpacing: "0.8px",
                  textTransform: "uppercase", marginBottom: 4, padding: "0 8px",
                }}
                className="text-muted-foreground"
              >
                {section.label}
              </div>
              {section.items.map(({ path, label, Icon }) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); setSidebarOpen(false); }}
                  className={`
                    w-full flex items-center gap-[10px] px-[10px] py-[9px]
                    rounded-[8px] text-[14px] transition-all duration-150
                    cursor-pointer select-none
                    ${
                      isActive(path)
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }
                  `}
                >
                  <Icon className="h-[17px] w-[17px] flex-shrink-0" strokeWidth={isActive(path) ? 2.2 : 1.8} />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer: theme + user */}
        <div className="border-t border-sidebar-border">
          <div className="px-3 py-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-full flex items-center gap-[10px] px-[10px] py-[9px] rounded-[8px] text-[14px] text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer"
            >
              {theme === "dark"
                ? <Sun className="h-[17px] w-[17px] flex-shrink-0" strokeWidth={1.8} />
                : <Moon className="h-[17px] w-[17px] flex-shrink-0" strokeWidth={1.8} />}
              {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            </button>
          </div>
          <div className="px-5 py-[14px] border-t border-sidebar-border flex items-center gap-[10px]">
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "#DBEAFE",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 600, color: "#1D4ED8",
                flexShrink: 0,
              }}
            >
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-sidebar-foreground truncate">{userName}</p>
              <span className="text-[11px] text-muted-foreground">Personal</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[220px]">

        {/* Desktop topbar */}
        <div
          className="hidden lg:flex sticky top-0 z-50 items-center justify-between"
          style={{
            background: "rgba(248,249,251,0.92)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--color-border)",
            padding: "14px 32px",
          }}
        >
          <div>
            <h1
              style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 600 }}
              className="text-foreground"
            >
              {meta.title}
            </h1>
            <p className="text-[12px] text-muted-foreground mt-[1px]">{meta.sub}</p>
          </div>
          <div className="flex items-center gap-[10px]">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{
                width: 36, height: 36, borderRadius: 8,
                border: "1px solid var(--color-border-md, rgba(0,0,0,0.12))",
                background: "var(--color-card)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
              className="hover:bg-muted transition-colors"
            >
              {theme === "dark"
                ? <Sun className="h-4 w-4 text-foreground" />
                : <Moon className="h-4 w-4 text-foreground" />}
            </button>
            <button
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#2563EB", color: "#fff",
                border: "none", borderRadius: 8,
                padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}
              className="hover:opacity-90 transition-opacity active:scale-95"
            >
              <LogOut className="h-[14px] w-[14px]" strokeWidth={2} />
              Logout
            </button>
          </div>
        </div>

        {/* Mobile topbar */}
        <div
          className="lg:hidden sticky top-0 z-[100]"
          style={{
            background: "rgba(248,249,251,0.96)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--color-border)",
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
            paddingBottom: 12,
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                style={{ border: "none", background: "transparent", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                className="text-foreground"
              >
                <Menu className="h-[22px] w-[22px]" strokeWidth={1.8} />
              </button>
              <div
                style={{
                  width: 28, height: 28, background: "#2563EB",
                  borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ color: "#fff", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 12 }}>M</span>
              </div>
              <span
                style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 600, letterSpacing: -0.5 }}
                className="text-foreground"
              >
                MIRA
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: "1px solid var(--color-border-md, rgba(0,0,0,0.12))",
                  background: "var(--color-card)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
                className="text-foreground hover:bg-muted transition-colors"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main
          style={{
            flex: 1,
            paddingBottom: "calc(68px + env(safe-area-inset-bottom, 0px))",
          }}
          className="lg:pb-0"
        >
          <Outlet />
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[200]"
        style={{
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(24px) saturate(1.8)",
          borderTop: "1px solid var(--color-border)",
          paddingTop: 8,
          paddingLeft: 8,
          paddingRight: 8,
          paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex items-center">
          {/* Home */}
          {MOBILE_NAV.slice(0, 2).map(({ path, label, Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3,
                padding: "6px 4px",
                borderRadius: 8, border: "none", background: "transparent",
                cursor: "pointer",
                fontSize: 10, fontWeight: 400,
                color: isActive(path) ? "#2563EB" : "#9CA3AF",
                transition: "color 0.15s",
                userSelect: "none",
              }}
            >
              <Icon
                style={{ width: 22, height: 22, stroke: isActive(path) ? "#2563EB" : "#9CA3AF" }}
                strokeWidth={isActive(path) ? 2.2 : 1.7}
              />
              {label}
            </button>
          ))}

          {/* Center Add Button */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <button
              onClick={() => navigate("/dashboard/transactions")}
              style={{
                width: 50, height: 50,
                background: "#2563EB",
                borderRadius: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", cursor: "pointer",
                boxShadow: "0 4px 16px rgba(37,99,235,0.45)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.9)")}
              onMouseUp={e => (e.currentTarget.style.transform = "")}
              onTouchStart={e => (e.currentTarget.style.transform = "scale(0.9)")}
              onTouchEnd={e => (e.currentTarget.style.transform = "")}
            >
              <Plus style={{ width: 22, height: 22, stroke: "#fff" }} strokeWidth={2.5} />
            </button>
          </div>

          {/* Goals + Insight */}
          {MOBILE_NAV.slice(2).map(({ path, label, Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3,
                padding: "6px 4px",
                borderRadius: 8, border: "none", background: "transparent",
                cursor: "pointer",
                fontSize: 10, fontWeight: 400,
                color: isActive(path) ? "#2563EB" : "#9CA3AF",
                transition: "color 0.15s",
                userSelect: "none",
              }}
            >
              <Icon
                style={{ width: 22, height: 22, stroke: isActive(path) ? "#2563EB" : "#9CA3AF" }}
                strokeWidth={isActive(path) ? 2.2 : 1.7}
              />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
