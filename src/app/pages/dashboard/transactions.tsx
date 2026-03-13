import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/card";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  X,
  Wallet as WalletIcon,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useUserSession } from "../../context/user-session-context";

export function DashboardTransactions() {
  const navigate = useNavigate();
  const { userSession } = useUserSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterWallet, setFilterWallet] = useState("all");

  useEffect(() => {
    // Check if userSession exists
    if (!userSession || !userSession.transactions) {
      navigate("/login");
    }
  }, [userSession, navigate]);

  // If no userSession, redirect
  if (!userSession || !userSession.transactions) {
    return null;
  }

  // Sort transactions by date descending (newest first)
  const sortedTransactions = useMemo(() => {
    return [...userSession.transactions].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [userSession.transactions]);

  // Filter transactions
  const filteredTransactions = sortedTransactions.filter((tx) => {
    const matchesSearch =
      (tx.merchant?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (tx.category?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || tx.category === filterCategory;
    const matchesWallet =
      filterWallet === "all" || tx.wallet === filterWallet;
    return matchesSearch && matchesCategory && matchesWallet;
  });

  // Get unique categories and wallets for filters
  const categories = useMemo(() => {
    const cats = new Set(userSession.transactions.map((t: any) => t.category));
    return Array.from(cats).filter(Boolean);
  }, [userSession.transactions]);

  const wallets = useMemo(() => {
    const walls = new Set(userSession.transactions.map((t: any) => t.wallet));
    return Array.from(walls).filter(Boolean);
  }, [userSession.transactions]);

  // Show empty state if no transactions
  if (userSession.transactions.length === 0) {
    return (
      <div className="p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <WalletIcon className="h-16 w-16 text-muted-foreground mb-4" />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">
            Semua transaksi kamu dari WhatsApp
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari merchant atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-12 rounded-2xl border border-border bg-input-background px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filterWallet}
              onChange={(e) => setFilterWallet(e.target.value)}
              className="h-12 rounded-2xl border border-border bg-input-background px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Semua Wallet</option>
              {wallets.map((wallet) => (
                <option key={wallet} value={wallet}>
                  {wallet}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table - Desktop */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredTransactions.length} Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                    <th className="text-left py-3 px-4 font-medium">
                      Merchant
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      Kategori
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Wallet</th>
                    <th className="text-right py-3 px-4 font-medium">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx, index) => (
                    <tr
                      key={index}
                      className="border-b border-border hover:bg-secondary/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm">
                        {new Date(tx.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {tx.merchant}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{tx.wallet}</td>
                      <td className="py-3 px-4 text-sm font-medium text-right">
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List - Mobile */}
      <div className="lg:hidden space-y-3">
        {filteredTransactions.map((tx, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{tx.merchant}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tx.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(tx.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {tx.wallet}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
