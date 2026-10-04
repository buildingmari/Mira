import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { RotateCcw, MessageCircle } from "lucide-react";
import { MiraIcon } from "../components/icons/MiraIcon";

const WA_SUPPORT = "6287889681230";

const T_ICON     = 0.05;
const T_CONTENT  = T_ICON + 0.65; // after Miri + the badge have popped in
const T_BUTTONS  = T_CONTENT + 0.18;

export function PaymentFailedPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px] flex flex-col items-center text-center">

          {/* ── Miri worried ── */}
          <motion.div
            className="relative flex items-center justify-center mb-12"
            style={{ width: 120, height: 120 }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <MiraIcon name="buddy-worried" size={120} />
            <motion.div
              style={{ position: "absolute", right: -6, bottom: -6 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <MiraIcon name="nope" size={48} tile={false} />
            </motion.div>
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
              Pembayaran gagal.
            </h1>
            <p style={{
              fontSize: "15px",
              color: "#64748B",
              lineHeight: 1.7,
              marginBottom: "8px",
            }}>
              Transaksi tidak berhasil diproses. Tidak ada dana yang terdebit dari akunmu.
            </p>
            <p style={{
              fontSize: "14px",
              color: "#94A3B8",
              lineHeight: 1.65,
              marginBottom: "36px",
            }}>
              Coba periksa saldo, koneksi internet, atau gunakan metode pembayaran lain.
            </p>
          </motion.div>

          {/* ── Buttons ── */}
          <motion.div
            className="w-full flex flex-col gap-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: T_BUTTONS, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Primary */}
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2.5 active:scale-[0.97] transition-transform duration-100"
              style={{
                height: 54,
                borderRadius: 16,
                background: "#0F172A",
                fontFamily: "'Sora', sans-serif",
                fontSize: "15px",
                fontWeight: 700,
                color: "#FFFFFF",
                border: "none",
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              <RotateCcw size={17} strokeWidth={2} />
              Coba Lagi
            </button>

            {/* Secondary */}
            <button
              onClick={() => window.open(`https://wa.me/${WA_SUPPORT}?text=${encodeURIComponent("Halo, pembayaran saya gagal. Bisa dibantu?")}`, "_blank")}
              className="w-full flex items-center justify-center gap-2.5 active:scale-[0.97] transition-transform duration-100"
              style={{
                height: 54,
                borderRadius: 16,
                background: "#F1F5F9",
                fontFamily: "'Sora', sans-serif",
                fontSize: "15px",
                fontWeight: 600,
                color: "#475569",
                border: "none",
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              <MessageCircle size={17} strokeWidth={2} />
              Hubungi Support
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
          Tidak ada dana yang terdebit.{" "}
          <a
            href={`https://wa.me/${WA_SUPPORT}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#94A3B8", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            Butuh bantuan?
          </a>
        </p>
      </motion.div>
    </div>
  );
}
