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
  
  // Get phone number and registration data from navigation state
  const phoneNumber = location.state?.phoneNumber || "";
  const registrationData = location.state?.registrationData || null;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no phone number
  useEffect(() => {
    if (!phoneNumber) {
      navigate("/register", { replace: true });
    }
  }, [phoneNumber, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Mask phone number (show first 4 and last 4 digits)
  const maskPhoneNumber = (phone: string) => {
    if (!phone || phone.length < 8) return phone;
    const start = phone.slice(0, 4);
    const end = phone.slice(-4);
    const masked = "\u2022\u2022\u2022\u2022";
    return `+${start}${masked}${end}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all 6 digits are filled
    if (index === 5 && value && newOtp.every((digit) => digit !== "")) {
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
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    setError("");

    // Focus last filled input or trigger submit
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    } else {
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join("");
    
    if (otpToVerify.length !== 6) {
      setError("Masukkan 6 digit kode OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // STEP 2: Verify OTP
      const verifyResponse = await fetch(
        "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number: phoneNumber,
            otp: otpToVerify,
          }),
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok && verifyData.status === "verified") {
        // OTP verified successfully, now create account
        if (registrationData) {
          try {
            const createAccountResponse = await fetch(
              "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/register-mira",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  phone_number: phoneNumber,
                  ...registrationData,
                }),
              }
            );

            if (createAccountResponse.ok) {
              const accountData = await createAccountResponse.json();
              
              // Always persist phone so dashboard auth guard can find it
              localStorage.setItem("mira_phone", phoneNumber);
              // Save user session (also persists mira_user)
              setUserSession(accountData);
              
              // Show success and redirect
              setShowSuccess(true);
              setTimeout(() => {
                navigate("/dashboard", { replace: true });
              }, 1500);
            } else {
              setError("Gagal membuat akun. Coba lagi.");
              setLoading(false);
              setOtp(["", "", "", "", "", ""]);
              inputRefs.current[0]?.focus();
            }
          } catch (err) {
            setError("Gagal membuat akun. Coba lagi.");
            setLoading(false);
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
          }
        } else {
          // No registration data — persist phone and show success
          localStorage.setItem("mira_phone", phoneNumber);
          setShowSuccess(true);
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 1500);
        }
      } else if (verifyData.status === "invalid_otp") {
        setError("Kode OTP salah. Coba lagi.");
        setLoading(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(verifyData.message || "Kode salah atau sudah kadaluarsa.");
        setLoading(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Verifikasi gagal. Coba lagi.");
      setLoading(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");

    try {
      // Call register endpoint again to resend OTP
      const response = await fetch(
        "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/register-mira",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number: phoneNumber,
            resend_otp: true,
          }),
        }
      );

      if (response.ok) {
        // Reset countdown and clear OTP
        setCountdown(60);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setResendLoading(false);
        
        // Show success message briefly
        setError("");
        const successMsg = document.createElement("div");
        successMsg.className = "success-toast";
        successMsg.textContent = "Kode baru telah dikirim!";
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      } else {
        setError("Gagal mengirim ulang kode. Coba lagi.");
        setResendLoading(false);
      }
    } catch (err) {
      setError("Gagal mengirim ulang kode. Coba lagi.");
      setResendLoading(false);
    }
  };

  const handleChangeNumber = () => {
    navigate("/register", { replace: true });
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
              Verifikasi Berhasil! \uD83C\uDF89
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
            onClick={() => navigate("/register")}
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
              Kami telah mengirim kode verifikasi 6 digit ke nomor WhatsApp Anda.
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
          {/* Mobile Back Button */}
          <button
            onClick={() => navigate("/register")}
            className="lg:hidden inline-flex items-center gap-2 text-sm text-black/60 hover:text-black mb-3 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-4">
            <div className="flex items-center justify-center mb-3">
              <img src={logo} alt="MIRA" className="h-8 w-8" />
            </div>
            <h1 className="text-[24px] font-black mb-1 tracking-tight text-[#0F172A]">
              Verifikasi WhatsApp
            </h1>
          </div>

          {/* OTP Card */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 sm:p-8">
            <div className="text-center mb-8">
              <h2 className="text-[28px] sm:text-[32px] font-black mb-3 text-[#0F172A] tracking-tight">
                Cek WhatsApp Anda \uD83D\uDCF2
              </h2>
              <p className="text-[15px] text-black/60 mb-6 font-light leading-relaxed">
                Kami sudah mengirim kode verifikasi ke nomor WhatsApp Anda.
              </p>

              {/* Phone Number Display */}
              <div className="inline-flex items-center gap-3 bg-black/[0.02] border border-black/5 rounded-lg px-4 py-3">
                <span className="text-[17px] font-bold text-[#0F172A] tracking-tight">
                  {maskPhoneNumber(phoneNumber)}
                </span>
                <button
                  onClick={handleChangeNumber}
                  className="text-[13px] text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Ubah
                </button>
              </div>
            </div>

            {/* OTP Input */}
            <div className="mb-6">
              <label className="block text-[14px] font-medium mb-4 text-center text-[#0F172A]">
                Masukkan Kode Verifikasi
              </label>
              <div className="flex justify-center gap-2 sm:gap-3 mb-4" onPaste={handlePaste}>
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
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-[24px] font-bold border-2 rounded-lg transition-all focus:outline-none ${
                      error
                        ? "border-red-500 bg-red-50"
                        : digit
                        ? "border-[#0F172A] bg-[#0F172A]/[0.04]"
                        : "border-black/10 bg-white focus:border-[#0F172A]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                ))}
              </div>

              {/* Error Message */}
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

              {/* Countdown / Resend */}
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

            {/* Verify Button */}
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

            {/* Help Text */}
            <p className="text-[12px] text-center text-black/50 font-light mt-6 leading-relaxed">
              Tidak menerima kode? Pastikan nomor WhatsApp Anda aktif dan periksa chat dari MIRA.
            </p>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 flex items-center justify-center gap-6 text-[13px] text-black/40">
            <button className="hover:text-black/60 transition-colors">
              Privacy
            </button>
            <span>\u00b7</span>
            <button className="hover:text-black/60 transition-colors">
              Terms
            </button>
            <span>\u00b7</span>
            <button className="hover:text-black/60 transition-colors">
              Contact
            </button>
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
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
