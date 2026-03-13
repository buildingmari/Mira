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
  const { logout } = useUserSession();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isMoreActive = MORE_ITEMS.some(item => location.pathname === item.path);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col h-screen w-64 border-r border-sidebar-border bg-sidebar sticky top-0">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={logo} alt="MIRA" className="h-10 w-10 rounded-xl" />
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">MIRA</h1>
              <p className="text-xs text-sidebar-foreground/60">Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[...NAV_ITEMS, ...MORE_ITEMS].map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content - Mobile Optimized */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile Header - Minimal */}
        <div className="lg:hidden sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex h-14 items-center justify-between px-4">
            <img src={logo} alt="MIRA" className="h-8" />
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 -mr-2 rounded-lg hover:bg-accent/10 transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area - Full Height Mobile */}
        <main className="pb-20 lg:pb-0 min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation - App-like */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom">
        <div className="grid grid-cols-5 h-16">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {/* More Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
              isMoreActive || showMoreMenu ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Settings className={`h-5 w-5 ${isMoreActive || showMoreMenu ? "scale-110" : ""} transition-transform`} strokeWidth={isMoreActive || showMoreMenu ? 2.5 : 2} />
            <span className={`text-[10px] ${isMoreActive || showMoreMenu ? "font-semibold" : "font-medium"}`}>
              Lainnya
            </span>
          </button>
        </div>
      </div>

      {/* More Menu Modal - Mobile */}
      {showMoreMenu && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMoreMenu(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-background rounded-t-3xl border-t border-border shadow-2xl pb-safe"
          >
            <div className="p-6">
              {/* Handle Bar */}
              <div className="w-12 h-1 bg-border rounded-full mx-auto mb-6" />

              {/* Menu Items */}
              <div className="space-y-2">
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
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all active:scale-95 ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <Icon className="h-6 w-6" strokeWidth={2} />
                      <span className="text-[16px] font-medium">{item.label}</span>
                    </button>
                  );
                })}

                {/* Theme Toggle */}
                <button
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-accent/50 transition-all active:scale-95"
                >
                  {theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                  <span className="text-[16px] font-medium">
                    {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
                  </span>
                </button>

                {/* Logout */}
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-destructive/10 text-destructive transition-all active:scale-95 border-t border-border mt-4 pt-6"
                >
                  <LogOut className="h-6 w-6" />
                  <span className="text-[16px] font-medium">Keluar</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
