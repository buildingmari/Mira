/**
 * Natural-language / receipt -> SplitDraft, shared by mira-tools (Split Bill
 * page "ceritain ke MIRA" + scan struk) and chat-send (split bill via chat).
 * Also handles edits: pass the current draft and the user's instruction
 * ("Budi ga makan nasi goreng", "bagi rata aja") and get the full updated
 * draft back.
 */

import { callStructured, parseJsonLoose, sanitizeDate, todayWIB } from './ai.ts';
import { computeSplit, isFixed, totalOf, type SplitDraft, type SplitItem, type SplitParticipant } from './split.ts';

const SPLIT_PARSE_SYSTEM = `Kamu parser split bill (patungan) untuk MIRA, asisten keuangan Indonesia.
Dari teks user (dan lampiran foto struk / voice note kalau ada), ekstrak data patungan.

Balas HANYA JSON valid dengan struktur:
{
  "merchant": string,
  "date": "YYYY-MM-DD" | null,
  "wallet": string | null,
  "items": [{"name": string, "price": number, "qty": number, "assignees": [string]}],
  "tax": number,
  "discount": number,
  "total": number,
  "people": [string],
  "mode": "item" | "equal",
  "fixed_amounts": {"<nama>": number}
}

ATURAN:
- merchant = nama tempat/toko/acara/barang yang dibayar (misal "Solaria", "Kado ultah", "Villa Puncak").
- "Kamu" = user sendiri. Kata ganti "gua/gue/gw/aku/saya/w/ane" = "Kamu".
- people = HANYA nama teman yang disebut user (selain user). JANGAN mengarang nama. JANGAN masukkan "Kamu".
- Kalau user cuma sebut jumlah orang ("berempat", "4 orang") tanpa nama → people = "Teman 1", "Teman 2", ... sebanyak (jumlah orang - 1).
- items[].price = harga SATUAN, qty = jumlah. Kalau struk cuma menampilkan harga baris, pakai qty 1.
- tax = total pajak + service charge + ongkir (rupiah). discount = total diskon/promo (rupiah, positif).
- total = total akhir yang dibayar (Grand Total). 0 kalau tidak diketahui.
- assignees = siapa yang makan/pakai item itu (pakai "Kamu" untuk user). Item yang tidak jelas siapa → [] (dibagi semua).
- mode: "item" kalau user menyebut siapa pesan apa, selain itu "equal" (bagi rata).
- fixed_amounts = nominal TETAP per orang yang disebut user ("Bayu bayar 400rb aja", "Budi 50rb"), pakai "Kamu" untuk user.
  Orang yang TIDAK ada di fixed_amounts otomatis membagi SISA tagihan sesuai mode. Kosongkan {} kalau tidak ada.
  HANYA isi nominal yang user sebut EKSPLISIT untuk orang itu. JANGAN hitung sisa sendiri, JANGAN isi "Kamu" kecuali user menyebut nominal untuk dirinya.
  Contoh: total 2,4jt berempat, "Bayu cuma 400rb sisanya bagi rata" → fixed_amounts {"Bayu":400000}, mode "equal".
- Angka Indonesia: 50rb/50k = 50000, 1,5jt = 1500000, 15.000 = 15000, goceng = 5000, ceban = 10000.
- Tanggal hari ini: {{TODAY}}, kemarin: {{YESTERDAY}}. date = null kalau user TIDAK menyebut tanggal/hari.
- wallet: hanya kalau disebut/terlihat (BCA, GoPay, OVO, DANA, ShopeePay, Cash, dll), selain itu null.
- Kalau ada DRAFT SAAT INI: terapkan instruksi user sebagai PERUBAHAN ke draft tersebut dan kembalikan draft LENGKAP hasil edit (field yang tidak disinggung tetap sama).
  total, items, tax, discount TIDAK BERUBAH kecuali user eksplisit menyebut total/harga/item/pajak baru.
  Contoh: draft total 180000 bertiga, "Adi cuma bayar 40rb, sisanya gua sama Budi" → total tetap 180000, fixed_amounts {"Adi":40000}.`;

// Words that signal the user is changing the bill itself (not just who pays what).
const BILL_CHANGE = /total|harga|pajak|tax|service|diskon|discount|promo|ongkir|struk|tagihan|HASIL SCAN/i;

const ME_ALIASES = /^(kamu|gua|gue|gw|aku|saya|w|ane|me|i|user|aku sendiri)$/i;

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const cleanName = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);

function toLLMShape(d: SplitDraft) {
  const fixed = d.mode === 'manual' ? d.participants : d.participants.filter(isFixed);
  return {
    merchant: d.merchant, date: d.date, wallet: d.wallet,
    items: d.items, tax: d.tax, discount: d.discount, total: d.total,
    people: d.participants.filter((p) => !p.is_me).map((p) => p.name),
    mode: d.mode === 'item' ? 'item' : 'equal',
    fixed_amounts: Object.fromEntries(
      fixed.map((p) => [p.is_me ? 'Kamu' : p.name, d.mode === 'manual' ? p.amount : Number(p.fixed)]),
    ),
  };
}

// deno-lint-ignore no-explicit-any
export function normalizeSplit(raw: any, defaults: { wallet?: string } = {}): SplitDraft {
  const canon = new Map<string, string>(); // lowercased -> display name
  const addPerson = (n: string) => {
    const name = cleanName(n);
    if (!name || ME_ALIASES.test(name)) return 'Kamu';
    const key = name.toLowerCase();
    if (!canon.has(key)) canon.set(key, name);
    return canon.get(key)!;
  };

  for (const p of Array.isArray(raw?.people) ? raw.people : []) addPerson(p);

  const items: SplitItem[] = (Array.isArray(raw?.items) ? raw.items : [])
    .map((it: any) => ({
      name: cleanName(it?.name) || 'Item',
      price: Math.round(num(it?.price)),
      qty: Math.max(1, Math.round(num(it?.qty)) || 1),
      assignees: [...new Set((Array.isArray(it?.assignees) ? it.assignees : []).map((a: string) => addPerson(a)))] as string[],
    }))
    .filter((it: SplitItem) => it.price > 0);

  // Accept the older "manual_amounts" key too, in case the model uses it.
  const fixedRaw = raw?.fixed_amounts ?? raw?.manual_amounts;
  const fixed: Record<string, number> = {};
  if (fixedRaw && typeof fixedRaw === 'object') {
    for (const [k, v] of Object.entries(fixedRaw)) {
      const n = Math.round(Number(v));
      if (Number.isFinite(n) && n >= 0) fixed[addPerson(k)] = n;
    }
  }

  // Models like to "helpfully" pin the user to the computed remainder (or 0)
  // even when the user only fixed someone else's share — that's not a real
  // fixed amount, so let the user split the rest normally instead.
  if ('Kamu' in fixed) {
    const total0 = Math.round(num(raw?.total));
    const others = Object.entries(fixed).filter(([k]) => k !== 'Kamu').reduce((s, [, v]) => s + v, 0);
    const someFriendUnfixed = canon.size > Object.keys(fixed).length - 1;
    if (fixed['Kamu'] === 0 || (total0 > 0 && fixed['Kamu'] === total0 - others && someFriendUnfixed)) {
      delete fixed['Kamu'];
    }
  }

  const participants: SplitParticipant[] = [
    { name: 'Kamu', is_me: true, amount: 0 },
    ...[...canon.values()].map((name) => ({ name, is_me: false, amount: 0 })),
  ].map((p) => ({ ...p, fixed: p.name in fixed ? fixed[p.name] : null }));

  // Everyone has a fixed amount -> it's a fully manual split.
  const allFixed = participants.every((p) => p.fixed !== null);
  const mode: SplitDraft['mode'] = allFixed && Object.keys(fixed).length ? 'manual'
    : raw?.mode === 'item' && items.length ? 'item'
    : 'equal';
  if (mode === 'manual') participants.forEach((p) => { p.amount = p.fixed ?? 0; p.fixed = null; });

  const total = Math.round(num(raw?.total));

  const draft: SplitDraft = {
    merchant: cleanName(raw?.merchant) || 'Split Bill',
    date: sanitizeDate(raw?.date),
    wallet: cleanName(raw?.wallet) || defaults.wallet || 'Cash',
    items,
    tax: Math.round(num(raw?.tax)),
    discount: Math.round(num(raw?.discount)),
    total,
    mode,
    participants,
  };
  return computeSplit(draft);
}

/** Parse a fresh split from text, or apply `text` as an edit to `current`. */
export async function parseSplitWithAI(
  text: string,
  opts: { current?: SplitDraft | null; wallet?: string; media?: string[] } = {},
): Promise<SplitDraft> {
  const system = SPLIT_PARSE_SYSTEM.replace('{{TODAY}}', todayWIB()).replace('{{YESTERDAY}}', todayWIB(-1));
  const user = opts.current
    ? `DRAFT SAAT INI:\n${JSON.stringify(toLLMShape(opts.current))}\n\nINSTRUKSI USER:\n${text}`
    : `TEKS USER:\n${text}`;
  const raw = await callStructured(system, user, opts.media || []);
  const next = normalizeSplit(parseJsonLoose(raw), { wallet: opts.current?.wallet || opts.wallet });

  // Guard: an edit about WHO pays must not silently change HOW MUCH the bill
  // is (models sometimes "helpfully" subtract a fixed share from the total).
  const cur = opts.current;
  if (cur && totalOf(cur) > 0 && next.mode !== 'manual' && !opts.media?.length && !BILL_CHANGE.test(text)) {
    const sameItems = next.items.length === cur.items.length &&
      next.items.every((it, i) => it.name.toLowerCase() === cur.items[i].name.toLowerCase());
    if (sameItems && totalOf(next) !== totalOf(cur)) {
      return computeSplit({
        ...next,
        // keep the new assignees, restore the original prices
        items: next.items.map((it, i) => ({ ...it, price: cur.items[i].price, qty: cur.items[i].qty })),
        total: cur.total, tax: cur.tax, discount: cur.discount,
      });
    }
  }
  return next;
}
