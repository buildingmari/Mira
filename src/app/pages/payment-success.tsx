import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { MessageCircle, LayoutDashboard } from "lucide-react";
import { WHATSAPP_AUTH_ENABLED, authAccount, getAuthSession, getFreshAuthToken, saveMiraSession } from "../lib/auth";
import { MiraIcon } from "../components/icons/MiraIcon";
import { RENEWAL_MARKER } from "../lib/subscription";

const WA_NUMBER  = "6287889681230";
const WA_MESSAGE = encodeURIComponent("Halo MIRA! Akun saya sudah aktif. Bantu saya mulai tracking pengeluaran.");

// Timing: copy fades in after Miri + the check badge have popped in.
const T_CONTENT  = 0.7;
const T_BUTTONS  = T_CONTENT + 0.18;

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  useEffect(() => { sessionStorage.removeItem("assessment_data"); }, []);

  // Back from a renewal paid on the Langganan page (marker < 6 hours old).
  const [renewal] = useState(() => {
    try {
      const t = Number(localStorage.getItem(RENEWAL_MARKER));
      localStorage.removeItem(RENEWAL_MARKER);
      return t > 0 && Date.now() - t < 6 * 3600_000 && !!localStorage.getItem("mira_phone");
    } catch { return false; }
  });

  // Web account (Google / email): log in automatically. Midtrans → n8n
  // activation can land a few seconds after the redirect, so retry briefly.
  const [opening, setOpening] = useState(false);
  const [notReady, setNotReady] = useState(false);
  const loginWebAccount = async (tries: number): Promise<boolean> => {
    for (let i = 0; i < tries; i++) {
      const token = await getFreshAuthToken();
      if (!token) return false;
      const r = await authAccount({ op: "resolve", access_token: token });
      if (r.data?.status === "linked" && r.data.phone) {
        saveMiraSession(String(r.data.phone), r.data.user);
        return true;
      }
      await new Promise((res) => setTimeout(res, 2000));
    }
    return false;
  };
  useEffect(() => {
    if (!localStorage.getItem("mira_phone") && getAuthSession()) void loginWebAccount(5);
  }, []);

  const openDashboard = async () => {
    if (!localStorage.getItem("mira_phone") && getAuthSession()) {
      setOpening(true);
      const ok = await loginWebAccount(3);
      setOpening(false);
      if (!ok) { setNotReady(true); return; }
    }
    navigate(renewal ? "/dashboard/langganan" : "/dashboard");
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col bg-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 safe-area-padding">
        <div className="w-full max-w-[360px] flex flex-col items-center text-center">

          {/* ── Miri celebrating ── */}
          <motion.div
            className="relative flex items-center justify-center mb-12"
            style={{ width: 120, height: 120 }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <MiraIcon name="buddy-strong" size={120} />
            <motion.div
              style={{ position: "absolute", right: -6, bottom: -6 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <MiraIcon name="check-badge" size={48} tile={false} />
            </motion.div>
          </motion.div>

          {/* ── Copy — appears after checkmark done ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: T_CONTENT, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
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
              {renewal ? "Langganan diperpanjang!" : "Pembayaran berhasil!"}
            </h1>
            <p style={{
              fontSize: "15px",
              color: "#64748B",
              lineHeight: 1.7,
              marginBottom: "36px",
            }}>
              {renewal
                ? "Makasih udah lanjut bareng MIRA! Masa aktif barumu sudah ditambahkan — cek detailnya di menu Langganan."
                : WHATSAPP_AUTH_ENABLED
                ? "Akun MIRA kamu sudah aktif. Mulai lacak pengeluaran dan atur keuanganmu langsung dari WhatsApp."
                : "Akun MIRA kamu sudah aktif. Mulai lacak pengeluaran dan atur keuanganmu langsung dari dashboard MIRA."}
            </p>
          </motion.div>

          {/* ── Buttons ── */}
          <motion.div
            className="w-full flex flex-col gap-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: T_BUTTONS, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* WhatsApp (only while WhatsApp accounts are enabled) */}
            {WHATSAPP_AUTH_ENABLED && <button
              onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`, "_blank")}
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
              <MessageCircle size={18} strokeWidth={2} />
              Buka WhatsApp MIRA
            </button>}

            <button
              onClick={openDashboard}
              disabled={opening}
              className="w-full flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-100"
              style={{
                height: 54,
                borderRadius: 16,
                background: WHATSAPP_AUTH_ENABLED ? "#F1F5F9" : "#0F172A",
                fontFamily: "'Sora', sans-serif",
                fontSize: "15px",
                fontWeight: WHATSAPP_AUTH_ENABLED ? 600 : 700,
                color: WHATSAPP_AUTH_ENABLED ? "#475569" : "#FFFFFF",
                border: "none",
                cursor: opening ? "wait" : "pointer",
                letterSpacing: "-0.01em",
                opacity: opening ? 0.75 : 1,
              }}
            >
              <LayoutDashboard size={17} strokeWidth={2} />
              {opening ? "Membuka akun…" : "Buka Dashboard"}
            </button>
            {notReady && (
              <p style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6, margin: 0 }}>
                Pembayaranmu masih diproses. Tunggu sebentar lalu coba lagi — atau masuk dari halaman utama pakai akun yang tadi.
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        className="pb-10 px-6 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: T_BUTTONS + 0.3 }}
      >
        <p style={{ fontSize: "13px", color: "#CBD5E1", textAlign: "center" }}>
          Ada pertanyaan?{" "}
          <a
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#94A3B8", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            Hubungi support
          </a>
        </p>
      </motion.div>
    </div>
  );
}
