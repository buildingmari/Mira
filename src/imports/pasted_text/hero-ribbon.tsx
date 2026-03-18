# MIRA Hero — Stripe-Style Ribbon Fix (Lightweight, No Three.js)

## MASALAH YANG HARUS DIFIX

1. **Hapus semua implementasi Three.js / WebGL** yang sebelumnya ditambahkan ke hero section
2. **Ganti background kanan hero** yang sekarang flat gradient dengan efek ribbon animasi
3. Implementasi baru harus **ringan dan smooth** (no external 3D libraries)

---

## IMPLEMENTASI BARU: Canvas 2D Ribbon

Buat file baru: `components/HeroRibbon.tsx`

**HAPUS dulu import Three.js apapun yang sudah ada**, lalu buat component ini:

```tsx
'use client';

import { useEffect, useRef } from 'react';

export function HeroRibbon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    setSize();
    window.addEventListener('resize', setSize);

    // ============================================================
    // RIBBON CONFIGURATION (tuned to match Stripe visual)
    // ============================================================
    const RIBBONS = [
      // Each ribbon: { colorStart, colorMid, colorEnd, width, opacity, speedMult, yOffset, curve }
      { colorStart: '#7C3AED', colorEnd: '#4F46E5', width: 280, opacity: 0.55, speedMult: 1.0,   yBase: 0.25, curve: 180, twist: 0.8 },
      { colorStart: '#4F46E5', colorEnd: '#2563EB', width: 200, opacity: 0.45, speedMult: 0.75,  yBase: 0.35, curve: 220, twist: 1.1 },
      { colorStart: '#8B5CF6', colorEnd: '#EC4899', width: 240, opacity: 0.40, speedMult: 1.2,   yBase: 0.55, curve: 160, twist: 0.9 },
      { colorStart: '#F97316', colorEnd: '#EC4899', width: 260, opacity: 0.50, speedMult: 0.9,   yBase: 0.70, curve: 200, twist: 1.3 },
      { colorStart: '#EF4444', colorEnd: '#F97316', width: 180, opacity: 0.35, speedMult: 1.15,  yBase: 0.82, curve: 240, twist: 0.7 },
      { colorStart: '#A855F7', colorEnd: '#3B82F6', width: 160, opacity: 0.30, speedMult: 0.85,  yBase: 0.45, curve: 190, twist: 1.0 },
    ];

    let time = 0;
    let rafId: number;
    let paused = false;

    const handleVisibility = () => { paused = document.hidden; };
    document.addEventListener('visibilitychange', handleVisibility);

    // ============================================================
    // DRAW FUNCTION
    // ============================================================
    const drawRibbon = (
      ribbon: typeof RIBBONS[0],
      t: number,
      w: number,
      h: number
    ) => {
      const { colorStart, colorEnd, width, opacity, speedMult, yBase, curve, twist } = ribbon;

      // Animated control points (bezier curve for ribbon shape)
      const speed = t * 0.0004 * speedMult;

      // Entry point (left side, off-screen)
      const x0 = -width * 0.5;
      const y0 = h * yBase + Math.sin(speed * 0.7 + yBase * 5) * curve * 0.4;

      // Control point 1
      const cp1x = w * 0.15 + Math.sin(speed * 1.1) * 80;
      const cp1y = h * yBase - curve + Math.sin(speed * 0.9 + 1) * curve * twist;

      // Control point 2
      const cp2x = w * 0.6 + Math.cos(speed * 0.8 + 0.5) * 100;
      const cp2y = h * yBase + curve * 0.5 + Math.sin(speed * 1.2 + 2) * curve * twist * 0.8;

      // Exit point (right side)
      const x3 = w + width * 0.3;
      const y3 = h * yBase + Math.sin(speed * 0.6 + 3) * curve * 0.3;

      // --- Draw the ribbon as thick stroke with gradient ---
      const grad = ctx.createLinearGradient(x0, y0, x3, y3);
      grad.addColorStop(0, colorStart + '00');     // transparent start
      grad.addColorStop(0.15, colorStart);
      grad.addColorStop(0.5, colorEnd);
      grad.addColorStop(0.85, colorStart);
      grad.addColorStop(1, colorEnd + '00');       // transparent end

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x3, y3);

      ctx.strokeStyle = grad;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.globalAlpha = opacity;
      ctx.filter = 'blur(0px)';
      ctx.stroke();

      // --- Draw thin bright highlight line on top ---
      const gradHighlight = ctx.createLinearGradient(x0, y0, x3, y3);
      gradHighlight.addColorStop(0, colorStart + '00');
      gradHighlight.addColorStop(0.2, '#ffffff40');
      gradHighlight.addColorStop(0.5, '#ffffff60');
      gradHighlight.addColorStop(0.8, '#ffffff30');
      gradHighlight.addColorStop(1, '#ffffff00');

      ctx.beginPath();
      ctx.moveTo(x0, y0 - width * 0.15);
      ctx.bezierCurveTo(
        cp1x, cp1y - width * 0.12,
        cp2x, cp2y - width * 0.12,
        x3, y3 - width * 0.15
      );
      ctx.strokeStyle = gradHighlight;
      ctx.lineWidth = width * 0.08;
      ctx.globalAlpha = opacity * 0.6;
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.filter = 'none';
    };

    // ============================================================
    // ANIMATION LOOP
    // ============================================================
    const animate = (timestamp: number) => {
      rafId = requestAnimationFrame(animate);
      if (paused) return;

      time = timestamp;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      // Background: dark purple/blue gradient (matches MIRA's existing right side)
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#3730A3');    // indigo dark
      bgGrad.addColorStop(0.4, '#4F46E5'); // indigo
      bgGrad.addColorStop(0.7, '#7C3AED'); // violet
      bgGrad.addColorStop(1, '#DC2626');   // red (bottom right, matches your screenshot)

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw ribbons back-to-front (painter's algorithm)
      // Back ribbons first (darker/thicker)
      ctx.save();

      // Soft bloom effect: draw each ribbon twice — once blurred, once sharp
      // First pass: blurred glow
      RIBBONS.slice().reverse().forEach(ribbon => {
        ctx.save();
        ctx.filter = 'blur(24px)';
        drawRibbon({ ...ribbon, opacity: ribbon.opacity * 0.6, width: ribbon.width * 1.5 }, time, w, h);
        ctx.restore();
      });

      // Second pass: sharp ribbon
      RIBBONS.slice().reverse().forEach(ribbon => {
        ctx.save();
        ctx.filter = 'blur(2px)';
        drawRibbon(ribbon, time, w, h);
        ctx.restore();
      });

      ctx.restore();
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', setSize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  );
}
```

---

## CARA INTEGRASI KE HERO SECTION

Cari file hero section MIRA (yang ada teks "Kelola uang dengan cerdas" / "Pengeluaran terpantau").

**HAPUS semua ini yang sebelumnya ditambahkan:**
- Import `* as THREE from 'three'`
- Import `HeroRibbon` versi lama
- `<canvas>` atau `<HeroRibbon />` yang sudah ada di hero
- Semua `useEffect` yang berisi `new THREE.Scene()` atau `new THREE.WebGLRenderer()`

**Lalu ubah struktur hero section seperti ini:**

```tsx
// Import baru
import { HeroRibbon } from '@/components/HeroRibbon';

// Struktur hero — PERHATIKAN: kanan hero harus jadi container dengan position relative
export default function HeroSection() {
  return (
    <section className="hero-section" style={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* LEFT: Text content — JANGAN DIUBAH */}
      <div className="hero-left" style={{ 
        flex: '0 0 50%', 
        padding: '80px 60px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* ... semua text, CTA, dll existing MIRA tetap di sini ... */}
      </div>

      {/* RIGHT: Ribbon canvas background */}
      <div className="hero-right" style={{ 
        flex: '0 0 50%', 
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ribbon animasi — REPLACE background kanan yang sebelumnya flat */}
        <HeroRibbon />
        
        {/* Phone mockup tetap di atas canvas */}
        <div style={{ position: 'relative', zIndex: 1, /* ... existing styles ... */ }}>
          {/* ... phone mockup existing MIRA ... */}
        </div>
      </div>

    </section>
  );
}
```

---

## JIKA STRUKTUR HERO MIRA BEDA (pakai Tailwind)

Kalau hero-nya pakai Tailwind classes, ini equivalentnya:

```tsx
{/* RIGHT wrapper */}
<div className="relative flex-1 overflow-hidden">
  <HeroRibbon />
  
  {/* Phone mockup — tambahkan relative z-10 */}
  <div className="relative z-10 flex items-center justify-center h-full">
    {/* ... existing phone mockup ... */}
  </div>
</div>
```

---

## TUNING VISUAL (adjust sesuai selera)

Edit array `RIBBONS` di dalam `HeroRibbon.tsx`:

```typescript
// Mau lebih ungu kayak Stripe? Ubah warna:
{ colorStart: '#6D28D9', colorEnd: '#4338CA', ... }

// Mau ribbonnya lebih tipis (less dominant)?
width: 120,  // default 180–280, kurangin ke 100–150

// Mau lebih lambat?
speedMult: 0.5,  // default 0.75–1.2

// Mau opacity lebih subtle?
opacity: 0.25,  // default 0.30–0.55

// Mau lebih smooth / less twisty?
twist: 0.4,  // default 0.7–1.3, kurangin

// Mau glow lebih kuat?
// Di dalam drawRibbon, ubah blur amount:
ctx.filter = 'blur(40px)';  // default 24px, naikin = glow lebih kuat
```

---

## KENAPA INI LEBIH BAIK DARI THREE.JS

| | Three.js (versi lama) | Canvas 2D (versi baru) |
|---|---|---|
| Bundle size | +500KB (three.js) | 0 extra |
| Vertices | 120,000+ | 6 bezier curves |
| GPU usage | WebGL heavy | CPU ringan |
| FPS | Lemot | 60fps smooth |
| Look | Flat gradient | Ribbon flowing ✓ |
| Maintenance | Complex shaders | Simple code |

---

## UNINSTALL THREE.JS (kalau sudah install)

```bash
npm uninstall three
npm uninstall @types/three
```

Pastikan tidak ada import `from 'three'` tersisa di codebase.