import { Card, CardContent, CardHeader, CardTitle } from "../../components/card";
import { Sparkles, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { formatCurrency } from "../../lib/utils";

const MONTHLY_TREND = [
  { month: "Sep", amount: 3800000 },
  { month: "Oct", amount: 4200000 },
  { month: "Nov", amount: 3950000 },
  { month: "Dec", amount: 4800000 },
  { month: "Jan", amount: 4100000 },
  { month: "Feb", amount: 4250000 },
];

const CATEGORY_BREAKDOWN = [
  { name: "Food", value: 1800000, percentage: 42, color: "#00ff88" },
  { name: "Transport", value: 850000, percentage: 20, color: "#3b82f6" },
  { name: "Shopping", value: 920000, percentage: 22, color: "#8b5cf6" },
  { name: "Entertainment", value: 480000, percentage: 11, color: "#f59e0b" },
  { name: "Other", value: 200000, percentage: 5, color: "#ef4444" },
];

const TOP_MERCHANTS = [
  { name: "Starbucks", amount: 420000, count: 12 },
  { name: "Grab", amount: 380000, count: 24 },
  { name: "Alfamart", amount: 320000, count: 18 },
  { name: "Warung Padang", amount: 280000, count: 15 },
  { name: "Pertamina", amount: 250000, count: 8 },
];

export function DashboardInsights() {
  return (
    <div className="p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Insights</h1>
        <p className="text-muted-foreground">
          AI-powered insights tentang kebiasaan spending kamu
        </p>
      </div>

      {/* AI Insights Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI Insight</h3>
                <p className="text-sm text-muted-foreground">
                  Bulan ini kamu{" "}
                  <span className="font-semibold text-destructive">
                    35% lebih boros
                  </span>{" "}
                  di kategori Food dibanding rata-rata 3 bulan terakhir
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <TrendingDown className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Spending Pattern</h3>
                <p className="text-sm text-muted-foreground">
                  Pengeluaran terbanyak terjadi di{" "}
                  <span className="font-semibold text-accent">
                    hari Sabtu & Minggu
                  </span>
                  , rata-rata 45% lebih tinggi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <AlertCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Budget Alert</h3>
                <p className="text-sm text-muted-foreground">
                  Jika pengeluaran tetap seperti ini, kamu akan mencapai limit
                  pada <span className="font-semibold">24 Februari</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Saving Opportunity</h3>
                <p className="text-sm text-muted-foreground">
                  Hemat{" "}
                  <span className="font-semibold text-accent">
                    {formatCurrency(300000)}
                  </span>{" "}
                  dengan mengurangi coffee shop visits
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
          <p className="text-sm text-muted-foreground">
            Perbandingan pengeluaran 6 bulan terakhir
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={MONTHLY_TREND}>
              <XAxis
                dataKey="month"
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
                tickFormatter={(value) => `${value / 1000000}M`}
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
                dot={{ fill: "#00ff88", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribusi pengeluaran per kategori
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={CATEGORY_BREAKDOWN}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {CATEGORY_BREAKDOWN.map((entry, index) => (
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
            <div className="space-y-3">
              {CATEGORY_BREAKDOWN.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {category.percentage}%
                    </span>
                    <span className="text-sm font-medium w-24 text-right">
                      {formatCurrency(category.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Category Comparison</CardTitle>
            <p className="text-sm text-muted-foreground">
              Perbandingan dengan bulan lalu
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={CATEGORY_BREAKDOWN}>
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
                <Bar dataKey="value" fill="#00ff88" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Merchants */}
      <Card>
        <CardHeader>
          <CardTitle>Top Merchants</CardTitle>
          <p className="text-sm text-muted-foreground">
            Merchant dengan pengeluaran terbanyak
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {TOP_MERCHANTS.map((merchant, index) => (
              <div
                key={merchant.name}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-semibold">
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold">{merchant.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {merchant.count} transactions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(merchant.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
