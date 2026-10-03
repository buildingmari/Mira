/**
 * Split bill math + persistence, shared by chat-send (split via chat) and
 * mira-tools (the Split Bill page). Persistence mirrors the WhatsApp flow's
 * "Confirm Split Bill" node exactly — user's share -> expenses, each friend
 * -> user_assets 'piutang' + a user_reminders "tagih" reminder H+3 — so a
 * split made on the web shows up in the Aset page just like a WhatsApp one.
 * The frontend (pages/dashboard/split-bill.tsx) has its own copy of
 * computeSplit for live recalculation; keep the two in sync.
 */

export interface SplitItem { name: string; price: number; qty: number; assignees: string[] }
export interface SplitParticipant {
  name: string; is_me: boolean; amount: number;
  /** Semi-manual: a locked amount for this person; everyone else splits the rest. */
  fixed?: number | null;
  paid?: boolean; asset_id?: string | null; reminder_id?: string | null;
}
export interface SplitDraft {
  merchant: string; date: string; wallet: string; category?: string;
  items: SplitItem[]; tax: number; discount: number; total: number;
  mode: 'item' | 'equal' | 'manual';
  participants: SplitParticipant[];
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function subtotalOf(d: SplitDraft): number {
  return d.items.reduce((s, it) => s + num(it.price) * (num(it.qty) || 1), 0);
}

export function totalOf(d: SplitDraft): number {
  if (num(d.total) > 0) return num(d.total);
  return Math.max(0, subtotalOf(d) + num(d.tax) - num(d.discount));
}

export const isFixed = (p: SplitParticipant) =>
  p.fixed !== null && p.fixed !== undefined && Number.isFinite(Number(p.fixed)) && Number(p.fixed) >= 0;

/**
 * Returns a copy with participant amounts recomputed.
 *  - 'manual': every amount is typed by the user; total = their sum.
 *  - 'equal' / 'item': people with a `fixed` amount pay exactly that; the
 *    rest of the bill is split among everyone else — evenly, or in
 *    proportion to the items they had (tax/discount spread proportionally).
 */
export function computeSplit(d: SplitDraft): SplitDraft {
  const people = d.participants.length ? d.participants : [{ name: 'Kamu', is_me: true, amount: 0 }];
  if (d.mode === 'manual') {
    const ps = people.map((p) => ({ ...p, fixed: null, amount: Math.max(0, Math.round(num(p.amount))) }));
    return { ...d, total: ps.reduce((s, p) => s + p.amount, 0), participants: ps };
  }

  const fixedSum = people.filter(isFixed).reduce((s, p) => s + Math.round(num(p.fixed)), 0);
  const total = totalOf(d) > 0 ? totalOf(d) : fixedSum;
  const free = people.filter((p) => !isFixed(p));
  const remaining = Math.max(0, total - fixedSum);

  const weight: Record<string, number> = {};
  free.forEach((p) => { weight[p.name] = 0; });
  if (d.mode === 'item' && d.items.length) {
    const all = people.map((p) => p.name);
    for (const it of d.items) {
      const line = num(it.price) * (num(it.qty) || 1);
      const owners = (it.assignees || []).filter((n) => all.includes(n));
      // Unassigned items are shared evenly by everyone.
      const share = owners.length ? owners : all;
      share.forEach((n) => { if (n in weight) weight[n] += line / share.length; });
    }
  }
  let wsum = Object.values(weight).reduce((s, w) => s + w, 0);
  if (wsum <= 0) { free.forEach((p) => { weight[p.name] = 1; }); wsum = free.length; }

  const rounded = people.map((p) => ({
    ...p,
    amount: isFixed(p) ? Math.round(num(p.fixed)) : wsum > 0 ? Math.round((remaining * weight[p.name]) / wsum) : 0,
  }));
  if (free.length) {
    // Absorb the rounding remainder: on the user if they're splitting, else the first free person.
    const diff = Math.round(fixedSum + remaining) - rounded.reduce((s, p) => s + p.amount, 0);
    const meFree = rounded.findIndex((p) => p.is_me && !isFixed(p));
    const idx = meFree >= 0 ? meFree : rounded.findIndex((p) => !isFixed(p));
    if (idx >= 0) rounded[idx].amount = Math.max(0, rounded[idx].amount + diff);
  }

  return { ...d, total, participants: rounded };
}

const fmt = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n));

export function formatSplitSummary(d: SplitDraft): string {
  const lines = [`🍕 Split Bill — ${d.merchant || 'Tanpa nama'}`, `💸 Total: ${fmt(totalOf(d))}`, ''];
  for (const p of d.participants) lines.push(`${p.is_me ? '👤 Kamu' : '• ' + p.name}: ${fmt(p.amount)}`);
  if (d.participants.filter((p) => !p.is_me).length === 0) {
    lines.push('', 'Belum ada teman yang ikut — sebutin namanya (misal: "sama Budi dan Adi").');
  }
  return lines.join('\n');
}

// deno-lint-ignore no-explicit-any
export async function saveSplit(sb: any, phone: string, input: SplitDraft, source: 'web' | 'chat') {
  const d = computeSplit(input);
  const merchant = (d.merchant || 'Split Bill').trim();
  const date = d.date || new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  const wallet = d.wallet || 'Cash';
  const me = d.participants.find((p) => p.is_me);

  let expense_id: string | null = null;
  if (me && me.amount > 0) {
    const { data, error } = await sb.from('expenses').insert({
      phone_number: phone, amount: Math.round(me.amount), currency: 'IDR',
      item: `Split Bill ${merchant}`, merchant, date, wallet,
      category: d.category || 'Makanan & Minuman', transaction_type: 'expense',
      created_at: new Date().toISOString(),
    }).select('id').single();
    if (error) throw new Error('expense_insert_failed: ' + error.message);
    expense_id = data?.id ?? null;
  }

  const remindOn = new Date(Date.now() + 7 * 3600 * 1000 + 3 * 86400000).toISOString().slice(0, 10);
  const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  const participants: SplitParticipant[] = [];
  for (const p of d.participants) {
    if (p.is_me || p.amount <= 0) { participants.push({ ...p, paid: p.is_me ? true : p.paid ?? false }); continue; }
    const { data: asset } = await sb.from('user_assets').insert({
      phone_number: phone, category: 'piutang', name: `Piutang ${p.name} (${merchant})`,
      subtype: 'Piutang Pribadi', value: Math.round(p.amount), updated_date: today,
    }).select('id').single();
    const { data: rem } = await sb.from('user_reminders').insert({
      phone_number: phone, name: `Tagih piutang ${p.name} — ${merchant}`,
      schedule_type: 'once', schedule_date: remindOn, nominal: Math.round(p.amount),
      lead_days: 1, active: true,
    }).select('id').single();
    participants.push({ ...p, paid: false, asset_id: asset?.id ?? null, reminder_id: rem?.id ?? null });
  }

  const { data: row, error: splitErr } = await sb.from('split_bills').insert({
    phone_number: phone, merchant, date, subtotal: subtotalOf(d), tax: num(d.tax), discount: num(d.discount),
    total: totalOf(d), wallet, mode: d.mode, items: d.items, participants, source, expense_id,
  }).select('id').single();
  if (splitErr) throw new Error('split_insert_failed: ' + splitErr.message);

  const others = participants.filter((p) => !p.is_me && p.amount > 0);
  const msg = [
    `✅ Split bill tersimpan! 🍕`,
    `Bagian kamu: ${fmt(me?.amount || 0)} (masuk ke pengeluaran)`,
    ...(others.length ? ['', '💰 Piutang (dicatat di Aset):', ...others.map((p) => `• ${p.name}: ${fmt(p.amount)}`)] : []),
  ].join('\n');

  return { id: row?.id as string, message: msg };
}

/** Marks a friend's piutang as paid. Works for web/chat splits (via split_bills)
 *  and WhatsApp-created ones (asset only). */
// deno-lint-ignore no-explicit-any
export async function settlePiutang(sb: any, phone: string, assetId: string) {
  const { data: asset } = await sb.from('user_assets').select('id, name')
    .eq('id', assetId).eq('phone_number', phone).maybeSingle();
  if (!asset) return { ok: false };

  const { data: splits } = await sb.from('split_bills').select('id, participants')
    // Must be a JSON string: postgrest-js turns a JS array into a Postgres
    // array literal ({a,b}), which is wrong for a jsonb containment check.
    .eq('phone_number', phone).contains('participants', JSON.stringify([{ asset_id: assetId }]));
  for (const s of splits || []) {
    const parts = (s.participants || []).map((p: SplitParticipant) => {
      if (p.asset_id !== assetId) return p;
      return { ...p, paid: true };
    });
    const remId = (s.participants || []).find((p: SplitParticipant) => p.asset_id === assetId)?.reminder_id;
    if (remId) await sb.from('user_reminders').update({ active: false }).eq('id', remId).eq('phone_number', phone);
    await sb.from('split_bills').update({ participants: parts }).eq('id', s.id);
  }

  // WhatsApp-created piutang: deactivate the matching "tagih" reminder by name.
  const m = /^Piutang (.+) \((.+)\)$/.exec(asset.name || '');
  if (m) {
    await sb.from('user_reminders').update({ active: false })
      .eq('phone_number', phone).eq('name', `Tagih piutang ${m[1]} — ${m[2]}`);
  }

  await sb.from('user_assets').delete().eq('id', assetId).eq('phone_number', phone);
  return { ok: true };
}
