import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OtpFormProps {
  phoneNumber: string;
  onVerified: (data: any) => void;
  onChangeNumber: () => void;
}

export function OtpForm({ phoneNumber, onVerified, onChangeNumber }: OtpFormProps) {
  // n8n generates 4-digit OTPs — this MUST match
  const OTP_LENGTH = 4;

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const maskPhoneNumber = (phone: string) => {
    if (!phone || phone.length < 8) return phone;
    return `+${phone.slice(0, 4)}••••${phone.slice(-4)}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError("");

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === OTP_LENGTH - 1 && value && newOtp.every((d) => d !== "")) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, OTP_LENGTH);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pastedData.length; i++) newOtp[i] = pastedData[i];
    setOtp(newOtp);
    setOtpError("");

    if (pastedData.length === OTP_LENGTH) {
      handleVerifyOtp(pastedData);
    } else {
      inputRefs.current[Math.min(pastedData.length, OTP_LENGTH - 1)]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join("");

    if (otpToVerify.length !== OTP_LENGTH) {
      setOtpError(`Masukkan ${OTP_LENGTH} digit kode OTP`);
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const response = await fetch(
        "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ phone_number: phoneNumber, otp: otpToVerify }),
        }
      );

      let data: any = {};
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      // STRICT CHECK: only data.status === 'success' is a valid verification.
      // Do NOT use response.ok — n8n returns HTTP 200 for BOTH success and failure.
      // Using response.ok would bypass OTP validation entirely.
      if (data.status === 'success') {
        onVerified(data);
      } else {
        setOtpError(data.message || "Kode salah atau sudah kadaluarsa.");
        setOtpLoading(false);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setOtpError("Verifikasi gagal. Coba lagi.");
      setOtpLoading(false);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    try {
      const response = await fetch(
        "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/register-mira",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: phoneNumber, resend_otp: true }),
        }
      );
      if (response.ok) {
        setCountdown(60);
        setCanResend(false);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        setOtpLoading(false);
      } else {
        setOtpError("Gagal mengirim ulang. Coba lagi.");
        setOtpLoading(false);
      }
    } catch {
      setOtpError("Gagal mengirim ulang. Coba lagi.");
      setOtpLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-[28px] sm:text-[32px] font-black mb-3 text-[#0F172A] tracking-tight">
          Masukkan Kode OTP
        </h2>
        <p className="text-[15px] text-black/60 mb-6 font-light leading-relaxed">
          Kami sudah mengirimkan kode {OTP_LENGTH} digit ke WhatsApp Anda
        </p>

        <div className="inline-flex items-center gap-3 bg-black/[0.02] border border-black/5 rounded-lg px-4 py-3">
          <span className="text-[17px] font-bold text-[#0F172A] tracking-tight">
            {maskPhoneNumber(phoneNumber)}
          </span>
          <button
            onClick={onChangeNumber}
            className="text-[13px] text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Ubah
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-center gap-3 sm:gap-4 mb-4" onPaste={handleOtpPaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              disabled={otpLoading}
              className={`w-14 h-16 sm:w-16 sm:h-18 text-center text-[28px] font-bold border-2 rounded-lg transition-all focus:outline-none ${
                otpError
                  ? "border-red-500 bg-red-50"
                  : digit
                  ? "border-[#0F172A] bg-[#0F172A]/[0.04]"
                  : "border-black/10 bg-white focus:border-[#0F172A]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {otpError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 text-red-600 text-[13px] font-medium mb-4"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{otpError}</span>
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
              onClick={handleResendOtp}
              disabled={otpLoading}
              className="text-[14px] text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
            >
              {otpLoading ? "Mengirim..." : "Kirim ulang kode"}
            </button>
          )}
        </div>
      </div>

      <Button
        onClick={() => handleVerifyOtp()}
        disabled={otp.some((digit) => !digit) || otpLoading}
        className="w-full h-12 bg-[#0F172A] text-white hover:bg-[#0F172A]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[15px] font-medium rounded-lg transition-all"
      >
        {otpLoading ? (
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
  );
}
