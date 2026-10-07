/**
 * Insight — this month against the plan from the assessment.
 *
 * Sources (nothing estimated that isn't labelled as such):
 *   expenses  last 6 months (paged; PostgREST caps a response at 1000 rows)
 *   users     limit_nominal (Pengaturan), income_estimated_idr +
 *             expense_allocation_pct / saving_allocation_pct (assessment,
 *             editable in Pengaturan), biggest_spend_raw (assessment)
 * "Pengeluaran" = everything not income and not Investasi — money moved to
 * savings/investments counts as saved, not spent.
 * Dates are calendar days (YYYY-MM-DD), parsed locally, never via UTC.
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { normalizeCategory } from '../../lib/category';
import { MiraIcon, type IconName } from '../../components/icons/MiraIcon';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Legend,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
} from 'recharts';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const H = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };

const fmt  = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');
const fmtK = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'jt';
  if (a >= 1e3) return Math.round(n / 1e3) + 'rb';
  return String(Math.round(n));
};

const CAT_COLOR: Record<string, string> = {
  Makanan: '#2563EB', Transport: '#10B981', Belanja: '#8B5CF6',
  Tagihan: '#F59E0B', Kesehatan: '#EF4444', Hiburan: '#EC4899',
  Pemasukan: '#16A34A', Investasi: '#0891B2', Lainnya: '#6B7280',
};
const mapCat = (c: string) => normalizeCategory(c, 'Lainnya');

// Assessment answer (biggest_spend_raw) → the category it corresponds to.
const ASSESS_CAT: Record<string, { cat: string; label: string }> = {
  makan: { cat: 'Makanan', label: 'makan & jajan' },
  lifestyle: { cat: 'Hiburan', label: 'nongkrong & lifestyle' },
  'belanja-online': { cat: 'Belanja', label: 'belanja online' },
  keluarga: { cat: 'Lainnya', label: 'kebutuhan keluarga' },
};

// Monday-first, full names — "Min" was ambiguous.
const DOW = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const dowIdx = (d: Date) => (d.getDay() + 6) % 7;

const DAY = 86400000;
const todayWIB = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const parseDay = (s: string) => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthKey = (d: Date) => ymd(d).slice(0, 7);

type Txn = { amount: number; category?: string; transaction_type?: string; date?: string; created_at?: string; merchant?: string; item?: string };
type Profile = {
  limit_nominal?: number | null; income_estimated_idr?: number | null;
  expense_allocation_pct?: number | null; saving_allocation_pct?: number | null;
  biggest_spend_raw?: string | null;
};

const INS_CSS = `
  .ins-wrap { padding: 24px 32px 48px; max-width: 960px; margin: 0 auto; font-family: 'DM Sans', sans-serif; color: #111827; }
  .ins-h1 { font: 600 20px 'Sora', sans-serif; margin: 0; }
  .ins-sub { font-size: 13px; color: #6B7280; margin: 3px 0 0; }
  .ins-card { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 16px; overflow: hidden; }
  .ins-card-hd { padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,.07); display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .ins-card-hd h3 { font: 600 14px 'Sora', sans-serif; margin: 0; }
  .ins-card-hd span { font-size: 12px; color: #9CA3AF; }
  .ins-plan { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
  .ins-plan-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .ins-big { font: 800 24px 'Sora', sans-serif; }
  .ins-bar { position: relative; height: 10px; background: #EEF1F6; border-radius: 99px; overflow: visible; }
  .ins-bar > div { height: 100%; border-radius: 99px; }
  .ins-bar .ins-mark { position: absolute; top: -4px; width: 2px; height: 18px; background: #111827; border-radius: 2px; }
  .ins-kv { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .ins-kv div { background: #F8FAFC; border-radius: 12px; padding: 10px 12px; min-width: 0; }
  .ins-kv small { display: block; font-size: 11.5px; color: #6B7280; }
  .ins-kv strong { display: block; font: 700 14px 'Sora', sans-serif; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ins-note { font-size: 12px; color: #6B7280; line-height: 1.55; }
  .ins-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 14px 0; }
  .ins-tip { border-radius: 16px; padding: 14px 16px; border: 1px solid; display: flex; flex-direction: column; gap: 4px; }
  .ins-tip p { margin: 0; font-size: 13px; line-height: 1.55; color: #374151; }
  .ins-tip .ins-tip-t { font-weight: 700; color: #111827; font-size: 13.5px; display: flex; align-items: center; gap: 8px; }
  .ins-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .ins-row { display: flex; align-items: center; gap: 12px; padding: 11px 18px; border-bottom: 1px solid rgba(0,0,0,.05); }
  .ins-row:last-child { border-bottom: 0; }
  @media (max-width: 900px) {
    .ins-wrap { padding: 16px 12px 28px; }
    .ins-grid, .ins-two { grid-template-columns: 1fr; }
  }
  @media (max-width: 480px) { .ins-kv { grid-template-columns: 1fr 1fr; } .ins-big { font-size: 20px; } }
  .dark .ins-wrap { color: #F1F5F9; }
  .dark .ins-card { background: #1E293B; border-color: rgba(255,255,255,.08); }
  .dark .ins-card-hd { border-color: rgba(255,255,255,.07); }
  .dark .ins-bar { background: #334155; }
  .dark .ins-bar .ins-mark { background: #F1F5F9; }
  .dark .ins-kv div { background: #0F172A; }
  .dark .ins-kv small, .dark .ins-note, .dark .ins-sub { color: #94A3B8; }
  .dark .ins-tip p { color: #CBD5E1; }
  .dark .ins-tip .ins-tip-t { color: #F1F5F9; }
  .dark .ins-row { border-color: rgba(255,255,255,.05); }
`;

const TT: React.CSSProperties = {
  backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#111827',
};

type Tone = 'blue' | 'green' | 'amber' | 'red';
const TONE: Record<Tone, { bg: string; bd: string }> = {
  blue: { bg: 'rgba(37,99,235,.07)', bd: 'rgba(37,99,235,.18)' },
  green: { bg: 'rgba(22,163,74,.07)', bd: 'rgba(22,163,74,.2)' },
  amber: { bg: 'rgba(245,158,11,.08)', bd: 'rgba(245,158,11,.25)' },
  red: { bg: 'rgba(239,68,68,.07)', bd: 'rgba(239,68,68,.2)' },
};

export function DashboardInsights() {
  const navigate = useNavigate();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = 'mira-ins-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = INS_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const load = useCallback(async (ph: string) => {
    const t = parseDay(todayWIB());
    const from = ymd(new Date(t.getFullYear(), t.getMonth() - 5, 1));
    const all: Txn[] = [];
    try {
      for (let page = 0; page < 10; page++) {
        const r = await fetch(`${SUPA_URL}/rest/v1/expenses?phone_number=eq.${ph}&date=gte.${from}&select=amount,category,transaction_type,date,created_at,merchant,item&order=date.desc&limit=1000&offset=${page * 1000}`, { headers: H });
        if (!r.ok) break;
        const rows = await r.json();
        if (!Array.isArray(rows)) break;
        all.push(...rows.map((x: Txn) => ({ ...x, amount: Number(x.amount || 0) })));
        if (rows.length < 1000) break;
      }
      const u = await fetch(`${SUPA_URL}/rest/v1/users?primary_phone=eq.${ph}&select=limit_nominal,income_estimated_idr,expense_allocation_pct,saving_allocation_pct,biggest_spend_raw`, { headers: H });
      if (u.ok) { const a = await u.json(); setProfile(a?.[0] || null); }
    } catch {}
    setTxns(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }
    void load(ph);
    const refresh = () => void load(ph);
    window.addEventListener('mira:tx-added', refresh);
    return () => window.removeEventListener('mira:tx-added', refresh);
  }, []);

  const s = useMemo(() => {
    const today = parseDay(todayWIB());
    const dayN = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const thisM = monthKey(today);
    const lastMDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastM = monthKey(lastMDate);
    const lastMDays = new Date(lastMDate.getFullYear(), lastMDate.getMonth() + 1, 0).getDate();

    const dayOf = (t: Txn) => String(t.date || t.created_at || '').slice(0, 10);
    const isInc = (t: Txn) => String(t.transaction_type || '').toLowerCase() === 'income' || mapCat(t.category || '') === 'Pemasukan';
    const isInv = (t: Txn) => !isInc(t) && mapCat(t.category || '') === 'Investasi';
    const isExp = (t: Txn) => !isInc(t) && !isInv(t);

    const month = txns.filter((t) => dayOf(t).startsWith(thisM));
    const spent = month.filter(isExp).reduce((a, t) => a + t.amount, 0);
    const income = month.filter(isInc).reduce((a, t) => a + t.amount, 0);
    const invested = month.filter(isInv).reduce((a, t) => a + t.amount, 0);
    // Same stretch of last month (1st … today's date) — a fair comparison mid-month.
    const lastSame = txns.filter((t) => { const d = dayOf(t); return d.startsWith(lastM) && Number(d.slice(8, 10)) <= Math.min(dayN, lastMDays) && isExp(t); })
      .reduce((a, t) => a + t.amount, 0);
    const changePct = lastSame > 0 ? ((spent - lastSame) / lastSame) * 100 : null;

    // Plan: the monthly limit from Pengaturan, else the assessment's split of estimated income.
    const estIncome = Number(profile?.income_estimated_idr || 0);
    const expPct = Number(profile?.expense_allocation_pct ?? 0) || (profile?.saving_allocation_pct != null ? 100 - Number(profile.saving_allocation_pct) : 0);
    const savePct = profile?.saving_allocation_pct != null ? Number(profile.saving_allocation_pct) : expPct ? 100 - expPct : 0;
    const limit = Number(profile?.limit_nominal || 0);
    const budget = limit > 0 ? limit : estIncome > 0 && expPct > 0 ? Math.round((estIncome * expPct) / 100) : 0;
    const budgetSource = limit > 0 ? 'limit' : budget > 0 ? 'assessment' : null;
    const projected = dayN > 0 ? Math.round((spent / dayN) * daysInMonth) : spent;
    const daysLeft = daysInMonth - dayN + 1;
    const perDayLeft = budget > 0 ? Math.max(0, budget - spent) / daysLeft : 0;
    const incomeBase = income > 0 ? income : estIncome;
    const saveTarget = incomeBase > 0 && savePct > 0 ? Math.round((incomeBase * savePct) / 100) : 0;

    // Categories this month
    const catMap: Record<string, number> = {};
    month.filter(isExp).forEach((t) => { const c = mapCat(t.category || ''); catMap[c] = (catMap[c] || 0) + t.amount; });
    const catData = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({
      name, value, color: CAT_COLOR[name] || '#6B7280', pct: spent > 0 ? Math.round((value / spent) * 100) : 0,
    }));

    // Top merchants this month
    const mm: Record<string, { amount: number; count: number }> = {};
    month.filter(isExp).forEach((t) => {
      const k = (t.merchant || t.item || mapCat(t.category || '')).trim();
      mm[k] = mm[k] || { amount: 0, count: 0 };
      mm[k].amount += t.amount; mm[k].count++;
    });
    const topMerchants = Object.entries(mm).sort((a, b) => b[1].amount - a[1].amount).slice(0, 5).map(([name, v]) => ({ name, ...v }));

    // 6-month trend
    const trend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
      const k = monthKey(d);
      const rows = txns.filter((t) => dayOf(t).startsWith(k));
      return {
        month: d.toLocaleDateString('id-ID', { month: 'short' }) + (d.getFullYear() !== today.getFullYear() ? ` ${String(d.getFullYear()).slice(2)}` : ''),
        Pengeluaran: rows.filter(isExp).reduce((a, t) => a + t.amount, 0),
        Pemasukan: rows.filter(isInc).reduce((a, t) => a + t.amount, 0),
      };
    });

    // Day of week: average spend per calendar day of that weekday, counting
    // every such day in the window (also the ones without any spending).
    const expDays = txns.filter(isExp).map(dayOf).filter(Boolean).sort();
    let dow: { day: string; avg: number; days: number }[] = [];
    let peak: { day: string; avg: number; days: number } | null = null;
    let dailyAvg = 0;
    const activeDays = new Set(expDays).size;
    if (expDays.length) {
      const start = parseDay(expDays[0]);
      const totals = Array(7).fill(0), counts = Array(7).fill(0);
      for (let d = new Date(start); d <= today; d = new Date(d.getTime() + DAY)) counts[dowIdx(d)]++;
      txns.filter(isExp).forEach((t) => { const k = dayOf(t); if (k) totals[dowIdx(parseDay(k))] += t.amount; });
      dow = DOW.map((day, i) => ({ day, avg: counts[i] ? Math.round(totals[i] / counts[i]) : 0, days: counts[i] }));
      const totalDays = counts.reduce((a, b) => a + b, 0);
      dailyAvg = totalDays ? totals.reduce((a, b) => a + b, 0) / totalDays : 0;
      peak = dow.reduce((a, b) => (b.avg > a.avg ? b : a), dow[0]);
    }

    return {
      dayN, daysInMonth, spent, income, invested, lastSame, changePct,
      budget, budgetSource, estIncome, expPct, savePct, projected, daysLeft, perDayLeft, saveTarget, incomeBase,
      catData, topMerchants, trend, dow, peak, dailyAvg, activeDays,
      monthLabel: today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    };
  }, [txns, profile]);

  if (loading) return <div className="ins-wrap"><p style={{ color: '#6B7280', fontSize: 14 }}>Memuat insight…</p></div>;

  if (txns.length === 0) return (
    <div className="ins-wrap" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><MiraIcon name="report" size={72} /></div>
      <p style={{ color: '#6B7280', fontSize: 14 }}>Belum ada data. Mulai catat transaksi lewat Chat MIRA atau tombol +.</p>
    </div>
  );

  // ── Plan card copy ──
  const ratio = s.budget > 0 ? s.spent / s.budget : 0;
  const expectedRatio = s.dayN / s.daysInMonth;
  const barColor = ratio > 1 ? '#DC2626' : ratio > expectedRatio * 1.1 ? '#F59E0B' : '#16A34A';
  const planStatus = s.budget <= 0 ? null
    : ratio > 1 ? { tone: 'red' as Tone, text: `Sudah lewat batas ${fmt(s.spent - s.budget)}.` }
    : s.projected > s.budget ? { tone: 'amber' as Tone, text: `Dengan kecepatan sekarang, akhir bulan bisa tembus ${fmt(s.projected)} — ${fmt(s.projected - s.budget)} di atas rencana.` }
    : { tone: 'green' as Tone, text: `Aman. Perkiraan akhir bulan ${fmt(s.projected)}, masih ${fmt(s.budget - s.projected)} di bawah rencana.` };

  // ── Insight cards ──
  const tips: { tone: Tone; icon: IconName; title: string; body: React.ReactNode }[] = [];
  const top = s.catData[0];
  if (top) {
    const assess = ASSESS_CAT[String(profile?.biggest_spend_raw || '')];
    tips.push({
      tone: 'blue', icon: 'pie', title: 'Pengeluaran terbesar bulan ini',
      body: <><strong>{top.name}</strong> — {fmt(top.value)} ({top.pct}% dari pengeluaran).
        {assess && (assess.cat === top.name
          ? <> Sesuai jawaban assessment-mu: paling banyak keluar untuk {assess.label}.</>
          : <> Waktu assessment kamu bilang paling banyak untuk {assess.label}; bulan ini ternyata {top.name}.</>)}</>,
    });
  }
  if (s.changePct !== null) {
    const pct = Math.round(s.changePct);
    const up = pct > 0;
    tips.push({
      tone: up ? 'amber' : 'green', icon: up ? 'growth' : 'chart-down', title: `Dibanding tanggal 1–${s.dayN} bulan lalu`,
      body: pct === 0
        ? <>Pengeluaran <strong>sama</strong> dengan periode yang sama bulan lalu ({fmt(s.spent)}).</>
        : <>Pengeluaran {up ? 'naik' : 'turun'} <strong>{Math.abs(pct)}%</strong> ({fmt(s.spent)} vs {fmt(s.lastSame)} di periode yang sama).</>,
    });
  }
  if (s.peak && s.peak.avg > 0 && s.activeDays >= 10) {
    const vs = s.dailyAvg > 0 ? Math.round((s.peak.avg / s.dailyAvg - 1) * 100) : 0;
    tips.push({
      tone: 'amber', icon: 'calendar-star', title: `Hari paling boros: ${s.peak.day}`,
      body: <>Rata-rata kamu keluar <strong>{fmt(s.peak.avg)}</strong> setiap hari {s.peak.day}{vs > 0 ? <> — {vs}% di atas rata-rata harianmu ({fmt(s.dailyAvg)})</> : ''}. Dihitung dari {s.peak.days} hari {s.peak.day} dalam 6 bulan terakhir.</>,
    });
  }
  if (s.saveTarget > 0) {
    const saved = Math.max(0, s.incomeBase - s.projected);
    const ok = saved >= s.saveTarget;
    tips.push({
      tone: ok ? 'green' : 'amber', icon: 'piggy', title: `Target nabung ${s.savePct}%`,
      body: <>Dari {s.income > 0 ? 'pemasukan tercatat' : 'perkiraan penghasilan'} {fmt(s.incomeBase)}, target nabungmu <strong>{fmt(s.saveTarget)}</strong>/bulan.
        {ok ? <> Kalau pengeluaran tetap segini, sisa ≈ {fmt(saved)} — target tercapai.</> : <> Dengan pengeluaran sekarang sisa ≈ {fmt(saved)}, kurang {fmt(s.saveTarget - saved)}.</>}
        {s.invested > 0 && <> Sudah dipindah ke investasi/tabungan bulan ini: {fmt(s.invested)}.</>}</>,
    });
  }

  return (
    <div className="ins-wrap">
      <div style={{ marginBottom: 16 }}>
        <h1 className="ins-h1">Insight</h1>
        <p className="ins-sub">{s.monthLabel} · dari transaksi yang kamu catat dan hasil assessment-mu</p>
      </div>

      {/* Plan vs actual */}
      <div className="ins-card">
        <div className="ins-card-hd">
          <h3>Pengeluaran bulan ini</h3>
          <span>hari ke-{s.dayN} dari {s.daysInMonth}</span>
        </div>
        <div className="ins-plan">
          <div className="ins-plan-top">
            <div className="ins-big">{fmt(s.spent)}</div>
            {s.budget > 0 && <div style={{ fontSize: 13, color: '#6B7280' }}>dari rencana <strong style={{ color: 'inherit' }}>{fmt(s.budget)}</strong></div>}
          </div>
          {s.budget > 0 && (
            <div className="ins-bar" title="Garis hitam = posisi seharusnya hari ini">
              <div style={{ width: `${Math.min(100, ratio * 100)}%`, background: barColor }} />
              <span className="ins-mark" style={{ left: `calc(${Math.min(100, expectedRatio * 100)}% - 1px)` }} />
            </div>
          )}
          {planStatus && <div style={{ fontSize: 13.5, fontWeight: 600, color: planStatus.tone === 'red' ? '#DC2626' : planStatus.tone === 'amber' ? '#B45309' : '#15803D' }}>{planStatus.text}</div>}
          <div className="ins-kv">
            <div><small>Pemasukan tercatat</small><strong style={{ color: '#16A34A' }}>{fmt(s.income)}</strong></div>
            <div><small>Perkiraan akhir bulan</small><strong>{fmt(s.projected)}</strong></div>
            <div><small>{s.budget > 0 ? 'Jatah per hari tersisa' : 'Ke investasi/tabungan'}</small><strong>{s.budget > 0 ? fmt(s.perDayLeft) : fmt(s.invested)}</strong></div>
          </div>
          <div className="ins-note">
            {s.budgetSource === 'limit' ? 'Rencana = limit bulanan yang kamu set di Pengaturan.'
              : s.budgetSource === 'assessment' ? <>Rencana = {s.expPct}% dari perkiraan penghasilan {fmt(s.estIncome)} (hasil assessment). Ubah limit atau rasio di Pengaturan.</>
              : 'Set limit bulanan di Pengaturan biar MIRA bisa bandingin pengeluaran dengan rencanamu.'}
            {' '}Perkiraan akhir bulan = rata-rata harian bulan ini × {s.daysInMonth} hari. Investasi/tabungan nggak dihitung sebagai pengeluaran.
          </div>
        </div>
      </div>

      {tips.length > 0 && (
        <div className="ins-grid">
          {tips.map((t) => (
            <div key={t.title} className="ins-tip" style={{ background: TONE[t.tone].bg, borderColor: TONE[t.tone].bd }}>
              <div className="ins-tip-t"><MiraIcon name={t.icon} size={30} />{t.title}</div>
              <p>{t.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Trend */}
      <div className="ins-card" style={{ marginBottom: 14 }}>
        <div className="ins-card-hd"><h3>Tren 6 bulan</h3><span>pengeluaran vs pemasukan</span></div>
        <div style={{ padding: '12px 12px 16px' }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={s.trend}>
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtK} width={44} />
              <Tooltip formatter={(v: number, n: string) => [fmt(v), n]} contentStyle={TT} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Pengeluaran" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Pemasukan" stroke="#16A34A" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ins-two">
        <div className="ins-card">
          <div className="ins-card-hd"><h3>Kategori bulan ini</h3><span>{fmt(s.spent)}</span></div>
          <div style={{ padding: '10px 16px 16px' }}>
            {s.catData.length === 0 ? <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Belum ada pengeluaran bulan ini.</p> : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={s.catData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                      {s.catData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number, n: string) => [fmt(v), n]} contentStyle={TT} />
                  </PieChart>
                </ResponsiveContainer>
                {s.catData.map((c) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '4px 0' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span style={{ color: '#9CA3AF', fontSize: 12 }}>{c.pct}%</span>
                    <span style={{ fontWeight: 600, minWidth: 92, textAlign: 'right' }}>{fmt(c.value)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="ins-card">
          <div className="ins-card-hd"><h3>Rata-rata per hari</h3><span>6 bulan terakhir</span></div>
          <div style={{ padding: '12px 8px 8px' }}>
            {s.dow.length === 0 ? <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 10px' }}>Belum ada data.</p> : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={s.dow} barSize={22}>
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtK} width={40} />
                  <Tooltip formatter={(v: number) => [fmt(v), 'Rata-rata per hari']} labelFormatter={(l) => `Setiap hari ${l}`} contentStyle={TT} cursor={{ fill: 'rgba(148,163,184,.12)' }} />
                  <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                    {s.dow.map((d) => <Cell key={d.day} fill={s.peak && d.day === s.peak.day ? '#F59E0B' : '#2563EB'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <p className="ins-note" style={{ margin: '4px 10px 6px' }}>Total pengeluaran di hari itu ÷ jumlah hari itu sejak transaksi pertama (hari tanpa transaksi ikut dihitung).</p>
          </div>
        </div>
      </div>

      <div className="ins-card">
        <div className="ins-card-hd"><h3>Top merchant bulan ini</h3></div>
        {s.topMerchants.length === 0 ? <p style={{ padding: '14px 18px', fontSize: 13, color: '#9CA3AF', margin: 0 }}>Belum ada data.</p>
          : s.topMerchants.map((m, i) => (
            <div key={m.name} className="ins-row">
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(37,99,235,.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{m.count} transaksi</div>
              </div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13.5, fontWeight: 700 }}>{fmt(m.amount)}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
