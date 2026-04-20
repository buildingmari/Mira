import { Card, CardContent, CardHeader, CardTitle } from "../../components/card";
import {
  Wallet,
  TrendingDown,
  Target,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
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

const CATEGORY_COLORS: { [key: string]: string } = {
  Food: "#3b82f6",
  Transport: "#8b5cf6",
  Shopping: "#ec4899",
  Entertainment: "#f59e0b",
  Health: "#10b981",
  Education: "#6366f1",
  Bills: "#ef4444",
  Other: "#94a3b8",
};

// ── Helpers (logic unchanged) ────────────────────────────────────────────────

const getCurrentMonthTransactions = (transactions: any[]) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  return transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
};

const getLast7DaysTransactions = (transactions: any[]) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= sevenDaysAgo && date <= now;
  });
};

const sumTransactions = (transactions: any[]) =>
  transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

const groupByCategory = (transactions: any[]) => {
  const grouped: { [key: string]: number } = {};
  transactions.forEach((t) => {
    const category = t.category || "Other";
    grouped[category] = (grouped[category] || 0) + (t.amount || 0);
  });
  return grouped;
};

const groupByWallet = (transactions: any[]) => {
  const grouped: { [key: string]: number } = {};
  transactions.forEach((t) => {
    const wallet = t.wallet || "Unknown";
    grouped[wallet] = (grouped[wallet] || 0) + (t.amount || 0);
  });
  return grouped;
};

const groupByDate = (transactions: any[]) => {
  const grouped: { [key: string]: number } = {};
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
    grouped[dateStr] = 0;
  }
  transactions.forEach((t) => {
    const date = new Date(t.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
    if (grouped[date] !== undefined) {
      grouped[date] += t.amount || 0;
    }
  });
  return grouped;
};

// ── Greeting helper ──────────────────────────────────────────────────────────

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat pagi";
  if (hour < 17) return "Selamat siang";
  return "Selamat malam";
};

const getTodayLabel = () =>
  new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ── Component ────────────────────────────────────────────────────────────────

export function DashboardOverview() {
  const navigate = useNavigate();
  const { userSession } = useUserSession();

  const dashboardData = useMemo(() => {
    if (!userSession || !userSession.transactions || !userSession.user) return null;

    const transactions = userSession.transactions;
    const user = userSession.user;
    const currentMonthTxns = getCurrentMonthTransactions(transactions);
    const last7DaysTxns = getLast7DaysTransactions(transactions);

    const monthlyLimit = user.monthly_limit || 5000000;
    const savingsGoal = user.savings_goal || 2000000;
    const mainWallet = user.main_wallet || "";

    const totalBulanIni = sumTransactions(currentMonthTxns);
    const sisaLimit = monthlyLimit - totalBulanIni;
    const currentSaved = totalBulanIni * 0.3;
    const goalProgress = (currentSaved / savingsGoal) * 100;
    const status = totalBulanIni <= monthlyLimit ? "On Track" : "Over Budget";
    const percentageUsed = (totalBulanIni / monthlyLimit) * 100;

    const categoryLast7Days = groupByCategory(last7DaysTxns);
    let highestCategory = "";
    let highestAmount = 0;
    Object.keys(categoryLast7Days).forEach((cat) => {
      if (categoryLast7Days[cat] > highestAmount) {
        highestAmount = categoryLast7Days[cat];
        highestCategory = cat;
      }
    });

    const dateData = groupByDate(last7DaysTxns);
    const spendingTrendData = Object.keys(dateData).map((date) => ({
      date,
      amount: dateData[date],
    }));

    const categoryData = groupByCategory(currentMonthTxns);
    const categoryChartData = Object.keys(categoryData).map((cat) => ({
      name: cat,
      value: categoryData[cat],
      color: CATEGORY_COLORS[cat] || "#94a3b8",
    }));

    const walletData = groupByWallet(currentMonthTxns);
    const walletChartData = Object.keys(walletData).map((wallet) => ({
      name: wallet,
      amount: walletData[wallet],
    }));

    return {
      totalBulanIni,
      sisaLimit,
      currentSaved,
      goalProgress,
      status,
      percentageUsed,
      highestCategory,
      highestAmount,
      spendingTrendData,
      categoryChartData,
      walletChartData,
      monthlyLimit,
      savingsGoal,
      mainWallet,
    };
  }, [userSession]);

  useEffect(() => {
    if (!userSession) navigate("/login");
  }, [userSession, navigate]);

  const userName = (userSession?.user as any)?.name;
  const greeting = `${getGreeting()}${userName ? ", " + userName.split(" ")[0] : ""}`;

  // ── Loading state ──
  if (!userSession || !userSession.transactions || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-6">
        <Wallet className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Memuat data dashboard…</p>
      </div>
    );
  }

  // ── Empty state ──
  if (userSession.transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-1">Belum ada transaksi</h2>
          <p className="text-sm text-muted-foreground">
            Mulai catat pengeluaran kamu via WhatsApp
          </p>
        </div>
      </div>
    );
  }

  const isOnTrack = dashboardData.status === "On Track";

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-8 pb-8 space-y-8">

      {/* ── Page Header ─────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{greeting} 👋</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{getTodayLabel()}</p>
      </div>

      {/* ── Stats Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Bulan Ini */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Total Bulan Ini</p>
          <p className="text-xl font-bold tracking-tight">
            {formatCurrency(dashboardData.totalBulanIni)}
          </p>
          <p className="text-xs text-muted-foreground">
            dari {formatCurrency(dashboardData.monthlyLimit)}
          </p>
        </div>

        {/* Sisa Limit */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Sisa Limit</p>
          <p className="text-xl font-bold tracking-tight">
            {formatCurrency(dashboardData.sisaLimit)}
          </p>
          <div className="space-y-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${Math.min(dashboardData.percentageUsed, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {dashboardData.percentageUsed.toFixed(0)}% digunakan
            </p>
          </div>
        </div>

        {/* Goal Progress */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Goal Progress</p>
          <p className="text-xl font-bold tracking-tight">
            {formatCurrency(dashboardData.currentSaved)}
          </p>
          <div className="space-y-1">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(dashboardData.goalProgress, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {dashboardData.goalProgress.toFixed(0)}% dari target
            </p>
          </div>
        </div>

        {/* Status */}
        <div
          className={`bg-card border rounded-xl p-4 space-y-1 ${
            isOnTrack ? "border-emerald-200 dark:border-emerald-900" : "border-red-200 dark:border-red-900"
          }`}
        >
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full flex-shrink-0 ${
                isOnTrack ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <p
              className={`text-sm font-semibold ${
                isOnTrack ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {dashboardData.status}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {isOnTrack
              ? "Pengeluaran sesuai budget"
              : "Pengeluaran melebihi budget"}
          </p>
        </div>
      </div>

      {/* ── Insight Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Pengeluaran terbesar minggu ini</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {dashboardData.highestCategory ? (
                <>
                  Kategori{" "}
                  <span className="font-medium text-foreground">
                    {dashboardData.highestCategory}
                  </span>{" "}
                  sebesar {formatCurrency(dashboardData.highestAmount)}
                </>
              ) : (
                "Belum ada data minggu ini"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
          <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
            <Target className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Tips hemat bulan ini</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {dashboardData.highestCategory
                ? `Kurangi ${dashboardData.highestCategory} 15% untuk capai saving goal`
                : "Mulai catat pengeluaran untuk mendapat tips"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Charts ──────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Spending Trend */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-4">Tren 7 Hari Terakhir</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dashboardData.spendingTrendData}>
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2D5BFF"
                strokeWidth={2}
                dot={{ fill: "#2D5BFF", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-4">Kategori Pengeluaran</p>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={dashboardData.categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {dashboardData.categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {dashboardData.categoryChartData.map((category) => (
              <div key={category.name} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{category.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatCurrency(category.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Usage */}
        <div className="bg-card border border-border rounded-xl p-4 lg:col-span-2">
          <p className="text-sm font-semibold mb-4">Penggunaan per Dompet</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashboardData.walletChartData} barSize={32}>
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
              />
              <Bar dataKey="amount" fill="#2D5BFF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
