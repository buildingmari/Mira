import { Card, CardContent, CardHeader, CardTitle } from "../../components/card";
import { Button } from "../../components/button";
import { Download, FileText, Calendar, Filter } from "lucide-react";
import { motion } from "motion/react";

export function DashboardExport() {
  const handleExport = (format: string) => {
    // Mock export functionality
    alert(`Exporting data as ${format}...`);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Export Data</h1>
        <p className="text-muted-foreground">
          Download laporan dan data transaksi kamu
        </p>
      </div>

      {/* Quick Export */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:border-accent/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-accent/10 p-3">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle>Excel</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    .xlsx format
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="accent"
                className="w-full"
                onClick={() => handleExport("Excel")}
              >
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="hover:border-accent/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-accent/10 p-3">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle>CSV</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    .csv format
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="accent"
                className="w-full"
                onClick={() => handleExport("CSV")}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover:border-accent/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-accent/10 p-3">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle>PDF</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Formatted report
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="accent"
                className="w-full"
                onClick={() => handleExport("PDF")}
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Custom Export */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Export</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pilih periode dan filter data yang ingin di-export
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date
              </label>
              <input
                type="date"
                className="h-12 w-full rounded-2xl border border-border bg-input-background px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                className="h-12 w-full rounded-2xl border border-border bg-input-background px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">
                <Filter className="inline h-4 w-4 mr-1" />
                Category
              </label>
              <select className="h-12 w-full rounded-2xl border border-border bg-input-background px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="all">All Categories</option>
                <option value="food">Food</option>
                <option value="transport">Transport</option>
                <option value="shopping">Shopping</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                <Filter className="inline h-4 w-4 mr-1" />
                Wallet
              </label>
              <select className="h-12 w-full rounded-2xl border border-border bg-input-background px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="all">All Wallets</option>
                <option value="gopay">GoPay</option>
                <option value="ovo">OVO</option>
                <option value="dana">DANA</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="accent"
              className="flex-1"
              onClick={() => handleExport("Custom Excel")}
            >
              <Download className="h-4 w-4" />
              Export as Excel
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleExport("Custom CSV")}
            >
              <Download className="h-4 w-4" />
              Export as CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Reports</CardTitle>
          <p className="text-sm text-muted-foreground">
            Download laporan bulanan otomatis
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { month: "Februari 2026", amount: "Rp 4.250.000" },
              { month: "Januari 2026", amount: "Rp 4.100.000" },
              { month: "Desember 2025", amount: "Rp 4.800.000" },
              { month: "November 2025", amount: "Rp 3.950.000" },
            ].map((report) => (
              <div
                key={report.month}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
              >
                <div>
                  <h3 className="font-semibold">{report.month}</h3>
                  <p className="text-sm text-muted-foreground">
                    Total Spending: {report.amount}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleExport(`${report.month} Report PDF`)
                    }
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() =>
                      handleExport(`${report.month} Report Excel`)
                    }
                  >
                    <Download className="h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
