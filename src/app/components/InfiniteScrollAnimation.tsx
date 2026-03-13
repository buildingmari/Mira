import { motion } from "motion/react";

// Lightweight stickman character - optimized for mobile
function RunningCharacter({ delay = 0, speed = 1 }: { delay?: number; speed?: number }) {
  return (
    <motion.div
      className="absolute bottom-3"
      initial={{ x: "-20vw" }}
      animate={{ x: "120vw" }}
      transition={{
        duration: 18 / speed, // Even faster - was 20
        repeat: Infinity,
        ease: "linear",
        delay: delay
      }}
    >
      {/* Smaller stickman - reduced from 40x56 to 28x42 */}
      <svg width="28" height="42" viewBox="0 0 28 42" fill="none" className="opacity-90">
        {/* Head - smaller */}
        <circle cx="14" cy="7" r="5.5" fill="#2D5BFF" opacity="0.85" />
        
        {/* Body - thin stickman style */}
        <motion.line
          x1="14" y1="12.5" x2="14" y2="25"
          stroke="#2D5BFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={{ 
            rotate: [3, 5, 3],
          }}
          transition={{ 
            duration: 0.4, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          style={{ transformOrigin: "14px 18px" }}
        />
        
        {/* Arms - thin pumping motion */}
        <motion.line
          x1="14" y1="17" x2="8" y2="21"
          stroke="#2D5BFF"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ rotate: [-20, 20, -20] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "14px 17px" }}
        />
        
        <motion.line
          x1="14" y1="17" x2="20" y2="21"
          stroke="#2D5BFF"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ rotate: [20, -20, 20] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "14px 17px" }}
        />
        
        {/* Legs - thin running stride */}
        <motion.line
          x1="14" y1="25" x2="10" y2="38"
          stroke="#2D5BFF"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ rotate: [0, 30, -30, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "14px 25px" }}
        />
        
        <motion.line
          x1="14" y1="25" x2="18" y2="38"
          stroke="#2D5BFF"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ rotate: [0, -30, 30, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "14px 25px" }}
        />
        
        {/* Minimal speed line - single line only */}
        <motion.line
          x1="4" y1="18" x2="0" y2="18"
          stroke="#2D5BFF"
          strokeWidth="1.5"
          opacity="0.3"
          strokeLinecap="round"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    </motion.div>
  );
}

// Background track/road elements
function BackgroundTrack() {
  return (
    <motion.div
      className="absolute bottom-0 left-0 h-full flex items-end"
      initial={{ x: 0 }}
      animate={{ x: "-100%" }}
      transition={{
        duration: 40,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <svg width="2400" height="64" viewBox="0 0 2400 64" fill="none" className="opacity-8">
        {/* Road lane markings */}
        {Array.from({ length: 20 }).map((_, i) => (
          <rect
            key={i}
            x={i * 120}
            y="58"
            width="60"
            height="2"
            rx="1"
            fill="#2D5BFF"
            opacity="0.15"
          />
        ))}
        
        {/* Trees/environment silhouettes in background */}
        <g opacity="0.08">
          <circle cx="200" cy="45" r="8" fill="#2D5BFF" />
          <rect x="198" y="45" width="4" height="12" fill="#2D5BFF" />
          
          <circle cx="500" cy="42" r="10" fill="#2D5BFF" />
          <rect x="497" y="42" width="6" height="15" fill="#2D5BFF" />
          
          <circle cx="850" cy="44" r="9" fill="#2D5BFF" />
          <rect x="847" y="44" width="5" height="13" fill="#2D5BFF" />
          
          <circle cx="1200" cy="45" r="8" fill="#2D5BFF" />
          <rect x="1198" y="45" width="4" height="12" fill="#2D5BFF" />
          
          <circle cx="1600" cy="43" r="11" fill="#2D5BFF" />
          <rect x="1596" y="43" width="7" height="16" fill="#2D5BFF" />
        </g>
      </svg>
    </motion.div>
  );
}

export function InfiniteScrollAnimation() {
  return (
    <div className="relative w-full h-full overflow-hidden pointer-events-none flex items-center">
      {/* Ground/Track */}
      <div className="absolute bottom-3 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2D5BFF]/15 to-transparent" />
      
      {/* Background track elements - hidden on mobile for performance */}
      <div className="absolute inset-0 hidden md:block">
        <BackgroundTrack />
      </div>
      
      {/* Mobile: 3 characters only, Desktop: 5 characters */}
      <RunningCharacter delay={0} speed={1.2} />
      <RunningCharacter delay={4} speed={1} />
      <RunningCharacter delay={8} speed={0.9} />
      <div className="hidden md:block">
        <RunningCharacter delay={12} speed={1.1} />
        <RunningCharacter delay={16} speed={0.95} />
      </div>
    </div>
  );
}