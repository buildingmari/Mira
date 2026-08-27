import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ArrowLeft, AlertCircle, Tag, CheckCircle2, X } from "lucide-react";
import { Button } from "../components/button";
import { Input } from "../components/input";
import logo from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";

// Declare Snap on window object for TypeScript
declare global {
  interface Window {
    snap?: {
      pay: (
        snapToken: string,
        options: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

interface PlanDetails {
  id: string;
  packageId: number;
  name: string;
  price: number;
  priceLabel: string;
}

interface VoucherResult {
  valid: boolean;
  code?: string;
  discount_percent?: number;
  discount_amount?: number;
  original_price: number;
  final_price: number;
}

const planConfig: Record<string, PlanDetails> = {
  "3months": {
    id: "3months",
    packageId: 1,
    name: "💎 3 Bulan",
    price: 69000,
    priceLabel: "69.000",
  },
  "6months": {
    id: "6months",
    packageId: 2,
    name: "💎 6 Bulan ⭐ Lebih Hemat",
    price: 109000,
    priceLabel: "109.000",
  },
  "12months": {
    id: "12months",
    packageId: 3,
    name: "💎 12 Bulan 🔥 Paling Hemat",
    price: 199000,
    priceLabel: "199.000",
  },
};

function formatPrice(amount: number): string {
  return amount.toLocaleString("id-ID");
}

export function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan") || "3months";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snapLoaded, setSnapLoaded] = useState(false);

  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [voucherResult, setVoucherResult] = useState<VoucherResult | null>(null);

  const plan = planConfig[planId];
  const finalPrice = voucherResult?.valid ? voucherResult.final_price : plan?.price ?? 0;

  // Load Midtrans Snap.js script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", "Mid-client-7FjyW-EnrZA8HvP-");
    script.async = true;
    script.onload = () => setSnapLoaded(true);
    script.onerror = () => {
      setError("Failed to load payment system. Please refresh the page.");
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!plan) {
      navigate("/subscription");
    }
  }, [plan, navigate]);

  const handleApplyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setVoucherError("Masukkan kode voucher terlebih dahulu.");
      return;
    }

    setVoucherLoading(true);
    setVoucherError("");
    setVoucherResult(null);

    try {
      const response = await fetch(
        "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/validate-voucher",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            price: plan.price,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Gagal memvalidasi voucher. Coba lagi.");
      }

      const result: VoucherResult = await response.json();
      setVoucherResult(result);

      if (!result.valid) {
        setVoucherError("Kode voucher tidak valid atau sudah tidak aktif.");
      }
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherResult(null);
    setVoucherCode("");
    setVoucherError("");
  };

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      if (!snapLoaded || !window.snap) {
        throw new Error("Payment system not ready. Please wait a moment and try again.");
      }

      const assessmentDataStr = sessionStorage.getItem("assessment_data");
      if (!assessmentDataStr) {
        throw new Error("Assessment data not found. Please complete registration first.");
      }

      const assessmentData = JSON.parse(assessmentDataStr);

      if (!assessmentData.order_id) {
        throw new Error("Order ID not found. Please complete registration first.");
      }

      const response = await fetch(
        "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/create-transaction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: assessmentData.order_id,
            package_id: plan.packageId,
            package_name: plan.name,
            plan: plan.id,
            amount: finalPrice,
            price_original: plan.price,
            voucher_code: voucherResult?.valid ? voucherResult.code : null,
            voucher_discount_percent: voucherResult?.valid ? voucherResult.discount_percent : 0,
            price_final: finalPrice,
            ...assessmentData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Payment request failed. Please try again.");
      }

      const data = await response.json();

      if (!data.snap_token) {
        throw new Error("Payment session failed. Please try again.");
      }

      window.snap.pay(data.snap_token, {
        onSuccess: function () {
          window.location.href = "/payment-success";
        },
        onPending: function () {
          window.location.href = "/payment-pending";
        },
        onError: function () {
          window.location.href = "/payment-failed";
        },
        onClose: function () {
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-[#E5E5E5]">
        <div className="max-w-[420px] mx-auto px-6 py-5 flex items-center justify-center">
          <img src={logo} alt="MIRA" className="h-6" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          {/* Back button */}
          <button
            onClick={() => navigate("/subscription")}
            disabled={loading}
            className="inline-flex items-center gap-2 text-[14px] text-[#737373] hover:text-[#171717] mb-8 transition-colors font-normal disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back
          </button>

          {/* Headline */}
          <div className="mb-8">
            <h1 className="text-[28px] leading-[1.2] font-semibold mb-2 text-[#171717] tracking-tight">
              Complete Payment
            </h1>
            <p className="text-[15px] leading-[1.5] text-[#737373] font-normal">
              Confirm your subscription details below.
            </p>
          </div>

          {/* Plan summary card */}
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[16px] font-semibold text-[#171717] mb-1 tracking-tight">
                  {plan.name} Plan
                </h3>
                <p className="text-[13px] text-[#737373] font-normal">Billed monthly</p>
              </div>
              <div className="text-right">
                <AnimatePresence mode="wait">
                  {voucherResult?.valid ? (
                    <motion.div
                      key="discounted"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="text-right"
                    >
                      <div className="flex items-baseline gap-1 justify-end line-through text-[#A3A3A3] mb-0.5">
                        <span className="text-[10px] font-medium">Rp</span>
                        <span className="text-[15px] font-medium">{plan.priceLabel}</span>
                      </div>
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-[11px] text-[#171717] font-medium">Rp</span>
                        <span className="text-[22px] font-semibold text-[#171717] tracking-tight">
                          {formatPrice(voucherResult.final_price)}
                        </span>
                      </div>
                      <span className="text-[12px] font-medium text-emerald-600">
                        -{voucherResult.discount_percent}% diskon
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="original"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                    >
                      <div className="flex items-baseline gap-1">
                        <span className="text-[11px] text-[#737373] font-medium">Rp</span>
                        <span className="text-[22px] font-semibold text-[#171717] tracking-tight">
                          {plan.priceLabel}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5E5]">
              <p className="text-[13px] text-[#737373] font-normal leading-[1.6]">
                <span className="font-medium text-[#171717]">7-day free trial.</span> You won't be
                charged until{" "}
                {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                . Cancel anytime.
              </p>
            </div>
          </div>

          {/* Voucher section */}
          <div className="mb-6">
            <AnimatePresence mode="wait">
              {voucherResult?.valid ? (
                <motion.div
                  key="applied"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2} />
                    <div>
                      <p className="text-[13px] font-semibold text-emerald-800">{voucherResult.code}</p>
                      <p className="text-[12px] text-emerald-600 font-normal">
                        Hemat Rp {formatPrice(voucherResult.discount_amount ?? 0)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveVoucher}
                    className="text-emerald-500 hover:text-emerald-700 transition-colors p-1"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="space-y-2"
                >
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" strokeWidth={1.5} />
                      <Input
                        type="text"
                        placeholder="Masukkan kode voucher"
                        value={voucherCode}
                        onChange={(e) => {
                          setVoucherCode(e.target.value.toUpperCase());
                          setVoucherError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleApplyVoucher();
                        }}
                        disabled={voucherLoading}
                        className="h-11 pl-10 pr-4 text-[14px] border-[#E5E5E5] rounded-xl font-normal tracking-wider placeholder:tracking-normal placeholder:font-normal placeholder:text-[#A3A3A3] disabled:opacity-50"
                      />
                    </div>
                    <button
                      onClick={handleApplyVoucher}
                      disabled={voucherLoading || !voucherCode.trim()}
                      className="h-11 px-4 text-[14px] font-medium bg-[#171717] text-white rounded-xl hover:bg-[#262626] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                    >
                      {voucherLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Terapkan"
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {voucherError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[12px] text-red-500 font-normal px-1"
                      >
                        {voucherError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Total row */}
          <AnimatePresence>
            {voucherResult?.valid && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl px-5 py-4 flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-[#171717]">Total yang dibayar</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] text-[#737373] font-medium">Rp</span>
                    <span className="text-[18px] font-semibold text-[#171717] tracking-tight">
                      {formatPrice(voucherResult.final_price)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-[14px] text-red-600 font-normal leading-[1.5]">{error}</p>
            </motion.div>
          )}

          {/* Payment button */}
          <Button
            onClick={handlePayment}
            disabled={loading || !snapLoaded}
            className="w-full h-12 bg-[#171717] text-white hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed text-[15px] font-medium rounded-xl transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              `Continue to Payment${
                voucherResult?.valid ? ` · Rp ${formatPrice(finalPrice)}` : ""
              }`
            )}
          </Button>

          {/* Footer note */}
          <p className="text-center text-[13px] text-[#A3A3A3] font-normal mt-4">
            Secure payment powered by Midtrans
          </p>
        </motion.div>
      </div>
    </div>
  );
}
