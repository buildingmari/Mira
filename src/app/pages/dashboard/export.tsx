import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Download, FileText, Calendar, Filter } from 'lucide-react';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const H = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };

const fmt = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');

function mapCat(c: string) {
  const m: Record<string, string> = {
    food: 'Makanan', Food: 'Makanan', makanan: 'Makanan', Makanan: 'Makanan',
    transport: 'Transport', Transport: 'Transport',
    shopping: 'Belanja', Shopping: 'Belanja', Belanja: 'Belanja',
    bills: 'Tagihan', Bills: 'Tagihan', Tagihan: 'Tagihan', utilities: 'Tagihan',
    health: 'Kesehatan', Health: 'Kesehatan', Kesehatan: 'Kesehatan',
    entertainment: 'Hiburan', Entertainment: 'Hiburan', Hiburan: 'Hiburan',
    income: 'Pemasukan', Income: 'Pemasukan', Pemasukan: 'Pemasukan', salary: 'Pemasukan',
  };
  return m[c] || c || 'Lainnya';
}

// --- CSV helpers ---
function toCSV(rows: any[]): string {
  const headers = ['Tanggal', 'Merchant', 'Kategori', 'Wallet', 'Jumlah', 'Tipe'];
  const lines   = [headers.join(',')];
  rows.forEach(t => {
    lines.push([
      t.date || '',
      `"${(t.merchant || t.item || '').replace(/"/g, '""')}"`,
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

  // Inject page CSS
  useEffect(() => {
    const id = 'mira-exp-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = EXP_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-exp-css')?.remove(); };
  }, []);

  // Auth guard + fetch all transactions
  useEffect(() => {
    const ph = sessionStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }

    (async () => {
      try {
        const r = await fetch(
          `${SUPA_URL}/rest/v1/expenses?phone_number=eq.${ph}&order=date.desc&limit=2000`,
          { headers: H }
        );
        if (r.ok) {
          const a = await r.json();
          if (Array.isArray(a)) setTxns(a);
        }
      } catch { /* show empty state */ }
      setLoading(false);
    })();
  }, []);

  // Monthly aggregates
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
      .slice(0, 6)
      .map(([key, v]) => ({ key, ...v }));
  }, [txns]);

  // Unique categories and wallets for filter dropdowns
  const cats    = useMemo(() => [...new Set(txns.map(t => mapCat(t.category || '')))].sort(), [txns]);
  const wallets = useMemo(() => [...new Set(txns.map(t => t.wallet || '').filter(Boolean))].sort(), [txns]);

  // Apply custom filters
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

  // Export handlers
  const doExport = async (type: 'all-csv' | 'custom-csv' | string) => {
    setExporting(type);
    try {
      let rows: any[];
      let label = 'semua';

      if (type === 'all-csv') {
        rows  = txns;
        label = 'semua';
      } else if (type === 'custom-csv') {
        rows  = getFiltered();
        label = 'custom';
      } else if (type.startsWith('month-')) {
        const key = type.replace('month-', '');
        rows  = txns.filter(t => {
          const d = new Date(t.date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === key;
        });
        label = key;
      } else {
        rows = txns;
      }

      if (rows.length === 0) {
        alert('Tidak ada data untuk di-export dengan filter ini.');
        setExporting(null);
        return;
      }

      const csv      = toCSV(rows);
      const filename = `MIRA_transaksi_${label}_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csv, filename);
    } catch { /* noop */ }
    setExporting(null);
  };

  const busy = (key: string) => exporting === key;

  return (
    <div className="exp-wrap">

      {/* Quick Export */}
      <div className="exp-grid3">
        {/* All Data — CSV */}
        <div className="exp-qcard">
          <div className="exp-icon-box">
            <FileText style={{ width: 22, height: 22, color: '#2563EB' }} />
          </div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#111827' }}>CSV</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>Semua transaksi, .csv format</div>
          <button
            className="exp-btn"
            disabled={loading || busy('all-csv')}
            onClick={() => doExport('all-csv')}
          >
            <Download style={{ width: 15, height: 15 }} />
            {busy('all-csv') ? 'Mengekspor...' : 'Export CSV'}
          </button>
        </div>

        {/* This Month */}
        <div className="exp-qcard">
          <div className="exp-icon-box" style={{ background: '#F0FDF4' }}>
            <Calendar style={{ width: 22, height: 22, color: '#16A34A' }} />
          </div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#111827' }}>Bulan Ini</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>
            {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </div>
          <button
            className="exp-btn"
            style={{ background: '#16A34A' }}
            disabled={loading || busy('month-current')}
            onClick={() => {
              const d   = new Date();
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              doExport(`month-${key}`);
            }}
          >
            <Download style={{ width: 15, height: 15 }} />
            {busy('month-current') ? 'Mengekspor...' : 'Export Bulan Ini'}
          </button>
        </div>

        {/* Last 3 Months */}
        <div className="exp-qcard">
          <div className="exp-icon-box" style={{ background: '#FDF4FF' }}>
            <Filter style={{ width: 22, height: 22, color: '#9333EA' }} />
          </div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#111827' }}>3 Bulan Terakhir</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>90 hari terakhir</div>
          <button
            className="exp-btn"
            style={{ background: '#9333EA' }}
            disabled={loading || busy('3month')}
            onClick={() => {
              const cutoff = new Date();
              cutoff.setDate(cutoff.getDate() - 90);
              const rows = txns.filter(t => new Date(t.date) >= cutoff);
              const csv  = toCSV(rows);
              downloadCSV(csv, `MIRA_90hari_${new Date().toISOString().split('T')[0]}.csv`);
            }}
          >
            <Download style={{ width: 15, height: 15 }} />
            Export 3 Bulan
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
              style={{ flex: 1 }}
              disabled={loading || busy('custom-csv')}
              onClick={() => doExport('custom-csv')}
            >
              <Download style={{ width: 15, height: 15 }} />
              {busy('custom-csv') ? 'Mengekspor...' : 'Export as CSV'}
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
          {loading && (
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Memuat data...</p>
          )}
          {!loading && monthlyReports.length === 0 && (
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Belum ada data transaksi.</p>
          )}
          {monthlyReports.map(({ key, label, total }) => (
            <div key={key} className="exp-month-row">
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>Total: {fmt(total)}</p>
              </div>
              <button
                className="exp-btn-sec"
                disabled={busy(`month-${key}`)}
                onClick={() => doExport(`month-${key}`)}
              >
                <Download style={{ width: 14, height: 14 }} />
                {busy(`month-${key}`) ? 'Downloading...' : 'CSV'}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
