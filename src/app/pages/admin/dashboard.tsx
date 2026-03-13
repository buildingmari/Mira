import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/card";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  Search,
  Eye,
  Ban,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "../../lib/utils";
import logo from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";

const USER_GROWTH = [
  { month: "Sep", users: 120 },
  { month: "Oct", users: 245 },
  { month: "Nov", users: 380 },
  { month: "Dec", users: 520 },
  { month: "Jan", users: 680 },
  { month: "Feb", users: 850 },
];

const CATEGORY_USAGE = [
  { name: "Food", value: 42, color: "#00ff88" },
  { name: "Transport", value: 20, color: "#3b82f6" },
  { name: "Shopping", value: 22, color: "#8b5cf6" },
  { name: "Entertainment", value: 11, color: "#f59e0b" },
  { name: "Other", value: 5, color: "#ef4444" },
];

const USERS = [
  {
    id: "1",
    name: "John Doe",
    phone: "08123456789",
    monthlyLimit: 5000000,
    totalSpent: 4250000,
    status: "active",
  },
  {
    id: "2",
    name: "Jane Smith",
    phone: "08198765432",
    monthlyLimit: 3000000,
    totalSpent: 2800000,
    status: "active",
  },
  {
    id: "3",
    name: "Bob Wilson",
    phone: "08555123456",
    monthlyLimit: 7000000,
    totalSpent: 7200000,
    status: "over_budget",
  },
  {
    id: "4",
    name: "Alice Johnson",
    phone: "08777654321",
    monthlyLimit: 4000000,
    totalSpent: 1500000,
    status: "active",
  },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = USERS.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="MIRA" className="h-10 w-10 rounded-xl" />
              <div>
                <h1 className="text-xl font-bold">MIRA Admin</h1>
                <p className="text-xs text-muted-foreground">
                  Admin Dashboard
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">850</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-accent">+25%</span> dari bulan lalu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Today
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">324</div>
              <p className="text-xs text-muted-foreground mt-1">
                38% of total users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transactions
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,450</div>
              <p className="text-xs text-muted-foreground mt-1">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Volume
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp 3.6B
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-accent">+18%</span> growth
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Growth */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total registered users over time
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={USER_GROWTH}>
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
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#00ff88"
                    strokeWidth={3}
                    dot={{ fill: "#00ff88", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Usage */}
          <Card>
            <CardHeader>
              <CardTitle>System-wide Category Usage</CardTitle>
              <p className="text-sm text-muted-foreground">
                Most popular expense categories
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={CATEGORY_USAGE}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {CATEGORY_USAGE.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${value}%`}
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORY_USAGE.map((category) => (
                  <div key={category.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm">{category.name} ({category.value}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>User Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  View and manage all users
                </p>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Phone</th>
                    <th className="text-left py-3 px-4 font-medium">
                      Monthly Limit
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      Total Spent
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border hover:bg-secondary/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {user.phone}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatCurrency(user.monthlyLimit)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatCurrency(user.totalSpent)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.status === "active"
                              ? "bg-accent/10 text-accent"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {user.status === "active"
                            ? "Active"
                            : "Over Budget"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button className="rounded-lg p-2 hover:bg-secondary">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button className="rounded-lg p-2 hover:bg-destructive/10">
                            <Ban className="h-4 w-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="rounded-xl border border-border p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {user.phone}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.status === "active"
                          ? "bg-accent/10 text-accent"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {user.status === "active" ? "Active" : "Over Budget"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Limit</p>
                      <p className="font-medium">
                        {formatCurrency(user.monthlyLimit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-medium">
                        {formatCurrency(user.totalSpent)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Ban className="h-4 w-4" />
                      Suspend
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}