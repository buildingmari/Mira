Saya punya landing page React + TypeScript + Vite + Tailwind.
Hero section-nya punya animasi gradient biru tapi ada 2 masalah:
1. Flow animasinya belum seperti Stripe (gelombang organik, bukan hanya gradient bergerak)
2. Teks hero sulit dibaca karena warnanya ikut-ikutan berubah bersama animasi background

Tolong lakukan perubahan berikut:

=== PERUBAHAN 1: File hero component (Hero.tsx atau HeroSection.tsx) ===

A) Tambahkan canvas WebGL untuk animasi gelombang. Buat file baru 
   src/components/HeroWave.tsx dengan isi ini:

import { useEffect, useRef } from 'react';

export function HeroWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    if (!gl) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const vert = `
      attribute vec2 p;
      void main() { gl_Position = vec4(p, 0, 1); }
    `;
    const frag = `
      precision mediump float;
      uniform float t;
      uniform vec2 res;
      void main() {
        vec2 uv = gl_FragCoord.xy / res;
        float w1 = sin(uv.x * 5.0 + t * 0.7) * 0.5 + 0.5;
        float w2 = sin(uv.x * 3.0 - t * 0.4 + uv.y * 2.5) * 0.5 + 0.5;
        float w3 = cos(uv.y * 4.0 + t * 0.5) * 0.5 + 0.5;
        // Warna: sesuaikan vec3 ini ke brand color Mira
        vec3 c1 = vec3(0.05, 0.08, 0.25);  // biru gelap (background utama)
        vec3 c2 = vec3(0.10, 0.30, 0.80);  // biru terang
        vec3 c3 = vec3(0.40, 0.10, 0.70);  // ungu aksen
        vec3 col = mix(c1, c2, w1 * 0.6);
        col = mix(col, c3, w2 * 0.25);
        // Fade ke gelap di bagian atas (area teks)
        float topFade = smoothstep(0.65, 1.0, uv.y);
        col = mix(col, vec3(0.03, 0.05, 0.15), topFade * 0.7);
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const makeShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, makeShader(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, makeShader(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog); gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]),
      gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const tLoc = gl.getUniformLocation(prog, 't');
    const rLoc = gl.getUniformLocation(prog, 'res');
    let id: number;
    const draw = (ms: number) => {
      gl.uniform1f(tLoc, ms * 0.001);
      gl.uniform2f(rLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      id = requestAnimationFrame(draw);
    };
    id = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}

B) Di file hero component utama (Hero.tsx atau HeroSection.tsx):
   - Tambahkan import: import { HeroWave } from './HeroWave';
   - Pastikan wrapper section/div hero punya: className="relative overflow-hidden"
   - Letakkan <HeroWave /> sebagai child PERTAMA dari wrapper tersebut
   - Pastikan semua konten teks hero punya: style={{ position: 'relative', zIndex: 10 }}
     atau className="relative z-10"

=== PERUBAHAN 2: Teks yang sulit dibaca karena warna berubah ===

Di file hero component, temukan elemen teks (h1, p, span) yang warnanya bermasalah.

Untuk H1 / judul utama — ubah supaya warnanya statis dan terbaca:
  Ganti className yang ada warna animasi/gradient dengan:
  className="relative z-10 text-white font-bold"
  style={{
    textShadow: '0 2px 20px rgba(0,0,0,0.4), 0 0 40px rgba(0,0,0,0.2)'
  }}

Untuk subtitle / deskripsi — warna putih agak transparan:
  className="relative z-10 text-white/80"

Untuk CTA button text — pastikan kontras tinggi:
  Jangan pakai text-white kalau background button juga terang.
  Pakai text-white untuk dark button, text-gray-900 untuk light button.

=== PERUBAHAN 3: Hapus CSS animation yang konflik ===

Di file CSS (src/styles/ atau src/index.css atau src/App.css),
cari @keyframes yang namanya ada kata "gradient", "wave", "rainbow", 
"color", "hue" — yang berhubungan dengan hero section.

Kalau animasi itu dipakai di background hero section, HAPUS atau comment out
karena sudah diganti WebGL canvas.

Kalau animasi itu dipakai di TEKS hero, juga HAPUS — teks harus static 
supaya terbaca di atas background WebGL yang bergerak.

=== VERIFIKASI SETELAH SELESAI ===
1. npm run dev
2. Buka browser, cek hero section
3. Pastikan: background bergerak seperti gelombang organik (bukan hanya 
   gradient bergeser kiri-kanan)
4. Pastikan: judul dan subtitle terbaca dengan jelas di semua bagian 
   animasi (test dengan tunggu 10 detik supaya animasi berganti warna)