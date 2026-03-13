import { Card, CardContent, CardHeader, CardTitle } from "../../components/card";
import {
  Wallet,
  TrendingDown,
  Target,
  AlertCircle,
  ArrowUp,
  ArrowDown,
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
import { motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useUserSession } from "../../context/user-session-context";

const CATEGORY_COLORS: { [key: string]: string } = {
  Food: "#00ff88",
  Transport: "#3b82f6",
  Shopping: "#8b5cf6",
  Entertainment: "#f59e0b",
  Health: "#10b981",
  Education: "#ec4899",
  Bills: "#ef4444",
  Other: "#6b7280",
};

// Helper functions
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

const sumTransactions = (transactions: any[]) => {
  return transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
};

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
  
  // Get last 7 days
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
    dates.push(dateStr);
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

export function DashboardOverview() {
  const navigate = useNavigate();
  const { userSession } = useUserSession();

  // Calculate all data from userSession.transactions
  const dashboardData = useMemo(() => {
    if (!userSession || !userSession.transactions || !userSession.user) {
      return null;
    }

    const transactions = userSession.transactions;
    const user = userSession.user;
    const currentMonthTxns = getCurrentMonthTransactions(transactions);
    const last7DaysTxns = getLast7DaysTransactions(transactions);

    // Get user settings
    const monthlyLimit = user.monthly_limit || 5000000; // Fallback if not set
    const savingsGoal = user.savings_goal || 2000000; // Fallback if not set
    const mainWallet = user.main_wallet || ""; // Main wallet preference

    // 1. Total Bulan Ini
    const totalBulanIni = sumTransactions(currentMonthTxns);

    // 2. Sisa Limit (monthly_limit - Total Bulan Ini)
    const sisaLimit = monthlyLimit - totalBulanIni;

    // 3. Goal Progress (Total saved / savings_goal)
    // Use 30% of spending as temporary savings calculation
    const currentSaved = totalBulanIni * 0.3;
    const goalProgress = (currentSaved / savingsGoal) * 100;

    // 4. Status
    const status = totalBulanIni <= monthlyLimit ? "On Track" : "Over Budget";
    const percentageUsed = (totalBulanIni / monthlyLimit) * 100;

    // 5. Pengeluaran terbesar minggu ini (highest category in last 7 days)
    const categoryLast7Days = groupByCategory(last7DaysTxns);
    let highestCategory = "";
    let highestAmount = 0;
    Object.keys(categoryLast7Days).forEach((cat) => {
      if (categoryLast7Days[cat] > highestAmount) {
        highestAmount = categoryLast7Days[cat];
        highestCategory = cat;
      }
    });

    // 6. 7-Day Spending Trend
    const dateData = groupByDate(last7DaysTxns);
    const spendingTrendData = Object.keys(dateData).map((date) => ({
      date,
      amount: dateData[date],
    }));

    // 7. Category Breakdown
    const categoryData = groupByCategory(currentMonthTxns);
    const categoryChartData = Object.keys(categoryData).map((cat) => ({
      name: cat,
      value: categoryData[cat],
      color: CATEGORY_COLORS[cat] || "#6b7280",
    }));

    // 8. Wallet Usage
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

  // Redirect to login if no session
  useEffect(() => {
    if (!userSession) {
      navigate("/login");
    }
  }, [userSession, navigate]);

  // Show loading/empty state if no userSession or transactions
  if (!userSession || !userSession.transactions || !dashboardData) {
    return (
      <div className="p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">
            Memuat data dashboard
          </p>
        </div>
      </div>
    );
  }

  // Show empty state if no transactions
  if (userSession.transactions.length === 0) {
    return (
      <div className="p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Belum ada transaksi</h2>
          <p className="text-muted-foreground">
            Mulai catat pengeluaran kamu via WhatsApp
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Overview</h1>
        <p className="text-muted-foreground">
          Ringkasan keuangan kamu bulan ini
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Bulan Ini
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData.totalBulanIni)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                dari limit {formatCurrency(dashboardData.monthlyLimit)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sisa Limit</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData.sisaLimit)}
              </div>
              <div className="mt-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-500"
                    style={{ width: `${Math.min(dashboardData.percentageUsed, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.percentageUsed.toFixed(0)}% dari limit
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Goal Progress
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData.currentSaved)}
              </div>
              <div className="mt-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-500"
                    style={{ width: `${Math.min(dashboardData.goalProgress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.goalProgress.toFixed(0)}% dari target
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={dashboardData.status === "On Track" ? "border-accent/50" : "border-destructive/50"}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <AlertCircle className={`h-4 w-4 ${dashboardData.status === "On Track" ? "text-accent" : "text-destructive"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold ${dashboardData.status === "On Track" ? "text-accent" : "text-destructive"}`}>
                {dashboardData.status}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData.status === "On Track" 
                  ? "Pengeluaran masih sesuai budget"
                  : "Pengeluaran melebihi budget"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alert Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <TrendingDown className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  Pengeluaran terbesar minggu ini
                </h3>
                <p className="text-sm text-muted-foreground">
                  {dashboardData.highestCategory ? (
                    <>
                      Kategori{" "}
                      <span className="font-semibold text-accent">
                        {dashboardData.highestCategory}
                      </span>{" "}
                      dengan total {formatCurrency(dashboardData.highestAmount)}
                    </>
                  ) : (
                    "Belum ada data minggu ini"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Tips hemat bulan ini</h3>
                <p className="text-sm text-muted-foreground">
                  {dashboardData.highestCategory
                    ? `Kurangi pengeluaran ${dashboardData.highestCategory} sebesar 15% untuk mencapai goal saving`
                    : "Mulai catat pengeluaran untuk mendapat tips"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending Trend */}
        <Card>
          <CardHeader>
            <CardTitle>7-Day Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dashboardData.spendingTrendData}>
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#00ff88"
                  strokeWidth={3}
                  dot={{ fill: "#00ff88", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dashboardData.categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
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
                      borderRadius: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {dashboardData.categoryChartData.map((category) => (
                <div key={category.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {category.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(category.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wallet Usage */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Wallet Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dashboardData.walletChartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="amount" fill="#00ff88" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}