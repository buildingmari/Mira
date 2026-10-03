/**
 * Shared AI plumbing for the MIRA Edge Functions (chat-send, mira-tools):
 * Gemini for receipt OCR / voice transcription, OpenRouter for the LLM
 * calls. Prompts here are extracted from the n8n WhatsApp workflow.
 */

export const GEMINI_MODEL = 'gemini-3.8-flash';
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

function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/s);
  if (!m) return { mimeType: 'application/octet-stream', data: dataUrl };
  return { mimeType: m[1], data: m[2] };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** generateContent with retries: Gemini returns 503 "high demand" / 429 in
 *  short bursts, and one retry almost always gets through. */
async function geminiGenerate(body: unknown): Promise<string> {
  const key = Deno.env.get('GEMINI_API_KEY') ?? '';
  if (!key) throw new Error('gemini_not_configured');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  let last = '';
  for (const wait of [0, 700, 1800]) {
    if (wait) await sleep(wait);
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      const out = await res.json();
      return (out?.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || '').join('');
    }
    last = `gemini_failed:${res.status}:${(await res.text().catch(() => '')).slice(0, 300)}`;
    if (res.status !== 503 && res.status !== 429 && res.status !== 500) break;
  }
  throw new Error(last);
}

export async function analyzeMedia(dataUrl: string, prompt: string): Promise<string> {
  const { mimeType, data } = splitDataUrl(dataUrl);
  return geminiGenerate({
    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data } }] }],
  });
}

/** Text-only Gemini call; with json=true the model is constrained to emit JSON. */
export async function callGemini(system: string, user: string, opts: { json?: boolean } = {}): Promise<string> {
  return geminiGenerate({
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { temperature: 0.1, ...(opts.json ? { responseMimeType: 'application/json' } : {}) },
  });
}

/** Structured extraction: Gemini first (better at Indonesian context), OpenRouter as fallback. */
export async function callStructured(system: string, user: string): Promise<string> {
  try {
    const out = await callGemini(system, user, { json: true });
    if (out.trim()) return out;
  } catch (e) {
    console.warn('callStructured: gemini failed, falling back to openrouter', String(e).slice(0, 200));
  }
  return callOpenRouter(system, user, { json: true });
}

export async function callOpenRouter(
  system: string, user: string, opts: { json?: boolean; maxTokens?: number } = {},
): Promise<string> {
  const key = Deno.env.get('OPENROUTER_API_KEY') ?? '';
  if (!key) throw new Error('openrouter_not_configured');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: BRAIN_MODEL,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      // Without an explicit cap OpenRouter reserves the model's max (16k)
      // against the account balance and rejects with 402 when credits run low.
      max_tokens: opts.maxTokens ?? 2048,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`openrouter_failed:${res.status}:${await res.text().catch(() => '')}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
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
