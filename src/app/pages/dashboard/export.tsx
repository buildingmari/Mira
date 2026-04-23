import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Download, FileText, Calendar, Filter, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const H = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };

const fmt = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');

function decodeUnicode(str: string): string {
  if (!str) return str;
  try { return decodeURIComponent(JSON.parse('"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"')); } catch {}
  try { return str.replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) => String.fromCodePoint(parseInt(h, 16))); } catch {}
  return str;
}

function mapCat(c: string) {
  const m: Record<string, string> = {
    food: 'Food & Drinks', Food: 'Food & Drinks', makanan: 'Makanan & Minuman', Makanan: 'Makanan & Minuman',
    'food & drinks': 'Food & Drinks', 'makanan & minuman': 'Makanan & Minuman',
    transport: 'Transport', Transport: 'Transport', transportation: 'Transportation', Transportation: 'Transportation',
    shopping: 'Belanja', Shopping: 'Belanja', Belanja: 'Belanja',
    bills: 'Tagihan', Bills: 'Tagihan', Tagihan: 'Tagihan', utilities: 'Tagihan',
    health: 'Kesehatan', Health: 'Kesehatan', Kesehatan: 'Kesehatan',
    entertainment: 'Hiburan', Entertainment: 'Hiburan', Hiburan: 'Hiburan',
    income: 'Pemasukan', Income: 'Pemasukan', Pemasukan: 'Pemasukan', salary: 'Pemasukan',
    'savings & investment': 'Savings & Investment', investasi: 'Savings & Investment',
    education: 'Education', Education: 'Education',
  };
  return m[c] || m[c?.toLowerCase()] || c || 'Lainnya';
}

// ─── XLSX builder matching the template structure ─────────────────────────────
function buildXlsx(txns: any[], userName: string): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Transaksi ───────────────────────────────────────────────────
  const dateRange = txns.length
    ? `${txns[txns.length - 1].date} — ${txns[0].date}`
    : 'No data';

  const transaksiRows: any[][] = [
    [`  🤖  MIRA | Asisten Keuangan ${userName}`],
    [`  ${txns.length} transaksi  ·  ${dateRange}`],
    ['NO', 'TANGGAL', 'KATEGORI', 'SUB-KATEGORI', 'TIPE', 'JUMLAH (Rp)', 'MERCHANT', 'METODE'],
  ];

  txns.forEach((t, i) => {
    const isIncome = t.transaction_type?.toLowerCase() === 'income' ||
      t.transaction_type?.toLowerCase() === 'uang masuk' ||
      (t.category || '').toLowerCase().includes('income') ||
      (t.category || '').toLowerCase().includes('pemasukan');
    const isInvest = (t.category || '').toLowerCase().includes('invest') ||
      (t.category || '').toLowerCase().includes('saving');
    const tipe = isInvest ? 'Investasi' : (isIncome ? 'Uang Masuk' : 'Uang Keluar');
    const amount = Number(t.amount || 0);
    transaksiRows.push([
      i + 1,
      t.date || '',
      mapCat(t.category || ''),
      t.subcategory || '',
      tipe,
      isIncome ? amount : -amount,
      decodeUnicode(t.merchant || t.item || ''),
      t.wallet || '',
    ]);
  });

  const wsTransaksi = XLSX.utils.aoa_to_sheet(transaksiRows);
  // Column widths
  wsTransaksi['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
    { wch: 16 }, { wch: 32 }, { wch: 16 },
  ];
  // Freeze header rows
  wsTransaksi['!freeze'] = { xSplit: 0, ySplit: 3 };
  XLSX.utils.book_append_sheet(wb, wsTransaksi, 'Transaksi');

  // ── Sheet 2: Grafik ──────────────────────────────────────────────────────
  const monthMap: Record<string, { pemasukan: number; pengeluaran: number; investasi: number }> = {};
  const catMapCurrent: Record<string, number> = {};
  const catMapLast: Record<string, number> = {};

  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastM.getFullYear()}-${String(lastM.getMonth() + 1).padStart(2, '0')}`;

  txns.forEach(t => {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) monthMap[key] = { pemasukan: 0, pengeluaran: 0, investasi: 0 };

    const amt = Number(t.amount || 0);
    const cat = mapCat(t.category || '');
    const isIncome = t.transaction_type?.toLowerCase() === 'income' ||
      (t.category || '').toLowerCase().includes('pemasukan') ||
      t.transaction_type?.toLowerCase() === 'uang masuk';
    const isInvest = cat.toLowerCase().includes('invest') || cat.toLowerCase().includes('saving');

    if (isIncome) monthMap[key].pemasukan += amt;
    else if (isInvest) monthMap[key].investasi += amt;
    else monthMap[key].pengeluaran += amt;

    if (key === curMonth) catMapCurrent[cat] = (catMapCurrent[cat] || 0) + amt;
    if (key === lastMonth) catMapLast[cat] = (catMapLast[cat] || 0) + amt;
  });

  const totalPemasukan = Object.values(monthMap).reduce((s, m) => s + m.pemasukan, 0);
  const totalPengeluaran = Object.values(monthMap).reduce((s, m) => s + m.pengeluaran, 0);
  const totalInvestasi = Object.values(monthMap).reduce((s, m) => s + m.investasi, 0);

  const grafRows: any[][] = [
    [`  🤖  MIRA | Asisten Keuangan ${userName}`],
    ['💰 PEMASUKAN', '', '', '', '💸 PENGELUARAN', '', '', '', '📈 INVESTASI', ''],
    [fmt(totalPemasukan), '', '', '', fmt(totalPengeluaran), '', '', '', fmt(totalInvestasi), ''],
    [],
    [`  🔥  PENGELUARAN BULAN INI  — ${curMonth}`],
    ['KATEGORI', '', 'BULAN INI', 'BULAN LALU', 'SELISIH', '', 'Kategori', `${curMonth}`, 'Bln Lalu', ''],
  ];

  const allCats = [...new Set([...Object.keys(catMapCurrent), ...Object.keys(catMapLast)])].sort();
  let totalCur = 0, totalLast = 0;
  allCats.forEach(cat => {
    const cur = catMapCurrent[cat] || 0;
    const last = catMapLast[cat] || 0;
    const diff = cur - last;
    totalCur += cur; totalLast += last;
    grafRows.push([
      cat, '', cur, last,
      (diff >= 0 ? '+' : '') + diff.toLocaleString('id-ID'),
      '', cat, cur, last, '',
    ]);
  });
  grafRows.push(['TOTAL', '', totalCur, totalLast, ((totalCur - totalLast) >= 0 ? '+' : '') + (totalCur - totalLast).toLocaleString('id-ID'), '', '', '', '', '']);
  grafRows.push([]);
  grafRows.push([]);
  grafRows.push([`  📅  RINGKASAN BULANAN  — ${dateRange}`]);
  grafRows.push([]);

  const months = Object.keys(monthMap).sort();
  months.forEach(m => {
    const { pemasukan, pengeluaran, investasi } = monthMap[m];
    const monthLabel = new Date(m + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    grafRows.push([monthLabel, '', pemasukan, '', pengeluaran, '', investasi, '', (pemasukan - pengeluaran - investasi), '']);
  });
  const totP = months.reduce((s, m) => s + monthMap[m].pemasukan, 0);
  const totPen = months.reduce((s, m) => s + monthMap[m].pengeluaran, 0);
  const totInv = months.reduce((s, m) => s + monthMap[m].investasi, 0);
  grafRows.push(['TOTAL', '', totP, '', totPen, '', totInv, '', totP - totPen - totInv, '']);
  grafRows.push(['Bulan', 'Pemasukan', 'Pengeluaran', 'Investasi', 'Saldo Bersih', '', '', '', '', '']);

  const wsGrafik = XLSX.utils.aoa_to_sheet(grafRows);
  wsGrafik['!cols'] = Array(10).fill({ wch: 18 });
  XLSX.utils.book_append_sheet(wb, wsGrafik, 'Grafik');

  // ── Sheet 3: Per Wallet ──────────────────────────────────────────────────
  const walletMap: Record<string, number> = {};
  txns.forEach(t => {
    if (!t.wallet) return;
    walletMap[t.wallet] = (walletMap[t.wallet] || 0) + Number(t.amount || 0);
  });
  const totalW = Object.values(walletMap).reduce((s, v) => s + v, 0);
  const walletRows: any[][] = [['wallet', 'total', 'persen']];
  Object.entries(walletMap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([w, total]) => {
      walletRows.push([w, total, totalW > 0 ? parseFloat((total / totalW).toFixed(3)) : 0]);
    });

  const wsWallet = XLSX.utils.aoa_to_sheet(walletRows);
  wsWallet['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsWallet, 'Per Wallet');

  // ── Sheet 4: Per Tanggal ─────────────────────────────────────────────────
  const dateAgg: Record<string, number> = {};
  txns.forEach(t => {
    if (!t.date) return;
    const day = t.date.split('T')[0];
    dateAgg[day] = (dateAgg[day] || 0) + Number(t.amount || 0);
  });
  const dateRows: any[][] = [['tanggal', 'total']];
  Object.entries(dateAgg)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([d, total]) => dateRows.push([new Date(d), total]));

  const wsDate = XLSX.utils.aoa_to_sheet(dateRows);
  wsDate['!cols'] = [{ wch: 22 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsDate, 'Per Tanggal');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
}

function downloadXlsx(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// CSV fallback
function toCSV(rows: any[]): string {
  const headers = ['Tanggal', 'Merchant', 'Kategori', 'Wallet', 'Jumlah', 'Tipe'];
  const lines   = [headers.join(',')];
  rows.forEach(t => {
    lines.push([
      t.date || '',
      `"${decodeUnicode(t.merchant || t.item || '').replace(/"/g, '""')}"`,
      mapCat(t.category || ''),
      t.wallet || '',
      t.amount || 0,
      t.transaction_type || 'expense',
    ].join(','));
  });
  return lines.join('\n');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const EXP_CSS = `
  .exp-wrap      { padding: 28px 32px 60px; max-width: 960px; margin: 0 auto;
                   font-family: 'DM Sans', sans-serif; }
  .exp-grid3     { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
                   margin-bottom: 20px; }
  .exp-card      { background: #fff; border: 1px solid rgba(0,0,0,0.07);
                   border-radius: 16px; overflow: hidden; margin-bottom: 16px; }
  .exp-card-hdr  { padding: 18px 20px 14px; border-bottom: 1px solid rgba(0,0,0,0.07); }
  .exp-card-hdr h3 { margin: 0; font-family: 'Sora', sans-serif; font-size: 14px;
                     font-weight: 600; color: #111827; }
  .exp-card-hdr p  { margin: 4px 0 0; font-size: 12px; color: #6B7280; }
  .exp-card-body { padding: 18px 20px; }
  .exp-qcard     { background: #fff; border: 1px solid rgba(0,0,0,0.07);
                   border-radius: 16px; padding: 20px; }
  .exp-icon-box  { width: 44px; height: 44px; border-radius: 10px; background: #EFF6FF;
                   display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
  .exp-btn       { width: 100%; height: 42px; background: #2563EB; color: #fff;
                   border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
                   font-family: 'DM Sans', sans-serif; cursor: pointer;
                   display: flex; align-items: center; justify-content: center; gap: 6px;
                   transition: background .15s; }
  .exp-btn:hover { background: #1D4ED8; }
  .exp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .exp-btn-sec   { height: 42px; padding: 0 18px; background: transparent; color: #374151;
                   border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; font-size: 14px;
                   font-family: 'DM Sans', sans-serif; cursor: pointer;
                   display: inline-flex; align-items: center; gap: 6px; transition: background .15s; }
  .exp-btn-sec:hover { background: #F8F9FB; }
  .exp-ctrl      { height: 44px; width: 100%; border: 1px solid rgba(0,0,0,0.10);
                   border-radius: 10px; padding: 0 14px; font-size: 14px;
                   font-family: 'DM Sans', sans-serif; background: #F8F9FB;
                   outline: none; box-sizing: border-box; }
  .exp-ctrl:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
  .exp-filter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .exp-month-row { display: flex; align-items: center; justify-content: space-between;
                   padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
  .exp-month-row:last-child { border-bottom: none; padding-bottom: 0; }
  @media (max-width: 900px) {
    .exp-wrap   { padding: 16px 16px 80px; }
    .exp-grid3  { grid-template-columns: 1fr; }
    .exp-filter-grid { grid-template-columns: 1fr; }
  }
`;

export function DashboardExport() {
  const navigate = useNavigate();
  const [txns,      setTxns]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [walFilter, setWalFilter] = useState('all');
  const [userName,  setUserName]  = useState('User');

  useEffect(() => {
    const id = 'mira-exp-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = EXP_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-exp-css')?.remove(); };
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }

    // Load user name
    try {
      const raw = localStorage.getItem('mira_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.name) setUserName(u.name);
      }
    } catch {}

    (async () => {
      try {
        const r = await fetch(
          `${SUPA_URL}/rest/v1/expenses?phone_number=eq.${ph}&order=date.desc&limit=5000`,
          { headers: H }
        );
        if (r.ok) {
          const a = await r.json();
          if (Array.isArray(a)) setTxns(a);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const monthlyReports = useMemo(() => {
    const map: Record<string, { label: string; total: number }> = {};
    txns.forEach(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      if (!map[key]) map[key] = { label, total: 0 };
      map[key].total += Number(t.amount || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 12)
      .map(([key, v]) => ({ key, ...v }));
  }, [txns]);

  const cats    = useMemo(() => [...new Set(txns.map(t => mapCat(t.category || '')))].sort(), [txns]);
  const wallets = useMemo(() => [...new Set(txns.map(t => t.wallet || '').filter(Boolean))].sort(), [txns]);

  const getFiltered = () => {
    return txns.filter(t => {
      const d = new Date(t.date);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate   && d > new Date(endDate))   return false;
      if (catFilter !== 'all' && mapCat(t.category || '') !== catFilter) return false;
      if (walFilter !== 'all' && (t.wallet || '') !== walFilter) return false;
      return true;
    });
  };

  const doExportXlsx = async (rows: any[], label: string) => {
    if (rows.length === 0) { alert('Tidak ada data untuk di-export.'); return; }
    const buffer = buildXlsx(rows, userName);
    const filename = `MIRA_${label}_${new Date().toISOString().split('T')[0]}.xlsx`;
    downloadXlsx(buffer, filename);
  };

  const doExportCSV = (rows: any[], label: string) => {
    if (rows.length === 0) { alert('Tidak ada data untuk di-export.'); return; }
    const csv = toCSV(rows);
    downloadCSV(csv, `MIRA_${label}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const doExport = async (type: string) => {
    setExporting(type);
    try {
      let rows: any[];
      let label = 'semua';

      if (type === 'all-xlsx' || type === 'all-csv') {
        rows = txns; label = 'semua';
      } else if (type === 'custom-xlsx' || type === 'custom-csv') {
        rows = getFiltered(); label = 'custom';
      } else if (type.startsWith('month-xlsx-') || type.startsWith('month-csv-')) {
        const [,, key] = type.split(/-(.+)/).filter(Boolean); // get part after 2nd -
        const parts = type.split('-');
        const mKey = parts.slice(2).join('-');
        rows = txns.filter(t => {
          const d = new Date(t.date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mKey;
        });
        label = mKey;
      } else if (type.startsWith('90d-')) {
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
        rows = txns.filter(t => new Date(t.date) >= cutoff);
        label = '90hari';
      } else {
        rows = txns; label = 'semua';
      }

      if (type.includes('csv')) {
        doExportCSV(rows, label);
      } else {
        await doExportXlsx(rows, label);
      }
    } catch {}
    setExporting(null);
  };

  const busy = (key: string) => exporting === key;

  return (
    <div className="exp-wrap">

      {/* Quick Export */}
      <div className="exp-grid3">
        {/* Excel — All data */}
        <div className="exp-qcard">
          <div className="exp-icon-box" style={{ background: '#F0FDF4' }}>
            <FileSpreadsheet style={{ width: 22, height: 22, color: '#16A34A' }} />
          </div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#111827' }}>Excel (.xlsx)</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>Semua transaksi — format Excel dengan 4 sheet</div>
          <button
            className="exp-btn"
            style={{ background: '#16A34A' }}
            disabled={loading || busy('all-xlsx')}
            onClick={() => doExport('all-xlsx')}
          >
            <Download style={{ width: 15, height: 15 }} />
            {busy('all-xlsx') ? 'Mengekspor...' : 'Export Excel'}
          </button>
        </div>

        {/* CSV — All data */}
        <div className="exp-qcard">
          <div className="exp-icon-box">
            <FileText style={{ width: 22, height: 22, color: '#2563EB' }} />
          </div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#111827' }}>CSV</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>Semua transaksi — .csv format</div>
          <button
            className="exp-btn"
            disabled={loading || busy('all-csv')}
            onClick={() => doExport('all-csv')}
          >
            <Download style={{ width: 15, height: 15 }} />
            {busy('all-csv') ? 'Mengekspor...' : 'Export CSV'}
          </button>
        </div>

        {/* 90 days */}
        <div className="exp-qcard">
          <div className="exp-icon-box" style={{ background: '#FDF4FF' }}>
            <Filter style={{ width: 22, height: 22, color: '#9333EA' }} />
          </div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#111827' }}>3 Bulan Terakhir</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>90 hari terakhir — Excel</div>
          <button
            className="exp-btn"
            style={{ background: '#9333EA' }}
            disabled={loading || busy('90d-xlsx')}
            onClick={() => doExport('90d-xlsx')}
          >
            <Download style={{ width: 15, height: 15 }} />
            {busy('90d-xlsx') ? 'Mengekspor...' : 'Export 3 Bulan'}
          </button>
        </div>
      </div>

      {/* Custom Export */}
      <div className="exp-card">
        <div className="exp-card-hdr">
          <h3>Custom Export</h3>
          <p>Filter data sebelum di-export</p>
        </div>
        <div className="exp-card-body">
          <div className="exp-filter-grid">
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Dari Tanggal</label>
              <input type="date" className="exp-ctrl" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Sampai Tanggal</label>
              <input type="date" className="exp-ctrl" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Kategori</label>
              <select className="exp-ctrl" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="all">Semua Kategori</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Wallet</label>
              <select className="exp-ctrl" value={walFilter} onChange={e => setWalFilter(e.target.value)}>
                <option value="all">Semua Wallet</option>
                {wallets.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              className="exp-btn"
              style={{ flex: 1, background: '#16A34A' }}
              disabled={loading || busy('custom-xlsx')}
              onClick={() => doExport('custom-xlsx')}
            >
              <Download style={{ width: 15, height: 15 }} />
              {busy('custom-xlsx') ? 'Mengekspor...' : 'Export Excel'}
            </button>
            <button
              className="exp-btn"
              style={{ flex: 1 }}
              disabled={loading || busy('custom-csv')}
              onClick={() => doExport('custom-csv')}
            >
              <Download style={{ width: 15, height: 15 }} />
              {busy('custom-csv') ? 'Mengekspor...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Reports */}
      <div className="exp-card">
        <div className="exp-card-hdr">
          <h3>Laporan Bulanan</h3>
          <p>Export per bulan dari data transaksi kamu</p>
        </div>
        <div className="exp-card-body">
          {loading && <p style={{ fontSize: 13, color: '#9CA3AF' }}>Memuat data...</p>}
          {!loading && monthlyReports.length === 0 && (
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Belum ada data transaksi.</p>
          )}
          {monthlyReports.map(({ key, label, total }) => (
            <div key={key} className="exp-month-row">
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>Total: {fmt(total)}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="exp-btn-sec"
                  style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}
                  disabled={!!busy(`month-xlsx-${key}`)}
                  onClick={() => doExport(`month-xlsx-${key}`)}
                >
                  <FileSpreadsheet style={{ width: 14, height: 14 }} />
                  {busy(`month-xlsx-${key}`) ? '...' : 'Excel'}
                </button>
                <button
                  className="exp-btn-sec"
                  disabled={!!busy(`month-csv-${key}`)}
                  onClick={() => doExport(`month-csv-${key}`)}
                >
                  <Download style={{ width: 14, height: 14 }} />
                  {busy(`month-csv-${key}`) ? '...' : 'CSV'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
