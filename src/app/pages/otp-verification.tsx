import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "../components/button";
import { ArrowLeft, Loader2, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import logo from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";
import { useUserSession } from "../context/user-session-context";

export function OTPVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserSession } = useUserSession();

  const registrationData = location.state?.registrationData || null;
  const isLoginFlow = !registrationData;

  // Phone: prefer navigation state, fallback to localStorage (login flow)
  const phoneNumber =
    location.state?.phoneNumber ||
    localStorage.getItem("mira_phone") ||
    "";

  // 4-digit OTP
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!phoneNumber) {
      // No phone found at all — redirect based on flow
      navigate(isLoginFlow ? "/login" : "/register", { replace: true });
    }
  }, [phoneNumber, navigate, isLoginFlow]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const maskPhoneNumber = (phone: string) => {
    if (!phone || phone.length < 8) return phone;
    const start = phone.slice(0, 4);
    const end = phone.slice(-4);
    return `+${start}••••${end}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    if (index === 3 && value && newOtp.every((digit) => digit !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 4);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 4; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    setError("");
    if (pastedData.length === 4) {
      handleVerify(pastedData);
    } else {
      inputRefs.current[Math.min(pastedData.length, 3)]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join("");
    if (otpToVerify.length !== 4) {
      setError("Masukkan 4 digit kode OTP");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const verifyResponse = await fetch(
        "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: phoneNumber, otp: otpToVerify }),
        }
      );
      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok && verifyData.status === "verified") {
        if (registrationData) {
          try {
            const createAccountResponse = await fetch(
              "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/register-mira",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone_number: phoneNumber, ...registrationData }),
              }
            );
            if (createAccountResponse.ok) {
              const accountData = await createAccountResponse.json();
              localStorage.setItem("mira_phone", phoneNumber);
              setUserSession(accountData);
              setShowSuccess(true);
              setTimeout(() => { navigate("/dashboard", { replace: true }); }, 1500);
            } else {
              setError("Gagal membuat akun. Coba lagi.");
              setLoading(false);
              setOtp(["", "", "", ""]);
              inputRefs.current[0]?.focus();
            }
          } catch {
            setError("Gagal membuat akun. Coba lagi.");
            setLoading(false);
            setOtp(["", "", "", ""]);
            inputRefs.current[0]?.focus();
          }
        } else {
          // Login flow — OTP verified, go to dashboard
          localStorage.setItem("mira_phone", phoneNumber);
          setShowSuccess(true);
          setTimeout(() => { navigate("/dashboard", { replace: true }); }, 1500);
        }
      } else if (verifyData.status === "invalid_otp") {
        setError("Kode OTP salah. Coba lagi.");
        setLoading(false);
        setOtp(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(verifyData.message || "Kode salah atau sudah kadaluarsa.");
        setLoading(false);
        setOtp(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Verifikasi gagal. Coba lagi.");
      setLoading(false);
      setOtp(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    try {
      const endpoint = isLoginFlow
        ? "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/login-mira"
        : "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/register-mira";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber, resend_otp: true }),
      });
      if (response.ok) {
        setCountdown(60);
        setCanResend(false);
        setOtp(["", "", "", ""]);
        inputRefs.current[0]?.focus();
        setResendLoading(false);
        const successMsg = document.createElement("div");
        successMsg.className = "success-toast";
        successMsg.textContent = "Kode baru telah dikirim!";
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      } else {
        setError("Gagal mengirim ulang kode. Coba lagi.");
        setResendLoading(false);
      }
    } catch {
      setError("Gagal mengirim ulang kode. Coba lagi.");
      setResendLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 sm:p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </motion.div>
            <h1 className="text-[32px] sm:text-[40px] font-black mb-4 tracking-tight text-[#0F172A]">
              Verifikasi Berhasil! 🎉
            </h1>
            <p className="text-[15px] sm:text-base text-black/60 leading-relaxed font-light">
              Akun Anda telah aktif. Redirecting...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-stretch bg-white">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex flex-1 items-center justify-center pl-20 pr-10 bg-[#F8F8F6]">
        <div className="w-full max-w-2xl">
          <button
            onClick={() => navigate(isLoginFlow ? "/login" : "/register")}
            className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-black mb-20 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <div className="mb-16">
            <h1 className="text-[56px] xl:text-[64px] font-black leading-[0.95] tracking-tight mb-6 text-[#0F172A]">
              Verifikasi
              <br />
              WhatsApp Anda.
            </h1>
            <p className="text-[20px] xl:text-[22px] text-black/60 leading-relaxed font-light">
              Kami telah mengirim kode verifikasi 4 digit ke nomor WhatsApp Anda.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <img src={logo} alt="MIRA" className="h-8 w-8" />
            <span className="text-sm font-semibold text-[#0F172A]">MIRA</span>
          </div>
        </div>
      </div>

      {/* Right Side - OTP Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 lg:pr-20 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <button
            onClick={() => navigate(isLoginFlow ? "/login" : "/register")}
            className="lg:hidden inline-flex items-center gap-2 text-sm text-black/60 hover:text-black mb-3 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          <div className="lg:hidden text-center mb-4">
            <div className="flex items-center justify-center mb-3">
              <img src={logo} alt="MIRA" className="h-8 w-8" />
            </div>
            <h1 className="text-[24px] font-black mb-1 tracking-tight text-[#0F172A]">
              Verifikasi WhatsApp
            </h1>
          </div>

          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 sm:p-8">
            <div className="text-center mb-8">
              <h2 className="text-[28px] sm:text-[32px] font-black mb-3 text-[#0F172A] tracking-tight">
                Cek WhatsApp Anda 📲
              </h2>
              <p className="text-[15px] text-black/60 mb-6 font-light leading-relaxed">
                Kami sudah mengirim kode verifikasi ke nomor WhatsApp Anda.
              </p>
              <div className="inline-flex items-center gap-3 bg-black/[0.02] border border-black/5 rounded-lg px-4 py-3">
                <span className="text-[17px] font-bold text-[#0F172A] tracking-tight">
                  {maskPhoneNumber(phoneNumber)}
                </span>
                <button
                  onClick={() => navigate(isLoginFlow ? "/login" : "/register", { replace: true })}
                  className="text-[13px] text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Ubah
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[14px] font-medium mb-4 text-center text-[#0F172A]">
                Masukkan Kode Verifikasi
              </label>
              <div className="flex justify-center gap-3 sm:gap-4 mb-4" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading}
                    className={`w-14 h-16 sm:w-16 sm:h-18 text-center text-[28px] font-bold border-2 rounded-lg transition-all focus:outline-none ${
                      error
                        ? "border-red-500 bg-red-50"
                        : digit
                        ? "border-[#0F172A] bg-[#0F172A]/[0.04]"
                        : "border-black/10 bg-white focus:border-[#0F172A]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2 text-red-600 text-[13px] font-medium mb-4"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-center">
                {!canResend ? (
                  <p className="text-[13px] text-black/50 font-light">
                    Kirim ulang dalam{" "}
                    <span className="font-semibold text-[#0F172A]">
                      00:{countdown.toString().padStart(2, "0")}
                    </span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-[14px] text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
                  >
                    {resendLoading ? "Mengirim..." : "Kirim ulang kode"}
                  </button>
                )}
              </div>
            </div>

            <Button
              onClick={() => handleVerify()}
              disabled={otp.some((digit) => !digit) || loading}
              className="w-full h-12 bg-[#0F172A] text-white hover:bg-[#0F172A]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[15px] font-medium rounded-lg transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </div>
              ) : (
                "Verifikasi"
              )}
            </Button>

            <p className="text-[12px] text-center text-black/50 font-light mt-6 leading-relaxed">
              Tidak menerima kode? Pastikan nomor WhatsApp Anda aktif dan periksa chat dari MIRA.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-[13px] text-black/40">
            <button className="hover:text-black/60 transition-colors">Privacy</button>
            <span>·</span>
            <button className="hover:text-black/60 transition-colors">Terms</button>
            <span>·</span>
            <button className="hover:text-black/60 transition-colors">Contact</button>
          </div>
        </motion.div>
      </div>

      <style>{`
        .success-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideUp 0.3s ease-out;
          z-index: 1000;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
