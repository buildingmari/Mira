/**
 * Shared AI plumbing for the MIRA Edge Functions (chat-send, mira-tools).
 * Everything goes through OpenRouter (one key, one bill):
 *   - GEMINI_MODEL (google/gemini-3.8-flash) for receipt OCR, voice-note
 *     transcription and structured parsing — it reads images/audio and is
 *     strong at Indonesian context,
 *   - BRAIN_MODEL (openai/gpt-4o-mini) for the chat brain, same as n8n.
 * Prompts here are extracted from the n8n WhatsApp workflow.
 */

export const GEMINI_MODEL = 'google/gemini-3.8-flash';
export const BRAIN_MODEL = 'openai/gpt-4o-mini';

/** "Today" in WIB (UTC+7), independent of the server clock. */
export function todayWIB(offsetDays = 0): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000 + offsetDays * 86400000).toISOString().split('T')[0];
}

/** Accepts an LLM-supplied date only if it is a plausible transaction date
 *  (within the last year, not in the future) — models like to hallucinate
 *  their training-cutoff year when the user never mentioned a date. */
export function sanitizeDate(v: unknown): string {
  const s = String(v ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return todayWIB();
  return s <= todayWIB() && s >= todayWIB(-366) ? s : todayWIB();
}

export const IMAGE_OCR_PROMPT = `Kamu adalah OCR specialist untuk dokumen keuangan Indonesia.

TUGAS: Ekstrak semua informasi transaksi dari gambar ini.

JENIS DOKUMEN yang dikenali:
- Struk belanja fisik (supermarket, minimarket, restoran, apotek)
- Bukti transfer bank (BCA, BNI, BRI, Mandiri, OCBC, Mega, Jago, dll)
- Screenshot e-wallet (GoPay, OVO, DANA, ShopeePay, LinkAja, dll)
- Struk QRIS / payment gateway
- Invoice online (Tokopedia, Shopee, Lazada, TikTok Shop, dll)
- Struk PayLater (ShopeePayLater, Akulaku, Kredivo, dll)
- Tagihan (PLN, PDAM, Indihome, Telkomsel, dll)
- Apapun bentuknya yang ada kaitannya dengan transaksi

INFORMASI YANG DIEKSTRAK:
1. MERCHANT/TOKO: nama toko, brand, nama pengirim/penerima
2. TANGGAL & WAKTU
3. ITEMS: nama item, qty, harga satuan
4. NOMINAL:
   - Subtotal (sebelum diskon)
   - Diskon/promo
   - Pajak/PPN/service charge
   - Ongkir (jika ada)
   - TOTAL AKHIR yang dibayar (cari: Total, Grand Total, Bayar, Nominal, Jumlah)
5. METODE PEMBAYARAN: nama bank, e-wallet, kartu, QRIS, tunai
6. REFERENSI: nomor transaksi, order ID
7. STATUS: Berhasil/Sukses/Failed

TIPS MEMBACA:
- Separator ribuan Indonesia: titik (.) → 15.000 = Rp 15.000
- "Rp" bisa mepet angka: Rp15000 = Rp 15.000
- Untuk bukti transfer: cari baris "Jumlah Transfer" atau "Nominal"
- Untuk e-wallet: cari angka besar di tengah layar
- Untuk struk kasir: cari baris TOTAL paling bawah
- Jika ada beberapa angka besar, ambil yang PALING AKHIR (Grand Total)

FORMAT OUTPUT:
Merchant: [nama]
Tanggal: [tanggal]
Items:
- [item] x[qty] = Rp [harga]
Subtotal: Rp [angka]
Diskon: Rp [angka]
Pajak/Biaya: Rp [angka]
TOTAL: Rp [total dibayar]
Metode Bayar: [metode]
Referensi: [nomor]
Status: [status]

Jika bukan dokumen keuangan: deskripsikan singkat isi gambar.`;

export const AUDIO_PROMPT = 'Transkripsikan voice note berbahasa Indonesia ini apa adanya (angka ditulis sebagai angka). Balas hanya dengan teks transkripnya.';

/** Splits a data URL. Tolerates MIME parameters — Safari records voice notes
 *  as "data:audio/mp4; codecs=mp4a.40.2;base64,...". */
export function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const m = /^data:([^,]*?);base64,(.*)$/s.exec(dataUrl);
  if (!m) return { mimeType: 'application/octet-stream', data: dataUrl };
  return { mimeType: m[1].split(';')[0].trim().toLowerCase(), data: m[2] };
}

// OpenRouter input_audio formats (Gemini): wav, mp3, aiff, aac, ogg, flac, m4a.
const AUDIO_FORMATS: Record<string, string> = {
  'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav',
  'audio/mpeg': 'mp3', 'audio/mp3': 'mp3',
  'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/m4a': 'm4a',
  'audio/aac': 'aac', 'audio/ogg': 'ogg', 'audio/flac': 'flac', 'audio/aiff': 'aiff', 'audio/x-aiff': 'aiff',
};

export class UnsupportedMediaError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// deno-lint-ignore no-explicit-any
type Message = { role: 'system' | 'user'; content: string | any[] };

/** OpenRouter chat completion with retries on rate limits / provider hiccups. */
async function openRouter(
  model: string, messages: Message[], opts: { json?: boolean; maxTokens?: number } = {},
): Promise<string> {
  const key = Deno.env.get('OPENROUTER_API_KEY') ?? '';
  if (!key) throw new Error('openrouter_not_configured');
  let last = '';
  for (const wait of [0, 800, 2000]) {
    if (wait) await sleep(wait);
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://halo-mira.com',
        'X-Title': 'MIRA',
      },
      body: JSON.stringify({
        model,
        messages,
        // Without an explicit cap OpenRouter reserves the model's max output
        // against the account balance and rejects with 402 when credits are low.
        max_tokens: opts.maxTokens ?? 2048,
        temperature: 0.1,
        ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) return content.map((p: { text?: string }) => p?.text || '').join('');
      // 200 with an error body happens when the upstream provider fails mid-way.
      last = `openrouter_empty:${JSON.stringify(data?.error || data).slice(0, 300)}`;
      continue;
    }
    last = `openrouter_failed:${res.status}:${(await res.text().catch(() => '')).slice(0, 300)}`;
    if (![408, 429, 500, 502, 503, 504].includes(res.status)) break;
  }
  throw new Error(last);
}

/** OpenRouter content part for a photo or a voice note (data URL). */
// deno-lint-ignore no-explicit-any
function mediaPart(dataUrl: string): any {
  const { mimeType, data } = splitDataUrl(dataUrl);
  if (mimeType.startsWith('image/')) {
    return { type: 'image_url', image_url: { url: `data:${mimeType};base64,${data}` } };
  }
  if (mimeType.startsWith('audio/') || mimeType === 'video/mp4' || mimeType === 'video/webm') {
    const format = AUDIO_FORMATS[mimeType] || (mimeType === 'video/mp4' ? 'm4a' : '');
    if (!format) throw new UnsupportedMediaError(`unsupported_audio:${mimeType}`);
    return { type: 'input_audio', input_audio: { data, format } };
  }
  throw new UnsupportedMediaError(`unsupported_media:${mimeType}`);
}

const isAudio = (dataUrl: string) => !splitDataUrl(dataUrl).mimeType.startsWith('image/');

/** Reads a photo (OCR) or a voice note (transcription) with Gemini. */
export async function analyzeMedia(dataUrl: string, prompt: string): Promise<string> {
  const out = await openRouter(GEMINI_MODEL, [{ role: 'user', content: [{ type: 'text', text: prompt }, mediaPart(dataUrl)] }], { maxTokens: 4096 });
  return out.trim();
}

/** Text-only Gemini call; with json=true the model is asked for a JSON object. */
export function callGemini(system: string, user: string, opts: { json?: boolean } = {}): Promise<string> {
  return openRouter(GEMINI_MODEL, [{ role: 'system', content: system }, { role: 'user', content: user }], opts);
}

/**
 * Structured extraction: Gemini first (better at Indonesian context).
 * Attached media (receipt photos, voice notes) are read in that SAME call —
 * one round trip instead of OCR/transcribe-then-parse. If Gemini fails, the
 * media is turned into text separately and gpt-4o-mini parses that.
 */
export async function callStructured(system: string, user: string, media: string[] = []): Promise<string> {
  const parts = media.map(mediaPart); // unsupported formats fail fast, before any AI call
  try {
    const content = parts.length ? [{ type: 'text', text: user }, ...parts] : user;
    const out = await openRouter(GEMINI_MODEL, [{ role: 'system', content: system }, { role: 'user', content }], { json: true, maxTokens: 4096 });
    if (out.trim()) return out;
  } catch (e) {
    if (e instanceof UnsupportedMediaError) throw e;
    console.warn('callStructured: gemini failed, falling back to gpt-4o-mini', String(e).slice(0, 200));
  }
  let text = user;
  if (media.length) {
    const read = await Promise.all(media.map((m) => analyzeMedia(m, isAudio(m) ? AUDIO_PROMPT : IMAGE_OCR_PROMPT)));
    text = [user, ...read.map((r, i) => (isAudio(media[i]) ? `VOICE NOTE:\n${r}` : `HASIL SCAN STRUK:\n${r}`))].join('\n\n');
  }
  return callOpenRouter(system, text, { json: true });
}

/** Tells the parser what's attached, so it reads the media as the main input. */
export function mediaNote(media: { image?: string; audio?: string }): string {
  const what = [media.image && 'foto struk/bukti transaksi', media.audio && 'voice note'].filter(Boolean);
  return what.length ? `[Lampiran dari user: ${what.join(' + ')} — baca/dengarkan isinya, itu sumber data utama.]` : '';
}

/** The chat brain model (gpt-4o-mini, same as n8n). */
export function callOpenRouter(
  system: string, user: string, opts: { json?: boolean; maxTokens?: number } = {},
): Promise<string> {
  return openRouter(BRAIN_MODEL, [{ role: 'system', content: system }, { role: 'user', content: user }], opts);
}

export function stripCodeFence(s: string): string {
  const t = s.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1] : t;
}

/** JSON.parse that tolerates code fences and leading/trailing prose. */
export function parseJsonLoose<T = unknown>(raw: string): T {
  const s = stripCodeFence(raw);
  try { return JSON.parse(s); } catch { /* fall through */ }
  const start = s.search(/[[{]/);
  const end = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (start >= 0 && end > start) return JSON.parse(s.slice(start, end + 1));
  throw new Error('invalid_json');
}
