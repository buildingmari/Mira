/**
 * Item lines of one transaction (receipt rows), stored in
 * expenses.items_detail as a JSON string:
 *   [{ "item": "Mineral", "qty": 2, "unit_price": 10000, "subtotal": 20000 }]
 * That's the shape the WhatsApp flow (n8n) and chat-send already write;
 * the dashboard reads and edits the same thing.
 */
export interface ItemLine {
  item: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Lenient: accepts the JSON string or an array, and older key names. */
export function parseItems(raw: unknown): ItemLine[] {
  let list: unknown = raw;
  if (typeof raw === 'string') {
    try { list = JSON.parse(raw); } catch { return []; }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((r: any) => {
      const qty = num(r?.qty ?? r?.quantity) || 1;
      const unit = num(r?.unit_price ?? r?.price);
      const subtotal = num(r?.subtotal) || Math.round(unit * qty);
      return {
        item: String(r?.item ?? r?.name ?? '').trim(),
        qty,
        unit_price: unit || (qty ? Math.round(subtotal / qty) : subtotal),
        subtotal,
      };
    })
    .filter((r) => r.item || r.subtotal > 0);
}

export const itemsTotal = (lines: ItemLine[]) => lines.reduce((s, l) => s + num(l.subtotal), 0);

/** For saving: drops empty rows, recomputes subtotals; null when nothing is left. */
export function serializeItems(lines: ItemLine[]): string | null {
  const clean = lines
    .map((l) => {
      const qty = num(l.qty) > 0 ? num(l.qty) : 1;
      const unit = Math.max(0, num(l.unit_price));
      return { item: l.item.trim(), qty, unit_price: unit, subtotal: Math.round(unit * qty) };
    })
    .filter((l) => l.item && l.subtotal > 0);
  return clean.length ? JSON.stringify(clean) : null;
}
