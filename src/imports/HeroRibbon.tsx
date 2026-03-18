'use client';

export function HeroRibbon() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        borderRadius: 'inherit',
        pointerEvents: 'none',
      }}
    >
      {/* Base background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(145deg, #4338CA 0%, #6D28D9 45%, #7C3AED 70%, #B91C1C 100%)',
      }} />

      {/* SVG Ribbons — thin bezier paths like Stripe */}
      <svg
        viewBox="0 0 520 640"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Ribbon 1 — blue-violet */}
          <linearGradient id="r1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#818CF8" stopOpacity="0" />
            <stop offset="20%"  stopColor="#818CF8" stopOpacity="0.9" />
            <stop offset="70%"  stopColor="#C084FC" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0" />
          </linearGradient>
          {/* Ribbon 2 — orange */}
          <linearGradient id="r2" x1="0%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%"   stopColor="#FB923C" stopOpacity="0" />
            <stop offset="25%"  stopColor="#FB923C" stopOpacity="0.95" />
            <stop offset="75%"  stopColor="#F43F5E" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
          </linearGradient>
          {/* Ribbon 3 — pink */}
          <linearGradient id="r3" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%"   stopColor="#E879F9" stopOpacity="0" />
            <stop offset="30%"  stopColor="#E879F9" stopOpacity="0.7" />
            <stop offset="70%"  stopColor="#FB7185" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
          </linearGradient>
          {/* Ribbon 4 — deep orange bottom */}
          <linearGradient id="r4" x1="0%" y1="20%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#EF4444" stopOpacity="0" />
            <stop offset="30%"  stopColor="#EF4444" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* 
          Ribbon shapes: each is a closed bezier path forming a thin flowing strip.
          Top edge and bottom edge of the ribbon are two bezier curves that taper at both ends.
          This is what creates the "thin ribbon" look, NOT a fat oval.
        */}

        {/* Ribbon 1 — blue/violet, enters top-right, sweeps down-left */}
        <g style={{ animation: 'rb1 9s ease-in-out infinite' }}>
          <path
            d="
              M 580 -80
              C 460 60,  300 180, 140 420
              C 155 435, 175 440, 190 432
              C 350 195, 510 75,  630 -55
              Z
            "
            fill="url(#r1)"
          />
        </g>

        {/* Ribbon 2 — orange/coral, enters top-right higher, sweeps more diagonal */}
        <g style={{ animation: 'rb2 11s ease-in-out infinite' }}>
          <path
            d="
              M 620 40
              C 500 120, 380 250, 220 500
              C 240 515, 265 515, 280 504
              C 438 258, 558 128, 678 48
              Z
            "
            fill="url(#r2)"
          />
        </g>

        {/* Ribbon 3 — pink, thinner, between the two */}
        <g style={{ animation: 'rb3 13s ease-in-out infinite' }}>
          <path
            d="
              M 600 -10
              C 500 80, 360 220, 200 460
              C 212 470, 226 472, 238 466
              C 396 228, 534 88, 634 -2
              Z
            "
            fill="url(#r3)"
          />
        </g>

        {/* Ribbon 4 — deep orange, bottom portion only */}
        <g style={{ animation: 'rb4 8s ease-in-out infinite' }}>
          <path
            d="
              M 420 300
              C 380 380, 300 470, 160 620
              C 185 640, 220 645, 245 635
              C 375 490, 455 398, 490 314
              Z
            "
            fill="url(#r4)"
          />
        </g>

        <style>{`
          @keyframes rb1 {
            0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
            50%       { transform: translate(-12px, 14px) rotate(-1.5deg); }
          }
          @keyframes rb2 {
            0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
            40%       { transform: translate(-8px, 18px) rotate(1deg); }
            80%       { transform: translate(6px, -10px) rotate(-0.5deg); }
          }
          @keyframes rb3 {
            0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
            50%       { transform: translate(10px, -16px) rotate(1.2deg); }
          }
          @keyframes rb4 {
            0%, 100% { transform: translate(0px, 0px); }
            50%       { transform: translate(-14px, 10px); }
          }
          @media (prefers-reduced-motion: reduce) {
            g[style*="animation"] { animation: none !important; }
          }
        `}</style>
      </svg>
    </div>
  );
}
