# FIX: MIRA Hero Ribbon — Ganti dengan CSS-only approach

## PROBLEM YANG HARUS DIFIX SEKARANG

1. HAPUS `HeroRibbon.tsx` yang ada (versi canvas dengan blur)
2. HAPUS import `HeroRibbon` dari hero section
3. JANGAN install/import Three.js apapun
4. Implementasi di bawah ini adalah pengganti LENGKAP

---

## STEP 1: Buat file baru `components/HeroRibbon.tsx`

Isi PERSIS seperti ini (jangan dimodif dulu):

```tsx
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
      {/* Base background gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 40%, #7C3AED 65%, #C2410C 100%)',
      }} />

      {/* Ribbon 1 — violet wide */}
      <div style={{
        position: 'absolute',
        left: '-20%',
        top: '5%',
        width: '90%',
        height: '38%',
        background: 'linear-gradient(105deg, transparent 0%, #8B5CF6 30%, #6D28D9 60%, transparent 100%)',
        borderRadius: '50%',
        opacity: 0.7,
        transform: 'rotate(-18deg) skewY(-6deg)',
        animation: 'ribbon1 8s ease-in-out infinite',
        filter: 'blur(1px)',
      }} />

      {/* Ribbon 2 — blue-indigo */}
      <div style={{
        position: 'absolute',
        left: '-10%',
        top: '20%',
        width: '85%',
        height: '32%',
        background: 'linear-gradient(100deg, transparent 0%, #4F46E5 25%, #3B82F6 55%, transparent 100%)',
        borderRadius: '50%',
        opacity: 0.65,
        transform: 'rotate(-12deg) skewY(-4deg)',
        animation: 'ribbon2 10s ease-in-out infinite',
        filter: 'blur(1px)',
      }} />

      {/* Ribbon 3 — pink/rose */}
      <div style={{
        position: 'absolute',
        left: '5%',
        top: '42%',
        width: '88%',
        height: '30%',
        background: 'linear-gradient(108deg, transparent 0%, #EC4899 20%, #DB2777 50%, #9333EA 80%, transparent 100%)',
        borderRadius: '50%',
        opacity: 0.55,
        transform: 'rotate(-15deg) skewY(-5deg)',
        animation: 'ribbon3 12s ease-in-out infinite',
        filter: 'blur(1px)',
      }} />

      {/* Ribbon 4 — orange/coral (bottom) */}
      <div style={{
        position: 'absolute',
        left: '-5%',
        top: '58%',
        width: '95%',
        height: '35%',
        background: 'linear-gradient(102deg, transparent 0%, #F97316 20%, #EF4444 55%, #DC2626 80%, transparent 100%)',
        borderRadius: '50%',
        opacity: 0.70,
        transform: 'rotate(-10deg) skewY(-3deg)',
        animation: 'ribbon4 9s ease-in-out infinite',
        filter: 'blur(1px)',
      }} />

      {/* Ribbon 5 — thin highlight streak */}
      <div style={{
        position: 'absolute',
        left: '-15%',
        top: '35%',
        width: '80%',
        height: '12%',
        background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.25) 55%, transparent 100%)',
        borderRadius: '50%',
        transform: 'rotate(-14deg)',
        animation: 'ribbon5 7s ease-in-out infinite',
      }} />

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes ribbon1 {
          0%, 100% { transform: rotate(-18deg) skewY(-6deg) translateY(0px); }
          50%       { transform: rotate(-20deg) skewY(-7deg) translateY(-18px); }
        }
        @keyframes ribbon2 {
          0%, 100% { transform: rotate(-12deg) skewY(-4deg) translateY(0px); }
          50%       { transform: rotate(-10deg) skewY(-3deg) translateY(22px); }
        }
        @keyframes ribbon3 {
          0%, 100% { transform: rotate(-15deg) skewY(-5deg) translateY(0px); }
          33%       { transform: rotate(-17deg) skewY(-6deg) translateY(-14px); }
          66%       { transform: rotate(-13deg) skewY(-4deg) translateY(12px); }
        }
        @keyframes ribbon4 {
          0%, 100% { transform: rotate(-10deg) skewY(-3deg) translateY(0px); }
          50%       { transform: rotate(-12deg) skewY(-4deg) translateY(-20px); }
        }
        @keyframes ribbon5 {
          0%, 100% { transform: rotate(-14deg) translateY(0px) scaleX(1); }
          50%       { transform: rotate(-16deg) translateY(-10px) scaleX(0.95); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes ribbon1, @keyframes ribbon2, @keyframes ribbon3,
          @keyframes ribbon4, @keyframes ribbon5 { 0%, 100% { transform: none; } }
        }
      `}</style>
    </div>
  );
}
```

---

## STEP 2: Update Hero section

Cari `hero-right` atau container kanan hero (yang wrap phone mockup).

Pastikan strukturnya PERSIS seperti ini:

```tsx
{/* Container kanan — HARUS position relative */}
<div
  className="hero-right"   /* atau className apapun yang sudah ada */
  style={{
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '24px',
  }}
>
  {/* Ribbon — taruh PERTAMA sebagai background */}
  <HeroRibbon />

  {/* Phone mockup — HARUS punya position relative dan z-index */}
  <div style={{ position: 'relative', zIndex: 1 }}>
    {/* ... existing phone mockup code ... */}
  </div>
</div>
```

**Jika hero menggunakan Tailwind:**
```tsx
<div className="relative overflow-hidden rounded-3xl">
  <HeroRibbon />
  <div className="relative z-10">
    {/* phone mockup */}
  </div>
</div>
```

---

## STEP 3: Update `Hero.css` (jika ada)

Pastikan `.hero-right` punya ini:

```css
.hero-right {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
}
```

**HAPUS** kalau ada properti background di `.hero-right` — ribbon akan handle sendiri.

---

## TUNING WARNA (setelah berhasil jalan)

Untuk adjust warna ribbon supaya lebih sesuai brand MIRA:

**Lebih ke biru/brand MIRA:**
Ribbon 1: ganti `#8B5CF6` → `#2563EB`, `#6D28D9` → `#1D4ED8`
Ribbon 2: ganti `#4F46E5` → `#0284C7`, `#3B82F6` → `#0EA5E9`

**Kurangi intensity (lebih subtle):**
Turunkan semua `opacity` sebesar 0.15 (contoh: 0.70 → 0.55)

**Ribbon lebih lebar/dominan:**
Naikkan `height` tiap ribbon dari `38%` → `50%`, `32%` → `45%`, dst.

**Animasi lebih lambat:**
Ganti `8s`, `10s`, `12s`, `9s`, `7s` → `14s`, `18s`, `22s`, `16s`, `12s`

---

## CHECKLIST

- [ ] `HeroRibbon.tsx` versi lama sudah dihapus dan diganti dengan yang baru
- [ ] Tidak ada import `three` atau `canvas` di hero section
- [ ] Container kanan hero punya `position: relative` dan `overflow: hidden`
- [ ] Phone mockup punya `position: relative` dan `z-index: 1` (atau Tailwind: `relative z-10`)
- [ ] `Hero.css` tidak punya background di `.hero-right` yang override ribbon