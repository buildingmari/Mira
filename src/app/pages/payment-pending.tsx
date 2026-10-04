import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { RefreshCw, MessageCircle } from "lucide-react";
import { MiraIcon } from "../components/icons/MiraIcon";

const WA_SUPPORT = "6287889681230";
const TOTAL      = 300; // 5 minutes

const T_ICON     = 0.05;
const T_CONTENT  = 0.35;
const T_BUTTONS  = 0.55;

export function PaymentPendingPage() {
  const navigate   = useNavigate();
  const [countdown, setCountdown] = useState(TOTAL);
  const [checking,  setChecking]  = useState(false);
  const isExpired = countdown <= 0;

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const fmt = (s: number) =>
    s <= 0 ? "0:00" : `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleCheck = () => {
    setChecking(true);
    setTimeout(() => { setChecking(false); window.location.reload(); }, 1800);
  };


  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px] flex flex-col items-center text-center">

          {/* ── Hourglass + countdown ── */}
          <motion.div
            className="flex flex-col items-center mb-8"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: T_ICON, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <MiraIcon name="hourglass" size={112} />
            <div style={{
              marginTop: 14, padding: "6px 14px", borderRadius: 999,
              background: isExpired ? "#F1F5F9" : "#FFF7E0",
              border: `1.5px solid ${isExpired ? "#E2E8F0" : "#FDE68A"}`,
              fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "15px",
              color: isExpired ? "#94A3B8" : "#B45309",
              fontVariantNumeric: "tabular-nums",
            }}>
              {isExpired ? "Waktu habis" : `Sisa ${fmt(countdown)}`}
            </div>
          </motion.div>

          {/* ── Copy ── */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: T_CONTENT, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "28px",
              fontWeight: 800,
              color: "#0F172A",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              marginBottom: "12px",
            }}>
              {isExpired ? "Waktu habis." : "Menunggu\npembayaran…"}
            </h1>
            <p style={{
              fontSize: "15px",
              color: "#64748B",
              lineHeight: 1.7,
              marginBottom: "36px",
            }}>
              {isExpired
                ? "Sesi pembayaran ini sudah kadaluarsa. Tidak ada dana yang terdebit. Hubungi support atau mulai ulang."
                : "Selesaikan pembayaran di aplikasi bank atau e-wallet kamu, lalu kembali ke sini untuk konfirmasi."}
            </p>
          </motion.div>

          {/* ── Buttons ── */}
          <motion.div
            className="w-full flex flex-col gap-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: T_BUTTONS, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {!isExpired && (
              <button
                onClick={handleCheck}
                disabled={checking}
                className="w-full flex items-center justify-center gap-2.5 active:scale-[0.97] transition-transform duration-100 disabled:opacity-50"
                style={{
                  height: 54,
                  borderRadius: 16,
                  background: "#0F172A",
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  border: "none",
                  cursor: checking ? "not-allowed" : "pointer",
                  letterSpacing: "-0.01em",
                }}
              >
                <RefreshCw size={17} strokeWidth={2} className={checking ? "animate-spin" : ""} />
                {checking ? "Memeriksa status…" : "Saya sudah bayar"}
              </button>
            )}

            <button
              onClick={() => window.open(`https://wa.me/${WA_SUPPORT}?text=${encodeURIComponent("Halo, pembayaran saya masih pending. Bisa dibantu?")}`, "_blank")}
              className="w-full flex items-center justify-center gap-2.5 active:scale-[0.97] transition-transform duration-100"
              style={{
                height: 54,
                borderRadius: 16,
                background: isExpired ? "#0F172A" : "#F1F5F9",
                fontFamily: "'Sora', sans-serif",
                fontSize: "15px",
                fontWeight: 600,
                color: isExpired ? "#FFFFFF" : "#475569",
                border: "none",
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              <MessageCircle size={17} strokeWidth={2} />
              Hubungi Support
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center active:scale-[0.97] transition-transform duration-100"
              style={{
                height: 48,
                borderRadius: 14,
                background: "transparent",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                color: "#94A3B8",
                border: "none",
                cursor: "pointer",
              }}
            >
              Kembali ke beranda
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        className="pb-10 px-6 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: T_BUTTONS + 0.4 }}
      >
        <p style={{ fontSize: "13px", color: "#CBD5E1", textAlign: "center" }}>
          Pembayaran aman dienkripsi end-to-end
        </p>
      </motion.div>
    </div>
  );
}
