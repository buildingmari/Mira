/**
 * mira-tools
 * ─────────────────────────────────────────────────────────────────────────
 * Structured (non-chat) AI + write endpoints for the dashboard web app:
 *
 *   { op: 'parse_expense', phone_number, text?, image_base64?, audio_base64? }
 *     -> { expenses: [{ item, merchant, amount, category, wallet, date, transaction_type }], note }
 *     Used by the "+" / Catat modal's ✨ AI mode. Categories are the modal's
 *     own labels (Makanan, Transport, …) so it can map them with CAT_TO_DB.
 *     Nothing is saved here — the modal shows editable cards first.
 *
 *   { op: 'parse_split', phone_number, text?, image_base64?, audio_base64?, current? }
 *     -> { draft: SplitDraft }
 *     Split Bill page: scan a receipt and/or describe who had what. With
 *     `current`, `text` is applied as an edit to that draft.
 *
 *   { op: 'save_split', phone_number, draft, clear_chat_state? }
 *     -> { id, message }   (persists exactly like WhatsApp's Confirm Split Bill)
 *
 *   { op: 'settle_piutang', phone_number, asset_id } -> { ok }
 *
 * Writes go through here (service role) because user_reminders has RLS with
 * no anon policy. Secret: OPENROUTER_API_KEY (every model, Gemini included, goes through OpenRouter).
 * ─────────────────────────────────────────────────────────────────────────
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  callStructured, mediaNote, parseJsonLoose, sanitizeDate, todayWIB, UnsupportedMediaError,
} from '../_shared/ai.ts';
import { saveSplit, settlePiutang, computeSplit, type SplitDraft } from '../_shared/split.ts';
import { parseSplitWithAI } from '../_shared/split_ai.ts';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

const CATEGORIES = ['Makanan', 'Transport', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Pemasukan', 'Lainnya'];
const WALLETS = ['BCA', 'BRI', 'Mandiri', 'BNI', 'CIMB', 'Jenius', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja', 'Cash'];

const EXPENSE_PARSE_SYSTEM = `Kamu parser transaksi keuangan untuk MIRA, asisten keuangan Indonesia.
Ekstrak SEMUA transaksi dari teks user dan lampirannya (foto struk/bukti transfer, voice note).

Balas HANYA JSON valid:
{"expenses":[{"item":string,"merchant":string|null,"amount":number,"category":string,"wallet":string|null,"date":"YYYY-MM-DD","transaction_type":"expense"|"income"}],"note":string|null}

ATURAN:
- Tanggal hari ini: {{TODAY}}, kemarin: {{YESTERDAY}}. Tentukan tanggal PER TRANSAKSI: kata waktu ("kemarin", "tadi pagi", "tgl 5") hanya berlaku untuk transaksi yang LANGSUNG mengikutinya / disebut bersamanya; transaksi lain = hari ini.
- JANGAN ada transaksi yang terlewat, termasuk pemasukan (gaji/bonus/transfer masuk).
- category WAJIB salah satu: ${CATEGORIES.join(', ')}.
  Makanan = makan/minum/kopi/jajan; Transport = bensin/ojol/parkir/tol/tiket; Belanja = belanja barang/groceries/fashion/elektronik;
  Tagihan = listrik/air/internet/pulsa/cicilan/langganan; Kesehatan = obat/dokter/gym; Hiburan = nonton/game/streaming/liburan;
  Pemasukan = gaji/bonus/transfer masuk/jualan; Lainnya = sisanya.
- transaction_type "income" untuk uang masuk (category Pemasukan), selain itu "expense".
- wallet: hanya kalau disebut/terlihat, dipetakan ke salah satu: ${WALLETS.join(', ')}. Tunai = Cash. Selain itu null.
- Struk dengan banyak item = SATU transaksi dengan amount = TOTAL akhir yang dibayar dan item = ringkasan (misal "Belanja Indomaret"), kecuali user minta dipisah.
- Beberapa transaksi berbeda dalam satu pesan ("kopi 25rb, parkir 5rb") = beberapa entri.
- Angka Indonesia: 25rb/25k = 25000, 1,5jt = 1500000, 15.000 = 15000, goceng = 5000, ceban = 10000, gopek = 500, seceng = 1000.
- item singkat & jelas (maks 40 karakter). merchant = nama toko/tempat kalau ada.
- Kalau tidak ada transaksi yang bisa dicatat: expenses [] dan note = pertanyaan singkat ramah (bahasa santai) untuk minta detail.

CONTOH (misal hari ini 2026-01-10):
Input: "makan siang warteg 18rb, kemarin isi bensin 50rb pake BCA, dapet bonus 2jt ke mandiri"
Output: {"expenses":[
 {"item":"Makan siang","merchant":"Warteg","amount":18000,"category":"Makanan","wallet":null,"date":"2026-01-10","transaction_type":"expense"},
 {"item":"Isi bensin","merchant":null,"amount":50000,"category":"Transport","wallet":"BCA","date":"2026-01-09","transaction_type":"expense"},
 {"item":"Bonus","merchant":null,"amount":2000000,"category":"Pemasukan","wallet":"Mandiri","date":"2026-01-10","transaction_type":"income"}
],"note":null}`;

// deno-lint-ignore no-explicit-any
async function getUser(phone: string): Promise<any | null> {
  const { data } = await sb.from('users').select('*').eq('primary_phone', phone).maybeSingle();
  return data;
}

// deno-lint-ignore no-explicit-any
function isActiveMember(user: any): boolean {
  if (user.valid_to && new Date(user.valid_to) < new Date()) return false;
  const s = String(user.account_status || '').toLowerCase();
  return s === 'pro' || s === 'paid';
}

// deno-lint-ignore no-explicit-any
function normalizeExpenses(raw: any, defaultWallet: string) {
  const list = Array.isArray(raw?.expenses) ? raw.expenses : [];
  // deno-lint-ignore no-explicit-any
  return list.map((e: any) => {
    const isIncome = e?.transaction_type === 'income' || e?.category === 'Pemasukan';
    const category = isIncome ? 'Pemasukan'
      : CATEGORIES.includes(e?.category) && e.category !== 'Pemasukan' ? e.category : 'Lainnya';
    const wallet = WALLETS.find((w) => w.toLowerCase() === String(e?.wallet || '').toLowerCase()) || defaultWallet;
    return {
      item: String(e?.item || e?.merchant || category).slice(0, 60),
      merchant: e?.merchant ? String(e.merchant).slice(0, 60) : null,
      amount: Math.round(Math.abs(Number(e?.amount) || 0)),
      category,
      wallet,
      date: sanitizeDate(e?.date),
      transaction_type: isIncome ? 'income' : 'expense',
    };
  // deno-lint-ignore no-explicit-any
  }).filter((e: any) => e.amount > 0);
}

// deno-lint-ignore no-explicit-any
function sanitizeDraft(d: any, defaultWallet: string): SplitDraft {
  const seen = new Set<string>();
  // deno-lint-ignore no-explicit-any
  const participants = (d.participants as any[])
    .map((p) => ({
      name: p?.is_me ? 'Kamu' : String(p?.name || '').replace(/\s+/g, ' ').trim().slice(0, 40),
      is_me: !!p?.is_me,
      amount: Math.max(0, Math.round(Number(p?.amount) || 0)),
      fixed: p?.fixed === null || p?.fixed === undefined || p?.fixed === '' || !Number.isFinite(Number(p.fixed))
        ? null : Math.max(0, Math.round(Number(p.fixed))),
    }))
    .filter((p) => {
      const k = p.name.toLowerCase();
      if (!p.name || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  if (!participants.some((p) => p.is_me)) participants.unshift({ name: 'Kamu', is_me: true, amount: 0, fixed: null });

  const mode: SplitDraft['mode'] = d.mode === 'manual' ? 'manual' : d.mode === 'item' ? 'item' : 'equal';
  const base: SplitDraft = {
    merchant: String(d.merchant || 'Split Bill').trim().slice(0, 60) || 'Split Bill',
    // Not sanitizeDate: the user may deliberately back-date a split by hand.
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(d.date || '')) ? String(d.date) : todayWIB(),
    wallet: String(d.wallet || defaultWallet).slice(0, 30),
    category: typeof d.category === 'string' && d.category ? d.category : undefined,
    // deno-lint-ignore no-explicit-any
    items: (Array.isArray(d.items) ? d.items : []).map((it: any) => ({
      name: String(it?.name || 'Item').slice(0, 60),
      price: Math.max(0, Math.round(Number(it?.price) || 0)),
      qty: Math.max(1, Math.round(Number(it?.qty) || 1)),
      assignees: Array.isArray(it?.assignees) ? it.assignees.map(String) : [],
    })),
    tax: Math.max(0, Math.round(Number(d.tax) || 0)),
    discount: Math.max(0, Math.round(Number(d.discount) || 0)),
    total: Math.max(0, Math.round(Number(d.total) || 0)),
    mode,
    participants,
  };
  return computeSplit(base);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // deno-lint-ignore no-explicit-any
  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'invalid_json' }, 400); }

  const op = String(body.op || '');
  const phone = String(body.phone_number || '').trim();
  if (!phone) return json({ error: 'phone_number_required' }, 400);

  try {
    const user = await getUser(phone);
    if (!user) return json({ error: 'user_not_found', message: 'Nomor ini belum terdaftar di MIRA.' }, 404);

    switch (op) {
      case 'parse_expense': {
        if (!isActiveMember(user)) return json({ error: 'inactive', message: 'Langganan MIRA kamu belum aktif.' }, 403);
        const text = typeof body.text === 'string' ? body.text.trim() : '';
        const image = typeof body.image_base64 === 'string' ? body.image_base64 : '';
        const audio = typeof body.audio_base64 === 'string' ? body.audio_base64 : '';
        if (!text && !image && !audio) return json({ error: 'empty' }, 400);

        const input = [text, mediaNote({ image, audio })].filter(Boolean).join('\n\n');
        const system = EXPENSE_PARSE_SYSTEM.replace('{{TODAY}}', todayWIB()).replace('{{YESTERDAY}}', todayWIB(-1));
        const raw = await callStructured(system, input, [image, audio].filter(Boolean));
        const parsed = parseJsonLoose<{ note?: string }>(raw);
        const expenses = normalizeExpenses(parsed, user.primary_wallet || 'Cash');
        return json({
          expenses,
          note: expenses.length ? null : (parsed?.note || 'Hmm, MIRA belum nemu nominalnya. Coba tulis kayak "kopi 25rb pake gopay" ya 🙂'),
        });
      }

      case 'parse_split': {
        if (!isActiveMember(user)) return json({ error: 'inactive', message: 'Langganan MIRA kamu belum aktif.' }, 403);
        const text = typeof body.text === 'string' ? body.text.trim() : '';
        const image = typeof body.image_base64 === 'string' ? body.image_base64 : '';
        const audio = typeof body.audio_base64 === 'string' ? body.audio_base64 : '';
        if (!text && !image && !audio) return json({ error: 'empty' }, 400);
        const input = [text, mediaNote({ image, audio })].filter(Boolean).join('\n\n');
        const current = body.current && typeof body.current === 'object' ? (body.current as SplitDraft) : null;
        const draft = await parseSplitWithAI(input, { current, wallet: user.primary_wallet || 'Cash', media: [image, audio].filter(Boolean) });
        return json({ draft });
      }

      case 'save_split': {
        const d = body.draft;
        if (!d || typeof d !== 'object' || !Array.isArray(d.participants)) return json({ error: 'invalid_draft' }, 400);
        // Re-sanitize server-side: never trust client math for what gets written.
        const draft = sanitizeDraft(d, user.primary_wallet || 'Cash');
        if (draft.participants.reduce((s, p) => s + p.amount, 0) <= 0) {
          return json({ error: 'empty_total', message: 'Total tagihannya masih Rp 0.' }, 400);
        }
        const result = await saveSplit(sb, phone, draft, body.source === 'chat' ? 'chat' : 'web');
        if (body.clear_chat_state) {
          await sb.from('user_states')
            .update({ state: 'idle', draft_data: null, updated_at: new Date().toISOString() })
            .eq('phone_number', phone).eq('state', 'waiting_split_confirm');
        }
        return json(result);
      }

      case 'settle_piutang': {
        const assetId = String(body.asset_id || '');
        if (!assetId) return json({ error: 'asset_id_required' }, 400);
        const result = await settlePiutang(sb, phone, assetId);
        return json(result, result.ok ? 200 : 404);
      }

      default:
        return json({ error: 'unknown_op' }, 400);
    }
  } catch (err) {
    if (err instanceof UnsupportedMediaError) {
      return json({ error: 'unsupported_media', message: 'Format file/voice note-nya belum didukung 😅 Coba foto JPG/PNG atau rekam ulang dari tombol mic ya.' }, 422);
    }
    console.error('mira-tools error:', op, err);
    return json({ error: 'internal', message: 'Waduh, ada gangguan di sisi MIRA. Coba lagi ya 🙏' }, 500);
  }
});
