// ═══════════════════════════════════════════════════════════
// BACKUP — HeroGradient.tsx (ribbon bezier canvas animation)
// Tanggal backup: 14 Maret 2026
// Untuk revert, copy isi file ini ke /src/app/components/HeroGradient.tsx
// ═══════════════════════════════════════════════════════════

/**
 * HeroGradient — Stripe-style fabric ribbon (bezier strip, bukan wedge geometris).
 *
 * Teknik: tiap ribbon dihitung sebagai STRIP bezier — sampel centerline setiap N langkah,
 * hitung normal tegak-lurus, offset ke tepi dalam/luar → path tertutup.
 * Gradient MELINTANG (inner → outer) menciptakan ilusi ribbon melengkung 3D.
 * CP1/CP2 bergerak perlahan → ribbon "mengalir" organik.
 */
import { useEffect, useRef } from 'react';

interface Pt { x: number; y: number; }

interface RibbonDef {
  p0: Pt; p3: Pt;
  cp1: Pt; cp2: Pt;
  hw: number;
  cA: string; cB: string; cC: string;
  opA: number; opB: number;
  spd: number; ph: number;
  aAmp: Pt; bAmp: Pt;
}

const RIBBONS: RibbonDef[] = [
  {
    p0:  { x:  1.40, y:  1.18 }, p3:  { x: 0.38, y: -0.12 },
    cp1: { x:  1.05, y:  0.78 }, cp2: { x: 0.72, y: 0.42 },
    hw: 0.26,
    cA: '#C7D2FE', cB: '#3B82F6', cC: '#1E3A8A',
    opA: 0.85, opB: 0.80,
    spd: 0.55, ph: 0.0,
    aAmp: { x: 0.07, y: 0.09 }, bAmp: { x: 0.09, y: 0.07 },
  },
  {
    p0:  { x:  1.28, y:  1.38 }, p3:  { x: 0.48, y: -0.10 },
    cp1: { x:  1.00, y:  0.88 }, cp2: { x: 0.74, y: 0.36 },
    hw: 0.21,
    cA: '#EEF2FF', cB: '#2D4BFF', cC: '#1a2dcc',
    opA: 0.90, opB: 0.85,
    spd: 0.78, ph: 1.8,
    aAmp: { x: 0.09, y: 0.07 }, bAmp: { x: 0.07, y: 0.10 },
  },
  {
    p0:  { x:  1.15, y:  1.52 }, p3:  { x: 0.56, y: -0.08 },
    cp1: { x:  1.04, y:  0.84 }, cp2: { x: 0.78, y: 0.32 },
    hw: 0.18,
    cA: '#ECFEFF', cB: '#22D3EE', cC: '#0891B2',
    opA: 0.88, opB: 0.82,
    spd: 0.65, ph: 3.3,
    aAmp: { x: 0.08, y: 0.10 }, bAmp: { x: 0.10, y: 0.07 },
  },
  {
    p0:  { x:  1.06, y:  1.62 }, p3:  { x: 0.44, y: -0.05 },
    cp1: { x:  0.94, y:  0.94 }, cp2: { x: 0.64, y: 0.43 },
    hw: 0.16,
    cA: '#EDE9FE', cB: '#4F46E5', cC: '#3730A3',
    opA: 0.82, opB: 0.76,
    spd: 0.88, ph: 5.1,
    aAmp: { x: 0.10, y: 0.07 }, bAmp: { x: 0.07, y: 0.10 },
  },
  {
    p0:  { x:  0.94, y:  1.58 }, p3:  { x: 0.63, y: -0.07 },
    cp1: { x:  1.07, y:  0.76 }, cp2: { x: 0.81, y: 0.29 },
    hw: 0.13,
    cA: '#F0FDFF', cB: '#06B6D4', cC: '#0E7490',
    opA: 0.80, opB: 0.74,
    spd: 0.72, ph: 2.6,
    aAmp: { x: 0.09, y: 0.09 }, bAmp: { x: 0.08, y: 0.09 },
  },
];

const STEPS = 64;

function bPt(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
    y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y,
  };
}
function bTan(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  const dx = 3*(u*u*(p1.x-p0.x) + 2*u*t*(p2.x-p1.x) + t*t*(p3.x-p2.x));
  const dy = 3*(u*u*(p1.y-p0.y) + 2*u*t*(p2.y-p1.y) + t*t*(p3.y-p2.y));
  const l = Math.hypot(dx, dy) || 1;
  return { x: dx/l, y: dy/l };
}
function hexRGB(h: string): [number,number,number] {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
}

export function HeroGradient() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number, t = 0, W = 0, H = 0;

    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setup();
    const ro = new ResizeObserver(setup);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      const isMobile = W < 768;
      const drawH = isMobile ? H * 0.48 : H;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, drawH);
      ctx.clip();

      const xS = isMobile ? 1.75 : 1.0;
      const toX = (rx: number) => (rx - 0.5) * xS * W + W * 0.5;

      for (const r of RIBBONS) {
        const tt = t * r.spd + r.ph;

        const p0  = { x: toX(r.p0.x),  y: r.p0.y  * H };
        const p3  = { x: toX(r.p3.x),  y: r.p3.y  * H };
        const cp1 = {
          x: toX(r.cp1.x + Math.sin(tt * 0.70) * r.aAmp.x),
          y: (r.cp1.y + Math.cos(tt * 0.60) * r.aAmp.y) * H,
        };
        const cp2 = {
          x: toX(r.cp2.x + Math.cos(tt * 0.80 + 1.2) * r.bAmp.x),
          y: (r.cp2.y + Math.sin(tt * 0.65 + 0.8) * r.bAmp.y) * H,
        };

        const hw = r.hw * (isMobile ? W * 0.7 : H);

        const spine: Pt[]   = [];
        const normals: Pt[] = [];
        for (let i = 0; i <= STEPS; i++) {
          const s = i / STEPS;
          spine.push(bPt(p0, cp1, cp2, p3, s));
          const tan = bTan(p0, cp1, cp2, p3, s);
          normals.push({ x: -tan.y, y: tan.x });
        }

        const edgeA = spine.map((p, i) => ({ x: p.x + normals[i].x * hw, y: p.y + normals[i].y * hw }));
        const edgeB = spine.map((p, i) => ({ x: p.x - normals[i].x * hw, y: p.y - normals[i].y * hw }));

        ctx.beginPath();
        ctx.moveTo(edgeA[0].x, edgeA[0].y);
        for (let i = 1; i <= STEPS; i++) ctx.lineTo(edgeA[i].x, edgeA[i].y);
        for (let i = STEPS; i >= 0; i--) ctx.lineTo(edgeB[i].x, edgeB[i].y);
        ctx.closePath();

        const mi = Math.floor(STEPS / 2);
        const mp = spine[mi], mn = normals[mi];
        const [rA,gA,bA] = hexRGB(r.cA);
        const [rB,gB,bB] = hexRGB(r.cB);
        const [rC,gC,bC] = hexRGB(r.cC);

        const grad = ctx.createLinearGradient(
          mp.x + mn.x * hw, mp.y + mn.y * hw,
          mp.x - mn.x * hw, mp.y - mn.y * hw,
        );
        grad.addColorStop(0.00, `rgba(${rA},${gA},${bA},${r.opA})`);
        grad.addColorStop(0.30, `rgba(${rB},${gB},${bB},${r.opB})`);
        grad.addColorStop(0.62, `rgba(${rB},${gB},${bB},${r.opB * 0.65})`);
        grad.addColorStop(0.85, `rgba(${rC},${gC},${bC},${r.opB * 0.20})`);
        grad.addColorStop(1.00, `rgba(${rC},${gC},${bC},0)`);

        ctx.fillStyle = grad;
        ctx.fill();
      }

      if (!isMobile) {
        const fr = ctx.createLinearGradient(W * 0.72, 0, W * 0.36, 0);
        fr.addColorStop(0, 'rgba(255,255,255,0)');
        fr.addColorStop(1, 'rgba(255,255,255,1)');
        ctx.fillStyle = fr;
        ctx.fillRect(0, 0, W, drawH);
      } else {
        const fm = ctx.createLinearGradient(W * 0.78, 0, W * 0.20, 0);
        fm.addColorStop(0, 'rgba(255,255,255,0)');
        fm.addColorStop(1, 'rgba(255,255,255,1)');
        ctx.fillStyle = fm;
        ctx.fillRect(0, 0, W, drawH);
      }

      const fadeY = isMobile ? 0.65 : 0.80;
      const fb = ctx.createLinearGradient(0, drawH * fadeY, 0, drawH);
      fb.addColorStop(0, 'rgba(255,255,255,0)');
      fb.addColorStop(1, 'rgba(255,255,255,1)');
      ctx.fillStyle = fb;
      ctx.fillRect(0, 0, W, drawH);

      ctx.restore();

      t += 0.012;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  );
}
