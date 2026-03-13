import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Check, MessageSquare, FileSpreadsheet, Zap, ChevronDown, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import logo from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";
import logoFooter from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";
import { ScrollDrivenPhone } from "../components/ScrollDrivenPhone";
import { ScrollDrivenPhoneLite } from "../components/ScrollDrivenPhoneLite";
import { InfiniteScrollAnimation } from "../components/InfiniteScrollAnimation";

// Rotating Headline Component
function RotatingHeadline() {
  const headlines = [
    "Kelola Uang dengan Cerdas",
    "Lihat Ke Mana Uangmu Pergi",
    "Pengeluaran Terpantau, Keuangan Lebih Terkendali."
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % headlines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[180px] sm:min-h-[200px] lg:min-h-[240px] overflow-hidden flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.h1
          key={currentIndex}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-['Playfair_Display'] text-[44px] sm:text-[64px] lg:text-[96px] font-medium tracking-[-0.02em] leading-[1.1] sm:leading-[1] text-[#1a1a2e] text-center px-4"
        >
          {headlines[currentIndex]}
        </motion.h1>
      </AnimatePresence>
    </div>
  );
}

// FAQ Accordion Item Component
function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white/50 border border-[#2D5BFF]/10 rounded-2xl overflow-hidden hover:border-[#2D5BFF]/20 transition-all"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-6 flex items-center justify-between gap-4 text-left"
      >
        <h3 className="font-medium text-[17px] text-[#1a1a2e]">{question}</h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChevronDown className="w-5 h-5 text-[#2D5BFF] flex-shrink-0" strokeWidth={1.5} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-8 pb-6">
              <p className="text-[15px] text-[#1a1a2e]/70 font-light leading-relaxed whitespace-pre-line">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Counter Animation Component
function AnimatedCounter({ target, suffix = "", duration = 2, formatAsBillion = false }: { target: number; suffix?: string; duration?: number; formatAsBillion?: boolean }) {
  const [count, setCount] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const startValue = 0;
    const endValue = target;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(startValue + (endValue - startValue) * easeOutQuart);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  const formatNumber = (num: number) => {
    if (formatAsBillion) {
      const billions = (num / 1000000000).toFixed(1);
      return `${billions} Miliar`;
    }
    return num.toLocaleString('id-ID');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onViewportEnter={() => setIsInView(true)}
      transition={{ duration: 0.6 }}
    >
      <h3 className="font-['Playfair_Display'] text-[56px] font-medium text-[#2D5BFF] tracking-tight mb-2">
        {formatNumber(count)}{suffix}
      </h3>
    </motion.div>
  );
}

// Animated WhatsApp Chat Component
function AnimatedWhatsAppChat() {
  const [step, setStep] = useState(0);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    const sequence = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep(1);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowTyping(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowTyping(false);
      setStep(2);
      await new Promise(resolve => setTimeout(resolve, 3000));
      setStep(0);
    };

    sequence();
    const interval = setInterval(sequence, 8500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-[28px] border border-[#2D5BFF]/10 overflow-hidden shadow-[0_2px_8px_rgba(45,91,255,0.04),0_16px_32px_rgba(45,91,255,0.06)]">
      {/* WA Header */}
      <div className="bg-[#075E54] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <img src={logo} alt="MIRA" className="w-6 h-6 opacity-90" />
          </div>
          <div>
            <p className="text-white font-medium text-[15px]">MIRA</p>
            <p className="text-white/60 text-[12px] font-light">online</p>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="bg-[#ECE5DD] p-6 min-h-[440px] relative">
        <div className="flex justify-center mb-5">
          <span className="bg-white/70 px-4 py-1.5 rounded-full text-[11px] text-black/40 font-medium tracking-wide">
            HARI INI
          </span>
        </div>

        <div className="space-y-3">
          {/* User message */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex justify-end"
              >
                <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-md px-5 py-3.5 max-w-[85%] shadow-sm">
                  <p className="text-[15px] text-[#111] leading-relaxed font-light mb-1">
                    Beli kopi 25rb di starbucks, debit bca
                  </p>
                  <p className="text-[11px] text-black/40 text-right font-light">14:23</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {showTyping && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start"
              >
                <div className="bg-white rounded-2xl rounded-tl-md px-5 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                        className="w-2 h-2 bg-black/30 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MIRA response */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex justify-start"
              >
                <div className="bg-white rounded-2xl rounded-tl-md px-5 py-3.5 max-w-[85%] shadow-sm">
                  <p className="text-[15px] text-[#111] leading-relaxed font-light mb-3">
                    ✅ Tercatat!
                  </p>
                  <div className="bg-[#F7F7F7] rounded-xl p-3.5 text-[13px] space-y-1.5 mb-2">
                    <div className="flex justify-between">
                      <span className="text-black/50 font-light">Kategori</span>
                      <span className="text-black/80 font-medium">Makanan & Minuman</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/50 font-light">Jumlah</span>
                      <span className="text-black/80 font-medium">Rp 25.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/50 font-light">Metode</span>
                      <span className="text-black/80 font-medium">Debit BCA</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-black/40 text-right font-light">14:23</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeScene, setActiveScene] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleScrollScene = () => {
      const scrollY = window.scrollY;
      const viewportCenter = scrollY + window.innerHeight / 2;
      
      // Get all scene cards
      const cards = document.querySelectorAll('[data-scene-index]');
      
      // Find which card is closest to viewport center
      let closestIndex = 0;
      let closestDistance = Infinity;
      
      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = scrollY + rect.top + rect.height / 2;
        const distance = Math.abs(viewportCenter - cardCenter);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      
      setActiveScene(closestIndex);
    };

    window.addEventListener("scroll", handleScrollScene, { passive: true });
    handleScrollScene(); // Run once on mount
    return () => window.removeEventListener("scroll", handleScrollScene);
  }, []);

  const scenes = [
    {
      step: "01",
      title: "Resi, Teks, Audio",
      subtitle: "Kirim dengan caramu",
      description: "Tinggal kirim via WhatsApp, MIRA langsung catat. Tanpa buka aplikasi lain. Foto struk? Voice note? Semua bisa.",
      icon: MessageSquare,
    },
    {
      step: "02",
      title: "Response",
      subtitle: "MIRA konfirmasi",
      description: "MIRA langsung merespon dan mengkonfirmasi transaksimu. Cepat, akurat, dan real-time.",
      icon: Zap,
    },
    {
      step: "03",
      title: "Kategorisasi",
      subtitle: "Otomatis terkelompok",
      description: "AI MIRA otomatis mengelompokkan pengeluaranmu ke kategori yang tepat. Makanan, transportasi, belanja, semua terorganisir.",
      icon: FileSpreadsheet,
    },
    {
      step: "04",
      title: "Pembukuan",
      subtitle: "Laporan siap pakai",
      description: "Excel bulanan siap pakai. Lihat pengeluaranmu dengan jelas, dan temukan kebocorannya. Download kapan aja.",
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAF8] via-[#F5F5F3] to-[#FAFAF8]">
      {/* Nav - Premium Editorial */}
      <nav className="fixed top-0 left-0 right-0 z-50 md:top-6 md:left-6 md:right-6">
        <div
          className={`max-w-[1400px] mx-auto transition-all duration-500 overflow-visible relative ${
            scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg" : "bg-white shadow-md"
          }`}
          style={{
            clipPath: window.innerWidth >= 768 
              ? 'polygon(60px 0, calc(100% - 60px) 0, 100% 100%, 0 100%)'
              : 'polygon(20px 0, calc(100% - 20px) 0, 100% 100%, 0 100%)'
          }}
        >
          {/* Full-width city animation background in header */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
            <div className="w-full h-full opacity-15">
              <InfiniteScrollAnimation />
            </div>
          </div>

          <div className="px-6 md:px-8 lg:px-12 relative z-10">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity ml-4 md:ml-0"
              >
                <img src={logo} alt="MIRA" className="h-7 opacity-90" />
              </button>

              {/* Desktop: Auth Buttons */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => navigate("/login")}
                  className="text-[15px] font-normal text-[#888888] hover:text-[#1a1a2e] transition-colors px-6 py-2.5"
                >
                  Masuk
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="text-[15px] font-medium text-white bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 px-8 py-3.5 rounded-full transition-all"
                >
                  Coba Gratis
                </button>
              </div>

              {/* Mobile: Menu Icon */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-black/5 rounded-lg transition-colors mr-2"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-[#1a1a2e]" strokeWidth={1.5} />
                ) : (
                  <Menu className="w-6 h-6 text-[#1a1a2e]" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="md:hidden overflow-hidden border-t border-[#2D5BFF]/10 relative z-10"
              >
                <div className="px-6 py-6 space-y-3 bg-white">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full text-[15px] font-normal text-[#1a1a2e] hover:bg-[#2D5BFF]/5 px-6 py-3.5 rounded-xl transition-all text-left"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/register");
                    }}
                    className="w-full text-[15px] font-medium text-white bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 px-6 py-3.5 rounded-full transition-all"
                  >
                    Coba Gratis
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 lg:pt-48 lg:pb-32 px-6 lg:px-12 relative overflow-hidden">
        <div className="max-w-[900px] mx-auto relative" style={{ zIndex: 1 }}>
          <div className="text-center space-y-8 mb-16">
            <RotatingHeadline />
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[17px] sm:text-[19px] lg:text-[21px] text-[#1a1a2e]/60 leading-[1.7] max-w-[640px] mx-auto font-light"
            >
              Dengan MIRA, #SemuaMudah.
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-[16px] text-[#1a1a2e]/50 leading-[1.7] max-w-[580px] mx-auto font-light"
            >
              Catat Pengeluaran Tanpa Ribet. 24/7. Cukup Kirim lewat Whatsapp, sisanya MIRA yang Urus.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center mb-12"
          >
            <button
              onClick={() => navigate("/register")}
              className="text-[15px] font-medium text-white bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
            >
              Coba Gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center text-[13px] text-[#1a1a2e]/40 font-light"
          >
            Tanpa download aplikasi baru, cukup lewat Whatsapp.
          </motion.p>
        </div>
      </section>

      {/* 3 Value Props - Premium Editorial */}
      <section className="pb-24 lg:pb-32 px-6 lg:px-12">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Catat Anti Ribet */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#2D5BFF]/10 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-7 h-7 text-[#2D5BFF]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[20px] font-medium text-[#1a1a2e] mb-3 tracking-tight">
                Catat Anti Ribet
              </h3>
              <p className="text-[15px] text-[#1a1a2e]/60 font-light leading-relaxed">
                Tinggal kirim via WhatsApp, MIRA langsung catat. Tanpa buka aplikasi lain.
              </p>
            </motion.div>

            {/* Pembukuan Otomatis */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#2D5BFF]/10 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-7 h-7 text-[#2D5BFF]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[20px] font-medium text-[#1a1a2e] mb-3 tracking-tight">
                Pembukuan Otomatis
              </h3>
              <p className="text-[15px] text-[#1a1a2e]/60 font-light leading-relaxed">
                Teks, Foto, Audio, MIRA ngerti semuanya.
              </p>
            </motion.div>

            {/* Laporan Instan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#2D5BFF]/10 flex items-center justify-center mx-auto mb-6">
                <FileSpreadsheet className="w-7 h-7 text-[#2D5BFF]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[20px] font-medium text-[#1a1a2e] mb-3 tracking-tight">
                Laporan Instan
              </h3>
              <p className="text-[15px] text-[#1a1a2e]/60 font-light leading-relaxed">
                Excel bulanan siap pakai. Lihat pengeluaranmu dengan jelas, dan temukan kebocorannya.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scroll-Driven Story Section */}
      <section id="process-section" className="relative min-h-[2400px] px-6 lg:px-12 pb-24">
        <div className="max-w-[1400px] mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-20"
          >
            <h2 className="font-['Playfair_Display'] text-[48px] sm:text-[56px] font-medium tracking-tight text-[#1a1a2e] mb-4">
              Dengan MIRA, #SemuaMudah
            </h2>
            <p className="text-[17px] text-[#1a1a2e]/60 font-light leading-[1.7] max-w-[640px] mx-auto">
              Catat Pengeluaran Tanpa Ribet. 24/7. Cukup Kirim lewat Whatsapp, sisanya MIRA yang Urus.
            </p>
          </motion.div>

          {/* Sticky Phone + Scrolling Cards */}
          <div className="relative">
            <div className="flex gap-12 lg:gap-20 items-start">
              {/* Left: Feature Cards (Scrolling) */}
              <div className="flex-1 space-y-12 lg:space-y-[450px]">
                {scenes.map((scene, index) => (
                  <div key={index} className="space-y-6">
                    {/* Feature Card - COMPLETELY STATIC on mobile, animated on desktop */}
                    <div className="lg:hidden bg-white/70 backdrop-blur-sm border border-[#2D5BFF]/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(45,91,255,0.06)] transition-all duration-500">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#2D5BFF]/10 flex items-center justify-center">
                          <scene.icon className="w-6 h-6 text-[#2D5BFF]" strokeWidth={1.5} />
                        </div>
                        <div className="text-[13px] font-medium text-[#2D5BFF]/50 tracking-widest">
                          {scene.step}
                        </div>
                      </div>
                      <h3 className="font-['Playfair_Display'] text-[28px] font-medium text-[#1a1a2e] tracking-tight mb-2">
                        {scene.title}
                      </h3>
                      <p className="text-[15px] text-[#2D5BFF] font-medium mb-3">
                        {scene.subtitle}
                      </p>
                      <p className="text-[15px] text-[#1a1a2e]/60 leading-[1.7] font-light">
                        {scene.description}
                      </p>
                    </div>
                    
                    {/* Desktop version with animation */}
                    <motion.div
                      initial={{ opacity: 0, x: -40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false, amount: 0.3 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="hidden lg:block bg-white/70 backdrop-blur-sm border border-[#2D5BFF]/10 rounded-3xl p-10 shadow-[0_8px_32px_rgba(45,91,255,0.06)] hover:shadow-[0_16px_48px_rgba(45,91,255,0.12)] transition-all duration-500"
                      data-scene-index={index}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#2D5BFF]/10 flex items-center justify-center">
                          <scene.icon className="w-6 h-6 text-[#2D5BFF]" strokeWidth={1.5} />
                        </div>
                        <div className="text-[13px] font-medium text-[#2D5BFF]/50 tracking-widest">
                          {scene.step}
                        </div>
                      </div>
                      <h3 className="font-['Playfair_Display'] text-[36px] font-medium text-[#1a1a2e] tracking-tight mb-2">
                        {scene.title}
                      </h3>
                      <p className="text-[15px] text-[#2D5BFF] font-medium mb-3">
                        {scene.subtitle}
                      </p>
                      <p className="text-[15px] text-[#1a1a2e]/60 leading-[1.7] font-light">
                        {scene.description}
                      </p>
                    </motion.div>

                    {/* Mobile: Show lite phone mockup BELOW the text - STATIC */}
                    <div className="lg:hidden flex justify-center">
                      <ScrollDrivenPhoneLite scene={index} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Sticky Phone (Desktop only) */}
              <div className="hidden lg:block sticky top-32 w-[400px] flex-shrink-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ScrollDrivenPhone scene={activeScene} />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upsell 1 - Numbers */}
      <section className="pb-24 lg:pb-32 px-6 lg:px-12 border-t border-[#2D5BFF]/10">
        <div className="max-w-[880px] mx-auto pt-24 lg:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <p className="text-[17px] text-[#1a1a2e]/60 font-light leading-[1.7] mb-12 max-w-[640px] mx-auto">
              Cara sederhana untuk melacak pengeluaran dan membantu kamu menabung lebih banyak setiap hari.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="text-center">
                <AnimatedCounter target={12732} suffix="+" />
                <p className="text-[16px] text-[#1a1a2e]/60 font-light">
                  orang sudah mengelola uangnya lebih baik
                </p>
              </div>
              <div className="text-center">
                <AnimatedCounter target={11000000000} suffix="+" formatAsBillion={true} />
                <p className="text-[16px] text-[#1a1a2e]/60 font-light">
                  pengeluaran terdokumentasikan
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/register")}
              className="text-[15px] font-medium text-white bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 px-10 py-4 rounded-2xl transition-all inline-flex items-center gap-2 group"
            >
              Mulai Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="pb-24 lg:pb-32 px-6 lg:px-12 border-t border-[#2D5BFF]/10">
        <div className="max-w-[1000px] mx-auto pt-24 lg:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-['Playfair_Display'] text-[48px] sm:text-[56px] font-medium tracking-tight text-[#1a1a2e] mb-16 text-center">
              Cerita dari Pengguna MIRA
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  name: "Sarah",
                  message: "Gila sih ini praktis banget! Tinggal foto struk langsung ke-input. Ga perlu buka-buka app lagi 🔥",
                  time: "10:23"
                },
                {
                  name: "Budi",
                  message: "Udah 2 bulan pake MIRA, baru sadar gue boros banget di kopi sama grab food. Sekarang udah mulai kontrol pengeluaran 💪",
                  time: "14:15"
                },
                {
                  name: "Dita",
                  message: "Report Excel-nya rapih banget, langsung bisa gue pake buat laporan bulanan ke kantor. Hemat waktu bgt!",
                  time: "09:47"
                },
                {
                  name: "Reza",
                  message: "Awalnya skeptis AI bisa akurat ga? Ternyata bener loh, bahkan voice note pun dicatat dengan presisi 👍",
                  time: "16:32"
                },
                {
                  name: "Anisa",
                  message: "69rb buat 3 bulan itu murah banget! Lebih murah dari segelas kopi tapi manfaatnya jauh lebih besar",
                  time: "11:08"
                },
                {
                  name: "Fikri",
                  message: "MIRA reminds gue kapan limit budget udah mau habis. Jadi lebih aware sama spending habit sendiri",
                  time: "13:55"
                }
              ].map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-2xl border border-[#2D5BFF]/10 p-6 hover:border-[#2D5BFF]/20 transition-all"
                >
                  {/* WhatsApp-style chat bubble */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#2D5BFF]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[14px] font-medium text-[#2D5BFF]">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-[15px] text-[#1a1a2e] mb-1">{testimonial.name}</p>
                      <p className="text-[13px] text-[#1a1a2e]/40">Pengguna MIRA</p>
                    </div>
                  </div>
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-md px-5 py-4">
                    <p className="text-[15px] text-[#111] leading-relaxed font-light mb-2">
                      {testimonial.message}
                    </p>
                    <p className="text-[11px] text-black/40 text-right font-light">{testimonial.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing - Premium Editorial */}
      <section className="pb-24 lg:pb-32 px-6 lg:px-12 border-t border-[#2D5BFF]/10">
        <div className="max-w-[880px] mx-auto pt-24 lg:pt-32">
          <div className="text-center mb-20">
            <h2 className="font-['Playfair_Display'] text-[48px] sm:text-[56px] lg:text-[64px] font-medium tracking-tight text-[#1a1a2e] mb-5">
              Harga Sederhana
            </h2>
            <p className="text-[17px] text-[#1a1a2e]/60 font-light leading-[1.7]">
              Hemat lebih banyak dengan paket yang lebih panjang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[900px] mx-auto">
            {/* 3 Months */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white/50 border border-[#2D5BFF]/10 rounded-3xl p-8 hover:border-[#2D5BFF]/20 transition-all flex flex-col"
            >
              <div className="mb-8">
                <p className="text-[13px] text-[#1a1a2e]/40 font-medium uppercase tracking-wider mb-3">💎 3 Bulan</p>
                <div className="mb-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-['Playfair_Display'] text-[48px] font-medium text-[#1a1a2e] tracking-tight">69K</span>
                  </div>
                  <p className="text-[14px] text-[#1a1a2e]/50 font-light mt-1">≈ Rp23.000 / bulan</p>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#2D5BFF] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-[15px] text-[#1a1a2e]/70 font-light">Lebih murah dari 1 tiket nonton bioskop</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/register")}
                className="w-full text-[15px] font-medium text-white bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 py-3.5 rounded-2xl transition-all"
              >
                Mulai Gratis
              </button>
            </motion.div>

            {/* 6 Months - Recommended */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-[#2D5BFF]/10 rounded-3xl p-8 hover:border-[#2D5BFF]/20 transition-all relative overflow-hidden flex flex-col"
            >
              <div className="absolute top-5 left-5">
                <span className="text-[11px] font-medium text-white bg-[#2D5BFF] px-3 py-1.5 rounded-full uppercase tracking-wide">
                  Recommended
                </span>
              </div>
              <div className="mb-8 pt-10">
                <p className="text-[13px] text-[#1a1a2e]/40 font-medium uppercase tracking-wider mb-3">💎 6 Bulan ⭐ Lebih Hemat</p>
                <div className="mb-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-['Playfair_Display'] text-[48px] font-medium text-[#1a1a2e] tracking-tight">109K</span>
                  </div>
                  <p className="text-[14px] text-[#1a1a2e]/50 font-light mt-1">≈ Rp18.200 / bulan</p>
                  <p className="text-[13px] text-[#2D5BFF] font-medium mt-1.5">🔥 21% lebih hemat</p>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#2D5BFF] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-[15px] text-[#1a1a2e]/70 font-light">Lebih murah dari 1x kopi americano</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/register")}
                className="w-full text-[15px] font-medium text-white bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 py-3.5 rounded-2xl transition-all"
              >
                Mulai Gratis
              </button>
            </motion.div>

            {/* 12 Months - Best Value */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-[#2D5BFF]/10 rounded-3xl p-8 hover:border-[#2D5BFF]/20 transition-all relative overflow-hidden flex flex-col"
            >
              <div className="absolute top-5 left-5">
                <span className="text-[11px] font-medium text-[#1a1a2e] bg-[#FFD23F] px-3 py-1.5 rounded-full uppercase tracking-wide">
                  Best Value
                </span>
              </div>
              <div className="mb-8 pt-10">
                <p className="text-[13px] text-[#1a1a2e]/40 font-medium uppercase tracking-wider mb-3">💎 12 Bulan 🔥 Paling Hemat</p>
                <div className="mb-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-['Playfair_Display'] text-[48px] font-medium text-[#1a1a2e] tracking-tight">199K</span>
                  </div>
                  <p className="text-[14px] text-[#1a1a2e]/50 font-light mt-1">≈ Rp16.600 / bulan</p>
                  <p className="text-[13px] text-[#FF6B6B] font-medium mt-1.5">🔥 28% lebih hemat</p>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#2D5BFF] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-[15px] text-[#1a1a2e]/70 font-light">Lebih murah dari parkir mobil weekend di mall</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/register")}
                className="w-full text-[15px] font-medium text-white bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 py-3.5 rounded-2xl transition-all"
              >
                Mulai Gratis
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pb-24 lg:pb-32 px-6 lg:px-12 border-t border-[#2D5BFF]/10">
        <div className="max-w-[800px] mx-auto pt-24 lg:pt-32">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-['Playfair_Display'] text-[48px] sm:text-[56px] font-medium tracking-tight text-[#1a1a2e] mb-16 text-center"
          >
            FAQ
          </motion.h2>

          <div className="space-y-6">
            {[
              {
                q: "Apakah AI-nya akurat? Bisa salah?",
                a: "Pencatatan MIRA sangat akurat!\nUntuk hasil terbaik, kirim data yang jelas + info tambahan.\nContoh:\n\"Belanja supermarket Rp1.500.000, Debit BCA\"\n→ hasil pencatatan jadi lebih presisi."
              },
              {
                q: "Bisa export data keuangan?",
                a: "Bisa banget.\nSetiap ada transaksi baru, MIRA membagikan link laporan terbaru dalam format Excel (XLS).\nCocok untuk pembukuan, laporan bisnis, atau analisis lanjutan di tools favoritmu."
              },
              {
                q: "Berapa banyak transaksi per hari?",
                a: "Tidak ada batasan transaksi untuk pengguna berlangganan.\nCatat sepuasnya, praktis dan hemat."
              },
              {
                q: "Apa bedanya MIRA dengan aplikasi money manager lain?",
                a: "MIRA\n✅ Lewat WhatsApp — tanpa download aplikasi\n✅ Dibuat untuk kebiasaan finansial orang Indonesia\n✅ Input bebas: chat, foto, voice note\n✅ Harga jauh lebih terjangkau\n\nAplikasi lain\n❌ Harus install & setup aplikasi\n❌ Kurang optimal untuk rupiah\n❌ Input transaksi kaku & ribet\n❌ Biaya premium bisa Rp600rb–Rp1jt/tahun"
              },
              {
                q: "Bagaimana cara kerja MIRA di WhatsApp?",
                a: "Setelah daftar & berlangganan, kamu akan menerima pesan selamat datang dari MIRA.\nSelanjutnya, cukup:\n• kirim chat transaksi\n• foto struk\n• atau voice note\nMIRA langsung mencatat dan merapikan keuanganmu."
              }
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Upsell 2 */}
      <section className="pb-32 px-6 lg:px-12 border-t border-[#2D5BFF]/10">
        <div className="max-w-[880px] mx-auto pt-24 lg:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <h2 className="font-['Playfair_Display'] text-[48px] sm:text-[56px] font-medium tracking-tight text-[#1a1a2e] mb-6">
              Pembukuan tanpa effort
            </h2>
            <p className="text-[17px] text-[#1a1a2e]/60 font-light leading-[1.7] mb-10 max-w-[560px] mx-auto">
              Ngobrol aja dengan MIRA lewat chat, foto, atau suara.<br />
              Semudah chatting di WhatsApp.
            </p>
            <button
              onClick={() => navigate("/register")}
              className="text-[15px] font-medium text-white bg-[#2D5BFF] hover:bg-[#2D5BFF]/90 px-10 py-4 rounded-2xl transition-all inline-flex items-center gap-2 group"
            >
              Gabung Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer - Premium Editorial */}
      <footer className="bg-[#2D5BFF] py-16 px-6 lg:px-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Logo & Caption */}
            <div className="space-y-4">
              <img src={logoFooter} alt="MIRA" className="h-10" />
              <p className="text-[14px] text-white/70 font-light leading-relaxed">
                Asisten pelacak pengeluaran berbasis WhatsApp untuk pengguna Indonesia
              </p>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-medium text-[15px] mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/privacy-policy"
                    className="text-[14px] text-white/70 hover:text-white transition-colors font-light"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms-of-service"
                    className="text-[14px] text-white/70 hover:text-white transition-colors font-light"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-medium text-[15px] mb-4">Kontak</h3>
              <ul className="space-y-3 text-[14px] text-white/70 font-light">
                <li>
                  <a href="mailto:hello@mira.ai" className="hover:text-white transition-colors">
                    hello@mira.ai
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/628123456789" className="hover:text-white transition-colors">
                    +62 812-3456-789
                  </a>
                </li>
                <li className="leading-relaxed pt-2">
                  Jl. Sudirman No. 123<br />
                  Jakarta Selatan 12190<br />
                  Indonesia
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[13px] text-white/50 font-light">
                © 2026 MIRA AI. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a href="https://instagram.com/mira.ai" className="text-[13px] text-white/50 hover:text-white/80 transition-colors font-light">
                  Instagram
                </a>
                <a href="https://twitter.com/mira_ai" className="text-[13px] text-white/50 hover:text-white/80 transition-colors font-light">
                  Twitter
                </a>
                <a href="https://linkedin.com/company/mira-ai" className="text-[13px] text-white/50 hover:text-white/80 transition-colors font-light">
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}