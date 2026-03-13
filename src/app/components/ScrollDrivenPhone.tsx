import { motion, AnimatePresence } from "motion/react";
import logo from "figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png";

export function ScrollDrivenPhone({ scene }: { scene: number }) {
  return (
    <div className="bg-white rounded-[40px] border border-[#2D5BFF]/10 overflow-hidden shadow-[0_8px_32px_rgba(45,91,255,0.12)] w-[400px]">
      {/* WA Header */}
      <div className="bg-[#075E54] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <img src={logo} alt="MIRA" className="w-6 h-6 opacity-90" />
          </div>
          <div>
            <p className="text-white font-medium text-[15px]">MIRA</p>
            <p className="text-white/60 text-[12px] font-light">online</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-[#ECE5DD] p-6 h-[680px] overflow-hidden relative">
        <div className="flex justify-center mb-5">
          <span className="bg-white/70 px-4 py-1.5 rounded-full text-[11px] text-black/40 font-medium tracking-wide">
            HARI INI
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {/* Scene 0: Input */}
            {scene === 0 && (
              <motion.div
                key="scene-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3"
              >
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-md px-5 py-3.5 max-w-[85%] shadow-sm">
                    <p className="text-[15px] text-[#111] leading-relaxed font-light mb-1">
                      Beli groceries 450rb
                    </p>
                    <p className="text-[11px] text-black/40 text-right font-light">09:15</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Scene 1: Response */}
            {scene === 1 && (
              <motion.div
                key="scene-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3"
              >
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-md px-5 py-3.5 max-w-[85%] shadow-sm">
                    <p className="text-[15px] text-[#111] leading-relaxed font-light mb-1">
                      Beli groceries 450rb
                    </p>
                    <p className="text-[11px] text-black/40 text-right font-light">09:15</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-md px-5 py-3.5 max-w-[85%] shadow-sm">
                    <p className="text-[15px] text-[#111] leading-relaxed font-light mb-1">
                      ✅ Tercatat!
                    </p>
                    <p className="text-[11px] text-black/40 text-right font-light">09:15</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Scene 2: Kategorisasi */}
            {scene === 2 && (
              <motion.div
                key="scene-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3"
              >
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-md px-5 py-3.5 max-w-[85%] shadow-sm">
                    <p className="text-[15px] text-[#111] leading-relaxed font-light mb-1">
                      Beli groceries 450rb
                    </p>
                    <p className="text-[11px] text-black/40 text-right font-light">09:15</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-md px-5 py-3.5 max-w-[85%] shadow-sm">
                    <p className="text-[15px] text-[#111] leading-relaxed font-light mb-3">
                      ✅ Tercatat!
                    </p>
                    <div className="bg-[#F7F7F7] rounded-xl p-3.5 text-[13px] space-y-1.5 mb-2">
                      <div className="flex justify-between">
                        <span className="text-black/50 font-light">Kategori</span>
                        <span className="text-black/80 font-medium">Kebutuhan Harian</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black/50 font-light">Jumlah</span>
                        <span className="text-black/80 font-medium">Rp 450.000</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-black/40 text-right font-light">09:15</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Scene 3: Pembukuan */}
            {scene === 3 && (
              <motion.div
                key="scene-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3"
              >
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-md px-5 py-3.5 max-w-[90%] shadow-sm">
                    <p className="text-[15px] text-[#111] leading-relaxed font-light mb-3">
                      📊 Laporan Februari
                    </p>
                    <div className="bg-[#F7F7F7] rounded-xl p-3.5 text-[13px] space-y-2.5 mb-3">
                      <div className="flex justify-between">
                        <span className="text-black/50 font-light">Total Pengeluaran</span>
                        <span className="text-[#FF6B6B] font-medium">Rp 3.250.000</span>
                      </div>
                      <div className="h-px bg-black/5"></div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-black/60">Makanan</span>
                          <span className="text-black/80">Rp 1.200.000</span>
                        </div>
                        <div className="flex justify-between text-[12px]">
                          <span className="text-black/60">Transportasi</span>
                          <span className="text-black/80">Rp 800.000</span>
                        </div>
                        <div className="flex justify-between text-[12px]">
                          <span className="text-black/60">Kebutuhan Harian</span>
                          <span className="text-black/80">Rp 1.250.000</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#2D5BFF]/5 rounded-lg px-3.5 py-2.5 mb-2">
                      <p className="text-[12px] text-[#2D5BFF] font-medium">
                        📥 Download Excel
                      </p>
                    </div>
                    <p className="text-[11px] text-black/40 text-right font-light">09:30</p>
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