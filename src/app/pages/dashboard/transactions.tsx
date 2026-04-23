import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const H = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };

const fmt = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');

const CAT_COLOR: Record<string, string> = {
  Makanan: '#2563EB', Transport: '#10B981', Belanja: '#8B5CF6',
  Tagihan: '#F59E0B', Kesehatan: '#EF4444', Hiburan: '#EC4899',
  Pemasukan: '#16A34A', Investasi: '#0891B2', Others: '#6B7280',
};
const CAT_BG: Record<string, string> = {
  Makanan: '#EFF6FF', Transport: '#ECFDF5', Belanja: '#F5F3FF',
  Tagihan: '#FFFBEB', Kesehatan: '#FFF1F2', Hiburan: '#FDF2F8',
  Pemasukan: '#F0FDF4', Investasi: '#ECFEFF', Others: '#F1F4F8',
};
const CAT_EMOJI: Record<string, string> = {
  Makanan: '🍜', Transport: '🚗', Belanja: '🛒',
  Tagihan: '💡', Kesehatan: '❤️', Hiburan: '🎮',
  Pemasukan: '💰', Investasi: '📈', Others: '✨',
};

function mapCat(c: string) {
  const m: Record<string, string> = {
    food: 'Makanan', Food: 'Makanan', makanan: 'Makanan', Makanan: 'Makanan',
    'food & drinks': 'Makanan', 'Food & Drinks': 'Makanan', 'makanan & minuman': 'Makanan',
    transport: 'Transport', Transport: 'Transport', transportation: 'Transport', Transportation: 'Transport',
    shopping: 'Belanja', Shopping: 'Belanja', Belanja: 'Belanja',
    bills: 'Tagihan', Bills: 'Tagihan', Tagihan: 'Tagihan', utilities: 'Tagihan',
    health: 'Kesehatan', Health: 'Kesehatan', Kesehatan: 'Kesehatan',
    entertainment: 'Hiburan', Entertainment: 'Hiburan', Hiburan: 'Hiburan',
    income: 'Pemasukan', Income: 'Pemasukan', Pemasukan: 'Pemasukan', salary: 'Pemasukan',
    'savings & investment': 'Investasi', investasi: 'Investasi', investment: 'Investasi',
  };
  return m[c] || m[c?.toLowerCase()] || 'Others';
}

const TXN_CSS = `
  .txn-wrap  { padding: 28px 32px 40px; max-width: 960px; margin: 0 auto;
               font-family: 'DM Sans', sans-serif; }
  .txn-card  { background: #fff; border: 1px solid rgba(0,0,0,0.07);
               border-radius: 16px; overflow: hidden; }
  .txn-hdr   { padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.07);
               display: flex; align-items: center; justify-content: space-between; }
  .txn-row   { display: flex; align-items: center; gap: 12px; padding: 14px 20px;
               border-bottom: 1px solid rgba(0,0,0,0.05); transition: background .12s; }
  .txn-row:last-child { border-bottom: none; }
  .txn-row:hover { background: #F8F9FB; }
  .txn-ctrl  { height: 40px; border: 1px solid rgba(0,0,0,0.10); border-radius: 9px;
               padding: 0 12px; font-size: 13px; font-family: 'DM Sans', sans-serif;
               background: #F8F9FB; outline: none; box-sizing: border-box; }
  .txn-ctrl:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
  .txn-badge { display: inline-flex; align-items: center; padding: 3px 9px;
               border-radius: 20px; font-size: 11px; font-weight: 500; }
  .txn-filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; align-items: center; }
  .txn-chip-active { display: inline-flex; align-items: center; gap: 5px; background: #EFF6FF;
                     border: 1px solid #BFDBFE; border-radius: 20px; padding: 4px 10px;
                     font-size: 12px; color: #1D4ED8; font-weight: 500; }
  .txn-chip-active button { background: none; border: none; cursor: pointer; color: #93C5FD; padding: 0; display: flex; }
  .txn-reset { height: 32px; padding: 0 12px; background: #FEF2F2; border: 1px solid #FECACA;
               border-radius: 8px; font-size: 12px; color: #DC2626; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .dark .txn-card { background: #1E293B; border-color: rgba(255,255,255,0.08); }
  .dark .txn-hdr  { border-color: rgba(255,255,255,0.08); }
  .dark .txn-row:hover { background: rgba(255,255,255,0.04); }
  .dark .txn-row  { border-color: rgba(255,255,255,0.05); }
  .dark .txn-ctrl { background: #0F172A; border-color: rgba(255,255,255,0.12); color: #F1F5F9; }
  @media (max-width: 900px) {
    .txn-wrap { padding: 16px 16px 24px; }
    .txn-row  { padding: 12px 16px; }
  }
`;

const FILTER_CATEGORIES = ['Makanan', 'Transport', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Pemasukan', 'Investasi', 'Others'];

export function DashboardTransactions() {
  const navigate = useNavigate();
  const [phone,   setPhone]   = useState('');
  const [txns,    setTxns]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [catF,    setCatF]    = useState<string[]>([]);
  const [walletF, setWalletF] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const id = 'mira-txn-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = TXN_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-txn-css')?.remove(); };
  }, []);

  // Build Supabase query URL from server-side filters
  const buildQuery = useCallback((ph: string, start: string, end: string, wallet: string) => {
    let url = `${SUPA_URL}/rest/v1/expenses?phone_number=eq.${ph}&order=date.desc,created_at.desc&limit=1000`;
    if (start) url += `&date=gte.${start}`;
    if (end)   url += `&date=lte.${end}`;
    if (wallet !== 'all' && wallet) url += `&wallet=eq.${encodeURIComponent(wallet)}`;
    return url;
  }, []);

  const loadTxns = useCallback(async (ph: string, start = '', end = '', wallet = 'all') => {
    setLoading(true);
    try {
      const r = await fetch(buildQuery(ph, start, end, wallet), { headers: H });
      if (r.ok) {
        const a = await r.json();
        if (Array.isArray(a)) setTxns(a);
      }
    } catch {}
    setLoading(false);
  }, [buildQuery]);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }
    setPhone(ph);
    loadTxns(ph);
  }, []);

  // Re-query Supabase when server-side filters change (debounced)
  useEffect(() => {
    if (!phone) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadTxns(phone, startDate, endDate, walletF);
    }, 350);
  }, [startDate, endDate, walletF]);

  // Listen for new transaction events
  useEffect(() => {
    const handler = () => {
      if (phone) loadTxns(phone, startDate, endDate, walletF);
    };
    window.addEventListener('mira:tx-added', handler);
    return () => window.removeEventListener('mira:tx-added', handler);
  }, [phone, startDate, endDate, walletF]);

  // Client-side: search + category multi-select
  const filtered = useMemo(() => txns.filter(t => {
    const q = search.toLowerCase();
    const matchS = !q ||
      (t.merchant || '').toLowerCase().includes(q) ||
      (t.item     || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q);
    const cat = mapCat(t.category || '');
    const matchCat = catF.length === 0 || catF.includes(cat);
    return matchS && matchCat;
  }), [txns, search, catF]);

  const wallets = useMemo(() => [...new Set(txns.map(t => t.wallet || '').filter(Boolean))].sort(), [txns]);

  const hasFilters = catF.length > 0 || walletF !== 'all' || startDate || endDate || search;

  const resetFilters = () => {
    setCatF([]);
    setWalletF('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  const toggleCat = (c: string) => setCatF(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  return (
    <div className="txn-wrap">
      {/* Filter bar */}
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <input
            className="txn-ctrl"
            style={{ flex: '1 1 180px', minWidth: 140 }}
            placeholder="🔍  Cari merchant, kategori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {/* Date range */}
          <input type="date" className="txn-ctrl" value={startDate} onChange={e => setStartDate(e.target.value)}
            style={{ flex: '0 1 140px' }} title="Dari tanggal" />
          <input type="date" className="txn-ctrl" value={endDate} onChange={e => setEndDate(e.target.value)}
            style={{ flex: '0 1 140px' }} title="Sampai tanggal" />
          {/* Wallet */}
          <select className="txn-ctrl" value={walletF} onChange={e => setWalletF(e.target.value)}
            style={{ flex: '0 1 140px' }}>
            <option value="all">Semua Wallet</option>
            {wallets.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{ height: 40, padding: '0 12px', background: showFilters ? '#EFF6FF' : '#F8F9FB', border: `1px solid ${showFilters ? '#BFDBFE' : 'rgba(0,0,0,0.10)'}`, borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: showFilters ? '#1D4ED8' : '#374151', fontFamily: "'DM Sans',sans-serif" }}
          >
            <SlidersHorizontal style={{ width: 14, height: 14 }} />
            Kategori {catF.length > 0 && `(${catF.length})`}
            <ChevronDown style={{ width: 13, height: 13, transform: showFilters ? 'rotate(180deg)' : '', transition: 'transform .2s' }} />
          </button>
          {hasFilters && (
            <button className="txn-reset" onClick={resetFilters}>Reset filter</button>
          )}
        </div>

        {/* Category multi-select chips */}
        {showFilters && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {FILTER_CATEGORIES.map(c => {
              const active = catF.includes(c);
              return (
                <button key={c} onClick={() => toggleCat(c)} style={{
                  padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${active ? CAT_COLOR[c] || '#2563EB' : 'rgba(0,0,0,0.10)'}`,
                  background: active ? (CAT_BG[c] || '#EFF6FF') : '#F8F9FB',
                  color: active ? (CAT_COLOR[c] || '#2563EB') : '#374151',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                  transition: 'all .15s',
                }}>
                  {CAT_EMOJI[c] || '✨'} {c}
                </button>
              );
            })}
          </div>
        )}

        {/* Active filter chips */}
        {hasFilters && (
          <div className="txn-filter-bar" style={{ marginTop: 8, marginBottom: 0 }}>
            {search && (
              <span className="txn-chip-active">
                Cari: "{search}" <button onClick={() => setSearch('')}><X style={{ width: 10, height: 10 }} /></button>
              </span>
            )}
            {startDate && (
              <span className="txn-chip-active">
                Dari: {startDate} <button onClick={() => setStartDate('')}><X style={{ width: 10, height: 10 }} /></button>
              </span>
            )}
            {endDate && (
              <span className="txn-chip-active">
                S/d: {endDate} <button onClick={() => setEndDate('')}><X style={{ width: 10, height: 10 }} /></button>
              </span>
            )}
            {walletF !== 'all' && (
              <span className="txn-chip-active">
                Wallet: {walletF} <button onClick={() => setWalletF('all')}><X style={{ width: 10, height: 10 }} /></button>
              </span>
            )}
            {catF.map(c => (
              <span key={c} className="txn-chip-active">
                {c} <button onClick={() => toggleCat(c)}><X style={{ width: 10, height: 10 }} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="txn-card">
        <div className="txn-hdr">
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, margin: 0, color: '#111827' }}>
            Riwayat Transaksi
          </h3>
          <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
            {loading ? '...' : `${filtered.length} transaksi`}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            Memuat transaksi...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            {txns.length === 0 ? 'Belum ada transaksi.' : 'Tidak ada transaksi yang cocok dengan filter.'}
          </div>
        ) : (
          filtered.map((t, i) => {
            const cat   = mapCat(t.category || '');
            const bg    = CAT_BG[cat]    || '#F1F4F8';
            const clr   = CAT_COLOR[cat] || '#6B7280';
            const emoji = CAT_EMOJI[cat] || '✨';
            const isIn  = t.transaction_type?.toLowerCase() === 'income' || cat === 'Pemasukan';
            const ds    = new Date(t.date).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'short', year: 'numeric',
            });
            return (
              <div key={t.id || i} className="txn-row">
                <div style={{
                  width: 42, height: 42, borderRadius: 10, background: bg, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500, color: '#111827',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {t.merchant || t.item || cat}
                  </div>
                  <div style={{
                    fontSize: 12, color: '#9CA3AF', marginTop: 2,
                    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                  }}>
                    <span className="txn-badge" style={{ background: bg, color: clr }}>{cat}</span>
                    {t.wallet && <span>{t.wallet}</span>}
                    <span>{ds}</span>
                  </div>
                </div>
                <div style={{
                  fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600,
                  color: isIn ? '#16A34A' : '#111827', flexShrink: 0, textAlign: 'right',
                }}>
                  {isIn ? '+' : '−'} {fmt(Number(t.amount || 0))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
