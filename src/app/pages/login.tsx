import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import logo from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";
import { useUserSession } from "../context/user-session-context";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUserSession } = useUserSession();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Normalize to E.164 WITHOUT + — always "628xxxxxxxx"
   * Handles: 08xxx / 8xxx / +628xxx / 628xxx
   */
  const normalizePhone = (input: string): string => {
    let p = input.replace(/[^\d+]/g, "");
    if (p.startsWith("+")) p = p.slice(1);          // +628 → 628
    if (p.startsWith("0")) p = "62" + p.slice(1);   // 08xx → 628xx
    if (p.startsWith("8") || p.startsWith("9")) p = "62" + p; // 8xx → 628xx
    return p;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalized = normalizePhone(phone);

    if (normalized.length < 10 || !normalized.startsWith("62")) {
      setError("Masukkan nomor WhatsApp yang valid (contoh: 08123456789)");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/login-mira",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: normalized }),
        },
      );

      const data = await response.json();

      if (data.status === "otp_sent") {
        // OTP sent successfully — go to OTP verification page
        localStorage.setItem("mira_phone", normalized);
        navigate("/otp-verification");
      } else if (data.status === "success") {
        // Direct login (no OTP required)
        localStorage.setItem("mira_phone", normalized);
        setUserSession(data);
        navigate("/dashboard");
      } else {
        // Show server error message
        const msg = data.message || "Terjadi kesalahan. Coba lagi ya.";
        if (
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("tidak ditemukan") ||
          msg.toLowerCase().includes("user not found")
        ) {
          setError("Nomor tidak terdaftar. Pastikan nomor WhatsApp yang kamu gunakan saat daftar.");
        } else {
          setError(msg);
        }
        setLoading(false);
      }
    } catch {
      setError("Koneksi gagal. Periksa internet kamu dan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm text-[#1a1a2e]/60 hover:text-[#1a1a2e] mb-8 transition-colors font-medium active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <img src={logo} alt="MIRA" className="h-12 sm:h-14" />
          </div>
          <h1 className="font-['Playfair_Display'] text-[36px] sm:text-[44px] font-medium mb-3 tracking-tight text-[#1a1a2e]">
            Masuk ke MIRA
          </h1>
          <p className="text-[16px] sm:text-[17px] text-[#1a1a2e]/60 font-light">
            Gunakan nomor WhatsApp yang terdaftar.
          </p>
        </div>

        {/* Login Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-[15px] font-medium mb-2.5 text-[#1a1a2e]">
              Nomor WhatsApp
            </label>
            <Input
              type="tel"
              placeholder="08123456789"
              value={phone}
              onChange={handlePhoneChange}
              className="h-14 px-4 bg-white border-[#2D5BFF]/10 text-[16px] text-[#1a1a2e] placeholder:text-[#1a1a2e]/30 focus:border-[#2D5BFF] focus:ring-2 focus:ring-[#2D5BFF]/20 transition-all rounded-xl"
              disabled={loading}
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[14px] text-red-600 mt-3 font-medium"
              >
                {error}
              </motion.p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={phone.length < 8 || loading}
            className="w-full h-14 bg-[#2D5BFF] text-white hover:bg-[#2D5BFF]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[16px] font-medium rounded-xl transition-all active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Memproses...
              </>
            ) : (
              "Kirim Kode OTP"
            )}
          </Button>

          <p className="text-[13px] text-center text-[#1a1a2e]/50 font-light pt-2">
            Data lo aman. Tidak ada akses ke rekening.
          </p>
        </div>

        {/* Footer Link */}
        <div className="mt-10 pt-6 border-t border-[#2D5BFF]/10 text-center">
          <p className="text-[15px] text-[#1a1a2e]/60">
            Belum punya akun?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-[#2D5BFF] font-medium hover:underline active:scale-95 inline-block transition-transform"
            >
              Daftar sekarang
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
