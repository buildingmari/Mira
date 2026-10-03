import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Voice notes for the AI inputs (chat, "+" AI mode, Split Bill).
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

/**
 * Mic recording with a live seconds counter. `onDone` gets a WAV data URL
 * (falls back to the raw recording if this browser can't decode it).
 */
export function useVoiceRecorder(onDone: (note: VoiceNote) => void, onError: (message: string) => void) {
  const [recording, setRecording] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(0);
  const cbRef = useRef({ onDone, onError });
  cbRef.current = { onDone, onError };

  const stop = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (recRef.current?.state === 'recording') recRef.current.stop();
    setRecording(false);
  }, []);

  const start = useCallback(async () => {
    if (recRef.current?.state === 'recording') return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      cbRef.current.onError('Browser ini belum bisa rekam suara. Coba pakai Chrome atau Safari terbaru ya.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const secs = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        if (blob.size === 0) { cbRef.current.onError('Rekamannya kosong, coba ulang ya.'); return; }
        setPreparing(true);
        try {
          cbRef.current.onDone({ dataUrl: await blobToWavDataUrl(blob), seconds: secs });
        } catch {
          try { cbRef.current.onDone({ dataUrl: await blobToDataUrl(blob), seconds: secs }); }
          catch { cbRef.current.onError('Voice note gagal diproses, coba rekam ulang ya.'); }
        } finally {
          setPreparing(false);
        }
      };
      rec.start();
      recRef.current = rec;
      startedRef.current = Date.now();
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        const s = Math.round((Date.now() - startedRef.current) / 1000);
        setSeconds(s);
        if (s >= MAX_SECONDS) stop();
      }, 500);
    } catch {
      cbRef.current.onError('MIRA butuh izin mikrofon buat rekam voice note. Izinkan dulu ya di pengaturan browser.');
    }
  }, [stop]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recRef.current?.state === 'recording') recRef.current.stop();
  }, []);

  return { recording, preparing, seconds, start, stop };
}

export const fmtSeconds = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
