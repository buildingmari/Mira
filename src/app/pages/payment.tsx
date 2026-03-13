import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "../components/button";
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

export function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan") || "3months";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snapLoaded, setSnapLoaded] = useState(false);

  const plan = planConfig[planId];

  // Load Midtrans Snap.js script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", "SB-Mid-client-_XBF0U4zdQDmvVdT");
    script.async = true;
    script.onload = () => setSnapLoaded(true);
    script.onerror = () => {
      setError("Failed to load payment system. Please refresh the page.");
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    // Redirect if invalid plan
    if (!plan) {
      navigate("/subscription");
    }
  }, [plan, navigate]);

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      // Check if Snap is loaded
      if (!snapLoaded || !window.snap) {
        throw new Error("Payment system not ready. Please wait a moment and try again.");
      }

      // Get assessment data from sessionStorage
      const assessmentDataStr = sessionStorage.getItem('assessment_data');
      if (!assessmentDataStr) {
        throw new Error("Assessment data not found. Please complete registration first.");
      }

      const assessmentData = JSON.parse(assessmentDataStr);

      // Use order_id from registration (already in assessmentData)
      if (!assessmentData.order_id) {
        throw new Error("Order ID not found. Please complete registration first.");
      }

      // Call n8n webhook with complete data
      const response = await fetch(
        "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/create-transaction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Order identification (from registration)
            order_id: assessmentData.order_id,
            
            // Subscription/Package data
            package_id: plan.packageId,
            package_name: plan.name,
            plan: plan.id,
            amount: plan.price, // Must be number, not string
            
            // Assessment form data
            ...assessmentData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Payment request failed. Please try again.");
      }

      // Backend returns: { "snap_token": "xxx" }
      const data = await response.json();

      // Check if snap_token exists
      if (!data.snap_token) {
        throw new Error("Payment session failed. Please try again.");
      }

      // Use Midtrans Snap Modal with callbacks
      window.snap.pay(data.snap_token, {
        onSuccess: function(result) {
          console.log("Payment success:", result);
          window.location.href = "/payment-success";
        },
        onPending: function(result) {
          console.log("Payment pending:", result);
          window.location.href = "/payment-pending";
        },
        onError: function(result) {
          console.log("Payment error:", result);
          window.location.href = "/payment-failed";
        },
        onClose: function() {
          console.log("Customer closed the popup without finishing payment");
          setLoading(false);
        }
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
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[16px] font-semibold text-[#171717] mb-1 tracking-tight">
                  {plan.name} Plan
                </h3>
                <p className="text-[13px] text-[#737373] font-normal">Billed monthly</p>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1">
                  <span className="text-[11px] text-[#737373] font-medium">Rp</span>
                  <span className="text-[22px] font-semibold text-[#171717] tracking-tight">
                    {plan.priceLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5E5]">
              <p className="text-[13px] text-[#737373] font-normal leading-[1.6]">
                <span className="font-medium text-[#171717]">7-day free trial.</span> You won't be charged until{" "}
                {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                . Cancel anytime.
              </p>
            </div>
          </div>

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
              "Continue to Payment"
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