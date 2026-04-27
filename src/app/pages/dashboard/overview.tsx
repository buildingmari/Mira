import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar,
} from 'recharts';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const H = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };

const fmt  = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');
const fmtK = (n: number) => {
  if (n === 0) return '0';
  if (Math.abs(n) >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'jt';
  if (Math.abs(n) >= 1000) return Math.round(n/1000) + 'rb';
  return String(Math.round(n));
};

const CAT_COLOR: Record<string,string> = {
  Makanan:'#2563EB',
  Transport:'#10B981',
  Belanja:'#8B5CF6',
  Tagihan:'#F59E0B',
  Kesehatan:'#EF4444',
  Hiburan:'#EC4899',
  Pemasukan:'#16A34A',
  Others:'#6B7280',
};

function mapCat(c: string) {
  const m: Record<string,string> = {
    food:'Makanan', makanan:'Makanan', Makanan:'Makanan',
    transport:'Transport',
    shopping:'Belanja',
    bills:'Tagihan', utilities:'Tagihan',
    health:'Kesehatan',
    entertainment:'Hiburan',
    income:'Pemasukan',
  };
  return m[c] || 'Makanan';
}

export function DashboardOverview() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (ph: string) => {
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/users?primary_phone=eq.${ph}&select=*`,{headers:H});
      const a = await r.json();
      setUser(a[0]);
    } catch {}

    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/expenses?phone_number=eq.${ph}&limit=500`,{headers:H});
      const a = await r.json();
      setTxns(a);
    } catch {}

    setLoading(false);
  };

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) return navigate('/');
    fetchData(ph);
  }, []);

  const s = useMemo(() => {
    const now = new Date();

    const l7 = txns.filter(t => {
      const d = new Date(t.date);
      return d >= new Date(now.getTime() - 7*86400000);
    });

    // INIT DATA
    const dMap: any = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      dMap[key] = { date: key };

      Object.keys(CAT_COLOR).forEach(cat => {
        dMap[key][cat] = 0;
      });
    }

    // FILL DATA
    l7.forEach(t => {
      const key = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const cat = mapCat(t.category || '');

      if (dMap[key]) {
        dMap[key][cat] += Number(t.amount || 0);
      }
    });

    return {
      trendData: Object.values(dMap)
    };

  }, [txns]);

  if (loading) return <div style={{padding:40}}>Loading...</div>;

  return (
    <div style={{padding:40}}>

      <h2>Tren 7 Hari</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={s.trendData}>
          <XAxis dataKey="date"/>
          <YAxis tickFormatter={fmtK}/>
          <Tooltip formatter={(v:any,name:any)=>[fmt(v),name]}/>

          {Object.keys(CAT_COLOR).map(cat => (
            <Line
              key={cat}
              type="monotone"
              dataKey={cat}
              stroke={CAT_COLOR[cat]}
              strokeWidth={2}
              dot={false}
            />
          ))}

        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}
