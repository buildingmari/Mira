import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { ArrowLeft, Loader2, Check, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import logo from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";
import { useUserSession } from "../context/user-session-context";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface AssessmentData {
  // Section 1
  income_range: string;
  income_type: string;
  
  // Section 2
  spending_categories: string[];
  
  // Section 3
  financial_goals: string[];
  
  // Section 4
  monitoring_preference: string;
  limit_method: string;
  limit_percentage?: number; // 0-100
  limit_nominal?: number; // Rupiah amount
  reminder_style: string;
  
  // Section 5
  payment_methods: string[];
  banks_umum: string[];
  banks_digital: string[];
  ewallets: string[];
  paylaters: string[];
  has_credit_card: string;
  credit_cards: { bank: string; count: number }[];
  
  // NEW: Payment priority
  payment_priority: string[];
  
  // User data
  phone: string;
  name: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { setUserSession } = useUserSession();
  
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPriorityQuestion, setShowPriorityQuestion] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [expandedBankSection, setExpandedBankSection] = useState<"umum" | "digital" | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [data, setData] = useState<AssessmentData>({
    income_range: "",
    income_type: "",
    spending_categories: [],
    financial_goals: [],
    monitoring_preference: "",
    limit_method: "",
    limit_percentage: undefined,
    limit_nominal: undefined,
    reminder_style: "",
    payment_methods: [],
    banks_umum: [],
    banks_digital: [],
    ewallets: [],
    paylaters: [],
    has_credit_card: "",
    credit_cards: [],
    payment_priority: [],
    phone: "",
    name: "",
  });

  // Section structure
  const sections = [
    {
      title: "Income & Cash Flow",
      questions: [
        {
          id: "income_range",
          text: "Berapa rata-rata penghasilan bulanan kamu?",
          subtext: "Ini membantu kami menyesuaikan saran keuangan dengan kondisi kamu.",
          type: "single",
          options: [
            "< Rp 3 juta",
            "Rp 3–5 juta",
            "Rp 5–10 juta",
            "Rp 10–20 juta",
            "Rp 20–30 juta",
            "Rp 30–50 juta",
            "> Rp 50 juta",
          ],
        },
        {
          id: "income_type",
          text: "Jenis penghasilan kamu:",
          subtext: "Apakah pendapatan kamu stabil atau bervariasi tiap bulan?",
          type: "single",
          options: [
            "Tetap tiap bulan",
            "Tidak tetap / freelance",
            "Campuran",
          ],
        },
      ],
    },
    {
      title: "Spending Behavior",
      questions: [
        {
          id: "spending_categories",
          text: "Biasanya uang kamu paling banyak habis untuk:",
          subtext: "Pilih semua yang sesuai dengan kebiasaan kamu.",
          type: "multi",
          options: [
            "Makan & jajan",
            "Nongkrong / lifestyle",
            "Belanja online",
            "Kebutuhan keluarga",
            "Transportasi",
            "Cicilan",
            "Tidak terasa habis saja",
          ],
        },
      ],
    },
    {
      title: "Financial Goals",
      questions: [
        {
          id: "financial_goals",
          text: "Dalam 3 bulan ke depan, kamu ingin kondisi keuangan kamu seperti apa?",
          subtext: "Apa yang ingin kamu capai atau perbaiki?",
          type: "multi",
          options: [
            "Lebih hemat",
            "Lebih disiplin",
            "Mulai nabung",
            "Kontrol belanja impulsif",
            "Mengurangi utang",
            "Tracking pengeluaran lebih rapi",
          ],
        },
      ],
    },
    {
      title: "Limit & Monitoring",
      questions: [
        {
          id: "monitoring_preference",
          text: "Kamu ingin MIRA membantu dengan:",
          subtext: "Pilih pendekatan yang paling sesuai untuk kamu.",
          type: "single",
          options: [
            "Monitoring pengeluaran otomatis",
            "Memberi peringatan saat mendekati limit",
            "Memberi rekomendasi penghematan",
            "Semua di atas",
          ],
        },
        {
          id: "limit_method",
          text: "Rasio batas pengeluaran kamu",
          subtext: "Mana yang lebih mudah untuk kamu kelola?",
          type: "custom-limit",
          options: [
            "Percentage dari income",
            "Nominal limit langsung",
          ],
        },
        {
          id: "reminder_style",
          text: "Gaya pengingat yang kamu prefer:",
          subtext: "Pilih tone komunikasi yang kamu sukai.",
          type: "single",
          options: [
            "Tegas (disiplin)",
            "Santai & lembut",
          ],
        },
      ],
    },
    {
      title: "Spending Method",
      questions: [
        {
          id: "payment_methods",
          text: "Biasanya kamu bayar pakai apa?",
          subtext: "Pilih semua metode yang biasa kamu gunakan.",
          type: "multi",
          options: [
            "Tunai",
            "Debit / kartu ATM",
            "Transfer bank",
            "E-wallet",
            "PayLater",
            "Kartu kredit",
          ],
        },
        {
          id: "banks",
          text: "Bank yang kamu gunakan:",
          subtext: "Pilih bank yang aktif kamu pakai untuk transaksi.",
          type: "custom-banks",
        },
        {
          id: "ewallets",
          text: "E-wallet yang digunakan:",
          subtext: "Pilih semua e-wallet yang kamu pakai.",
          type: "multi",
          options: [
            "GoPay",
            "DANA",
            "ShopeePay",
            "OVO",
            "LinkAja",
            "AstraPay",
            "Lainnya",
            "Tidak menggunakan sama sekali",
          ],
        },
        {
          id: "paylaters",
          text: "PayLater yang digunakan:",
          subtext: "Apakah kamu menggunakan layanan paylater?",
          type: "multi",
          options: [
            "Kredivo",
            "Akulaku",
            "SPayLater",
            "GoPayLater",
            "Traveloka PayLater",
            "Lainnya",
            "Tidak menggunakan sama sekali",
          ],
        },
        {
          id: "has_credit_card",
          text: "Apakah kamu memiliki kartu kredit?",
          subtext: "Jika ada, kami akan minta detail bank penerbit.",
          type: "single",
          options: ["Tidak ada", "Ada"],
        },
      ],
    },
  ];

  // Countdown timer
  useEffect(() => {
    if (showOtpForm && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, showOtpForm]);

  useEffect(() => {
    if (showOtpForm && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [showOtpForm]);

  const getCurrentQuestion = () => {
    return sections[currentSection]?.questions[currentQuestion];
  };

  const canProceed = () => {
    const question = getCurrentQuestion();
    if (!question) return false;

    switch (question.id) {
      case "income_range":
        return data.income_range !== "";
      case "income_type":
        return data.income_type !== "";
      case "spending_categories":
        return data.spending_categories.length > 0;
      case "financial_goals":
        return data.financial_goals.length > 0;
      case "monitoring_preference":
        return data.monitoring_preference !== "";
      case "limit_method":
        if (data.limit_method === "") return false;
        if (data.limit_method === "Percentage dari income") {
          return data.limit_percentage !== undefined && data.limit_percentage > 0;
        }
        if (data.limit_method === "Nominal limit langsung") {
          return data.limit_nominal !== undefined && data.limit_nominal > 0;
        }
        return false;
      case "reminder_style":
        return data.reminder_style !== "";
      case "payment_methods":
        return data.payment_methods.length > 0;
      case "banks":
        return data.banks_umum.length > 0 || data.banks_digital.length > 0;
      case "ewallets":
        return data.ewallets.length > 0;
      case "paylaters":
        return data.paylaters.length > 0;
      case "has_credit_card":
        if (data.has_credit_card === "Tidak ada") return true;
        if (data.has_credit_card === "Ada") return data.credit_cards.length > 0;
        return false;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const section = sections[currentSection];
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Check if there's a next question in current section
    if (currentQuestion < section.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } 
    // Move to next section
    else if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    }
    // Assessment complete - show priority question before summary
    else {
      // Build payment priority list from user selections
      const priorityList: string[] = [];
      
      // Add banks
      [...data.banks_umum, ...data.banks_digital].forEach(bank => {
        if (bank !== "Tidak menggunakan bank digital" && bank !== "Lainnya") {
          priorityList.push(bank);
        }
      });
      
      // Add e-wallets
      data.ewallets.forEach(wallet => {
        if (wallet !== "Tidak menggunakan sama sekali" && wallet !== "Lainnya") {
          priorityList.push(wallet);
        }
      });
      
      // Add paylaters
      data.paylaters.forEach(paylater => {
        if (paylater !== "Tidak menggunakan sama sekali" && paylater !== "Lainnya") {
          priorityList.push(paylater);
        }
      });
      
      // Add credit cards
      data.credit_cards.forEach(cc => {
        priorityList.push(`${cc.bank} (Kartu Kredit)`);
      });
      
      // Set initial priority order
      setData({ ...data, payment_priority: priorityList });
      setShowPriorityQuestion(true);
    }
  };

  const handleBack = () => {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setCurrentQuestion(sections[currentSection - 1].questions.length - 1);
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setData((prevData) => {
        const oldIndex = prevData.payment_priority.indexOf(active.id as string);
        const newIndex = prevData.payment_priority.indexOf(over.id as string);

        return {
          ...prevData,
          payment_priority: arrayMove(prevData.payment_priority, oldIndex, newIndex),
        };
      });
    }
  };

  const toggleMultiSelect = (field: keyof AssessmentData, value: string) => {
    const current = data[field] as string[];
    if (current.includes(value)) {
      setData({ ...data, [field]: current.filter((v) => v !== value) });
    } else {
      setData({ ...data, [field]: [...current, value] });
    }
  };

  const formatPhoneNumber = (input: string) => {
    let cleaned = input.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) return cleaned.substring(1);
    if (cleaned.startsWith("0")) return "62" + cleaned.substring(1);
    if (cleaned.startsWith("8") || cleaned.startsWith("9")) return "62" + cleaned;
    return cleaned;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setData({ ...data, phone: formatted });
    setError("");
  };

  const handleSubmit = async () => {
    if (!data.name || data.phone.length < 10) {
      setError("Mohon lengkapi semua data.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Generate order_id once at registration
      const orderId = `SUB-${data.phone}-${Date.now()}`;
      
      // Call register webhook
      const response = await fetch(
        "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/register-mira",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            name: data.name,
            phone_number: data.phone,
            income_range: data.income_range,
            income_type: data.income_type,
            spending_categories: data.spending_categories,
            financial_goals: data.financial_goals,
            limit_method: data.limit_method,
            limit_percentage: data.limit_percentage,
            limit_nominal: data.limit_nominal,
            monitoring_preference: data.monitoring_preference,
            reminder_style: data.reminder_style,
            payment_methods: data.payment_methods,
            banks_umum: data.banks_umum,
            banks_digital: data.banks_digital,
            ewallets: data.ewallets,
            paylaters: data.paylaters,
            credit_cards: data.credit_cards,
            payment_priority: data.payment_priority,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Gagal mendaftar. Coba lagi.");
      }

      const result = await response.json();

      // Store assessment data + order_id to sessionStorage for payment webhook
      sessionStorage.setItem('assessment_data', JSON.stringify({
        order_id: orderId,
        name: data.name,
        phone_number: data.phone,
        income_range: data.income_range,
        income_type: data.income_type,
        spending_categories: data.spending_categories,
        financial_goals: data.financial_goals,
        limit_method: data.limit_method,
        limit_percentage: data.limit_percentage,
        limit_nominal: data.limit_nominal,
        monitoring_preference: data.monitoring_preference,
        reminder_style: data.reminder_style,
        payment_methods: data.payment_methods,
        banks_umum: data.banks_umum,
        banks_digital: data.banks_digital,
        ewallets: data.ewallets,
        paylaters: data.paylaters,
        credit_cards: data.credit_cards,
        payment_priority: data.payment_priority,
      }));

      // Registration successful - go to subscription page
      setLoading(false);
      navigate("/subscription");
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Periksa koneksi internet Anda.");
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (index === 5 && value && newOtp.every((digit) => digit !== "")) {
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
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    setOtpError("");
    if (pastedData.length === 6) {
      handleVerifyOtp(pastedData);
    } else {
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join("");
    if (otpToVerify.length !== 6) {
      setOtpError("Masukkan 6 digit kode OTP");
      return;
    }
    setOtpLoading(true);
    setOtpError("");

    try {
      const response = await fetch(
        "https://n8n-nkpskgzjoaqk.jkt1.sumopod.my.id/webhook/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone_number: data.phone,
            otp: otpToVerify,
          }),
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.status === "verified") {
        setUserSession(responseData);
        setShowSuccess(true);
        setOtpLoading(false);
      } else {
        setOtpError("Kode OTP salah. Coba lagi.");
        setOtpLoading(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setOtpError("Verifikasi gagal. Coba lagi.");
      setOtpLoading(false);
      setOtp(["", "", "", "", "", ""]);
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
          body: JSON.stringify({
            phone_number: data.phone,
            resend_otp: true,
          }),
        }
      );
      if (response.ok) {
        setCountdown(60);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setOtpLoading(false);
      }
    } catch (err) {
      setOtpError("Gagal mengirim ulang. Coba lagi.");
      setOtpLoading(false);
    }
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/${data.phone}`, "_blank");
  };

  // Sortable Item Component
  function SortableItem({ id }: { id: string }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-4 p-5 bg-white/50 border border-[#2D5BFF]/10 rounded-2xl transition-all ${
          isDragging ? "shadow-lg" : ""
        }`}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[#1a1a2e]/40 hover:text-[#1a1a2e] transition-colors"
        >
          <GripVertical className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <span className="flex-1 text-[15px] font-light text-[#1a1a2e]">{id}</span>
      </div>
    );
  }

  // Calculate progress values (needed for multiple screens)
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const currentQuestionNumber = sections.slice(0, currentSection).reduce((sum, s) => sum + s.questions.length, 0) + currentQuestion + 1;
  const progress = (currentQuestionNumber / totalQuestions) * 100;

  // Success screen
  if (showSuccess) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-16 h-16 mx-auto mb-12 rounded-full bg-[#2D5BFF] flex items-center justify-center"
          >
            <Check className="w-8 h-8 text-white" strokeWidth={1.5} />
          </motion.div>

          <h1 className="font-['Playfair_Display'] text-[40px] leading-[1.1] font-medium mb-4 text-[#1a1a2e]">
            Account Created
          </h1>
          <p className="text-[15px] leading-[1.7] text-[#1a1a2e]/60 mb-16 font-light max-w-sm mx-auto">
            Your profile is ready. Let's choose the right plan for your financial journey.
          </p>

          <Button
            onClick={() => navigate("/subscription")}
            className="w-full h-14 bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 text-white text-[15px] font-medium rounded-2xl transition-all"
          >
            Continue
          </Button>
        </motion.div>
      </div>
    );
  }

  // OTP screen
  if (showOtpForm) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-16">
            <img src={logo} alt="MIRA" className="h-10 mx-auto mb-12 opacity-80" />
            <h1 className="font-['Playfair_Display'] text-[40px] leading-[1.1] font-medium mb-4 text-[#1a1a2e]">
              Verifikasi OTP
            </h1>
            <p className="text-[15px] leading-[1.7] text-[#1a1a2e]/60 font-light">
              Kode sudah dikirim ke WhatsApp
              <br />
              +{data.phone}
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
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
                  className="w-12 h-16 text-center text-[20px] font-medium border border-[#2D5BFF]/10 rounded-xl focus:border-[#2D5BFF] focus:outline-none transition-all bg-white/50"
                  disabled={otpLoading}
                />
              ))}
            </div>

            {otpError && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[14px] text-red-600 text-center font-light"
              >
                {otpError}
              </motion.p>
            )}

            {countdown > 0 ? (
              <p className="text-[13px] text-center text-[#1a1a2e]/40 font-light">
                Kirim ulang dalam {countdown}s
              </p>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={otpLoading}
                className="text-[14px] text-[#2D5BFF] font-medium hover:underline mx-auto block"
              >
                Kirim Ulang OTP
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Payment Priority Question Screen
  if (showPriorityQuestion) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center p-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl"
        >
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setShowPriorityQuestion(false);
              setCurrentSection(4);
              setCurrentQuestion(4);
            }}
            className="inline-flex items-center gap-2 text-[14px] text-[#1a1a2e]/50 hover:text-[#1a1a2e] mb-12 transition-colors font-light"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Kembali
          </button>

          <div className="mb-12">
            <h1 className="font-['Playfair_Display'] text-[36px] sm:text-[42px] leading-[1.15] font-medium mb-4 text-[#1a1a2e]">
              Kalau untuk belanja sehari-hari, urutan yang paling sering kamu pakai apa?
            </h1>
            <p className="text-[15px] leading-[1.7] text-[#1a1a2e]/50 font-light max-w-lg">
              Drag untuk mengatur urutan dari paling sering digunakan.
            </p>
          </div>

          {data.payment_priority.length > 0 ? (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={data.payment_priority}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 mb-12">
                    {data.payment_priority.map((item, index) => (
                      <div key={item} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#2D5BFF] text-white flex items-center justify-center text-[13px] font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <SortableItem id={item} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <Button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setShowPriorityQuestion(false);
                  setShowSummary(true);
                }}
                className="w-full h-14 bg-[#2D5BFF] text-white hover:bg-[#2D5BFF]/90 text-[15px] font-medium rounded-2xl transition-all"
              >
                Lanjut ke Ringkasan
              </Button>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-[15px] text-[#1a1a2e]/50 font-light mb-8">
                Tidak ada metode pembayaran yang dipilih.
              </p>
              <Button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setShowPriorityQuestion(false);
                  setShowSummary(true);
                }}
                className="w-full h-14 bg-[#2D5BFF] text-white hover:bg-[#2D5BFF]/90 text-[15px] font-medium rounded-2xl transition-all"
              >
                Lewati & Lanjut ke Ringkasan
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Summary screen
  if (showSummary) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAF8] flex items-center justify-center p-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl"
        >
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setShowSummary(false);
              setShowPriorityQuestion(true);
            }}
            className="inline-flex items-center gap-2 text-[14px] text-[#1a1a2e]/50 hover:text-[#1a1a2e] mb-12 transition-colors font-light"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Kembali
          </button>

          <div className="mb-12">
            <h1 className="font-['Playfair_Display'] text-[42px] leading-[1.1] font-medium mb-3 text-[#1a1a2e]">
              Profil Keuangan Kamu
            </h1>
            <p className="text-[15px] leading-[1.7] text-[#1a1a2e]/50 font-light">
              Ringkasan dari {totalQuestions} pertanyaan yang sudah kamu jawab.
            </p>
          </div>

          {/* Compact summary cards */}
          <div className="space-y-4 mb-12 pb-12 border-b border-[#2D5BFF]/5">
            {/* Income */}
            <div className="bg-white/50 border border-[#2D5BFF]/10 rounded-2xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-[#1a1a2e]/40 font-medium mb-3">Income & Cash Flow</p>
              <p className="text-[15px] text-[#1a1a2e] font-light leading-[1.6]">
                {data.income_range} · {data.income_type}
              </p>
            </div>

            {/* Spending & Goals */}
            <div className="bg-white/50 border border-[#2D5BFF]/10 rounded-2xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-[#1a1a2e]/40 font-medium mb-3">Kebiasaan & Target</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[12px] text-[#1a1a2e]/50 font-light mb-1.5">Sering habis untuk:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.spending_categories.map((cat) => (
                      <span key={cat} className="text-[13px] bg-[#2D5BFF]/5 text-[#1a1a2e] px-2.5 py-1 rounded-full font-light">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[12px] text-[#1a1a2e]/50 font-light mb-1.5">Target 3 bulan:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.financial_goals.map((goal) => (
                      <span key={goal} className="text-[13px] bg-[#2D5BFF]/5 text-[#1a1a2e] px-2.5 py-1 rounded-full font-light">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Monitoring Preference */}
            <div className="bg-white/50 border border-[#2D5BFF]/10 rounded-2xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-[#1a1a2e]/40 font-medium mb-3">Preferensi MIRA</p>
              <div className="space-y-2 text-[14px] text-[#1a1a2e] font-light">
                <p>• {data.monitoring_preference}</p>
                <p>• Set limit: {data.limit_method}</p>
                <p>• Reminder: {data.reminder_style}</p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white/50 border border-[#2D5BFF]/10 rounded-2xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-[#1a1a2e]/40 font-medium mb-3">Metode Bayar</p>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {data.payment_methods.map((method) => (
                    <span key={method} className="text-[13px] bg-[#2D5BFF]/5 text-[#1a1a2e] px-2.5 py-1 rounded-full font-light">
                      {method}
                    </span>
                  ))}
                </div>

                {/* Banks */}
                {(data.banks_umum.length > 0 || data.banks_digital.length > 0) && (
                  <div className="pt-2 border-t border-[#2D5BFF]/5">
                    <p className="text-[12px] text-[#1a1a2e]/50 font-light mb-1.5">Bank:</p>
                    <p className="text-[14px] text-[#1a1a2e] font-light">
                      {[...data.banks_umum, ...data.banks_digital.filter(b => b !== "Tidak menggunakan bank digital")].join(", ")}
                    </p>
                  </div>
                )}

                {/* E-wallet */}
                {data.ewallets.length > 0 && data.ewallets[0] !== "Tidak menggunakan sama sekali" && (
                  <div className="pt-2 border-t border-[#2D5BFF]/5">
                    <p className="text-[12px] text-[#1a1a2e]/50 font-light mb-1.5">E-wallet:</p>
                    <p className="text-[14px] text-[#1a1a2e] font-light">{data.ewallets.join(", ")}</p>
                  </div>
                )}

                {/* PayLater */}
                {data.paylaters.length > 0 && data.paylaters[0] !== "Tidak menggunakan sama sekali" && (
                  <div className="pt-2 border-t border-[#2D5BFF]/5">
                    <p className="text-[12px] text-[#1a1a2e]/50 font-light mb-1.5">PayLater:</p>
                    <p className="text-[14px] text-[#1a1a2e] font-light">{data.paylaters.join(", ")}</p>
                  </div>
                )}

                {/* Credit Cards */}
                {data.credit_cards.length > 0 && (
                  <div className="pt-2 border-t border-[#2D5BFF]/5">
                    <p className="text-[12px] text-[#1a1a2e]/50 font-light mb-1.5">Kartu Kredit:</p>
                    <p className="text-[14px] text-[#1a1a2e] font-light">
                      {data.credit_cards.map((cc) => cc.bank).join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[13px] uppercase tracking-wider mb-3 text-[#1a1a2e]/60 font-medium">
                Nama Lengkap
              </label>
              <Input
                type="text"
                placeholder="Masukkan nama"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                className="h-14 px-5 bg-white/50 border-[#2D5BFF]/10 text-[16px] placeholder:text-[#1a1a2e]/30 focus:border-[#2D5BFF] focus:outline-none transition-all rounded-2xl font-light"
              />
            </div>

            <div>
              <label className="block text-[13px] uppercase tracking-wider mb-3 text-[#1a1a2e]/60 font-medium">
                Nomor WhatsApp
              </label>
              <Input
                type="tel"
                placeholder="08123456789"
                value={data.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="h-14 px-5 bg-white/50 border-[#2D5BFF]/10 text-[16px] placeholder:text-[#1a1a2e]/30 focus:border-[#2D5BFF] focus:outline-none transition-all rounded-2xl font-light"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[14px] text-red-600 font-light"
              >
                {error}
              </motion.p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!data.name || data.phone.length < 10 || loading}
              className="w-full h-14 bg-[#2D5BFF] text-white hover:bg-[#2D5BFF]/90 disabled:opacity-40 text-[15px] font-medium rounded-2xl transition-all mt-8"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Daftar Sekarang"
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Assessment flow - COMPLETELY REDESIGNED
  const question = getCurrentQuestion();
  const currentSectionData = sections[currentSection];

  return (
    <div className="min-h-[100dvh] bg-[#FAFAF8] flex flex-col">
      {/* Thin progress line - top center */}
      <div className="fixed top-0 left-0 right-0 h-[1px] bg-[#2D5BFF]/5 z-50">
        <motion.div
          className="h-full bg-[#2D5BFF]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Progress indicator - visible percentage */}
      <div className="fixed top-6 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/90 backdrop-blur-md border border-[#2D5BFF]/10 rounded-full px-5 py-2 shadow-sm"
        >
          <p className="text-[13px] font-light text-[#1a1a2e]/70">
            <span className="font-medium text-[#1a1a2e]">{Math.round(progress)}%</span>
            {" · "}
            <span>{currentQuestionNumber}/{totalQuestions}</span>
            {" · "}
            <span className="text-[#1a1a2e]/50">{totalQuestions - currentQuestionNumber} lagi</span>
          </p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-2xl"
        >
          {/* Back button - subtle */}
          {(currentSection > 0 || currentQuestion > 0) && (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-[14px] text-[#1a1a2e]/40 hover:text-[#1a1a2e] mb-16 transition-colors font-light"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              Kembali
            </button>
          )}

          {/* Question content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentSection}-${currentQuestion}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Headline - serif, large, editorial */}
              <h1 className="font-['Playfair_Display'] text-[36px] sm:text-[42px] leading-[1.15] font-medium mb-4 text-[#1a1a2e] max-w-xl">
                {question.text}
              </h1>

              {/* Subtext - light sans-serif */}
              <p className="text-[15px] leading-[1.7] text-[#1a1a2e]/50 mb-16 font-light max-w-lg">
                {question.subtext}
              </p>

              {/* Answer options - REDESIGNED */}
              <div className="space-y-3 mb-12">
                {/* Single select - large card blocks */}
                {question.type === "single" && question.options?.map((option) => {
                  const isSelected = data[question.id as keyof AssessmentData] === option;
                  return (
                    <motion.button
                      key={option}
                      onClick={() => setData({ ...data, [question.id]: option })}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full p-6 rounded-2xl border text-left transition-all duration-300 ${
                        isSelected
                          ? "border-[#2D5BFF] bg-[#2D5BFF] text-white shadow-sm"
                          : "border-[#2D5BFF]/10 bg-white/50 text-[#1a1a2e] hover:border-[#2D5BFF]/30"
                      }`}
                    >
                      <span className="text-[16px] font-light leading-[1.6]">{option}</span>
                    </motion.button>
                  );
                })}

                {/* Multi select - floating selection grid */}
                {question.type === "multi" && question.options?.map((option) => {
                  const isSelected = (data[question.id as keyof AssessmentData] as string[])?.includes(option);
                  return (
                    <motion.button
                      key={option}
                      onClick={() => toggleMultiSelect(question.id as keyof AssessmentData, option)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full p-6 rounded-2xl border text-left transition-all duration-300 ${
                        isSelected
                          ? "border-[#2D5BFF] bg-[#2D5BFF] text-white shadow-sm"
                          : "border-[#2D5BFF]/10 bg-white/50 text-[#1a1a2e] hover:border-[#2D5BFF]/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] font-light leading-[1.6]">{option}</span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Check className="w-5 h-5" strokeWidth={1.5} />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}

                {/* Custom banks - expandable clean sheet */}
                {question.type === "custom-banks" && (
                  <div className="space-y-3">
                    {/* Bank Umum */}
                    <div className="border border-[#2D5BFF]/10 rounded-2xl overflow-hidden bg-white/50">
                      <button
                        onClick={() => setExpandedBankSection(expandedBankSection === "umum" ? null : "umum")}
                        className="w-full p-6 flex items-center justify-between hover:bg-[#2D5BFF]/5 transition-colors"
                      >
                        <span className="text-[16px] font-light text-[#1a1a2e]">Bank Umum</span>
                        <motion.div
                          animate={{ rotate: expandedBankSection === "umum" ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#1a1a2e]/40">
                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {expandedBankSection === "umum" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-2 space-y-2">
                              {[
                                "BCA",
                                "Mandiri",
                                "BRI",
                                "BNI",
                                "CIMB Niaga",
                                "Permata",
                                "Danamon",
                                "Panin",
                                "OCBC",
                                "UOB",
                                "Maybank",
                                "Mega",
                                "Lainnya",
                              ].map((bank) => {
                                const isSelected = data.banks_umum.includes(bank);
                                return (
                                  <button
                                    key={bank}
                                    onClick={() => toggleMultiSelect("banks_umum", bank)}
                                    className={`w-full p-4 rounded-xl border text-left transition-all text-[15px] font-light ${
                                      isSelected
                                        ? "border-[#2D5BFF] bg-[#2D5BFF] text-white"
                                        : "border-[#2D5BFF]/10 bg-white text-[#1a1a2e] hover:border-[#2D5BFF]/30"
                                    }`}
                                  >
                                    {bank}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Bank Digital */}
                    <div className="border border-[#2D5BFF]/10 rounded-2xl overflow-hidden bg-white/50">
                      <button
                        onClick={() => setExpandedBankSection(expandedBankSection === "digital" ? null : "digital")}
                        className="w-full p-6 flex items-center justify-between hover:bg-[#2D5BFF]/5 transition-colors"
                      >
                        <span className="text-[16px] font-light text-[#1a1a2e]">Bank Digital</span>
                        <motion.div
                          animate={{ rotate: expandedBankSection === "digital" ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#1a1a2e]/40">
                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {expandedBankSection === "digital" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-2 space-y-2">
                              {[
                                "Jago",
                                "Jenius",
                                "SeaBank",
                                "Blu BCA",
                                "Line Bank",
                                "Allo Bank",
                                "MotionBanking",
                                "Superbank",
                                "Digibank",
                                "Lainnya",
                                "Tidak menggunakan bank digital",
                              ].map((bank) => {
                                const isSelected = data.banks_digital.includes(bank);
                                return (
                                  <button
                                    key={bank}
                                    onClick={() => toggleMultiSelect("banks_digital", bank)}
                                    className={`w-full p-4 rounded-xl border text-left transition-all text-[15px] font-light ${
                                      isSelected
                                        ? "border-[#2D5BFF] bg-[#2D5BFF] text-white"
                                        : "border-[#2D5BFF]/10 bg-white text-[#1a1a2e] hover:border-[#2D5BFF]/30"
                                    }`}
                                  >
                                    {bank}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Custom limit method - slider or nominal input */}
                {question.type === "custom-limit" && question.options && (
                  <>
                    {/* Method selection buttons */}
                    {question.options.map((option) => {
                      const isSelected = data.limit_method === option;
                      return (
                        <motion.button
                          key={option}
                          onClick={() => {
                            setData({ 
                              ...data, 
                              limit_method: option,
                              // Reset values when switching methods
                              limit_percentage: option === "Percentage dari income" ? data.limit_percentage || 50 : undefined,
                              limit_nominal: option === "Nominal limit langsung" ? data.limit_nominal : undefined,
                            });
                          }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`w-full p-6 rounded-2xl border text-left transition-all duration-300 ${
                            isSelected
                              ? "border-[#2D5BFF] bg-[#2D5BFF] text-white shadow-sm"
                              : "border-[#2D5BFF]/10 bg-white/50 text-[#1a1a2e] hover:border-[#2D5BFF]/30"
                          }`}
                        >
                          <span className="text-[16px] font-light leading-[1.6]">{option}</span>
                        </motion.button>
                      );
                    })}

                    {/* Percentage slider */}
                    {data.limit_method === "Percentage dari income" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-8 pt-8 border-t border-[#2D5BFF]/10"
                      >
                        <div className="mb-6">
                          <div className="flex items-baseline justify-between mb-4">
                            <span className="text-[32px] font-['Playfair_Display'] font-medium text-[#1a1a2e]">
                              {data.limit_percentage || 50}%
                            </span>
                            <span className="text-[14px] text-[#1a1a2e]/50 font-light">
                              dari income bulanan
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={data.limit_percentage || 50}
                            onChange={(e) => setData({ ...data, limit_percentage: parseInt(e.target.value) })}
                            className="w-full h-2 bg-[#2D5BFF]/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2D5BFF] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#2D5BFF] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                          />
                          <div className="flex justify-between mt-2">
                            <span className="text-[12px] text-[#1a1a2e]/40 font-light">1%</span>
                            <span className="text-[12px] text-[#1a1a2e]/40 font-light">100%</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Nominal input */}
                    {data.limit_method === "Nominal limit langsung" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-8 pt-8 border-t border-[#2D5BFF]/10"
                      >
                        <div className="mb-6">
                          <label className="block text-[13px] text-[#1a1a2e]/50 font-light mb-3">
                            Masukkan batas pengeluaran bulanan:
                          </label>
                          <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[18px] text-[#1a1a2e]/40 font-light">
                              Rp
                            </span>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              value={data.limit_nominal ? data.limit_nominal.toLocaleString('id-ID') : ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                setData({ ...data, limit_nominal: value ? parseInt(value) : undefined });
                              }}
                              className="h-16 pl-14 pr-5 bg-white/50 border-[#2D5BFF]/10 text-[20px] placeholder:text-[#1a1a2e]/20 focus:border-[#2D5BFF] focus:outline-none transition-all rounded-2xl font-light"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                {/* Credit card conditional - clean grid */}
                {question.id === "has_credit_card" && data.has_credit_card === "Ada" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-8 pt-8 border-t border-[#2D5BFF]/10"
                  >
                    <div className="mb-6">
                      <p className="text-[15px] font-light text-[#1a1a2e]/70 mb-2">
                        Pilih bank penerbit kartu kredit:
                      </p>
                      <p className="text-[13px] font-light text-[#1a1a2e]/40 italic">
                        Bank yang muncul berdasarkan pilihan kamu di pertanyaan sebelumnya
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* Show only banks from banks_umum selection + Lainnya */}
                      {[...data.banks_umum.filter(bank => bank !== "Lainnya"), "Lainnya"].map((bank) => {
                        const isSelected = data.credit_cards.some((cc) => cc.bank === bank);
                        return (
                          <button
                            key={bank}
                            onClick={() => {
                              if (isSelected) {
                                setData({
                                  ...data,
                                  credit_cards: data.credit_cards.filter((cc) => cc.bank !== bank),
                                });
                              } else {
                                setData({
                                  ...data,
                                  credit_cards: [...data.credit_cards, { bank, count: 1 }],
                                });
                              }
                            }}
                            className={`p-4 rounded-xl border text-center transition-all text-[14px] font-light ${
                              isSelected
                                ? "border-[#2D5BFF] bg-[#2D5BFF] text-white"
                                : "border-[#2D5BFF]/10 bg-white/50 text-[#1a1a2e] hover:border-[#2D5BFF]/30"
                            }`}
                          >
                            {bank}
                          </button>
                        );
                      })}
                    </div>

                    {data.banks_umum.length === 0 && (
                      <p className="text-[13px] text-[#1a1a2e]/40 font-light mt-4 text-center">
                        Pilih bank umum terlebih dahulu untuk melihat opsi kartu kredit
                      </p>
                    )}

                    {data.credit_cards.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-5 bg-[#2D5BFF]/5 border border-[#2D5BFF]/10 rounded-xl"
                      >
                        <p className="text-[13px] text-[#1a1a2e]/60 font-light">
                          Terpilih: {data.credit_cards.map((cc) => cc.bank).join(", ")}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Next button - minimal */}
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full h-14 bg-[#2D5BFF] text-white hover:bg-[#2D5BFF]/90 disabled:opacity-30 text-[15px] font-medium rounded-2xl transition-all"
              >
                Lanjut
              </Button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}