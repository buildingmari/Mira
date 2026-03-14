Saya punya web Mira (React + TypeScript + Vite + Tailwind).
Saya mau hero section-nya mengikuti FLOW dan LAYOUT persis Stripe,
tapi tetap pakai WARNA brand Mira (biru/cyan), bukan orange/ungu Stripe.

Lihat screenshot Stripe: background PUTIH, gelombang organik di KANAN,
teks GELAP di KIRI di atas area putih bersih.

Lakukan 5 perubahan berikut secara berurutan:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERUBAHAN 1 — Background section: gelap → putih
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Di file HeroSection.tsx (atau Hero.tsx), cari elemen <section> atau
<div> paling luar hero section.

Hapus semua class/style yang mengatur background gelap, contoh:
- bg-[#0B1D3A], bg-slate-900, bg-gray-900, bg-blue-900
- style={{ backgroundColor: '#...' }} yang warnanya gelap
- className dengan kata "dark", "navy", "midnight"

Ganti dengan:
  className="... bg-white"
  atau style={{ backgroundColor: '#ffffff' }}

Juga tambahkan: overflow-hidden  (untuk clip wave yang keluar batas)
Dan: relative  (supaya wave bisa absolute di dalamnya)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERUBAHAN 2 — Buat file HeroWave.tsx (animasi gelombang)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Buat file BARU di src/components/HeroWave.tsx dengan isi persis ini:

import { useEffect, useRef } from 'react';

export function HeroWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    if (!gl) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const vert = `
      attribute vec2 p;
      void main() { gl_Position = vec4(p, 0.0, 1.0); }
    `;

    // WARNA DISESUAIKAN KE BRAND MIRA (biru/cyan)
    // Untuk mengubah warna: edit nilai vec3 di baris c1, c2, c3, c4
    const frag = `
      precision mediump float;
      uniform float t;
      uniform vec2 res;
      void main() {
        vec2 uv = gl_FragCoord.xy / res;

        float w1 = sin(uv.x * 4.0 + t * 0.6 + uv.y * 1.5) * 0.5 + 0.5;
        float w2 = sin(uv.x * 3.0 - t * 0.4 + uv.y * 2.8) * 0.5 + 0.5;
        float w3 = cos(uv.y * 5.0 + t * 0.5 + uv.x * 1.2) * 0.5 + 0.5;
        float w4 = sin(uv.x * 6.0 + t * 0.8 - uv.y * 2.0) * 0.5 + 0.5;

        // Warna brand Mira (biru gelap, biru terang, cyan, biru tengah)
        vec3 c1 = vec3(0.02, 0.08, 0.35);   // #040D59 biru gelap
        vec3 c2 = vec3(0.00, 0.55, 0.95);   // #008CF2 biru terang
        vec3 c3 = vec3(0.00, 0.80, 1.00);   // #00CCFF cyan
        vec3 c4 = vec3(0.10, 0.30, 0.85);   // #1A4DD9 biru tengah

        vec3 col = mix(c1, c2, w1 * 0.7);
        col = mix(col, c3, w2 * 0.4);
        col = mix(col, c4, w3 * 0.3);
        col = mix(col, c2, w4 * 0.2);

        // PENTING: Fade ke putih di sisi KIRI (area teks)
        // Nilai 0.35 = wave mulai dari 35% dari kiri
        // Naikkan ke 0.45 jika mau wave lebih ke kanan
        float leftFade = smoothstep(0.0, 0.45, uv.x);
        col = mix(vec3(1.0, 1.0, 1.0), col, leftFade);

        // Fade ke putih di bagian ATAS (opsional, buat teks lebih bersih)
        float topFade = smoothstep(1.0, 0.6, uv.y);
        col = mix(vec3(1.0, 1.0, 1.0), col, topFade * 0.7 + 0.3);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const mkShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const tLoc = gl.getUniformLocation(prog, 't');
    const rLoc = gl.getUniformLocation(prog, 'res');

    let rafId: number;
    const draw = (ms: number) => {
      gl.uniform1f(tLoc, ms * 0.001);
      gl.uniform2f(rLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: 'block',
      }}
    />
  );
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERUBAHAN 3 — Pasang HeroWave di HeroSection.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Di file HeroSection.tsx:

A) Tambahkan import di baris paling atas:
   import { HeroWave } from './HeroWave';

B) Di JSX, letakkan <HeroWave /> sebagai child PERTAMA
   dari wrapper section/div utama (yang sudah diberi bg-white):

   <section className="relative overflow-hidden bg-white">
     <HeroWave />          {/* ← INI PERTAMA */}
     <div className="relative z-10 ...">  {/* semua konten lainnya */}
       {/* eyebrow, H1, subtitle, CTA, phone mockup */}
     </div>
   </section>

C) PASTIKAN semua konten teks (div wrapper-nya) punya:
   className="relative z-10"
   ATAU style={{ position: 'relative', zIndex: 10 }}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERUBAHAN 4 — Warna teks: cyan → gelap
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Di HeroSection.tsx, cari semua elemen teks dan ubah warnanya:

HEADLINE / H1 "Lihat ke mana uangmu pergi":
  Hapus: text-[#00BFFF], text-cyan-400, text-blue-400,
         atau className apapun yang bikin warnanya cyan/terang
  Hapus: animasi warna (kalau ada animate-*, atau style animation)
  Ganti dengan: className="text-[#050C1A]"
  atau style={{ color: '#050C1A' }}

HEADLINE KEDUA "Pengeluaran terpantau, keuangan terkendali.":
  Kalau sekarang putih (text-white), ganti ke:
  className="text-[#050C1A]"

SUBTITLE "Catat pengeluaran tanpa ribet...":
  Hapus: text-white/60, text-gray-300, atau warna terang lainnya
  Ganti ke: className="text-[#4A5568]"
  (abu medium yang terbaca di background putih)

BADGE/EYEBROW "Asisten Keuangan AI via WhatsApp":
  Kalau ada background gelap, ubah ke:
  className="bg-blue-50 text-blue-700 border border-blue-200"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERUBAHAN 5 — Phone mockup: pertahankan tapi sesuaikan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phone mockup di kanan boleh tetap ada. Yang perlu diubah:

Cari wrapper/div yang membungkus phone mockup.
Tambahkan: className="relative z-10"
(supaya phone muncul di atas wave canvas, bukan di balik wave)

Kalau phone mockup punya background gelap sendiri (bg-slate-900, dll),
BIARKAN saja — phone boleh tetap gelap, yang harus putih hanya
background SECTION utamanya.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFIKASI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Setelah semua perubahan:
1. npm run dev
2. Buka browser
3. Yang harus terlihat:
   - Background halaman: PUTIH
   - Bagian kiri: teks gelap, terbaca dengan jelas
   - Bagian kanan: gelombang biru/cyan organik bergerak
   - Wave fade dari putih (kiri) ke biru (kanan)
   - Phone mockup: muncul di atas wave

Kalau wave tidak muncul sama sekali → browser tidak support WebGL
→ tambahkan fallback: di HeroSection.tsx tambahkan
  style={{ background: 'linear-gradient(135deg, #ffffff 40%, #E6F3FF 70%, #B3D9FF 100%)' }}
  pada section utama sebagai static fallback.