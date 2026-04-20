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
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../components/theme-provider";
import { motion } from "motion/react";
import logo from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";
import { useUserSession } from "../../context/user-session-context";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/dashboard/transactions", label: "Transaksi", icon: Receipt },
  { path: "/dashboard/insights", label: "Insight", icon: TrendingUp },
  { path: "/dashboard/goals", label: "Target", icon: Target },
];

const MORE_ITEMS = [
  { path: "/dashboard/export", label: "Export Data", icon: Download },
  { path: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { logout, userSession } = useUserSession();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isMoreActive = MORE_ITEMS.some((item) => location.pathname === item.path);
  const userName = (userSession?.user as any)?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col h-screen w-56 border-r border-sidebar-border bg-sidebar sticky top-0 flex-shrink-0">
        {/* Workspace header */}
        <div className="px-3 pt-4 pb-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <img src={logo} alt="MIRA" className="h-5 w-5 rounded flex-shrink-0" />
            <span className="text-[13px] font-semibold text-sidebar-foreground tracking-tight">
              MIRA
            </span>
          </div>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 px-2 py-1 overflow-y-auto space-y-px">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-2 px-2 py-[5px] rounded-md text-[13px] transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t border-sidebar-border space-y-px">
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-2 px-2 py-[5px] rounded-md text-[13px] transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <Icon className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-2 pb-4 border-t border-sidebar-border pt-3 space-y-px">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-2 px-2 py-[5px] rounded-md text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-[15px] w-[15px]" strokeWidth={1.8} />
            ) : (
              <Moon className="h-[15px] w-[15px]" strokeWidth={1.8} />
            )}
            <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-[5px] rounded-md text-[13px] text-sidebar-foreground/60 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
          >
            <div className="h-[18px] w-[18px] rounded bg-sidebar-primary flex items-center justify-center text-[10px] font-bold text-sidebar-foreground flex-shrink-0">
              {userInitial}
            </div>
            <span className="flex-1 text-left truncate">{userName}</span>
            <LogOut className="h-3.5 w-3.5 flex-shrink-0 opacity-60" strokeWidth={1.8} />
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex h-12 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="MIRA" className="h-6 w-6 rounded-md" />
              <span className="font-semibold text-[15px] tracking-tight">MIRA</span>
            </div>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 -mr-1 rounded-md hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Page */}
        <main className="flex-1 pb-[72px] lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ───────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border">
        <div className="grid grid-cols-5 h-[60px]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-[3px] transition-all active:opacity-50 select-none ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                <span
                  className={`text-[10px] leading-none ${
                    isActive ? "font-semibold" : "font-normal"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center gap-[3px] transition-all active:opacity-50 select-none ${
              isMoreActive || showMoreMenu ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <MoreHorizontal
              className="h-[22px] w-[22px]"
              strokeWidth={isMoreActive || showMoreMenu ? 2.5 : 1.75}
            />
            <span
              className={`text-[10px] leading-none ${
                isMoreActive || showMoreMenu ? "font-semibold" : "font-normal"
              }`}
            >
              Lainnya
            </span>
          </button>
        </div>
        {/* iOS safe area */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>

      {/* ── More Menu Bottom Sheet ──────────────────────────── */}
      {showMoreMenu && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowMoreMenu(false)}
            className="lg:hidden fixed inset-0 bg-black/20 z-[60] backdrop-blur-[1px]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-background rounded-t-2xl border-t border-border shadow-lg"
          >
            <div className="px-4 pt-3 pb-10">
              {/* Handle */}
              <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-5" />

              <div className="space-y-1">
                {MORE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setShowMoreMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] transition-all active:opacity-60 ${
                        isActive ? "bg-muted font-medium" : "hover:bg-muted/60"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] hover:bg-muted/60 transition-all active:opacity-60"
                >
                  {theme === "dark" ? (
                    <Sun className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  ) : (
                    <Moon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  )}
                  <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
                </button>

                <div className="border-t border-border pt-2 mt-2">
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] text-destructive hover:bg-destructive/8 transition-all active:opacity-60"
                  >
                    <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
