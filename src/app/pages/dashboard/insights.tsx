import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
} from 'recharts';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const H = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };

const fmt  = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');
const fmtK = (n: number) => {
  if (n === 0) return '0';
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'jt';
  if (Math.abs(n) >= 1000)    return Math.round(n / 1000) + 'rb';
  return String(Math.round(n));
};

const CAT_COLOR: Record<string, string> = {
  Makanan: '#2563EB', Transport: '#10B981', Belanja: '#8B5CF6',
  Tagihan: '#F59E0B', Kesehatan: '#EF4444', Hiburan: '#EC4899',
  Pemasukan: '#16A34A', Lainnya: '#6B7280',
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
    others: 'Lainnya', Others: 'Lainnya', Lainnya: 'Lainnya',
  };
  return m[c] || 'Lainnya';
}

const INS_CSS = `
  .ins-wrap { padding: 28px 32px 40px; max-width: 960px; margin: 0 auto; font-family: 'DM Sans', sans-serif; }
  .ins-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
  .ins-insight-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  @media (max-width: 900px) {
    .ins-wrap { padding: 16px 16px 24px; }
    .ins-two-col { grid-template-columns: 1fr; gap: 10px; }
    .ins-insight-grid { grid-template-columns: 1fr; }
  }
`;

const CARD: React.CSSProperties = {
  background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, overflow: 'hidden',
};
const CARD_HDR: React.CSSProperties = {
  padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};
const TT: React.CSSProperties = {
  backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 10, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export function DashboardInsights() {
  const navigate = useNavigate();
  const [txns,    setTxns]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = 'mira-ins-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = INS_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-ins-css')?.remove(); };
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }

    (async () => {
      try {
        const from = new Date(); from.setMonth(from.getMonth() - 6);
        const r = await fetch(
          `${SUPA_URL}/rest/v1/expenses?phone_number=eq.${ph}&date=gte.${from.toISOString().split('T')[0]}&order=date.desc&limit=2000`,
          { headers: H }
        );
        if (r.ok) { const a = await r.json(); if (Array.isArray(a)) setTxns(a); }
      } catch {}
      setLoading(false);
    })();
  }, []);

  // Listen for new transactions added via modal
  useEffect(() => {
    const refresh = () => {
      const ph = localStorage.getItem('mira_phone');
      if (!ph) return;
      fetch(`${SUPA_URL}/rest/v1/expenses?phone_number=eq.${ph}&date=gte.${(() => { const d = new Date(); d.setMonth(d.getMonth()-6); return d.toISOString().split('T')[0]; })()}&order=date.desc&limit=2000`, { headers: H })
        .then(r => r.json()).then(a => { if (Array.isArray(a)) setTxns(a); }).catch(() => {});
    };
    window.addEventListener('mira:tx-added', refresh);
    return () => window.removeEventListener('mira:tx-added', refresh);
  }, []);

  const s = useMemo(() => {
    const now = new Date();
    const isExp = (t: any) => t.transaction_type?.toLowerCase() !== 'income' && mapCat(t.category || '') !== 'Pemasukan';

    // Monthly trend — last 6 months
    const monthlyMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      monthlyMap[key] = 0;
    }
    txns.filter(isExp).forEach(t => {
      const d = new Date(t.date);
      const key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      if (key in monthlyMap) monthlyMap[key] += Number(t.amount || 0);
    });
    const monthlyTrend = Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount }));

    // This month category breakdown
    const mTxns = txns.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && isExp(t);
    });
    const catMap: Record<string, number> = {};
    mTxns.forEach(t => { const c = mapCat(t.category || ''); catMap[c] = (catMap[c] || 0) + Number(t.amount || 0); });
    const total = Object.values(catMap).reduce((s, v) => s + v, 0);
    const catData = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({
      name, value, color: CAT_COLOR[name] || '#6B7280', percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }));

    // Top merchants this month
    const merchantMap: Record<string, { amount: number; count: number }> = {};
    mTxns.forEach(t => {
      const key = t.merchant || t.item || mapCat(t.category || '');
      if (!merchantMap[key]) merchantMap[key] = { amount: 0, count: 0 };
      merchantMap[key].amount += Number(t.amount || 0);
      merchantMap[key].count += 1;
    });
    const topMerchants = Object.entries(merchantMap)
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 5)
      .map(([name, d]) => ({ name, ...d }));

    // Last month comparison
    const lmTxns = txns.filter(t => {
      const d = new Date(t.date);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear() && isExp(t);
    });
    const lastMonthTotal = lmTxns.reduce((s, t) => s + Number(t.amount || 0), 0);
    const changePct = lastMonthTotal > 0 ? ((total - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    const topCatName = catData[0]?.name || '';
    const topCatAmt  = catData[0]?.value || 0;

    // Day-of-week spending
    const dowMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const dowCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    txns.filter(isExp).forEach(t => {
      const dow = new Date(t.date).getDay();
      dowMap[dow] += Number(t.amount || 0);
      dowCount[dow]++;
    });
    const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dowData = DAYS.map((day, i) => ({ day, amount: dowCount[i] > 0 ? Math.round(dowMap[i] / dowCount[i]) : 0 }));
    const peakDay = DAYS[Object.entries(dowMap).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] as any] || '';

    return { monthlyTrend, catData, topMerchants, total, lastMonthTotal, changePct, topCatName, topCatAmt, dowData, peakDay };
  }, [txns]);

  if (loading) return (
    <div className="ins-wrap">
      <p style={{ color: '#6B7280', fontSize: 14 }}>Memuat insight...</p>
    </div>
  );

  if (txns.length === 0) return (
    <div className="ins-wrap" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
      <p style={{ color: '#6B7280', fontSize: 14 }}>Belum ada data. Mulai catat transaksi via WhatsApp atau tombol Catat.</p>
    </div>
  );

  const upDown = s.changePct >= 0 ? '▲' : '▼';
  const upDownColor = s.changePct >= 0 ? '#EF4444' : '#16A34A';

  return (
    <div className="ins-wrap">

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 600, margin: 0, color: '#111827' }}>Insight</h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Analisis keuangan berdasarkan data transaksimu</p>
      </div>

      {/* AI Insight cards */}
      <div className="ins-insight-grid">
        {s.topCatName && (
          <div style={{ ...CARD, padding: '16px 18px', background: '#EFF6FF', border: '1px solid rgba(37,99,235,0.15)' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>💡</div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Kategori Terbesar</p>
            <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
              Bulan ini <strong>{s.topCatName}</strong> menghabiskan <strong>{fmt(s.topCatAmt)}</strong> — {s.total > 0 ? Math.round((s.topCatAmt / s.total) * 100) : 0}% dari total pengeluaran.
            </p>
          </div>
        )}
        {s.lastMonthTotal > 0 && (
          <div style={{ ...CARD, padding: '16px 18px', background: s.changePct >= 0 ? '#FFF1F2' : '#F0FDF4', border: `1px solid ${s.changePct >= 0 ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)'}` }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{s.changePct >= 0 ? '📈' : '📉'}</div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Vs Bulan Lalu</p>
            <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
              Pengeluaran <span style={{ color: upDownColor, fontWeight: 600 }}>{upDown} {Math.abs(s.changePct).toFixed(0)}%</span> dibanding bulan lalu ({fmt(s.lastMonthTotal)}).
            </p>
          </div>
        )}
        {s.peakDay && (
          <div style={{ ...CARD, padding: '16px 18px', background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>📅</div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Hari Tertinggi</p>
            <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
              Rata-rata pengeluaran tertinggi di hari <strong>{s.peakDay}</strong>. Coba lebih bijak di hari tersebut.
            </p>
          </div>
        )}
        {s.topCatName && (
          <div style={{ ...CARD, padding: '16px 18px', background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.15)' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>✨</div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Saving Opportunity</p>
            <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
              Hemat <strong>{fmt(Math.round(s.topCatAmt * 0.15))}</strong> dengan mengurangi 15% dari {s.topCatName}.
            </p>
          </div>
        )}
      </div>

      {/* Monthly trend */}
      <div style={{ ...CARD, marginBottom: 20 }}>
        <div style={CARD_HDR}>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, margin: 0, color: '#111827' }}>Tren Pengeluaran 6 Bulan</h3>
        </div>
        <div style={{ padding: '12px 20px 20px' }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={s.monthlyTrend}>
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtK} width={40} />
              <Tooltip formatter={(v: number) => [fmt(v), 'Pengeluaran']} contentStyle={TT} />
              <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2.5}
                dot={{ fill: '#fff', stroke: '#2563EB', r: 3, strokeWidth: 2 }}
                activeDot={{ fill: '#2563EB', r: 5, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category + Day of week */}
      <div className="ins-two-col">
        {/* Category breakdown */}
        <div style={CARD}>
          <div style={CARD_HDR}>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, margin: 0, color: '#111827' }}>Kategori Bulan Ini</h3>
          </div>
          <div style={{ padding: '12px 20px 20px' }}>
            {s.catData.length === 0
              ? <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Belum ada data</p>
              : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={s.catData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                        {s.catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [fmt(v)]} contentStyle={TT} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {s.catData.slice(0, 5).map(({ name, value, color, percentage }) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                          <span style={{ fontSize: 13, color: '#374151' }}>{name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{percentage}%</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#111827', minWidth: 80, textAlign: 'right' }}>{fmt(value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            }
          </div>
        </div>

        {/* Day of week spending */}
        <div style={CARD}>
          <div style={CARD_HDR}>
            <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, margin: 0, color: '#111827' }}>Rata-rata per Hari</h3>
          </div>
          <div style={{ padding: '12px 20px 20px' }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={s.dowData} barSize={24}>
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtK} width={38} />
                <Tooltip formatter={(v: number) => [fmt(v), 'Rata-rata']} contentStyle={TT} cursor={{ fill: '#F1F4F8' }} />
                <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top merchants */}
      <div style={CARD}>
        <div style={CARD_HDR}>
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, margin: 0, color: '#111827' }}>Top Merchant Bulan Ini</h3>
        </div>
        <div style={{ padding: '4px 0' }}>
          {s.topMerchants.length === 0
            ? <p style={{ padding: '16px 20px', fontSize: 13, color: '#9CA3AF', margin: 0 }}>Belum ada data</p>
            : s.topMerchants.map((m, i) => (
              <div key={m.name} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px',
                borderBottom: i < s.topMerchants.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#EFF6FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Sora',sans-serif", fontSize: 12, fontWeight: 700, color: '#1D4ED8', flexShrink: 0,
                }}>#{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{m.count} transaksi</div>
                </div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 600, color: '#111827' }}>{fmt(m.amount)}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
