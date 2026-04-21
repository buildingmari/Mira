import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { formatCurrency } from "../../lib/utils";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useUserSession } from "../../context/user-session-context";
import { Wallet, TrendingDown, Target, ArrowRight } from "lucide-react";

// ── Category config ───────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Food: "#2563EB",
  Transport: "#10B981",
  Shopping: "#8B5CF6",
  Entertainment: "#F59E0B",
  Health: "#EF4444",
  Education: "#6366F1",
  Bills: "#EC4899",
  Other: "#6B7280",
};

const CATEGORY_EMOJI: Record<string, string> = {
  Food: "🍜",
  Transport: "🚗",
  Shopping: "🛒",
  Entertainment: "📱",
  Health: "❤️",
  Education: "🎓",
  Bills: "💳",
  Other: "✨",
};

const CATEGORY_BG: Record<string, string> = {
  Food: "#FEE2E2",
  Transport: "#EDE9FE",
  Shopping: "#FEF3C7",
  Entertainment: "#EFF6FF",
  Health: "#D1FAE5",
  Education: "#DBEAFE",
  Bills: "#FCE7F3",
  Other: "#F1F4F8",
};

// ── Helpers (logic unchanged) ─────────────────────────────────────
const getCurrentMonthTransactions = (txns: any[]) => {
  const now = new Date();
  return txns.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
};

const getLast7DaysTransactions = (txns: any[]) => {
  const now = new Date();
  const ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return txns.filter((t) => {
    const d = new Date(t.date);
    return d >= ago && d <= now;
  });
};

const sumTransactions = (txns: any[]) =>
  txns.reduce((s, t) => s + (t.amount || 0), 0);

const groupByCategory = (txns: any[]) => {
  const g: Record<string, number> = {};
  txns.forEach((t) => {
    const c = t.category || "Other";
    g[c] = (g[c] || 0) + (t.amount || 0);
  });
  return g;
};

const groupByWallet = (txns: any[]) => {
  const g: Record<string, number> = {};
  txns.forEach((t) => {
    const w = t.wallet || "Unknown";
    g[w] = (g[w] || 0) + (t.amount || 0);
  });
  return g;
};

const groupByDate = (txns: any[]) => {
  const g: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    g[key] = 0;
  }
  txns.forEach((t) => {
    const key = new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    if (key in g) g[key] += t.amount || 0;
  });
  return g;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi";
  if (h < 17) return "Selamat siang";
  return "Selamat malam";
};

// ── Component ─────────────────────────────────────────────────────
export function DashboardOverview() {
  const navigate = useNavigate();
  const { userSession } = useUserSession();

  const data = useMemo(() => {
    if (!userSession?.transactions || !userSession?.user) return null;
    const txns = userSession.transactions;
    const user = userSession.user as any;
    const monthTxns = getCurrentMonthTransactions(txns);
    const last7 = getLast7DaysTransactions(txns);

    const monthlyLimit = user.monthly_limit || 5000000;
    const savingsGoal = user.savings_goal || 2000000;
    const totalBulanIni = sumTransactions(monthTxns);
    const sisaLimit = monthlyLimit - totalBulanIni;
    const currentSaved = totalBulanIni * 0.3;
    const goalProgress = (currentSaved / savingsGoal) * 100;
    const percentageUsed = (totalBulanIni / monthlyLimit) * 100;
    const status = totalBulanIni <= monthlyLimit ? "On Track" : "Over Budget";

    const catLast7 = groupByCategory(last7);
    let highestCategory = "";
    let highestAmount = 0;
    Object.entries(catLast7).forEach(([cat, amt]) => {
      if (amt > highestAmount) { highestAmount = amt; highestCategory = cat; }
    });

    const dateData = groupByDate(last7);
    const spendingTrendData = Object.entries(dateData).map(([date, amount]) => ({ date, amount }));

    const catData = groupByCategory(monthTxns);
    const categoryChartData = Object.entries(catData).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || "#6B7280",
    }));

    const walletData = groupByWallet(monthTxns);
    const walletChartData = Object.entries(walletData).map(([name, amount]) => ({ name, amount }));

    // Recent 5 transactions sorted newest first
    const recentTxns = [...txns]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      totalBulanIni, sisaLimit, currentSaved, goalProgress,
      percentageUsed, status, highestCategory, highestAmount,
      spendingTrendData, categoryChartData, walletChartData,
      monthlyLimit, savingsGoal, recentTxns,
    };
  }, [userSession]);

  useEffect(() => {
    if (!userSession) navigate("/login");
  }, [userSession, navigate]);

  const userName = (userSession?.user as any)?.name;
  const firstName = userName ? userName.split(" ")[0] : null;

  // Loading
  if (!userSession?.transactions || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Wallet className="h-10 w-10" style={{ color: "#9CA3AF" }} />
        <p style={{ fontSize: 14, color: "#6B7280" }}>Memuat data…</p>
      </div>
    );
  }

  // Empty state
  if (userSession.transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div
          style={{
            width: 64, height: 64, borderRadius: 20,
            background: "#EFF6FF",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Wallet className="h-8 w-8" style={{ color: "#2563EB" }} />
        </div>
        <div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Belum ada transaksi</h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>Mulai catat pengeluaran kamu via WhatsApp</p>
        </div>
      </div>
    );
  }

  const isOnTrack = data.status === "On Track";

  // ── Tooltip styles ──
  const tooltipStyle = {
    backgroundColor: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    fontSize: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  };

  return (
    <div
      style={{
        padding: "28px 32px 40px",
        maxWidth: 960,
        margin: "0 auto",
      }}
      className="dashboard-content"
    >
      <style>{`
        @media (max-width: 900px) {
          .dashboard-content { padding: 20px 16px 24px !important; }
          .hero-stats-right { display: none !important; }
          .two-col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .stats-row { grid-template-columns: repeat(3, minmax(0,1fr)) !important; gap: 8px !important; }
          .stat-card-val { font-size: 15px !important; letter-spacing: -0.5px !important; }
          .stat-card-lbl { font-size: 11px !important; }
          .hero-amount { font-size: 26px !important; }
        }
      `}</style>

      {/* ── Hero Card ───────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%)",
          borderRadius: 20,
          padding: "28px 32px",
          color: "#fff",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 20,
          alignItems: "flex-end",
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
          cursor: "default",
        }}
      >
        {/* Decorative circles */}
        <div style={{ position:"absolute", right:-40, top:-60, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", right:60, bottom:-80, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />

        <div>
          <div style={{ fontSize: 12, opacity: 0.75, letterSpacing: 0.3, marginBottom: 6 }}>Pengeluaran Bulan Ini</div>
          <div className="hero-amount" style={{ fontFamily:"'Sora',sans-serif", fontSize:36, fontWeight:600, letterSpacing:-1.5, lineHeight:1 }}>
            {formatCurrency(data.totalBulanIni)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6, display:"flex", alignItems:"center", gap: 4 }}>
            <span style={{ color: isOnTrack ? "#6EE7B7" : "#FCA5A5", fontWeight: 500 }}>
              {isOnTrack ? "✓" : "!"} {isOnTrack ? "On Track" : "Over Budget"}
            </span>
            <span>dari {formatCurrency(data.monthlyLimit)}</span>
          </div>
        </div>

        <div className="hero-stats-right" style={{ display:"flex", gap:28 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:18, fontWeight:600, letterSpacing:-0.5 }}>
              {formatCurrency(data.sisaLimit)}
            </div>
            <div style={{ fontSize:11, opacity:0.65, marginTop:2 }}>Sisa limit</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:18, fontWeight:600, letterSpacing:-0.5 }}>
              {data.goalProgress.toFixed(0)}%
            </div>
            <div style={{ fontSize:11, opacity:0.65, marginTop:2 }}>Goal progress</div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────── */}
      <div
        className="stats-row"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {/* Spending */}
        <div
          style={{
            background:"var(--color-card)",
            border:"1px solid var(--color-border)",
            borderRadius:16,
            padding:"18px 20px",
          }}
        >
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <TrendingDown style={{ width:17, height:17, stroke:"#2563EB" }} strokeWidth={1.8} />
            </div>
            <span
              style={{
                fontSize:12, padding:"3px 8px", borderRadius:20, fontWeight:500,
                background: isOnTrack ? "#D1FAE5" : "#FEE2E2",
                color: isOnTrack ? "#065F46" : "#991B1B",
              }}
            >
              {isOnTrack ? "▼" : "▲"} {data.percentageUsed.toFixed(0)}%
            </span>
          </div>
          <div className="stat-card-val" style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:600, letterSpacing:-0.8, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {formatCurrency(data.totalBulanIni)}
          </div>
          <div className="stat-card-lbl" style={{ fontSize:12, color:"#6B7280" }}>Pengeluaran</div>
        </div>

        {/* Savings */}
        <div
          style={{
            background:"var(--color-card)",
            border:"1px solid var(--color-border)",
            borderRadius:16,
            padding:"18px 20px",
          }}
        >
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:"#D1FAE5", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Target style={{ width:17, height:17, stroke:"#059669" }} strokeWidth={1.8} />
            </div>
            <span style={{ fontSize:12, padding:"3px 8px", borderRadius:20, fontWeight:500, background:"#D1FAE5", color:"#065F46" }}>
              ▲ {data.goalProgress.toFixed(0)}%
            </span>
          </div>
          <div className="stat-card-val" style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:600, letterSpacing:-0.8, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {formatCurrency(data.currentSaved)}
          </div>
          <div className="stat-card-lbl" style={{ fontSize:12, color:"#6B7280" }}>Tabungan</div>
        </div>

        {/* Status */}
        <div
          style={{
            background:"var(--color-card)",
            border: `1px solid ${isOnTrack ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
            borderRadius:16,
            padding:"18px 20px",
          }}
        >
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div
              style={{
                width:36, height:36, borderRadius:8,
                background: isOnTrack ? "#D1FAE5" : "#FEE2E2",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >
              <span style={{ fontSize:18 }}>{isOnTrack ? "✅" : "⚠️"}</span>
            </div>
          </div>
          <div
            className="stat-card-val"
            style={{
              fontFamily:"'Sora',sans-serif", fontSize:16, fontWeight:600, marginBottom:2,
              color: isOnTrack ? "#065F46" : "#991B1B",
            }}
          >
            {data.status}
          </div>
          <div className="stat-card-lbl" style={{ fontSize:12, color:"#6B7280" }}>
            {isOnTrack ? "Sesuai budget" : "Melebihi budget"}
          </div>
        </div>
      </div>

      {/* ── Two-col: Spending Trend + Category Breakdown ────────── */}
      <div
        className="two-col"
        style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}
      >
        {/* Spending Trend */}
        <div style={{ background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--color-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:600, letterSpacing:-0.3 }}>Tren 7 Hari</h3>
          </div>
          <div style={{ padding:"12px 20px 20px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.spendingTrendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2}
                  dot={{ fill:"#fff", stroke:"#2563EB", r:3, strokeWidth:2 }}
                  activeDot={{ fill:"#2563EB", r:5, strokeWidth:0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category/Budget Breakdown */}
        <div style={{ background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--color-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:600, letterSpacing:-0.3 }}>Budget Bulan Ini</h3>
          </div>
          <div style={{ padding:"8px 20px 16px", display:"flex", flexDirection:"column", gap:14 }}>
            {data.categoryChartData.length === 0 ? (
              <p style={{ fontSize:13, color:"#9CA3AF", padding:"12px 0" }}>Belum ada data</p>
            ) : (
              data.categoryChartData.slice(0, 5).map(({ name, value, color }) => {
                const pct = data.totalBulanIni > 0 ? (value / data.totalBulanIni) * 100 : 0;
                return (
                  <div key={name}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, fontWeight:500 }}>
                        <div style={{ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0 }} />
                        {name}
                      </div>
                      <div style={{ fontSize:12, color:"#6B7280" }}>
                        <strong style={{ fontWeight:500, color:"var(--color-foreground)" }}>{formatCurrency(value)}</strong>
                      </div>
                    </div>
                    <div style={{ height:5, background:"#F1F4F8", borderRadius:99, overflow:"hidden" }}>
                      <div
                        style={{
                          height:"100%", borderRadius:99,
                          background:color,
                          width:`${Math.min(pct, 100)}%`,
                          transition:"width 0.8s cubic-bezier(.4,0,.2,1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Two-col: Recent Transactions + Wallet Usage ─────────── */}
      <div
        className="two-col"
        style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}
      >
        {/* Recent Transactions */}
        <div style={{ background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--color-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:600, letterSpacing:-0.3 }}>Transaksi Terbaru</h3>
            <button
              onClick={() => { const nav = document.querySelector("[data-navigate]"); window.location.hash = ""; (window as any).__navigate?.("/dashboard/transactions"); }}
              style={{ fontSize:12, color:"#6B7280", cursor:"pointer", background:"none", border:"none", padding:"4px 8px", borderRadius:6, display:"flex", alignItems:"center", gap:4 }}
              className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              Lihat semua <ArrowRight style={{ width:12, height:12 }} />
            </button>
          </div>
          <div style={{ padding:"4px 0" }}>
            {data.recentTxns.length === 0 ? (
              <div style={{ padding:"20px", textAlign:"center", color:"#9CA3AF", fontSize:13 }}>Belum ada transaksi</div>
            ) : (
              data.recentTxns.map((t: any, i: number) => {
                const cat = t.category || "Other";
                const emoji = CATEGORY_EMOJI[cat] || "✨";
                const bg = CATEGORY_BG[cat] || "#F1F4F8";
                const dateStr = new Date(t.date).toLocaleDateString("id-ID", { day:"numeric", month:"short" });
                return (
                  <div
                    key={i}
                    style={{
                      display:"flex", alignItems:"center", gap:12,
                      padding:"12px 20px",
                      borderBottom: i < data.recentTxns.length - 1 ? "1px solid var(--color-border)" : "none",
                    }}
                  >
                    <div style={{ width:40, height:40, borderRadius:8, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                      {emoji}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {t.description || t.name || cat}
                      </div>
                      <div style={{ fontSize:11, color:"#9CA3AF", marginTop:2, display:"flex", alignItems:"center", gap:4 }}>
                        <span
                          style={{
                            fontSize:11, padding:"2px 7px", borderRadius:20,
                            background: CATEGORY_BG[cat] || "#F1F4F8",
                            color: CATEGORY_COLORS[cat] || "#6B7280",
                          }}
                        >
                          {cat}
                        </span>
                        {dateStr}
                      </div>
                    </div>
                    <div style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:500, textAlign:"right", flexShrink:0, color:"var(--color-foreground)" }}>
                      − {formatCurrency(t.amount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Wallet Usage */}
        <div style={{ background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:16, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--color-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:600, letterSpacing:-0.3 }}>Penggunaan Dompet</h3>
          </div>
          <div style={{ padding:"12px 20px 20px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.walletChartData} barSize={28}>
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} cursor={{ fill:"#F1F4F8" }} />
                <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Insight Alert ────────────────────────────────────────── */}
      {data.highestCategory && (
        <div
          style={{
            background:"var(--color-card)",
            border:"1px solid var(--color-border)",
            borderRadius:16,
            padding:"16px 20px",
            display:"flex", alignItems:"flex-start", gap:12,
          }}
        >
          <div style={{ width:36, height:36, borderRadius:8, background:"#FEF3C7", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontSize:18 }}>💡</span>
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>Tips hemat minggu ini</p>
            <p style={{ fontSize:13, color:"#6B7280" }}>
              Kategori terbesar minggu ini adalah{" "}
              <strong style={{ color:"var(--color-foreground)" }}>{data.highestCategory}</strong>{" "}
              ({formatCurrency(data.highestAmount)}). Coba kurangi 15% untuk mencapai saving goal kamu.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
