import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar,
} from 'recharts';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const HEADERS  = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };

const fmt = (n: number) => 'Rp' + Math.abs(n).toLocaleString('id-ID');

const CAT_COLOR: Record<string, string> = {
  Makanan: '#2563EB', Transport: '#10B981', Belanja: '#8B5CF6',
  Tagihan: '#F59E0B', Kesehatan: '#EF4444', Hiburan: '#EC4899',
  Pemasukan: '#16A34A', Others: '#6B7280',
};
const CAT_BG: Record<string, string> = {
  Makanan: '#FEE2E2', Transport: '#EDE9FE', Belanja: '#FEF3C7',
  Tagihan: '#FEF9C3', Kesehatan: '#D1FAE5', Hiburan: '#FCE7F3',
  Pemasukan: '#D1FAE5', Others: '#F1F4F8',
};
const CAT_EMOJI: Record<string, string> = {
  Makanan: '\uD83C\uDF5C', Transport: '\uD83D\uDE97', Belanja: '\uD83D\uDED2',
  Tagihan: '\uD83D\uDCB3', Kesehatan: '\u2764\uFE0F', Hiburan: '\uD83D\uDCF1',
  Pemasukan: '\uD83D\uDCB0', Others: '\u2728',
};

function mapCat(c: string) {
  const m: Record<string, string> = {
    food:'Makanan',Food:'Makanan',makanan:'Makanan',Makanan:'Makanan',
    transport:'Transport',Transport:'Transport',
    shopping:'Belanja',Shopping:'Belanja',Belanja:'Belanja',
    bills:'Tagihan',Bills:'Tagihan',Tagihan:'Tagihan',utilities:'Tagihan',
    health:'Kesehatan',Health:'Kesehatan',Kesehatan:'Kesehatan',
    entertainment:'Hiburan',Entertainment:'Hiburan',Hiburan:'Hiburan',
    income:'Pemasukan',Income:'Pemasukan',Pemasukan:'Pemasukan',salary:'Pemasukan',
  };
  return m[c] || 'Makanan';
}

const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Selamat pagi' : h < 17 ? 'Selamat siang' : 'Selamat malam';
};

export function DashboardOverview() {
  const navigate = useNavigate();
  const [user, setUser]   = useState<Record<string, any> | null>(null);
  const [txns, setTxns]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ph = sessionStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }

    // Load cached user first
    try {
      const raw = sessionStorage.getItem('mira_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}

    const load = async () => {
      try {
        // Fresh fetch user
        const uRes = await fetch(
          `${SUPA_URL}/rest/v1/users?primary_phone=eq.${ph}&select=*`,
          { headers: HEADERS }
        );
        if (uRes.ok) {
          const uData = await uRes.json();
          if (Array.isArray(uData) && uData.length > 0) {
            const u = uData[0];
            sessionStorage.setItem('mira_user', JSON.stringify(u));
            setUser(u);
          }
        }
      } catch {}

      try {
        // Fetch last 90 days of expenses
        const from90 = new Date();
        from90.setDate(from90.getDate() - 90);
        const fromStr = from90.toISOString().split('T')[0];
        const tRes = await fetch(
          `${SUPA_URL}/rest/v1/expenses?phone_number=eq.${ph}&date=gte.${fromStr}&order=date.desc,created_at.desc&limit=500`,
          { headers: HEADERS }
        );
        if (tRes.ok) {
          const expenses = await tRes.json();
          if (Array.isArray(expenses)) setTxns(expenses);
        }
      } catch {}

      setLoading(false);
    };

    load();
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    const now      = new Date();
    const curMonth = now.getMonth();
    const curYear  = now.getFullYear();

    const monthTxns = txns.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === curMonth && d.getFullYear() === curYear
        && t.transaction_type?.toLowerCase() !== 'income'
        && mapCat(t.category || '') !== 'Pemasukan';
    });

    const last7 = txns.filter(t => {
      const d = new Date(t.date);
      const ago = new Date(now.getTime() - 7 * 86400000);
      return d >= ago;
    });

    const totalBulanIni = monthTxns.reduce((s, t) => s + Number(t.amount || 0), 0);
    const monthlyLimit  = Number(user?.monthly_limit)  || 5000000;
    const savingsGoal   = Number(user?.savings_goal)   || 2000000;
    const sisaLimit     = monthlyLimit - totalBulanIni;
    const pctUsed       = Math.min((totalBulanIni / monthlyLimit) * 100, 100);
    const currentSaved  = totalBulanIni * 0.3;
    const goalPct       = Math.min((currentSaved / savingsGoal) * 100, 100);
    const isOnTrack     = totalBulanIni <= monthlyLimit;

    // Category breakdown (this month)
    const catMap: Record<string, number> = {};
    monthTxns.forEach(t => {
      const c = mapCat(t.category || '');
      catMap[c] = (catMap[c] || 0) + Number(t.amount || 0);
    });
    const catData = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, color: CAT_COLOR[name] || '#6B7280' }));

    // Highest category last 7 days
    const last7Map: Record<string, number> = {};
    last7.forEach(t => {
      const c = mapCat(t.category || '');
      last7Map[c] = (last7Map[c] || 0) + Number(t.amount || 0);
    });
    let topCat = '', topAmt = 0;
    Object.entries(last7Map).forEach(([c, a]) => { if (a > topAmt) { topAmt = a; topCat = c; } });

    // 7-day trend
    const dateMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      dateMap[key] = 0;
    }
    last7.forEach(t => {
      const key = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (key in dateMap) dateMap[key] += Number(t.amount || 0);
    });
    const trendData = Object.entries(dateMap).map(([date, amount]) => ({ date, amount }));

    // Wallet usage
    const walletMap: Record<string, number> = {};
    monthTxns.forEach(t => {
      const w = t.wallet || 'Lainnya';
      walletMap[w] = (walletMap[w] || 0) + Number(t.amount || 0);
    });
    const walletData = Object.entries(walletMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, amount]) => ({ name, amount }));

    // Recent 5 txns
    const recentTxns = [...txns].slice(0, 5);

    return {
      totalBulanIni, monthlyLimit, sisaLimit, pctUsed,
      currentSaved, goalPct, isOnTrack,
      catData, topCat, topAmt, trendData, walletData, recentTxns,
    };
  }, [txns, user]);

  const ttStyle = {
    backgroundColor: '#fff',
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 10, fontSize: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  };

  // Loading
  if (loading) {
    return (
      <div style={{ padding: '40px 32px' }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
          {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} \uD83D\uDC4B
        </div>
        <p style={{ color: '#6B7280', fontSize: 14 }}>Memuat data keuangan kamu...</p>
      </div>
    );
  }

  // Empty
  if (txns.length === 0) {
    return (
      <div style={{ padding: '40px 32px' }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
          {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} \uD83D\uDC4B
        </div>
        <div style={{ marginTop: 40, textAlign: 'center', color: '#6B7280' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>\uD83D\uDCB0</div>
          <p style={{ fontSize: 14 }}>Belum ada transaksi. Mulai catat via WhatsApp.</p>
        </div>
      </div>
    );
  }

  const s = stats;

  return (
    <div style={{ padding: '28px 32px 40px', maxWidth: 960, margin: '0 auto' }}
      className="dashboard-content">
      <style>{`
        @media(max-width:900px){.dashboard-content{padding:16px 16px 24px!important}}
        @media(max-width:600px){.stat-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}}
        @media(max-width:900px){.two-col{grid-template-columns:1fr!important}}
      `}</style>

      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: -0.5 }}>
          {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} \uD83D\uDC4B
        </h1>
        <p style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Hero card */}
      <div style={{
        background: 'linear-gradient(135deg,#1D4ED8 0%,#2563EB 60%,#3B82F6 100%)',
        borderRadius: 20, padding: '24px 28px', color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', right:-40, top:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        <div>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Pengeluaran Bulan Ini</div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 32, fontWeight: 600, letterSpacing: -1.5, lineHeight: 1 }}>
            {fmt(s.totalBulanIni)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: s.isOnTrack ? '#6EE7B7' : '#FCA5A5', fontWeight: 500 }}>
              {s.isOnTrack ? '\u2713 On Track' : '! Over Budget'}
            </span>
            <span>dari {fmt(s.monthlyLimit)}</span>
          </div>
        </div>
        <div className="hero-stats" style={{ display:'flex', gap:24, textAlign:'right' }}>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:18, fontWeight:600 }}>{fmt(s.sisaLimit)}</div>
            <div style={{ fontSize:11, opacity:0.65, marginTop:2 }}>Sisa limit</div>
          </div>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:18, fontWeight:600 }}>{s.goalPct.toFixed(0)}%</div>
            <div style={{ fontSize:11, opacity:0.65, marginTop:2 }}>Goal progress</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
        {/* Pengeluaran */}
        <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:16, padding:'16px 18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:16 }}>\uD83D\uDCB8</span>
            </div>
            <span style={{ fontSize:11, padding:'2px 7px', borderRadius:20, fontWeight:500, background: s.isOnTrack?'#D1FAE5':'#FEE2E2', color: s.isOnTrack?'#065F46':'#991B1B' }}>
              {s.pctUsed.toFixed(0)}% used
            </span>
          </div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontSize:18, fontWeight:700, letterSpacing:-0.5, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {fmt(s.totalBulanIni)}
          </div>
          <div style={{ fontSize:12, color:'#6B7280' }}>Pengeluaran</div>
        </div>

        {/* Tabungan */}
        <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:16, padding:'16px 18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:'#D1FAE5', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:16 }}>\uD83C\uDF1F</span>
            </div>
            <span style={{ fontSize:11, padding:'2px 7px', borderRadius:20, fontWeight:500, background:'#D1FAE5', color:'#065F46' }}>
              {s.goalPct.toFixed(0)}%
            </span>
          </div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontSize:18, fontWeight:700, letterSpacing:-0.5, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {fmt(s.currentSaved)}
          </div>
          <div style={{ fontSize:12, color:'#6B7280' }}>Tabungan est.</div>
        </div>

        {/* Status */}
        <div style={{ background:'#fff', border:`1px solid ${s.isOnTrack?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}`, borderRadius:16, padding:'16px 18px' }}>
          <div style={{ width:34, height:34, borderRadius:8, background: s.isOnTrack?'#D1FAE5':'#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            <span style={{ fontSize:18 }}>{s.isOnTrack?'\u2705':'\u26A0\uFE0F'}</span>
          </div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:700, color: s.isOnTrack?'#065F46':'#991B1B', marginBottom:2 }}>
            {s.isOnTrack ? 'On Track' : 'Over Budget'}
          </div>
          <div style={{ fontSize:12, color:'#6B7280' }}>{s.isOnTrack?'Sesuai budget':'Melebihi budget'}</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        {/* Trend */}
        <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:16, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:600, margin:0 }}>Tren 7 Hari</h3>
          </div>
          <div style={{ padding:'12px 16px 16px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={s.trendData}>
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${v/1000}k`} />
                <Tooltip formatter={(v:number)=>fmt(v)} contentStyle={ttStyle} />
                <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2}
                  dot={{ fill:'#fff', stroke:'#2563EB', r:3, strokeWidth:2 }}
                  activeDot={{ fill:'#2563EB', r:4, strokeWidth:0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget by category */}
        <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:16, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:600, margin:0 }}>Budget Kategori</h3>
          </div>
          <div style={{ padding:'8px 20px 16px', display:'flex', flexDirection:'column', gap:12 }}>
            {s.catData.length === 0 ? (
              <p style={{ fontSize:13, color:'#9CA3AF', padding:'12px 0' }}>Belum ada data</p>
            ) : s.catData.slice(0, 5).map(({ name, value, color }) => {
              const pct = s.totalBulanIni > 0 ? (value / s.totalBulanIni) * 100 : 0;
              return (
                <div key={name}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:500 }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }} />
                      {name}
                    </div>
                    <span style={{ fontSize:12, color:'#6B7280' }}>{fmt(value)}</span>
                  </div>
                  <div style={{ height:5, background:'#F1F4F8', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:99, background:color, width:`${Math.min(pct,100)}%`, transition:'width .8s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent transactions + wallet */}
      <div className="two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        {/* Recent txns */}
        <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:16, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:600, margin:0 }}>Transaksi Terbaru</h3>
            <button onClick={()=>navigate('/dashboard/transactions')}
              style={{ fontSize:12, color:'#6B7280', cursor:'pointer', background:'none', border:'none', padding:'4px 8px', borderRadius:6 }}>
              Lihat semua →
            </button>
          </div>
          <div>
            {s.recentTxns.map((t: any, i: number) => {
              const cat   = mapCat(t.category || '');
              const emoji = CAT_EMOJI[cat] || '\u2728';
              const bg    = CAT_BG[cat] || '#F1F4F8';
              const dateStr = new Date(t.date).toLocaleDateString('id-ID', { day:'numeric', month:'short' });
              const isIncome = t.transaction_type?.toLowerCase() === 'income' || cat === 'Pemasukan';
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 20px', borderBottom: i<s.recentTxns.length-1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <div style={{ width:38, height:38, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>{emoji}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.merchant || t.item || cat}</div>
                    <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                      <span style={{ padding:'1px 6px', borderRadius:20, background:bg, color:CAT_COLOR[cat]||'#6B7280', fontSize:10 }}>{cat}</span>
                      {dateStr}
                    </div>
                  </div>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:600, color: isIncome?'#16A34A':'#111827', flexShrink:0 }}>
                    {isIncome ? '+' : '\u2212'} {fmt(Number(t.amount||0))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wallet */}
        <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:16, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:600, margin:0 }}>Penggunaan Dompet</h3>
          </div>
          <div style={{ padding:'12px 16px 16px' }}>
            {s.walletData.length === 0 ? (
              <p style={{ fontSize:13, color:'#9CA3AF', padding:'8px 0' }}>Belum ada data</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={s.walletData} barSize={24}>
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`${v/1000}k`} />
                  <Tooltip formatter={(v:number)=>fmt(v)} contentStyle={ttStyle} cursor={{ fill:'#F1F4F8' }} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[5,5,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Insight tip */}
      {s.topCat && (
        <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:16, padding:'16px 20px', display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:'#FEF3C7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:18 }}>\uD83D\uDCA1</span>
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>Tips hemat minggu ini</p>
            <p style={{ fontSize:13, color:'#6B7280', margin:0, lineHeight:1.5 }}>
              Kategori terbesar minggu ini adalah <strong style={{ color:'#111827' }}>{s.topCat}</strong> ({fmt(s.topAmt)}).
              Coba kurangi 15% untuk capai saving goal kamu.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
