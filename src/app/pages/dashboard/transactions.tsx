import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const H = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };

const fmt = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');

const CAT_COLOR: Record<string, string> = {
  Makanan: '#2563EB', Transport: '#10B981', Belanja: '#8B5CF6',
  Tagihan: '#F59E0B', Kesehatan: '#EF4444', Hiburan: '#EC4899',
  Pemasukan: '#16A34A', Others: '#6B7280',
};
const CAT_BG: Record<string, string> = {
  Makanan: '#EFF6FF', Transport: '#ECFDF5', Belanja: '#F5F3FF',
  Tagihan: '#FFFBEB', Kesehatan: '#FFF1F2', Hiburan: '#FDF2F8',
  Pemasukan: '#F0FDF4', Others: '#F1F4F8',
};
const CAT_EMOJI: Record<string, string> = {
  Makanan: '\uD83C\uDF5C', Transport: '\uD83D\uDE97', Belanja: '\uD83D\uDED2',
  Tagihan: '\uD83D\uDCA1', Kesehatan: '\u2764\uFE0F', Hiburan: '\uD83C\uDFAE',
  Pemasukan: '\uD83D\uDCB0', Others: '\u2728',
};

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
  return m[c] || 'Makanan';
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
  .txn-filters { display: grid; grid-template-columns: 1fr 1fr 1fr;
                 gap: 12px; margin-bottom: 20px; }
  .txn-ctrl  { height: 44px; border: 1px solid rgba(0,0,0,0.10); border-radius: 10px;
               padding: 0 14px; font-size: 14px; font-family: 'DM Sans', sans-serif;
               background: #F8F9FB; outline: none; width: 100%; box-sizing: border-box; }
  .txn-ctrl:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
  .txn-badge { display: inline-flex; align-items: center; padding: 3px 9px;
               border-radius: 20px; font-size: 11px; font-weight: 500; }
  @media (max-width: 900px) {
    .txn-wrap    { padding: 16px 16px 24px; }
    .txn-filters { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .txn-row { padding: 12px 16px; }
  }
`;

export function DashboardTransactions() {
  const navigate = useNavigate();
  const [txns,    setTxns]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [catF,    setCatF]    = useState('all');
  const [walletF, setWalletF] = useState('all');

  useEffect(() => {
    const id = 'mira-txn-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = TXN_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-txn-css')?.remove(); };
  }, []);

  const loadTxns = async (ph: string) => {
    try {
      const r = await fetch(
        `${SUPA_URL}/rest/v1/expenses?phone_number=eq.${ph}&order=date.desc,created_at.desc&limit=1000`,
        { headers: H }
      );
      if (r.ok) {
        const a = await r.json();
        if (Array.isArray(a)) setTxns(a);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }
    loadTxns(ph);
  }, []);

  // Refresh after new transaction added
  useEffect(() => {
    const handler = () => {
      const ph = localStorage.getItem('mira_phone');
      if (ph) loadTxns(ph);
    };
    window.addEventListener('mira:tx-added', handler);
    return () => window.removeEventListener('mira:tx-added', handler);
  }, []);

  const filtered = useMemo(() => txns.filter(t => {
    const q = search.toLowerCase();
    const matchS = !q ||
      (t.merchant || '').toLowerCase().includes(q) ||
      (t.item     || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q);
    const cat = mapCat(t.category || '');
    return matchS &&
      (catF    === 'all' || cat === catF) &&
      (walletF === 'all' || (t.wallet || '') === walletF);
  }), [txns, search, catF, walletF]);

  const cats    = useMemo(() => [...new Set(txns.map(t => mapCat(t.category || '')))].sort(), [txns]);
  const wallets = useMemo(() => [...new Set(txns.map(t => t.wallet || '').filter(Boolean))].sort(), [txns]);

  if (loading) return (
    <div className="txn-wrap">
      <p style={{ color: '#6B7280', fontSize: 14 }}>Memuat transaksi...</p>
    </div>
  );

  if (txns.length === 0) return (
    <div className="txn-wrap" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>\uD83D\uDCB8</div>
      <p style={{ color: '#6B7280', fontSize: 14 }}>Belum ada transaksi. Mulai catat via WhatsApp atau tombol Catat.</p>
    </div>
  );

  return (
    <div className="txn-wrap">
      <div className="txn-filters">
        <input
          className="txn-ctrl"
          placeholder="\uD83D\uDD0D  Cari merchant, kategori..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="txn-ctrl" value={catF} onChange={e => setCatF(e.target.value)}>
          <option value="all">Semua Kategori</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="txn-ctrl" value={walletF} onChange={e => setWalletF(e.target.value)}>
          <option value="all">Semua Wallet</option>
          {wallets.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      <div className="txn-card">
        <div className="txn-hdr">
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, margin: 0, color: '#111827' }}>
            Riwayat Transaksi
          </h3>
          <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
            {filtered.length} transaksi
          </span>
        </div>

        {filtered.length === 0
          ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
              Tidak ada transaksi yang cocok
            </div>
          )
          : filtered.map((t, i) => {
              const cat   = mapCat(t.category || '');
              const bg    = CAT_BG[cat]    || '#F1F4F8';
              const clr   = CAT_COLOR[cat] || '#6B7280';
              const emoji = CAT_EMOJI[cat] || '\u2728';
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
                    {isIn ? '+' : '\u2212'} {fmt(Number(t.amount || 0))}
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
