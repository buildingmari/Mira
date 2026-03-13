import { useNavigate } from "react-router";
import { Button } from "../components/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import logo from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";

export function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3"
            >
              <img src={logo} alt="MIRA" className="h-8 w-8" />
              <span className="font-semibold">MIRA AI</span>
            </button>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
                className="text-white/70 hover:text-white hover:bg-white/5"
              >
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/register")}
                className="bg-white text-black hover:bg-white/90"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 relative">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[150px]"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </button>
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              Simple Pricing.
              <br />
              Serious Results.
            </h1>
            <p className="text-lg text-white/60">
              Choose the plan that works for you. No hidden fees. No free tier
              gimmicks. Just premium intelligence.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-2">
            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 backdrop-blur-xl p-8"
            >
              <div className="mb-8">
                <h3 className="text-sm font-medium text-white/60 mb-2">
                  Monthly
                </h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold">Rp 79,000</span>
                  <span className="text-white/60">/ month</span>
                </div>
                <p className="text-sm text-white/60">
                  Billed monthly. Cancel anytime.
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited expense logging",
                  "AI-powered categorization",
                  "Smart insights & analytics",
                  "Budget alerts & notifications",
                  "Savings goal tracking",
                  "Multi-wallet support (12+ options)",
                  "WhatsApp integration",
                  "Web dashboard access",
                  "Export reports (PDF, Excel)",
                  "Pattern detection",
                  "Spending predictions",
                  "Email support",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate("/register?plan=monthly")}
                className="w-full bg-white text-black hover:bg-white/90 h-12"
              >
                Subscribe Monthly
              </Button>
            </motion.div>

            {/* Annual Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border-2 border-blue-500/50 bg-gradient-to-b from-blue-500/10 to-blue-500/0 backdrop-blur-xl p-8 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                SAVE 20% — BEST VALUE
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-medium text-white/60 mb-2">
                  Annual
                </h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl font-bold">Rp 759,000</span>
                  <span className="text-white/60">/ year</span>
                </div>
                <p className="text-sm text-blue-400 font-medium mb-2">
                  Only Rp 63,250 per month
                </p>
                <p className="text-sm text-white/60">
                  Billed annually. Save Rp 189,000 per year.
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited expense logging",
                  "AI-powered categorization",
                  "Smart insights & analytics",
                  "Budget alerts & notifications",
                  "Savings goal tracking",
                  "Multi-wallet support (12+ options)",
                  "WhatsApp integration",
                  "Web dashboard access",
                  "Export reports (PDF, Excel)",
                  "Pattern detection",
                  "Spending predictions",
                  "Priority email support",
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate("/register?plan=annual")}
                className="w-full bg-blue-500 text-white hover:bg-blue-600 h-12"
              >
                Subscribe Annually
              </Button>
            </motion.div>
          </div>

          {/* FAQ Preview */}
          <div className="max-w-3xl mx-auto mt-20">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Common Questions
            </h2>
            <div className="space-y-6">
              <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 backdrop-blur-xl p-6">
                <h3 className="font-semibold mb-2">
                  Can I switch plans later?
                </h3>
                <p className="text-white/60 text-sm">
                  Yes. You can upgrade or downgrade at any time. Changes take
                  effect at the next billing cycle.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 backdrop-blur-xl p-6">
                <h3 className="font-semibold mb-2">What payment methods?</h3>
                <p className="text-white/60 text-sm">
                  We accept all major Indonesian payment methods including bank
                  transfer, e-wallets (GoPay, OVO, DANA), and credit cards.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 backdrop-blur-xl p-6">
                <h3 className="font-semibold mb-2">
                  What happens when I cancel?
                </h3>
                <p className="text-white/60 text-sm">
                  You'll retain access until the end of your billing period.
                  You can export all your data before your subscription ends.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 backdrop-blur-xl p-6">
                <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                <p className="text-white/60 text-sm">
                  No. We don't offer free trials because MIRA is a premium
                  product built for serious users. However, we offer a 30-day
                  money-back guarantee if you're not satisfied.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-white/60 mb-8">
              Join hundreds of users who've taken control of their finances
              with MIRA.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              className="bg-white text-black hover:bg-white/90"
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/60">
              © 2026 MIRA AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/60">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
