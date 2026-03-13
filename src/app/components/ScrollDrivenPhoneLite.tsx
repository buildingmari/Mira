import { motion, AnimatePresence } from "motion/react";
import logo from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";

// Lite zoomed-in version for mobile - focused on chat content only
export function ScrollDrivenPhoneLite({ scene }: { scene: number }) {
  return (
    <div className="bg-white rounded-[28px] border border-[#2D5BFF]/10 overflow-hidden shadow-[0_4px_16px_rgba(45,91,255,0.08)] w-full max-w-[340px] mx-auto">
      {/* Simplified WA Header - smaller */}
      <div className="bg-[#075E54] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <img src={logo} alt="MIRA" className="w-4 h-4 opacity-90" />
          </div>
          <div>
            <p className="text-white font-medium text-[13px]">MIRA</p>
            <p className="text-white/60 text-[10px] font-light">online</p>
          </div>
        </div>
      </div>

      {/* Chat Area - Zoomed and focused */}
      <div className="bg-[#ECE5DD] p-4 min-h-[280px] overflow-hidden relative">
        <div className="flex justify-center mb-4">
          <span className="bg-white/70 px-3 py-1 rounded-full text-[9px] text-black/40 font-medium tracking-wide">
            HARI INI
          </span>
        </div>

        <div className="space-y-2.5">
          <AnimatePresence mode="wait">
            {/* Scene 0: Input */}
            {scene === 0 && (
              <motion.div
                key="scene-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-2.5"
              >
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-xl rounded-tr-md px-4 py-2.5 max-w-[85%] shadow-sm">
                    <p className="text-[13px] text-[#111] leading-relaxed font-light mb-0.5">
                      Beli groceries 450rb
                    </p>
                    <p className="text-[9px] text-black/40 text-right font-light">09:15</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Scene 1: Response */}
            {scene === 1 && (
              <motion.div
                key="scene-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-2.5"
              >
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-xl rounded-tr-md px-4 py-2.5 max-w-[85%] shadow-sm">
                    <p className="text-[13px] text-[#111] leading-relaxed font-light mb-0.5">
                      Beli groceries 450rb
                    </p>
                    <p className="text-[9px] text-black/40 text-right font-light">09:15</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white rounded-xl rounded-tl-md px-4 py-2.5 max-w-[85%] shadow-sm">
                    <p className="text-[13px] text-[#111] leading-relaxed font-light mb-0.5">
                      ✅ Tercatat!
                    </p>
                    <p className="text-[9px] text-black/40 text-right font-light">09:15</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Scene 2: Kategorisasi */}
            {scene === 2 && (
              <motion.div
                key="scene-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-2.5"
              >
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-xl rounded-tr-md px-4 py-2.5 max-w-[85%] shadow-sm">
                    <p className="text-[13px] text-[#111] leading-relaxed font-light mb-0.5">
                      Beli groceries 450rb
                    </p>
                    <p className="text-[9px] text-black/40 text-right font-light">09:15</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white rounded-xl rounded-tl-md px-4 py-2.5 max-w-[90%] shadow-sm">
                    <p className="text-[13px] text-[#111] leading-relaxed font-light mb-2">
                      ✅ Tercatat!
                    </p>
                    <div className="bg-[#F7F7F7] rounded-lg p-2.5 text-[11px] space-y-1 mb-1.5">
                      <div className="flex justify-between">
                        <span className="text-black/50 font-light">Kategori</span>
                        <span className="text-black/80 font-medium">Kebutuhan Harian</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black/50 font-light">Jumlah</span>
                        <span className="text-black/80 font-medium">Rp 450.000</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-black/40 text-right font-light">09:15</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Scene 3: Pembukuan */}
            {scene === 3 && (
              <motion.div
                key="scene-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-2.5"
              >
                <div className="flex justify-start">
                  <div className="bg-white rounded-xl rounded-tl-md px-4 py-2.5 max-w-[95%] shadow-sm">
                    <p className="text-[13px] text-[#111] leading-relaxed font-light mb-2">
                      📊 Laporan Februari
                    </p>
                    <div className="bg-[#F7F7F7] rounded-lg p-2.5 text-[11px] space-y-2 mb-2">
                      <div className="flex justify-between">
                        <span className="text-black/50 font-light">Total Pengeluaran</span>
                        <span className="text-[#FF6B6B] font-medium">Rp 3.250.000</span>
                      </div>
                      <div className="h-px bg-black/5"></div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-black/60">Makanan</span>
                          <span className="text-black/80">Rp 1.200.000</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-black/60">Transportasi</span>
                          <span className="text-black/80">Rp 800.000</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-black/60">Kebutuhan Harian</span>
                          <span className="text-black/80">Rp 1.250.000</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#2D5BFF]/5 rounded-md px-2.5 py-2 mb-1.5">
                      <p className="text-[10px] text-[#2D5BFF] font-medium">
                        📥 Download Excel
                      </p>
                    </div>
                    <p className="text-[9px] text-black/40 text-right font-light">09:30</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
