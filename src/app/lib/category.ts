/**
 * Map a raw `expenses.category` to one of the dashboard's display buckets.
 *
 * The column is free text written by several sources — the WhatsApp/n8n flow
 * ("Makanan & Minuman", "Tagihan & Utilitas", "Savings & Investment"), older
 * English rows ("Food & Drinks", "Transportation"), the web app ("food",
 * "bills"), split bills — so exact-key lookups miss most real rows. Match on
 * keywords instead.
 */

export type CategoryBucket =
  | 'Makanan' | 'Transport' | 'Belanja' | 'Tagihan' | 'Kesehatan'
  | 'Hiburan' | 'Pemasukan' | 'Investasi';

const RULES: [RegExp, CategoryBucket][] = [
  [/income|pemasukan|gaji|salary|bonus/, 'Pemasukan'],
  [/saving|tabungan|invest|saham|reksa|bbca|bbri/, 'Investasi'],
  [/makan|minum|food|drink|kuliner|resto|kopi|coffee|jajan/, 'Makanan'],
  [/transport|bensin|bbm|parkir|ojek|ojol|tol\b/, 'Transport'],
  [/belanja|shop|groceries|supermarket|market/, 'Belanja'],
  [/tagihan|utilit|bill|listrik|internet|pulsa|cicilan|langganan|subscription/, 'Tagihan'],
  [/sehat|health|obat|dokter|medic|rumah sakit/, 'Kesehatan'],
  [/hiburan|entertain|lifestyle|liburan|travel|game|film|movie/, 'Hiburan'],
];

export function normalizeCategory<F extends string>(raw: string | null | undefined, fallback: F): CategoryBucket | F {
  const c = String(raw ?? '').toLowerCase();
  if (!c) return fallback;
  for (const [re, bucket] of RULES) if (re.test(c)) return bucket;
  return fallback;
}
