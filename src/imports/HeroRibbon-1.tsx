'use client';

export function HeroRibbon() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '62%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(160deg, #3730A3 0%, #4F46E5 35%, #6D28D9 65%, #9A1818 100%)',
      }} />
      <svg
        viewBox="0 0 600 700"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="60%" y2="100%">
            <stop offset="0%"   stopColor="#93C5FD" stopOpacity="0"/>
            <stop offset="15%"  stopColor="#818CF8" stopOpacity="0.85"/>
            <stop offset="60%"  stopColor="#A78BFA" stopOpacity="0.75"/>
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="g2" x1="10%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%"   stopColor="#FCA5A5" stopOpacity="0"/>
            <stop offset="20%"  stopColor="#FB923C" stopOpacity="0.95"/>
            <stop offset="65%"  stopColor="#F97316" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="g3" x1="5%" y1="0%" x2="75%" y2="100%">
            <stop offset="0%"   stopColor="#F9A8D4" stopOpacity="0"/>
            <stop offset="25%"  stopColor="#EC4899" stopOpacity="0.80"/>
            <stop offset="70%"  stopColor="#E879F9" stopOpacity="0.70"/>
            <stop offset="100%" stopColor="#C026D3" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="g4" x1="0%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%"   stopColor="#FDE68A" stopOpacity="0"/>
            <stop offset="30%"  stopColor="#FCD34D" stopOpacity="0.55"/>
            <stop offset="75%"  stopColor="#FB923C" stopOpacity="0.45"/>
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0"/>
          </linearGradient>
        </defs>

        <g style={{ animation: 'r1 10s ease-in-out infinite' }}>
          <path d="M -80 0 C 80 120, 220 300, 320 700 L 480 700 C 380 300, 240 120, 80 0 Z" fill="url(#g1)"/>
        </g>
        <g style={{ animation: 'r2 12s ease-in-out infinite' }}>
          <path d="M 80 0 C 240 130, 380 320, 460 700 L 600 700 C 520 320, 380 130, 220 0 Z" fill="url(#g2)"/>
        </g>
        <g style={{ animation: 'r3 14s ease-in-out infinite' }}>
          <path d="M 200 0 C 340 150, 460 340, 540 700 L 660 700 C 580 340, 460 150, 320 0 Z" fill="url(#g3)"/>
        </g>
        <g style={{ animation: 'r4 8s ease-in-out infinite' }}>
          <path d="M 30 0 C 160 140, 300 330, 390 700 L 430 700 C 340 330, 200 140, 70 0 Z" fill="url(#g4)"/>
        </g>

        <style>{`
          @keyframes r1{0%,100%{transform:translate(0,0)}50%{transform:translate(-18px,12px)}}
          @keyframes r2{0%,100%{transform:translate(0,0)}33%{transform:translate(14px,-10px)}66%{transform:translate(-10px,18px)}}
          @keyframes r3{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-14px)}}
          @keyframes r4{0%,100%{transform:translate(0,0)}50%{transform:translate(-12px,8px)}}
          @media(prefers-reduced-motion:reduce){g{animation:none!important}}
        `}</style>
      </svg>
    </div>
  );
}
