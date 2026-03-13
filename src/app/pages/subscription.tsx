import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "../components/button";
import logo from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";

interface Plan {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  features: string[];
}

export function SubscriptionPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>("3months");

  const plans: Plan[] = [
    {
      id: "3months",
      name: "💎 3 Bulan",
      price: 69000,
      priceLabel: "69.000",
      features: [
        "≈ Rp23.000 / bulan",
        "Lebih murah dari 1 tiket nonton bioskop",
      ],
    },
    {
      id: "6months",
      name: "💎 6 Bulan ⭐ Lebih Hemat",
      price: 109000,
      priceLabel: "109.000",
      features: [
        "≈ Rp18.200 / bulan",
        "🔥 21% lebih hemat",
        "Lebih murah dari 1x kopi americano",
      ],
    },
    {
      id: "12months",
      name: "💎 12 Bulan 🔥 Paling Hemat",
      price: 199000,
      priceLabel: "199.000",
      features: [
        "≈ Rp16.600 / bulan",
        "🔥 28% lebih hemat",
        "Lebih murah dari parkir mobil weekend di mall",
      ],
    },
  ];

  const handleContinue = () => {
    const plan = plans.find((p) => p.id === selectedPlan);
    if (plan) {
      navigate(`/payment?plan=${plan.id}`);
    }
  };

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
          {/* Headline */}
          <div className="mb-10">
            <h1 className="text-[28px] leading-[1.2] font-semibold mb-2 text-[#171717] tracking-tight">
              Pilih Paket Langganan
            </h1>
            <p className="text-[15px] leading-[1.5] text-[#737373] font-normal">
              Hemat lebih banyak dengan paket yang lebih panjang.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="space-y-3 mb-8">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <motion.button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left rounded-2xl border transition-all duration-200 p-5 relative ${
                    isSelected
                      ? "border-[#171717] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06)]"
                      : "border-[#E5E5E5] bg-white hover:border-[#A3A3A3]"
                  }`}
                >
                  {/* Radio indicator */}
                  <div className="absolute top-5 right-5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                        isSelected ? "border-[#171717] bg-[#171717]" : "border-[#D4D4D4] bg-white"
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  {/* Plan header */}
                  <div className="mb-4 pr-8">
                    <h3 className="text-[18px] font-semibold text-[#171717] mb-1 tracking-tight">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[11px] text-[#737373] font-medium">Rp</span>
                      <span className="text-[24px] font-semibold text-[#171717] tracking-tight">
                        {plan.priceLabel}
                      </span>
                      <span className="text-[14px] text-[#737373] font-normal">/ bulan</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            isSelected ? "text-[#171717]" : "text-[#A3A3A3]"
                          }`}
                          strokeWidth={2.5}
                        />
                        <span className={`text-[14px] font-normal leading-[1.5] ${isSelected ? "text-[#404040]" : "text-[#737373]"}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.button>
              );
            })}
          </div>

          {/* CTA button */}
          <Button
            onClick={handleContinue}
            className="w-full h-12 bg-[#171717] text-white hover:bg-[#262626] text-[15px] font-medium rounded-xl transition-all"
          >
            Lanjut ke Pembayaran
          </Button>

          {/* Footer note */}
          <p className="text-center text-[13px] text-[#A3A3A3] font-normal mt-4">
            Dapat dibatalkan kapan saja
          </p>
        </motion.div>
      </div>
    </div>
  );
}