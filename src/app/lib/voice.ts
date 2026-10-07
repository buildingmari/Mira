import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Voice input for the AI inputs (chat, "+" AI mode, Split Bill) — see
 * useVoiceInput at the bottom.
 *
 * Browsers record in different containers — Chrome/Android: audio/webm
 * (opus), Safari/iOS: audio/mp4 (aac) — and the AI side (Gemini via
 * OpenRouter) doesn't accept webm. So every recording is decoded and
 * re-encoded here as 16 kHz mono 16-bit WAV: accepted everywhere, and small
 * (~32 KB/s) because speech doesn't need more.
 */

const MAX_SECONDS = 120;

export async function blobToWavDataUrl(blob: Blob, targetRate = 16000): Promise<string> {
  const AC: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AC();
  try {
    const raw = await blob.arrayBuffer();
    // Callback form: older Safari doesn't return a promise from decodeAudioData.
    const decoded = await new Promise<AudioBuffer>((resolve, reject) => {
      const p = ctx.decodeAudioData(raw, resolve, reject);
      if (p && typeof (p as Promise<AudioBuffer>).then === 'function') (p as Promise<AudioBuffer>).then(resolve, reject);
    });
    const OAC: typeof OfflineAudioContext = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    let offline: OfflineAudioContext;
    try {
      offline = new OAC(1, Math.max(1, Math.ceil(decoded.duration * targetRate)), targetRate);
    } catch {
      // Some engines reject low sample rates — keep the source rate instead.
      targetRate = decoded.sampleRate;
      offline = new OAC(1, Math.max(1, Math.ceil(decoded.duration * targetRate)), targetRate);
    }
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination); // 1-channel destination = mono downmix
    src.start(0);
    const rendered = await offline.startRendering();
    return 'data:audio/wav;base64,' + bytesToBase64(encodeWav(rendered.getChannelData(0), targetRate));
  } finally {
    ctx.close?.().catch(() => {});
  }
}

function encodeWav(samples: Float32Array, rate: number): Uint8Array {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0, o = 44; i < samples.length; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buf);
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000) as unknown as number[]);
  }
  return btoa(bin);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export interface VoiceNote { dataUrl: string; seconds: number }

export const fmtSeconds = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

/* ── Voice input with live text ──────────────────────────────────────
 * Where the browser has speech recognition (Chrome, Edge, Safari incl.
 * iPhone) the words appear while you talk and land in the text box, so you
 * can check them before sending. Phones can't run speech recognition and a
 * recording at the same time (the mic has one user), so it's one or the
 * other: dictation first; if it isn't available or the speech service
 * refuses (e.g. dictation turned off on iOS), it falls back — for the rest
 * of the session — to a normal voice note that MIRA's AI transcribes, with
 * a live level meter.
 */

type SR = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  onresult: ((e: any) => void) | null; onerror: ((e: any) => void) | null; onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};

const speechCtor = (): (new () => SR) | null =>
  typeof window === 'undefined' ? null : ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null);

let liveUnavailable = false; // set once the speech service refuses; stays for the session

export type VoiceMode = 'idle' | 'live' | 'record' | 'preparing';

export function useVoiceInput(opts: {
  /** Live dictation finished — the recognised words. */
  onText: (text: string) => void;
  /** Fallback path finished — a WAV voice note for the AI. */
  onAudio: (note: VoiceNote) => void;
  onError: (message: string) => void;
}) {
  const [mode, setMode] = useState<VoiceMode>('idle');
  const [seconds, setSeconds] = useState(0);
  const [finalText, setFinalText] = useState('');
  const [interim, setInterim] = useState('');
  const [level, setLevel] = useState(0);
  const cb = useRef(opts);
  cb.current = opts;

  const recRef = useRef<SR | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meterRef = useRef<{ ctx: AudioContext; raf: number } | null>(null);
  const st = useRef({ session: 0, active: false, stopping: false, cancelled: false, fallback: false, denied: false, finalText: '', interim: '', started: 0 });

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const startTimer = (onTick?: (s: number) => void) => {
    st.current.started = Date.now();
    setSeconds(0);
    clearTimer();
    timerRef.current = setInterval(() => {
      const s = Math.round((Date.now() - st.current.started) / 1000);
      setSeconds(s);
      onTick?.(s);
    }, 400);
  };
  const stopMeter = () => {
    if (!meterRef.current) return;
    cancelAnimationFrame(meterRef.current.raf);
    meterRef.current.ctx.close?.().catch(() => {});
    meterRef.current = null;
    setLevel(0);
  };

  /* Fallback: recorded voice note + live level meter (same stream, no conflict). */
  const startRecord = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      cb.current.onError('Browser ini belum bisa rekam suara. Coba pakai Chrome atau Safari terbaru ya.');
      return;
    }
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { cb.current.onError('MIRA butuh izin mikrofon buat rekam suara. Izinkan dulu ya di pengaturan browser.'); return; }

    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    st.current.cancelled = false;
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      clearTimer(); stopMeter();
      if (st.current.cancelled) { setMode('idle'); return; }
      const secs = Math.max(1, Math.round((Date.now() - st.current.started) / 1000));
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      if (!blob.size) { setMode('idle'); cb.current.onError('Rekamannya kosong, coba ulang ya.'); return; }
      setMode('preparing');
      try { cb.current.onAudio({ dataUrl: await blobToWavDataUrl(blob), seconds: secs }); }
      catch {
        try { cb.current.onAudio({ dataUrl: await blobToDataUrl(blob), seconds: secs }); }
        catch { cb.current.onError('Voice note gagal diproses, coba rekam ulang ya.'); }
      }
      setMode('idle');
    };

    try {
      const AC: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      let last = 0;
      const tick = (t: number) => {
        analyser.getByteTimeDomainData(buf);
        if (t - last > 70) {
          let sum = 0;
          for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
          setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
          last = t;
        }
        if (meterRef.current) meterRef.current.raf = requestAnimationFrame(tick);
      };
      meterRef.current = { ctx, raf: requestAnimationFrame(tick) };
    } catch { /* the meter is decoration only */ }

    rec.start();
    mediaRef.current = rec;
    setMode('record');
    startTimer((s) => { if (s >= MAX_SECONDS && rec.state === 'recording') rec.stop(); });
  }, []);

  /* Live dictation. */
  const finishLive = useCallback(() => {
    const s = st.current;
    if (!s.active) return;
    s.active = false;
    clearTimer();
    recRef.current = null;
    const text = `${s.finalText} ${s.interim}`.replace(/\s+/g, ' ').trim();
    setInterim('');
    setMode('idle');
    if (s.cancelled) return;
    if (s.fallback && !text) { liveUnavailable = true; void startRecord(); return; }
    if (s.denied) { cb.current.onError('MIRA butuh izin mikrofon buat dengerin. Izinkan dulu ya di pengaturan browser.'); return; }
    if (text) cb.current.onText(text);
    else cb.current.onError('MIRA belum nangkep suaranya. Coba ngomong lebih dekat ke mic ya.');
  }, [startRecord]);

  const startLive = useCallback((Ctor: new () => SR) => {
    const s = st.current;
    Object.assign(s, { session: s.session + 1, active: true, stopping: false, cancelled: false, fallback: false, denied: false, finalText: '', interim: '' });
    setFinalText(''); setInterim('');
    const android = /android/i.test(navigator.userAgent);

    const begin = () => {
      const rec = new Ctor();
      rec.lang = 'id-ID';
      rec.interimResults = true;
      // Android Chrome repeats earlier words in continuous mode — use short
      // sessions there and stitch them together instead.
      rec.continuous = !android;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => {
        let live = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          const t = String(r[0]?.transcript || '');
          if (r.isFinal) s.finalText = `${s.finalText} ${t}`.replace(/\s+/g, ' ').trim();
          else live += t;
        }
        s.interim = live.trim();
        setFinalText(s.finalText);
        setInterim(s.interim);
      };
      rec.onerror = (e: any) => {
        const err = String(e?.error || '');
        if (err === 'no-speech' || err === 'aborted') return;
        if (err === 'not-allowed') { s.denied = !s.finalText; return; }
        // service-not-allowed / audio-capture / network / language-not-supported
        if (!s.finalText && !s.interim) s.fallback = true;
      };
      rec.onend = () => {
        // Engines end a session after a pause — keep listening until the user stops.
        const elapsed = (Date.now() - s.started) / 1000;
        if (s.active && !s.stopping && !s.fallback && !s.denied && elapsed < MAX_SECONDS) {
          if (s.interim) { s.finalText = `${s.finalText} ${s.interim}`.trim(); s.interim = ''; }
          try { begin(); return; } catch { /* fall through */ }
        }
        finishLive();
      };
      recRef.current = rec;
      rec.start();
    };

    try { begin(); }
    catch { s.active = false; liveUnavailable = true; void startRecord(); return; }
    setMode('live');
    startTimer((sec) => { if (sec >= MAX_SECONDS) stop(); });
  }, [finishLive, startRecord]);

  const start = useCallback(() => {
    if (st.current.active || mediaRef.current?.state === 'recording') return;
    const Ctor = speechCtor();
    if (Ctor && !liveUnavailable) startLive(Ctor);
    else void startRecord();
  }, [startLive, startRecord]);

  const stop = useCallback(() => {
    if (st.current.active) {
      st.current.stopping = true;
      try { recRef.current?.stop(); } catch { /* ended already */ }
      // Some engines never fire onend after stop().
      const session = st.current.session;
      setTimeout(() => { if (st.current.session === session) finishLive(); }, 1500);
      return;
    }
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop();
  }, [finishLive]);

  const cancel = useCallback(() => {
    st.current.cancelled = true;
    if (st.current.active) { st.current.stopping = true; try { recRef.current?.abort(); } catch {} finishLive(); return; }
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop();
  }, [finishLive]);

  useEffect(() => () => {
    st.current.cancelled = true;
    st.current.active = false;
    clearTimer(); stopMeter();
    try { recRef.current?.abort(); } catch {}
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop();
  }, []);

  return {
    mode, seconds, finalText, interim, level,
    busy: mode !== 'idle',
    listening: mode === 'live' || mode === 'record',
    start, stop, cancel,
  };
}
