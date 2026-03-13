import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/card";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import { Plus, Target, Calendar, TrendingUp, X } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";

type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
};

const MOCK_GOALS: Goal[] = [
  {
    id: "1",
    name: "Dana Liburan Bali",
    target: 10000000,
    current: 3500000,
    deadline: "2026-08-01",
  },
  {
    id: "2",
    name: "Emergency Fund",
    target: 20000000,
    current: 8000000,
    deadline: "2026-12-31",
  },
  {
    id: "3",
    name: "Gadget Baru",
    target: 5000000,
    current: 4200000,
    deadline: "2026-05-01",
  },
];

export function DashboardGoals() {
  const [goals, setGoals] = useState(MOCK_GOALS);
  const [showAddModal, setShowAddModal] = useState(false);

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const calculateMonthsRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const months = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    return months;
  };

  const calculateMonthlyNeeded = (current: number, target: number, deadline: string) => {
    const remaining = target - current;
    const months = calculateMonthsRemaining(deadline);
    return months > 0 ? remaining / months : remaining;
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Goals</h1>
          <p className="text-muted-foreground">
            Track progress menuju target saving kamu
          </p>
        </div>
        <Button variant="accent" onClick={() => setShowAddModal(true)}>
          <Plus className="h-5 w-5" />
          Add Goal
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(goals.reduce((sum, g) => sum + g.target, 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(goals.reduce((sum, g) => sum + g.current, 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current savings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="grid gap-4 lg:grid-cols-2">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.current, goal.target);
          const monthsRemaining = calculateMonthsRemaining(goal.deadline);
          const monthlyNeeded = calculateMonthlyNeeded(
            goal.current,
            goal.target,
            goal.deadline
          );

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:border-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-1">{goal.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Target: {formatCurrency(goal.target)}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        progress >= 100
                          ? "bg-accent/10 text-accent"
                          : progress >= 75
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {progress.toFixed(0)}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">
                        {formatCurrency(goal.current)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(goal.target - goal.current)} remaining
                      </span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-accent to-accent/80"
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs">Deadline</span>
                      </div>
                      <p className="text-sm font-medium">
                        {new Date(goal.deadline).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {monthsRemaining} months left
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs">Monthly Target</span>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency(monthlyNeeded)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        per month
                      </p>
                    </div>
                  </div>

                  {/* Status Message */}
                  {progress >= 100 ? (
                    <div className="rounded-xl bg-accent/10 p-3">
                      <p className="text-sm font-medium text-accent">
                        🎉 Goal tercapai! Selamat!
                      </p>
                    </div>
                  ) : monthlyNeeded > 2000000 ? (
                    <div className="rounded-xl bg-destructive/10 p-3">
                      <p className="text-sm font-medium text-destructive">
                        ⚠️ Target bulanan tinggi, pertimbangkan untuk adjust
                        deadline
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-accent/10 p-3">
                      <p className="text-sm font-medium text-accent">
                        ✨ On track! Keep going!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Tips Card */}
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Tips Mencapai Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                Set auto-transfer ke rekening saving setiap terima gaji
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                Kurangi pengeluaran di kategori yang tidak penting (Food &
                Entertainment)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                Review progress setiap minggu dan adjust spending jika perlu
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card className="w-full max-w-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Add New Goal</CardTitle>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="rounded-lg p-2 hover:bg-secondary"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Goal Name
                    </label>
                    <Input placeholder="e.g., Gadget Baru" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Target Amount
                    </label>
                    <Input type="number" placeholder="5000000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Deadline
                    </label>
                    <Input type="date" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Current Amount (Optional)
                    </label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <Button variant="accent" className="w-full">
                    Add Goal
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
