import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/card";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import {
  User,
  Wallet,
  Bell,
  Shield,
  Trash2,
  Save,
  AlertTriangle,
} from "lucide-react";

const WALLETS = [
  "BCA",
  "BRI",
  "Mandiri",
  "BNI",
  "CIMB",
  "Jenius",
  "GoPay",
  "OVO",
  "DANA",
  "ShopeePay",
  "LinkAja",
  "Cash",
];

export function DashboardSettings() {
  const [primaryWallet, setPrimaryWallet] = useState("GoPay");
  const [monthlyLimit, setMonthlyLimit] = useState("5000000");
  const [enableReminder, setEnableReminder] = useState(true);
  const [enableWeeklyReport, setEnableWeeklyReport] = useState(true);
  const [enableBudgetAlert, setEnableBudgetAlert] = useState(true);

  const handleSave = () => {
    alert("Settings saved successfully!");
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Apakah kamu yakin ingin menghapus akun? Semua data akan hilang permanen."
      )
    ) {
      alert("Account deletion requested");
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Kelola preferensi dan pengaturan akun kamu
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Nomor WhatsApp
            </label>
            <Input type="tel" value="08123456789" disabled />
            <p className="text-xs text-muted-foreground mt-1">
              Nomor WhatsApp tidak bisa diubah
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Nama (Optional)
            </label>
            <Input type="text" placeholder="John Doe" />
          </div>
        </CardContent>
      </Card>

      {/* Wallet Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet & Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Primary Wallet
            </label>
            <select
              value={primaryWallet}
              onChange={(e) => setPrimaryWallet(e.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-input-background px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {WALLETS.map((wallet) => (
                <option key={wallet} value={wallet}>
                  {wallet}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Monthly Spending Limit
            </label>
            <Input
              type="number"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              placeholder="5000000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Spending Reminder</h3>
              <p className="text-sm text-muted-foreground">
                Notifikasi ketika mendekati limit
              </p>
            </div>
            <button
              onClick={() => setEnableReminder(!enableReminder)}
              className={`h-11 w-20 rounded-full transition-all ${
                enableReminder ? "bg-accent" : "bg-secondary"
              }`}
            >
              <div
                className={`h-9 w-9 rounded-full bg-white shadow-sm transition-all ${
                  enableReminder ? "ml-10" : "ml-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Weekly Report</h3>
              <p className="text-sm text-muted-foreground">
                Laporan mingguan via WhatsApp
              </p>
            </div>
            <button
              onClick={() => setEnableWeeklyReport(!enableWeeklyReport)}
              className={`h-11 w-20 rounded-full transition-all ${
                enableWeeklyReport ? "bg-accent" : "bg-secondary"
              }`}
            >
              <div
                className={`h-9 w-9 rounded-full bg-white shadow-sm transition-all ${
                  enableWeeklyReport ? "ml-10" : "ml-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Budget Alert</h3>
              <p className="text-sm text-muted-foreground">
                Alert ketika over budget
              </p>
            </div>
            <button
              onClick={() => setEnableBudgetAlert(!enableBudgetAlert)}
              className={`h-11 w-20 rounded-full transition-all ${
                enableBudgetAlert ? "bg-accent" : "bg-secondary"
              }`}
            >
              <div
                className={`h-9 w-9 rounded-full bg-white shadow-sm transition-all ${
                  enableBudgetAlert ? "ml-10" : "ml-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">Data Privacy</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Data kamu di-enkripsi dan aman. Kami tidak akan membagikan data
              ke pihak ketiga.
            </p>
            <Button variant="outline">View Privacy Policy</Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button variant="accent" className="flex-1" onClick={handleSave}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-destructive/10 p-4 mb-4">
            <h3 className="font-medium text-destructive mb-1">
              Delete Account
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Aksi ini tidak bisa dibatalkan. Semua data akan dihapus permanen.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive hover:text-white"
            onClick={handleDeleteAccount}
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
