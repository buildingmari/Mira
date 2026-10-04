/**
 * Transaksi — every recorded transaction, by month.
 *   Daftar:   grouped per day, newest first (search looks across all months)
 *   Kalender: month grid with daily totals; tap a day for its transactions
 * Tapping a transaction opens a sheet with its details — receipt items
 * (expenses.items_detail) included — and Edit / Hapus.
 * All rows are loaded once and filtered here; a user has hundreds, not millions.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { CATEGORY_ICON, normalizeCategory } from '../../lib/category';
import { MiraIcon } from '../../components/icons/MiraIcon';
import { isReadOnlyError, openRenewSheet, requireActive } from '../../lib/subscription';
import { itemsTotal, parseItems, serializeItems, type ItemLine } from '../../lib/items';
import { X, Search, SlidersHorizontal, ChevronLeft, ChevronRight, List, CalendarDays, Pencil, Trash2, Plus, Check } from 'lucide-react';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const H = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };
const COLS = 'id,amount,category,wallet,date,created_at,item,merchant,transaction_type,items_detail,quantity';

const fmt = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');
/** Calendar cells: 125000 → 125rb, 1500000 → 1,5jt. */
const short = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e9) return (a / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'M';
  if (a >= 1e6) return (a / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'jt';
  if (a >= 1e3) return Math.round(a / 1e3) + 'rb';
  return String(Math.round(a));
};
/** Summary cards: full amount, or "Rp7,04jt" on narrow phones (CSS picks one). */
function Money({ n, sign = '' }: { n: number; sign?: string }) {
  const a = Math.abs(n);
  const compact = a >= 1e6 ? 'Rp' + (a / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + 'jt' : fmt(a);
  return <><span className="tx-full">{sign}{fmt(a)}</span><span className="tx-compact">{sign}{compact}</span></>;
}
const digits = (v: string) => Number(v.replace(/\D/g, '')) || 0;
const fmtInput = (n: number) => (n ? n.toLocaleString('id-ID') : '');

const CAT_COLOR: Record<string, string> = {
  Makanan: '#2563EB', Transport: '#10B981', Belanja: '#8B5CF6',
  Tagihan: '#F59E0B', Kesehatan: '#EF4444', Hiburan: '#EC4899',
  Pemasukan: '#16A34A', Investasi: '#0891B2', Others: '#6B7280',
};
const CATEGORIES = ['Makanan', 'Transport', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Pemasukan', 'Investasi', 'Others'];
const CAT_LABEL: Record<string, string> = { Others: 'Lainnya' };
// Stored values — same as AddTransactionModal's CAT_TO_DB.
const CAT_TO_DB: Record<string, string> = {
  Makanan: 'food', Transport: 'transport', Belanja: 'shopping', Tagihan: 'bills', Kesehatan: 'health',
  Hiburan: 'entertainment', Pemasukan: 'income', Investasi: 'Savings & Investment', Others: 'others',
};
const DEFAULT_WALLETS = ['Cash', 'BCA', 'BRI', 'Mandiri', 'BNI', 'GoPay', 'OVO', 'DANA', 'ShopeePay'];
const DOW = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const mapCat = (c: string) => normalizeCategory(c, 'Others');
const catLabel = (c: string) => CAT_LABEL[c] || c;

type Txn = Record<string, any>;
const isIncome = (t: Txn) => String(t.transaction_type || '').toLowerCase() === 'income' || mapCat(t.category || '') === 'Pemasukan';
const dayOf = (t: Txn) => String(t.date || t.created_at || '').slice(0, 10);
const titleOf = (t: Txn) => t.merchant || t.item || catLabel(mapCat(t.category || ''));

/** Today in WIB, as YYYY-MM-DD. */
const todayWIB = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const ymd = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const parseDay = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };

function dayLabel(day: string): string {
  const today = todayWIB();
  const yest = new Date(parseDay(today).getTime() - 86400000);
  if (day === today) return 'Hari ini';
  if (day === ymd(yest.getFullYear(), yest.getMonth(), yest.getDate())) return 'Kemarin';
  const d = parseDay(day);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'short',
    ...(d.getFullYear() !== parseDay(today).getFullYear() ? { year: 'numeric' } : {}),
  });
}
const longDate = (day: string) =>
  parseDay(day).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const CSS = `
  .tx-page { padding: 24px 32px 48px; max-width: 920px; margin: 0 auto; font-family: 'DM Sans', sans-serif; color: #111827; }
  .tx-top { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .tx-seg { display: inline-flex; background: #EEF1F6; border-radius: 12px; padding: 3px; gap: 2px; }
  .tx-seg button { border: 0; background: transparent; border-radius: 9px; padding: 7px 12px; font: 600 13px 'DM Sans', sans-serif;
    color: #6B7280; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
  .tx-seg button.on { background: #fff; color: #111827; box-shadow: 0 1px 3px rgba(15,23,42,.12); }
  .tx-month { display: inline-flex; align-items: center; gap: 2px; margin-left: auto; }
  .tx-month-lbl { font: 700 15px 'Sora', sans-serif; min-width: 128px; text-align: center; }
  .tx-icon-btn { width: 34px; height: 34px; border-radius: 10px; border: 0; background: transparent; color: #374151; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; }
  .tx-icon-btn:hover { background: #EEF1F6; }
  .tx-today-btn { border: 1px solid #DBEAFE; background: #EFF6FF; color: #1D4ED8; border-radius: 999px; padding: 4px 10px;
    font: 600 12px 'DM Sans', sans-serif; cursor: pointer; margin-left: 4px; }

  .tx-sum { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
  .tx-sum-card { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 14px; padding: 12px 14px; min-width: 0; }
  .tx-sum-lbl { font-size: 12px; color: #6B7280; }
  .tx-sum-val { font: 700 16px 'Sora', sans-serif; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tx-compact { display: none; }
  @media (max-width: 560px) { .tx-full { display: none; } .tx-compact { display: inline; } }

  .tx-tools { display: flex; gap: 8px; margin-bottom: 10px; }
  .tx-search { flex: 1; min-width: 0; position: relative; }
  .tx-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9CA3AF; pointer-events: none; }
  .tx-search input { width: 100%; height: 42px; box-sizing: border-box; border: 1px solid rgba(0,0,0,.1); border-radius: 12px;
    padding: 0 36px 0 36px; font: 16px 'DM Sans', sans-serif; background: #fff; color: #111827; outline: none; }
  .tx-search input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,.08); }
  .tx-search .tx-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); }
  .tx-filter-btn { height: 42px; border-radius: 12px; border: 1px solid rgba(0,0,0,.1); background: #fff; padding: 0 14px; cursor: pointer;
    display: inline-flex; align-items: center; gap: 6px; font: 600 13px 'DM Sans', sans-serif; color: #374151; white-space: nowrap; }
  .tx-filter-btn.on { border-color: #BFDBFE; background: #EFF6FF; color: #1D4ED8; }
  .tx-filters { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 14px; padding: 12px 14px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px; }
  .tx-f-lbl { font-size: 11.5px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px; }
  .tx-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .tx-chip { display: inline-flex; align-items: center; gap: 5px; border: 1.5px solid rgba(0,0,0,.1); background: #F8F9FB; color: #374151;
    border-radius: 999px; padding: 4px 11px; font: 500 12.5px 'DM Sans', sans-serif; cursor: pointer; }
  .tx-chip.icon { padding-left: 4px; }
  .tx-chip.on { border-color: #2563EB; background: #EFF6FF; color: #1D4ED8; }
  .tx-note { font-size: 12.5px; color: #6B7280; margin: 2px 2px 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .tx-link { border: 0; background: none; color: #2563EB; font: 600 12.5px 'DM Sans', sans-serif; cursor: pointer; padding: 0; }

  .tx-day { margin-bottom: 14px; }
  .tx-day-hd { display: flex; justify-content: space-between; align-items: baseline; padding: 0 4px 6px; font-size: 13px; font-weight: 600; color: #374151; }
  .tx-day-hd span:last-child { font-weight: 600; color: #6B7280; font-size: 12.5px; }
  .tx-card { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 16px; overflow: hidden; }
  .tx-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border: 0; background: transparent; text-align: left;
    cursor: pointer; font-family: inherit; color: inherit; border-bottom: 1px solid rgba(0,0,0,.05); -webkit-tap-highlight-color: transparent; }
  .tx-row:last-child { border-bottom: 0; }
  .tx-row:hover { background: #F8F9FB; }
  .tx-row:active { background: #F1F4F8; }
  .tx-row-main { flex: 1; min-width: 0; }
  .tx-row-title { font-size: 14.5px; font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tx-row-sub { font-size: 12.5px; color: #6B7280; margin-top: 2px; display: flex; align-items: center; gap: 6px; min-width: 0; }
  .tx-row-sub > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tx-pill { flex-shrink: 0; font-size: 11px; font-weight: 600; color: #4338CA; background: #EEF2FF; border-radius: 999px; padding: 1px 7px; }
  .tx-amt { font: 700 14.5px 'Sora', sans-serif; white-space: nowrap; text-align: right; color: #111827; }
  .tx-amt.in { color: #16A34A; }
  .tx-row-acts { display: none; gap: 2px; }
  @media (hover: hover) and (min-width: 901px) {
    .tx-row:hover .tx-row-acts { display: inline-flex; }
    .tx-row:hover .tx-chev { display: none; }
  }
  .tx-act { width: 30px; height: 30px; border-radius: 8px; border: 0; background: transparent; color: #9CA3AF; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; }
  .tx-act:hover { background: #EFF6FF; color: #2563EB; }
  .tx-act.del:hover { background: #FEF2F2; color: #DC2626; }
  .tx-chev { color: #CBD5E1; flex-shrink: 0; }
  .tx-empty { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 16px; padding: 36px 20px; text-align: center; color: #6B7280; font-size: 14px; }
  .tx-empty .tx-empty-ic { display: flex; justify-content: center; margin-bottom: 10px; }

  /* Calendar */
  .tx-cal { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 16px; padding: 10px; margin-bottom: 14px; }
  .tx-cal-dow, .tx-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
  .tx-cal-dow div { text-align: center; font-size: 11.5px; font-weight: 600; color: #9CA3AF; padding: 4px 0 6px; }
  .tx-cal-day { position: relative; min-height: 66px; border: 0; border-radius: 10px; cursor: pointer; padding: 5px 2px 4px;
    display: flex; flex-direction: column; align-items: center; gap: 1px; font-family: inherit; color: #111827;
    background: rgba(37,99,235, var(--heat, 0)); -webkit-tap-highlight-color: transparent; }
  .tx-cal-day:hover { box-shadow: inset 0 0 0 1.5px #BFDBFE; }
  .tx-cal-day.blank { background: transparent; cursor: default; box-shadow: none; }
  .tx-cal-num { font-size: 13px; font-weight: 600; line-height: 1.2; }
  .tx-cal-day.today .tx-cal-num { color: #fff; background: #2563EB; border-radius: 999px; min-width: 22px; padding: 0 4px; }
  .tx-cal-day.sel { box-shadow: inset 0 0 0 2px #2563EB; }
  .tx-cal-out { font-size: 10px; font-weight: 600; color: #374151; line-height: 1.15; }
  .tx-cal-in { font-size: 10px; font-weight: 700; color: #16A34A; line-height: 1.15; }
  .tx-cal-legend { display: flex; justify-content: space-between; gap: 8px; font-size: 11.5px; color: #9CA3AF; padding: 8px 4px 2px; flex-wrap: wrap; }

  /* Detail / edit sheet */
  .tx-ov { position: fixed; inset: 0; z-index: 600; background: rgba(15,23,42,.45); display: flex; align-items: flex-end; justify-content: center;
    animation: tx-fade .15s ease-out; }
  @media (min-width: 640px) { .tx-ov { align-items: center; padding: 20px; } }
  @keyframes tx-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes tx-up { from { transform: translateY(24px); opacity: .6; } to { transform: none; opacity: 1; } }
  .tx-sheet { width: 100%; max-width: 480px; max-height: 92vh; max-height: 92dvh; overflow-y: auto; overscroll-behavior: contain;
    background: #fff; border-radius: 22px 22px 0 0; box-sizing: border-box; font-family: 'DM Sans', sans-serif; color: #111827;
    padding: 0 20px calc(18px + env(safe-area-inset-bottom,0px)); animation: tx-up .2s ease-out; }
  @media (min-width: 640px) { .tx-sheet { border-radius: 20px; padding-bottom: 20px; } }
  .tx-handle { width: 38px; height: 4px; border-radius: 99px; background: #E5E7EB; margin: 10px auto 4px; }
  @media (min-width: 640px) { .tx-handle { display: none; } }
  .tx-sheet-hd { position: sticky; top: 0; background: inherit; display: flex; align-items: center; justify-content: space-between;
    padding: 8px 0 10px; z-index: 1; }
  .tx-sheet-hd h3 { margin: 0; font: 700 16px 'Sora', sans-serif; }
  .tx-hero { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; padding: 4px 0 14px; }
  .tx-hero-amt { font: 800 28px 'Sora', sans-serif; letter-spacing: -.02em; }
  .tx-hero-amt.in { color: #16A34A; }
  .tx-hero-title { font-size: 15px; font-weight: 600; color: #374151; max-width: 100%; overflow-wrap: anywhere; }
  .tx-cat-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; border-radius: 999px; padding: 3px 10px 3px 4px; }
  .tx-info { background: #F8FAFC; border-radius: 14px; padding: 4px 14px; margin-bottom: 14px; }
  .tx-info-row { display: flex; justify-content: space-between; gap: 14px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,.05); font-size: 13.5px; }
  .tx-info-row:last-child { border-bottom: 0; }
  .tx-info-row span:first-child { color: #6B7280; flex-shrink: 0; }
  .tx-info-row span:last-child { font-weight: 600; text-align: right; overflow-wrap: anywhere; }
  .tx-items { border: 1px solid rgba(0,0,0,.07); border-radius: 14px; overflow: hidden; margin-bottom: 14px; }
  .tx-items-hd { display: flex; justify-content: space-between; padding: 10px 14px; background: #F8FAFC; font-size: 12.5px; font-weight: 700; color: #374151; }
  .tx-item { display: flex; gap: 10px; padding: 9px 14px; border-top: 1px solid rgba(0,0,0,.05); font-size: 13.5px; }
  .tx-item-main { flex: 1; min-width: 0; }
  .tx-item-name { font-weight: 600; overflow-wrap: anywhere; }
  .tx-item-calc { font-size: 12px; color: #6B7280; margin-top: 1px; }
  .tx-item-sub { font-weight: 700; white-space: nowrap; }
  .tx-items-ft { display: flex; justify-content: space-between; padding: 9px 14px; border-top: 1px solid rgba(0,0,0,.07); font-size: 12.5px; color: #6B7280; }
  .tx-btns { display: flex; gap: 10px; }
  .tx-btn { flex: 1; height: 46px; border-radius: 13px; border: 0; cursor: pointer; font: 700 14.5px 'DM Sans', sans-serif;
    display: inline-flex; align-items: center; justify-content: center; gap: 7px; }
  .tx-btn.primary { background: #2563EB; color: #fff; }
  .tx-btn.primary:disabled { background: #93C5FD; cursor: not-allowed; }
  .tx-btn.ghost { background: #F1F5F9; color: #334155; }
  .tx-btn.danger { background: #FEF2F2; color: #DC2626; }
  .tx-btn.danger-solid { background: #DC2626; color: #fff; }
  .tx-confirm { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 14px; padding: 12px 14px; margin-bottom: 10px; font-size: 13.5px; color: #7F1D1D; line-height: 1.5; }
  .tx-err { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 12px; padding: 9px 12px; font-size: 13px; margin-bottom: 10px; }

  /* Edit form */
  .tx-field { margin-bottom: 12px; }
  .tx-label { display: block; font-size: 12px; font-weight: 700; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .04em; }
  .tx-input { width: 100%; height: 44px; box-sizing: border-box; border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 0 12px;
    font: 16px 'DM Sans', sans-serif; color: #111827; background: #FAFBFF; outline: none; }
  .tx-input:focus { border-color: #2563EB; background: #fff; }
  .tx-amount { display: flex; align-items: center; border: 1.5px solid #E5E7EB; border-radius: 14px; background: #FAFBFF; padding: 0 14px; }
  .tx-amount:focus-within { border-color: #2563EB; background: #fff; }
  .tx-amount span { font: 700 18px 'Sora', sans-serif; color: #9CA3AF; margin-right: 6px; }
  .tx-amount input { flex: 1; min-width: 0; height: 54px; border: 0; background: transparent; outline: none; font: 800 24px 'Sora', sans-serif; color: #111827; }
  .tx-type { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #F1F5F9; border-radius: 12px; padding: 3px; margin-bottom: 12px; }
  .tx-type button { height: 38px; border: 0; border-radius: 10px; background: transparent; font: 700 13.5px 'DM Sans', sans-serif; color: #64748B; cursor: pointer; }
  .tx-type button.on.out { background: #fff; color: #111827; box-shadow: 0 1px 3px rgba(15,23,42,.12); }
  .tx-type button.on.in { background: #fff; color: #16A34A; box-shadow: 0 1px 3px rgba(15,23,42,.12); }
  .tx-cats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .tx-cat { border: 1.5px solid #E5E7EB; background: #fff; border-radius: 12px; padding: 7px 2px 6px; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 3px; font: 600 11.5px 'DM Sans', sans-serif; color: #374151; }
  .tx-cat.on { border-color: #2563EB; background: #EFF6FF; color: #1D4ED8; }
  .tx-two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .tx-ed-item { display: grid; grid-template-columns: 1fr 52px 96px 28px; gap: 6px; align-items: center; margin-bottom: 6px; }
  .tx-ed-item .tx-input { height: 40px; padding: 0 9px; font-size: 15px; }
  .tx-ed-cols { margin-bottom: 2px; font-size: 11px; color: #9CA3AF; font-weight: 600; }
  .tx-ed-sum { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12.5px; color: #6B7280; margin-top: 4px; flex-wrap: wrap; }
  .tx-add-item { border: 1.5px dashed #CBD5E1; background: transparent; border-radius: 12px; height: 38px; width: 100%; cursor: pointer;
    font: 600 13px 'DM Sans', sans-serif; color: #475569; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }

  .tx-toast { position: fixed; left: 50%; transform: translateX(-50%); z-index: 700; background: #0F172A; color: #fff; border-radius: 12px;
    padding: 10px 16px; font-size: 13.5px; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(15,23,42,.3);
    bottom: calc(var(--mira-tabbar-h, 62px) + env(safe-area-inset-bottom,0px) + 16px); animation: tx-up .2s ease-out; }
  @media (min-width: 901px) { .tx-toast { bottom: 28px; } }

  @media (max-width: 900px) {
    .tx-page { padding: 14px 12px 28px; }
    .tx-month { margin-left: 0; flex: 1; justify-content: flex-end; }
    .tx-month-lbl { min-width: 0; font-size: 14px; }
  }
  @media (max-width: 600px) {
    .tx-cal-day { min-height: 0; aspect-ratio: 1 / 1.12; }
  }
  @media (max-width: 420px) {
    .tx-seg button { padding: 7px 9px; }
    .tx-seg button .tx-seg-txt { display: none; }
    .tx-sum { gap: 6px; }
    .tx-sum-card { padding: 10px; border-radius: 12px; }
    .tx-sum-val { font-size: 13.5px; }
    .tx-sum-lbl { font-size: 11px; }
    .tx-cal { padding: 6px; }
    .tx-cal-dow, .tx-cal-grid { gap: 2px; }
    .tx-cal-out, .tx-cal-in { font-size: 9px; }
    .tx-ed-item { grid-template-columns: 1fr 44px 84px 26px; gap: 4px; }
  }

  /* Dark */
  .dark .tx-page { color: #F1F5F9; }
  .dark .tx-seg { background: #1E293B; }
  .dark .tx-seg button { color: #94A3B8; }
  .dark .tx-seg button.on { background: #334155; color: #F1F5F9; }
  .dark .tx-icon-btn { color: #CBD5E1; }
  .dark .tx-icon-btn:hover { background: #1E293B; }
  .dark .tx-today-btn { background: rgba(37,99,235,.15); border-color: rgba(96,165,250,.3); color: #93C5FD; }
  .dark .tx-sum-card, .dark .tx-card, .dark .tx-filters, .dark .tx-cal, .dark .tx-empty { background: #1E293B; border-color: rgba(255,255,255,.08); }
  .dark .tx-sum-lbl, .dark .tx-row-sub, .dark .tx-day-hd span:last-child, .dark .tx-note, .dark .tx-empty { color: #94A3B8; }
  .dark .tx-day-hd { color: #CBD5E1; }
  .dark .tx-search input, .dark .tx-filter-btn { background: #1E293B; border-color: rgba(255,255,255,.1); color: #F1F5F9; }
  .dark .tx-filter-btn.on { background: rgba(37,99,235,.18); color: #93C5FD; border-color: rgba(96,165,250,.35); }
  .dark .tx-chip { background: #0F172A; border-color: rgba(255,255,255,.1); color: #CBD5E1; }
  .dark .tx-chip.on { background: rgba(37,99,235,.18); border-color: #3B82F6; color: #93C5FD; }
  .dark .tx-row { border-bottom-color: rgba(255,255,255,.06); }
  .dark .tx-row:hover, .dark .tx-row:active { background: rgba(255,255,255,.04); }
  .dark .tx-row-title, .dark .tx-amt { color: #F1F5F9; }
  .dark .tx-amt.in { color: #4ADE80; }
  .dark .tx-pill { background: rgba(99,102,241,.2); color: #C7D2FE; }
  .dark .tx-chev { color: #475569; }
  .dark .tx-cal-day { color: #E2E8F0; background: rgba(59,130,246, var(--heat, 0)); }
  .dark .tx-cal-day.blank { background: transparent; }
  .dark .tx-cal-out { color: #CBD5E1; }
  .dark .tx-cal-in { color: #4ADE80; }
  .dark .tx-sheet { background: #1E293B; color: #F1F5F9; }
  .dark .tx-handle { background: #475569; }
  .dark .tx-hero-title { color: #CBD5E1; }
  .dark .tx-info, .dark .tx-items-hd { background: #0F172A; }
  .dark .tx-info-row, .dark .tx-item, .dark .tx-items-ft { border-color: rgba(255,255,255,.06); }
  .dark .tx-items { border-color: rgba(255,255,255,.08); }
  .dark .tx-items-hd { color: #CBD5E1; }
  .dark .tx-btn.ghost { background: #334155; color: #E2E8F0; }
  .dark .tx-btn.danger { background: rgba(220,38,38,.15); color: #FCA5A5; }
  .dark .tx-confirm { background: rgba(220,38,38,.12); border-color: rgba(248,113,113,.3); color: #FECACA; }
  .dark .tx-input, .dark .tx-amount { background: #0F172A; border-color: rgba(255,255,255,.12); color: #F1F5F9; }
  .dark .tx-amount input { color: #F1F5F9; }
  .dark .tx-input { color-scheme: dark; }
  .dark .tx-type { background: #0F172A; }
  .dark .tx-type button.on.out, .dark .tx-type button.on.in { background: #334155; }
  .dark .tx-type button.on.out { color: #F1F5F9; }
  .dark .tx-cat { background: #0F172A; border-color: rgba(255,255,255,.1); color: #CBD5E1; }
  .dark .tx-cat.on { background: rgba(37,99,235,.18); border-color: #3B82F6; color: #93C5FD; }
`;

/* ─────────────────────────────── Row ─────────────────────────────── */

function TxRow({ t, onOpen, onEdit, onDelete }: { t: Txn; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const cat = mapCat(t.category || '');
  const inc = isIncome(t);
  const title = titleOf(t);
  const items = parseItems(t.items_detail);
  const sub = [
    t.item && t.item !== title ? t.item : catLabel(cat),
    t.wallet,
  ].filter(Boolean).join(' · ');
  return (
    <div role="button" tabIndex={0} className="tx-row" onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <MiraIcon name={CATEGORY_ICON[cat] || 'sparkle'} size={40} />
      <div className="tx-row-main">
        <div className="tx-row-title">{title}</div>
        <div className="tx-row-sub">
          <span>{sub}</span>
          {items.length > 1 && <span className="tx-pill">{items.length} item</span>}
        </div>
      </div>
      <div className={`tx-amt${inc ? ' in' : ''}`}>{inc ? '+' : '−'}{fmt(Number(t.amount || 0))}</div>
      <span className="tx-row-acts">
        <button className="tx-act" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(); }}><Pencil size={15} /></button>
        <button className="tx-act del" title="Hapus" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 size={15} /></button>
      </span>
      <ChevronRight size={18} className="tx-chev" />
    </div>
  );
}

/* ─────────────────────────── Detail sheet ─────────────────────────── */

interface Draft {
  type: 'expense' | 'income';
  amount: number;
  category: string;
  merchant: string;
  item: string;
  date: string;
  wallet: string;
  items: ItemLine[];
}

const draftOf = (t: Txn): Draft => ({
  type: isIncome(t) ? 'income' : 'expense',
  amount: Math.round(Number(t.amount || 0)),
  category: mapCat(t.category || ''),
  merchant: t.merchant || '',
  item: t.item || '',
  date: dayOf(t) || todayWIB(),
  wallet: t.wallet || '',
  items: parseItems(t.items_detail),
});

type SheetMode = 'view' | 'edit' | 'delete';

function TxSheet({ txn, startMode, wallets, onClose, onSaved, onDeleted }: {
  txn: Txn; startMode: SheetMode; wallets: string[];
  onClose: () => void; onSaved: (t: Txn) => void; onDeleted: (id: string) => void;
}) {
  const [mode, setMode] = useState<SheetMode>(startMode);
  const [d, setD] = useState<Draft>(() => draftOf(txn));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => { sheetRef.current?.scrollTo({ top: 0 }); }, [mode]);

  const cat = mapCat(txn.category || '');
  const inc = isIncome(txn);
  const items = parseItems(txn.items_detail);
  const itemsSum = itemsTotal(items);
  const amount = Number(txn.amount || 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  const startEdit = () => { if (requireActive('Ubah transaksi butuh langganan aktif.')) { setD(draftOf(txn)); setErr(''); setMode('edit'); } };
  const startDelete = () => { if (requireActive('Hapus transaksi butuh langganan aktif.')) { setErr(''); setMode('delete'); } };

  const fail = (e: any, fallback: string) => {
    if (isReadOnlyError(e?.message)) { onClose(); openRenewSheet('Langganan kamu baru saja berakhir.'); return; }
    setErr(e?.message && e.message.length < 140 ? e.message : fallback);
  };

  const save = async () => {
    if (d.amount <= 0) { setErr('Nominalnya belum diisi.'); return; }
    if (!d.date) { setErr('Tanggalnya belum diisi.'); return; }
    const orig = draftOf(txn);
    const category = d.type === 'income' ? 'Pemasukan' : d.category === 'Pemasukan' ? 'Others' : d.category;
    const itemsJson = serializeItems(d.items);
    // Only what changed — untouched legacy values (e.g. old category names) stay as they were.
    const patch: Record<string, unknown> = {};
    if (d.amount !== orig.amount) patch.amount = d.amount;
    if (d.type !== orig.type) patch.transaction_type = d.type;
    if (category !== orig.category) patch.category = CAT_TO_DB[category] || category;
    if (d.merchant.trim() !== orig.merchant) patch.merchant = d.merchant.trim() || null;
    if (d.item.trim() !== orig.item) patch.item = d.item.trim() || null;
    if (d.date !== orig.date) patch.date = d.date;
    if (d.wallet.trim() !== orig.wallet) patch.wallet = d.wallet.trim() || null;
    if (itemsJson !== serializeItems(orig.items)) patch.items_detail = itemsJson;
    if (!Object.keys(patch).length) { setMode('view'); return; }

    setBusy(true); setErr('');
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/expenses?id=eq.${txn.id}`, {
        method: 'PATCH',
        headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error((await r.text().catch(() => '')) || 'Gagal menyimpan');
      const rows = await r.json().catch(() => []);
      onSaved(Array.isArray(rows) && rows[0] ? rows[0] : { ...txn, ...patch });
      setMode('view');
    } catch (e: any) {
      fail(e, 'Gagal menyimpan. Coba lagi ya.');
    }
    setBusy(false);
  };

  const remove = async () => {
    setBusy(true); setErr('');
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/expenses?id=eq.${txn.id}`, { method: 'DELETE', headers: H });
      if (!r.ok) throw new Error((await r.text().catch(() => '')) || 'Gagal menghapus');
      onDeleted(txn.id);
    } catch (e: any) {
      fail(e, 'Gagal menghapus. Coba lagi ya.');
      setBusy(false);
    }
  };

  const setItem = (i: number, patch: Partial<ItemLine>) =>
    setD((x) => ({ ...x, items: x.items.map((l, j) => (j === i ? { ...l, ...patch, subtotal: Math.round((patch.unit_price ?? l.unit_price) * (patch.qty ?? l.qty)) } : l)) }));
  const draftItemsSum = itemsTotal(d.items.map((l) => ({ ...l, subtotal: Math.round(l.unit_price * (l.qty || 1)) })));
  const walletOptions = [...new Set([...wallets, ...DEFAULT_WALLETS])];

  return (
    <div className="tx-ov" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="tx-sheet" role="dialog" aria-label="Detail transaksi" ref={sheetRef}>
        <div className="tx-handle" />
        <div className="tx-sheet-hd">
          <h3>{mode === 'edit' ? 'Edit transaksi' : 'Detail transaksi'}</h3>
          <button className="tx-icon-btn" onClick={onClose} aria-label="Tutup" disabled={busy}><X size={18} /></button>
        </div>

        {mode !== 'edit' ? (
          <>
            <div className="tx-hero">
              <MiraIcon name={CATEGORY_ICON[cat] || 'sparkle'} size={52} />
              <div className={`tx-hero-amt${inc ? ' in' : ''}`}>{inc ? '+' : '−'}{fmt(amount)}</div>
              <div className="tx-hero-title">{titleOf(txn)}</div>
              <span className="tx-cat-chip" style={{ background: `${CAT_COLOR[cat] || '#6B7280'}18`, color: CAT_COLOR[cat] || '#6B7280' }}>
                <MiraIcon name={CATEGORY_ICON[cat] || 'sparkle'} size={20} tile={false} />{catLabel(cat)}
              </span>
            </div>

            <div className="tx-info">
              <div className="tx-info-row"><span>Tanggal</span><span>{longDate(dayOf(txn))}</span></div>
              <div className="tx-info-row"><span>Jenis</span><span>{inc ? 'Pemasukan' : 'Pengeluaran'}</span></div>
              {txn.wallet && <div className="tx-info-row"><span>Wallet</span><span>{txn.wallet}</span></div>}
              {txn.merchant && <div className="tx-info-row"><span>Merchant</span><span>{txn.merchant}</span></div>}
              {txn.item && txn.item !== txn.merchant && <div className="tx-info-row"><span>Keterangan</span><span>{txn.item}</span></div>}
            </div>

            {items.length > 0 && (
              <div className="tx-items">
                <div className="tx-items-hd"><span>Rincian item</span><span>{items.length} item</span></div>
                {items.map((l, i) => (
                  <div className="tx-item" key={i}>
                    <div className="tx-item-main">
                      <div className="tx-item-name">{l.item || 'Item'}</div>
                      <div className="tx-item-calc">{l.qty.toLocaleString('id-ID')} × {fmt(l.unit_price)}</div>
                    </div>
                    <div className="tx-item-sub">{fmt(l.subtotal)}</div>
                  </div>
                ))}
                <div className="tx-items-ft">
                  <span>Total rincian</span>
                  <span>{fmt(itemsSum)}{Math.round(itemsSum) !== Math.round(amount) ? ` · selisih ${fmt(amount - itemsSum)}` : ''}</span>
                </div>
              </div>
            )}

            {err && <div className="tx-err">{err}</div>}
            {mode === 'delete' ? (
              <>
                <div className="tx-confirm"><strong>Hapus transaksi ini?</strong> {titleOf(txn)} · {fmt(amount)} akan dihapus permanen.</div>
                <div className="tx-btns">
                  <button className="tx-btn ghost" onClick={() => setMode('view')} disabled={busy}>Batal</button>
                  <button className="tx-btn danger-solid" onClick={() => void remove()} disabled={busy}>{busy ? 'Menghapus…' : 'Ya, hapus'}</button>
                </div>
              </>
            ) : (
              <div className="tx-btns">
                <button className="tx-btn danger" onClick={startDelete}><Trash2 size={17} />Hapus</button>
                <button className="tx-btn primary" onClick={startEdit}><Pencil size={17} />Edit</button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="tx-type">
              <button className={`out${d.type === 'expense' ? ' on' : ''}`} onClick={() => setD((x) => ({ ...x, type: 'expense', category: x.category === 'Pemasukan' ? 'Others' : x.category }))}>Pengeluaran</button>
              <button className={`in${d.type === 'income' ? ' on' : ''}`} onClick={() => setD((x) => ({ ...x, type: 'income', category: 'Pemasukan' }))}>Pemasukan</button>
            </div>

            <div className="tx-field">
              <span className="tx-label">Nominal</span>
              <div className="tx-amount">
                <span>Rp</span>
                <input inputMode="numeric" placeholder="0" value={fmtInput(d.amount)} onChange={(e) => setD((x) => ({ ...x, amount: digits(e.target.value) }))} />
              </div>
            </div>

            {d.type === 'expense' && (
              <div className="tx-field">
                <span className="tx-label">Kategori</span>
                <div className="tx-cats">
                  {CATEGORIES.filter((c) => c !== 'Pemasukan').map((c) => (
                    <button key={c} className={`tx-cat${d.category === c ? ' on' : ''}`} onClick={() => setD((x) => ({ ...x, category: c }))}>
                      <MiraIcon name={CATEGORY_ICON[c] || 'sparkle'} size={26} />{catLabel(c)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="tx-field">
              <span className="tx-label">Merchant / toko</span>
              <input className="tx-input" placeholder="Misal: Indomaret" value={d.merchant} onChange={(e) => setD((x) => ({ ...x, merchant: e.target.value }))} />
            </div>
            <div className="tx-field">
              <span className="tx-label">Keterangan</span>
              <input className="tx-input" placeholder="Misal: Belanja bulanan" value={d.item} onChange={(e) => setD((x) => ({ ...x, item: e.target.value }))} />
            </div>
            <div className="tx-two tx-field">
              <div>
                <span className="tx-label">Tanggal</span>
                <input className="tx-input" type="date" value={d.date} onChange={(e) => setD((x) => ({ ...x, date: e.target.value }))} />
              </div>
              <div>
                <span className="tx-label">Wallet</span>
                <input className="tx-input" list="tx-wallets" placeholder="Cash" value={d.wallet} onChange={(e) => setD((x) => ({ ...x, wallet: e.target.value }))} />
                <datalist id="tx-wallets">{walletOptions.map((w) => <option key={w} value={w} />)}</datalist>
              </div>
            </div>

            <div className="tx-field">
              <span className="tx-label">Rincian item (opsional)</span>
              {d.items.length > 0 && (
                <div className="tx-ed-item tx-ed-cols"><span>Nama item</span><span>Qty</span><span>Harga satuan</span><span /></div>
              )}
              {d.items.map((l, i) => (
                <div className="tx-ed-item" key={i}>
                  <input className="tx-input" placeholder="Nama item" value={l.item} onChange={(e) => setItem(i, { item: e.target.value })} />
                  <input className="tx-input" inputMode="numeric" aria-label="Jumlah" value={l.qty || ''} onChange={(e) => setItem(i, { qty: digits(e.target.value) })} />
                  <input className="tx-input" inputMode="numeric" aria-label="Harga satuan" placeholder="Harga" value={fmtInput(l.unit_price)} onChange={(e) => setItem(i, { unit_price: digits(e.target.value) })} />
                  <button className="tx-act del" aria-label="Hapus item" onClick={() => setD((x) => ({ ...x, items: x.items.filter((_, j) => j !== i) }))}><X size={15} /></button>
                </div>
              ))}
              <button className="tx-add-item" onClick={() => setD((x) => ({ ...x, items: [...x.items, { item: '', qty: 1, unit_price: 0, subtotal: 0 }] }))}>
                <Plus size={15} />Tambah item
              </button>
              {d.items.length > 0 && (
                <div className="tx-ed-sum">
                  <span>Total rincian {fmt(draftItemsSum)}</span>
                  {draftItemsSum > 0 && draftItemsSum !== d.amount && (
                    <button className="tx-link" onClick={() => setD((x) => ({ ...x, amount: draftItemsSum }))}>Jadikan nominal</button>
                  )}
                </div>
              )}
            </div>

            {err && <div className="tx-err">{err}</div>}
            <div className="tx-btns">
              <button className="tx-btn ghost" onClick={() => (startMode === 'edit' ? onClose() : setMode('view'))} disabled={busy}>Batal</button>
              <button className="tx-btn primary" onClick={() => void save()} disabled={busy || d.amount <= 0}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── Calendar ───────────────────────────── */

function CalendarGrid({ year, month, totals, selected, onSelect }: {
  year: number; month: number; totals: Map<string, { out: number; in: number; n: number }>;
  selected: string | null; onSelect: (day: string) => void;
}) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(year, month + 1, 0).getDate();
  const today = todayWIB();
  const maxOut = Math.max(1, ...[...totals.values()].map((v) => v.out));
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <div className="tx-cal">
      <div className="tx-cal-dow">{DOW.map((d) => <div key={d}>{d}</div>)}</div>
      <div className="tx-cal-grid">
        {cells.map((n, i) => {
          if (!n) return <div key={i} className="tx-cal-day blank" />;
          const key = ymd(year, month, n);
          const v = totals.get(key);
          const heat = v?.out ? 0.05 + 0.2 * (v.out / maxOut) : 0;
          return (
            <button key={i} className={`tx-cal-day${key === today ? ' today' : ''}${key === selected ? ' sel' : ''}`}
              style={{ ['--heat' as string]: heat }} onClick={() => onSelect(key)}>
              <span className="tx-cal-num">{n}</span>
              {!!v?.out && <span className="tx-cal-out">{short(v.out)}</span>}
              {!!v?.in && <span className="tx-cal-in">+{short(v.in)}</span>}
            </button>
          );
        })}
      </div>
      <div className="tx-cal-legend">
        <span>Angka = total pengeluaran · <span style={{ color: '#16A34A', fontWeight: 600 }}>hijau</span> = pemasukan</span>
        <span>Makin biru, makin besar pengeluaran</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Page ─────────────────────────────── */

const VIEW_KEY = 'mira_tx_view';

export function DashboardTransactions() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>(() => {
    try { return localStorage.getItem(VIEW_KEY) === 'calendar' ? 'calendar' : 'list'; } catch { return 'list'; }
  });
  const [month, setMonth] = useState(() => { const t = parseDay(todayWIB()); return { y: t.getFullYear(), m: t.getMonth() }; });
  const [selDay, setSelDay] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeF, setTypeF] = useState<'all' | 'expense' | 'income'>('all');
  const [catF, setCatF] = useState<string[]>([]);
  const [walletF, setWalletF] = useState('all');
  const [sheet, setSheet] = useState<{ txn: Txn; mode: SheetMode } | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const id = 'mira-tx-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const load = useCallback(async (ph: string) => {
    setLoading(true);
    const all: Txn[] = [];
    try {
      // PostgREST caps a response at 1000 rows — page through.
      for (let page = 0; page < 10; page++) {
        const r = await fetch(
          `${SUPA_URL}/rest/v1/expenses?phone_number=eq.${ph}&select=${COLS}&order=date.desc,created_at.desc&limit=1000&offset=${page * 1000}`,
          { headers: H },
        );
        if (!r.ok) break;
        const rows = await r.json();
        if (!Array.isArray(rows)) break;
        all.push(...rows);
        if (rows.length < 1000) break;
      }
      setTxns(all);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }
    setPhone(ph);
    void load(ph);
  }, []);

  useEffect(() => {
    if (!phone) return;
    const onAdded = () => void load(phone);
    window.addEventListener('mira:tx-added', onAdded);
    return () => window.removeEventListener('mira:tx-added', onAdded);
  }, [phone]);

  useEffect(() => { try { localStorage.setItem(VIEW_KEY, view); } catch {} }, [view]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2400); return () => clearTimeout(t); }, [toast]);

  const wallets = useMemo(() => [...new Set(txns.map((t) => t.wallet).filter(Boolean))].sort() as string[], [txns]);

  const q = search.trim().toLowerCase();
  const matches = useCallback((t: Txn) => {
    if (typeF !== 'all' && (isIncome(t) ? 'income' : 'expense') !== typeF) return false;
    if (catF.length && !catF.includes(mapCat(t.category || ''))) return false;
    if (walletF !== 'all' && t.wallet !== walletF) return false;
    if (q) {
      const hay = [t.merchant, t.item, t.wallet, catLabel(mapCat(t.category || '')), t.items_detail].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }, [typeF, catF, walletF, q]);

  const monthKey = `${month.y}-${String(month.m + 1).padStart(2, '0')}`;
  const allTime = view === 'list' && !!q; // searching the list looks across every month
  const shown = useMemo(
    () => txns.filter((t) => matches(t) && (allTime || dayOf(t).startsWith(monthKey))),
    [txns, matches, allTime, monthKey],
  );

  const summary = useMemo(() => {
    let out = 0, inc = 0;
    for (const t of shown) (isIncome(t) ? (inc += Number(t.amount || 0)) : (out += Number(t.amount || 0)));
    return { out, inc, net: inc - out };
  }, [shown]);

  const groups = useMemo(() => {
    const m = new Map<string, Txn[]>();
    for (const t of shown) { const k = dayOf(t); if (!m.has(k)) m.set(k, []); m.get(k)!.push(t); }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [shown]);

  const dayTotals = useMemo(() => {
    const m = new Map<string, { out: number; in: number; n: number }>();
    for (const t of shown) {
      const k = dayOf(t);
      const v = m.get(k) || { out: 0, in: 0, n: 0 };
      if (isIncome(t)) v.in += Number(t.amount || 0); else v.out += Number(t.amount || 0);
      v.n++;
      m.set(k, v);
    }
    return m;
  }, [shown]);

  // Calendar: keep a sensible selected day when the month changes.
  useEffect(() => {
    if (view !== 'calendar') return;
    if (selDay?.startsWith(monthKey)) return;
    const today = todayWIB();
    setSelDay(today.startsWith(monthKey) ? today : groups[0]?.[0] || `${monthKey}-01`);
  }, [view, monthKey, groups.length]);

  const shiftMonth = (delta: number) => setMonth(({ y, m }) => {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const thisMonth = todayWIB().slice(0, 7);
  const goToday = () => { const t = parseDay(todayWIB()); setMonth({ y: t.getFullYear(), m: t.getMonth() }); setSelDay(todayWIB()); };
  const monthLabel = new Date(month.y, month.m, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const filterCount = (typeF !== 'all' ? 1 : 0) + catF.length + (walletF !== 'all' ? 1 : 0);
  const resetFilters = () => { setTypeF('all'); setCatF([]); setWalletF('all'); };

  const open = (txn: Txn, mode: SheetMode = 'view') => {
    if (mode !== 'view' && !requireActive(mode === 'edit' ? 'Ubah transaksi butuh langganan aktif.' : 'Hapus transaksi butuh langganan aktif.')) return;
    setSheet({ txn, mode });
  };
  const onSaved = (t: Txn) => {
    setTxns((list) => list.map((x) => (x.id === t.id ? { ...x, ...t } : x)));
    setSheet((s) => (s ? { ...s, txn: { ...s.txn, ...t } } : s));
    setToast('Perubahan disimpan');
  };
  const onDeleted = (id: string) => {
    setTxns((list) => list.filter((x) => x.id !== id));
    setSheet(null);
    setToast('Transaksi dihapus');
  };

  const rows = (list: Txn[]) => (
    <div className="tx-card">
      {list.map((t) => (
        <TxRow key={t.id} t={t} onOpen={() => open(t)} onEdit={() => open(t, 'edit')} onDelete={() => open(t, 'delete')} />
      ))}
    </div>
  );
  const dayNet = (list: Txn[]) => {
    const out = list.filter((t) => !isIncome(t)).reduce((s, t) => s + Number(t.amount || 0), 0);
    const inc = list.filter(isIncome).reduce((s, t) => s + Number(t.amount || 0), 0);
    return [out ? `−${fmt(out)}` : '', inc ? `+${fmt(inc)}` : ''].filter(Boolean).join(' · ');
  };
  const selList = selDay ? shown.filter((t) => dayOf(t) === selDay) : [];

  return (
    <div className="tx-page">
      {/* View switch + month */}
      <div className="tx-top">
        <div className="tx-seg" role="tablist">
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="Tampilan daftar"><List size={16} /><span className="tx-seg-txt">Daftar</span></button>
          <button className={view === 'calendar' ? 'on' : ''} onClick={() => setView('calendar')} aria-label="Tampilan kalender"><CalendarDays size={16} /><span className="tx-seg-txt">Kalender</span></button>
        </div>
        <div className="tx-month">
          <button className="tx-icon-btn" onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya"><ChevronLeft size={18} /></button>
          <span className="tx-month-lbl">{monthLabel}</span>
          <button className="tx-icon-btn" onClick={() => shiftMonth(1)} aria-label="Bulan berikutnya"><ChevronRight size={18} /></button>
          {monthKey !== thisMonth && <button className="tx-today-btn" onClick={goToday}>Hari ini</button>}
        </div>
      </div>

      {/* Totals */}
      <div className="tx-sum">
        <div className="tx-sum-card"><div className="tx-sum-lbl">Pengeluaran</div><div className="tx-sum-val"><Money n={summary.out} /></div></div>
        <div className="tx-sum-card"><div className="tx-sum-lbl">Pemasukan</div><div className="tx-sum-val" style={{ color: '#16A34A' }}><Money n={summary.inc} /></div></div>
        <div className="tx-sum-card"><div className="tx-sum-lbl">Selisih</div><div className="tx-sum-val" style={{ color: summary.net < 0 ? '#DC2626' : '#16A34A' }}><Money n={summary.net} sign={summary.net < 0 ? '−' : '+'} /></div></div>
      </div>

      {/* Search + filters */}
      <div className="tx-tools">
        <div className="tx-search">
          <Search size={16} />
          <input placeholder="Cari merchant, item, wallet…" value={search} onChange={(e) => setSearch(e.target.value)} enterKeyHint="search" />
          {search && <button className="tx-icon-btn tx-clear" onClick={() => setSearch('')} aria-label="Hapus pencarian"><X size={15} /></button>}
        </div>
        <button className={`tx-filter-btn${showFilters || filterCount ? ' on' : ''}`} onClick={() => setShowFilters((v) => !v)}>
          <SlidersHorizontal size={15} />Filter{filterCount ? ` (${filterCount})` : ''}
        </button>
      </div>

      {showFilters && (
        <div className="tx-filters">
          <div>
            <div className="tx-f-lbl">Jenis</div>
            <div className="tx-chips">
              {([['all', 'Semua'], ['expense', 'Pengeluaran'], ['income', 'Pemasukan']] as const).map(([k, l]) => (
                <button key={k} className={`tx-chip${typeF === k ? ' on' : ''}`} onClick={() => setTypeF(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="tx-f-lbl">Kategori</div>
            <div className="tx-chips">
              {CATEGORIES.map((c) => (
                <button key={c} className={`tx-chip icon${catF.includes(c) ? ' on' : ''}`}
                  onClick={() => setCatF((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))}>
                  <MiraIcon name={CATEGORY_ICON[c] || 'sparkle'} size={22} />{catLabel(c)}
                </button>
              ))}
            </div>
          </div>
          {wallets.length > 0 && (
            <div>
              <div className="tx-f-lbl">Wallet</div>
              <div className="tx-chips">
                <button className={`tx-chip${walletF === 'all' ? ' on' : ''}`} onClick={() => setWalletF('all')}>Semua</button>
                {wallets.map((w) => <button key={w} className={`tx-chip${walletF === w ? ' on' : ''}`} onClick={() => setWalletF(w)}>{w}</button>)}
              </div>
            </div>
          )}
          {filterCount > 0 && <div><button className="tx-link" onClick={resetFilters}>Reset filter</button></div>}
        </div>
      )}

      {allTime && (
        <div className="tx-note">
          <span>Hasil "{search.trim()}" dari semua bulan · {shown.length} transaksi</span>
        </div>
      )}

      {loading ? (
        <div className="tx-empty">Memuat transaksi…</div>
      ) : view === 'calendar' ? (
        <>
          <CalendarGrid year={month.y} month={month.m} totals={dayTotals} selected={selDay} onSelect={setSelDay} />
          {selDay && (
            <div className="tx-day">
              <div className="tx-day-hd"><span>{dayLabel(selDay)}</span><span>{dayNet(selList)}</span></div>
              {selList.length ? rows(selList) : <div className="tx-empty">Nggak ada transaksi di tanggal ini.</div>}
            </div>
          )}
        </>
      ) : groups.length === 0 ? (
        <div className="tx-empty">
          <div className="tx-empty-ic"><MiraIcon name="empty-box" size={56} /></div>
          {txns.length === 0 ? 'Belum ada transaksi. Tap + buat mulai catat.'
            : q || filterCount ? 'Nggak ada transaksi yang cocok.'
            : `Belum ada transaksi di ${monthLabel}.`}
          {(q || filterCount > 0) && <div style={{ marginTop: 8 }}><button className="tx-link" onClick={() => { setSearch(''); resetFilters(); }}>Hapus pencarian & filter</button></div>}
        </div>
      ) : (
        groups.map(([day, list]) => (
          <div className="tx-day" key={day}>
            <div className="tx-day-hd"><span>{dayLabel(day)}</span><span>{dayNet(list)}</span></div>
            {rows(list)}
          </div>
        ))
      )}

      {sheet && (
        <TxSheet key={sheet.txn.id + sheet.mode} txn={sheet.txn} startMode={sheet.mode} wallets={wallets}
          onClose={() => setSheet(null)} onSaved={onSaved} onDeleted={onDeleted} />
      )}
      {toast && <div className="tx-toast"><Check size={16} />{toast}</div>}
    </div>
  );
}
