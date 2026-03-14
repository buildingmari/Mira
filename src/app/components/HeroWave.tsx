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
        vec3 c1 = vec3(0.02, 0.08, 0.35);   // biru gelap
        vec3 c2 = vec3(0.00, 0.55, 0.95);   // biru terang
        vec3 c3 = vec3(0.00, 0.80, 1.00);   // cyan
        vec3 c4 = vec3(0.10, 0.30, 0.85);   // biru tengah

        vec3 col = mix(c1, c2, w1 * 0.7);
        col = mix(col, c3, w2 * 0.4);
        col = mix(col, c4, w3 * 0.3);
        col = mix(col, c2, w4 * 0.2);

        // Fade ke putih di sisi KIRI (area teks)
        float leftFade = smoothstep(0.0, 0.45, uv.x);
        col = mix(vec3(1.0, 1.0, 1.0), col, leftFade);

        // Fade ke putih di bagian ATAS
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
