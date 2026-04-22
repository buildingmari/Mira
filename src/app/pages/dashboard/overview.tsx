import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar,
} from 'recharts';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const H = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };

const OV_CSS = `
  .ov-hero-stats { display:flex; gap:28px; text-align:right; }
  .ov-two-col  { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px; }
  .ov-three-col{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
  .ov-wrap     { padding:28px 32px 40px; max-width:960px; margin:0 auto; font-family:'DM Sans',sans-serif; }
  .ov-stat-val { font-family:'Sora',sans-serif; font-size:22px; font-weight:600;
                 letter-spacing:-0.8px; margin-bottom:2px;
                 overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  @media(max-width:900px){
    .ov-wrap      { padding:20px 16px 24px; }
    .ov-hero-stats{ display:none; }
    .ov-two-col   { grid-template-columns:1fr; gap:10px; }
    .ov-hero-amount{ font-size:28px !important; }
  }
  @media(max-width:600px){
    .ov-three-col { grid-template-columns:1fr 1fr; gap:8px; }
    .ov-stat-val  { font-size:16px !important; }
  }
`;

const fmt  = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');
const fmtK = (n: number) => {
  if (n === 0) return '0';
  if (Math.abs(n) >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'jt';
  if (Math.abs(n) >= 1000)    return Math.round(n/1000) + 'rb';
  return String(Math.round(n));
};

const CAT_COLOR: Record<string,string> = {
  Makanan:'#2563EB', Transport:'#10B981', Belanja:'#8B5CF6',
  Tagihan:'#F59E0B', Kesehatan:'#EF4444', Hiburan:'#EC4899',
  Pemasukan:'#16A34A', Others:'#6B7280',
};
const CAT_BG: Record<string,string> = {
  Makanan:'#FEE2E2', Transport:'#EDE9FE', Belanja:'#FEF3C7',
  Tagihan:'#FEF9C3', Kesehatan:'#D1FAE5', Hiburan:'#FCE7F3',
  Pemasukan:'#D1FAE5', Others:'#F1F4F8',
};
const CAT_EMOJI: Record<string,string> = {
  Makanan:'\uD83C\uDF5C', Transport:'\uD83D\uDE97', Belanja:'\uD83D\uDED2',
  Tagihan:'\uD83D\uDCA1', Kesehatan:'\u2764\uFE0F', Hiburan:'\uD83C\uDFAE',
  Pemasukan:'\uD83D\uDCB0', Others:'\u2728',
};

function mapCat(c: string) {
  const m: Record<string,string> = {
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

function greet() {
  const h = new Date().getHours();
  return h<12 ? 'Selamat pagi' : h<17 ? 'Selamat siang' : 'Selamat malam';
}

const CARD: React.CSSProperties = {
  background:'#fff', border:'1px solid rgba(0,0,0,0.07)', borderRadius:16, overflow:'hidden',
};
const CARD_HDR: React.CSSProperties = {
  padding:'16px 20px', borderBottom:'1px solid rgba(0,0,0,0.07)',
  display:'flex', alignItems:'center', justifyContent:'space-between',
};
const TT: React.CSSProperties = {
  backgroundColor:'#fff', border:'1px solid rgba(0,0,0,0.07)',
  borderRadius:10, fontSize:12, boxShadow:'0 4px 12px rgba(0,0,0,0.08)',
};

export function DashboardOverview() {
  const navigate           = useNavigate();
  const [user,   setUser]  = useState<Record<string,any>|null>(null);
  const [txns,   setTxns]  = useState<any[]>([]);
  const [loading,setLoad]  = useState(true);

  useEffect(() => {
    const id = 'mira-ov-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id=id; s.textContent=OV_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-ov-css')?.remove(); };
  }, []);

  const fetchData = async (ph: string) => {
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/users?primary_phone=eq.${ph}&select=*`,{headers:H});
      if (r.ok) { const a=await r.json(); if(Array.isArray(a)&&a.length>0){localStorage.setItem('mira_user',JSON.stringify(a[0]));setUser(a[0]);}}
    } catch {}
    try {
      const from = new Date(); from.setDate(from.getDate()-90);
      const r = await fetch(
        `${SUPA_URL}/rest/v1/expenses?phone_number=eq.${ph}&date=gte.${from.toISOString().split('T')[0]}&order=date.desc,created_at.desc&limit=500`,
        {headers:H}
      );
      if (r.ok) { const a=await r.json(); if(Array.isArray(a)) setTxns(a); }
    } catch {}
    setLoad(false);
  };

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/',{replace:true}); return; }
    try { const r=localStorage.getItem('mira_user'); if(r) setUser(JSON.parse(r)); } catch {}
    fetchData(ph);
  }, []);

  // Refresh on new transaction
  useEffect(() => {
    const handler = () => {
      const ph = localStorage.getItem('mira_phone');
      if (ph) fetchData(ph);
    };
    window.addEventListener('mira:tx-added', handler);
    return () => window.removeEventListener('mira:tx-added', handler);
  }, []);

  const s = useMemo(() => {
    const now=new Date(), cm=now.getMonth(), cy=now.getFullYear();
    const isExp=(t:any)=>t.transaction_type?.toLowerCase()!=='income'&&mapCat(t.category||'')!=='Pemasukan';
    const mTxns = txns.filter(t=>{const d=new Date(t.date);return d.getMonth()===cm&&d.getFullYear()===cy&&isExp(t);});
    const l7    = txns.filter(t=>new Date(t.date)>=new Date(now.getTime()-7*86400000)&&isExp(t));

    const total   = mTxns.reduce((s,t)=>s+Number(t.amount||0),0);
    const limit   = Number(user?.monthly_limit)||5000000;
    const goal    = Number(user?.savings_goal)||2000000;
    const pct     = Math.min((total/limit)*100,100);
    const saved   = total*0.3;
    const goalPct = Math.min((saved/goal)*100,100);
    const onTrack = total<=limit;

    const catMap:Record<string,number>={};
    mTxns.forEach(t=>{const c=mapCat(t.category||'');catMap[c]=(catMap[c]||0)+Number(t.amount||0);});
    const catData = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value,color:CAT_COLOR[name]||'#6B7280'}));

    const l7Map:Record<string,number>={};
    l7.forEach(t=>{const c=mapCat(t.category||'');l7Map[c]=(l7Map[c]||0)+Number(t.amount||0);});
    let topCat='',topAmt=0;
    Object.entries(l7Map).forEach(([c,a])=>{if(a>topAmt){topAmt=a;topCat=c;}});

    const dMap:Record<string,number>={};
    for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);dMap[d.toLocaleDateString('id-ID',{day:'numeric',month:'short'})]=0;}
    l7.forEach(t=>{const k=new Date(t.date).toLocaleDateString('id-ID',{day:'numeric',month:'short'});if(k in dMap)dMap[k]+=Number(t.amount||0);});
    const trendData=Object.entries(dMap).map(([date,amount])=>({date,amount}));

    const wMap:Record<string,number>={};
    mTxns.forEach(t=>{const w=t.wallet||'Lainnya';wMap[w]=(wMap[w]||0)+Number(t.amount||0);});
    const walletData=Object.entries(wMap).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,amount])=>({name,amount}));

    return {total,limit,sisa:limit-total,pct,saved,goalPct,onTrack,catData,topCat,topAmt,trendData,walletData,recent:txns.slice(0,5)};
  },[txns,user]);

  const fn = user?.name ? user.name.split(' ')[0] : null;
  const greeting = greet() + (fn ? `, ${fn}` : '');

  if (loading) return (
    <div className="ov-wrap">
      <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:600,margin:0,color:'#111827'}}>{greeting} \uD83D\uDC4B</h1>
      <p style={{color:'#6B7280',fontSize:13,marginTop:4}}>Memuat data keuangan...</p>
    </div>
  );

  if (txns.length===0) return (
    <div className="ov-wrap">
      <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:600,margin:0,color:'#111827'}}>{greeting} \uD83D\uDC4B</h1>
      <div style={{marginTop:60,textAlign:'center',color:'#6B7280'}}>
        <div style={{fontSize:48,marginBottom:16}}>\uD83D\uDCB0</div>
        <p style={{fontSize:14}}>Belum ada transaksi. Mulai catat via WhatsApp atau tombol Catat.</p>
      </div>
    </div>
  );

  return (
    <div className="ov-wrap">

      {/* greeting */}
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:600,margin:0,letterSpacing:-0.5,color:'#111827'}}>
          {greeting} \uD83D\uDC4B
        </h1>
        <p style={{color:'#6B7280',fontSize:13,marginTop:3,marginBottom:0}}>
          {new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </p>
      </div>

      {/* hero */}
      <div style={{
        background:'linear-gradient(135deg,#1D4ED8 0%,#2563EB 60%,#3B82F6 100%)',
        borderRadius:20,padding:'28px 32px',color:'#fff',
        display:'grid',gridTemplateColumns:'1fr auto',gap:20,alignItems:'flex-end',
        marginBottom:20,position:'relative',overflow:'hidden',
      }}>
        <div style={{position:'absolute',right:-40,top:-60,width:220,height:220,borderRadius:'50%',background:'rgba(255,255,255,0.06)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',right:60,bottom:-80,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,0.04)',pointerEvents:'none'}}/>
        <div>
          <div style={{fontSize:12,opacity:0.75,letterSpacing:0.3,marginBottom:6}}>Pengeluaran Bulan Ini</div>
          <div className="ov-hero-amount" style={{fontFamily:"'Sora',sans-serif",fontSize:36,fontWeight:600,letterSpacing:-1.5,lineHeight:1}}>{fmt(s.total)}</div>
          <div style={{fontSize:12,opacity:0.7,marginTop:6,display:'flex',alignItems:'center',gap:4}}>
            <span style={{color:s.onTrack?'#6EE7B7':'#FCA5A5',fontWeight:500}}>{s.onTrack?'\u25b2 On Track':'! Over Budget'}</span>
            <span>dari {fmt(s.limit)}</span>
          </div>
        </div>
        <div className="ov-hero-stats">
          <div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:600,letterSpacing:-0.5}}>{fmt(s.sisa)}</div>
            <div style={{fontSize:11,opacity:0.65,marginTop:2}}>Sisa limit</div>
          </div>
          <div>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:18,fontWeight:600,letterSpacing:-0.5}}>{s.goalPct.toFixed(0)}%</div>
            <div style={{fontSize:11,opacity:0.65,marginTop:2}}>Goal progress</div>
          </div>
        </div>
      </div>

      {/* stats 3-col */}
      <div className="ov-three-col">
        <div style={{...CARD,padding:'18px 20px'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:8,background:'#EFF6FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>\uD83D\uDCC8</div>
            <span style={{fontSize:12,padding:'3px 8px',borderRadius:20,fontWeight:500,background:s.onTrack?'#D1FAE5':'#FEE2E2',color:s.onTrack?'#065F46':'#991B1B'}}>
              {s.onTrack?'\u25bc':'\u25b2'} {s.pct.toFixed(0)}%
            </span>
          </div>
          <div className="ov-stat-val">{fmt(s.total)}</div>
          <div style={{fontSize:12,color:'#6B7280'}}>Pengeluaran</div>
        </div>
        <div style={{...CARD,padding:'18px 20px'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:8,background:'#D1FAE5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>\u2B50</div>
            <span style={{fontSize:12,padding:'3px 8px',borderRadius:20,fontWeight:500,background:'#D1FAE5',color:'#065F46'}}>\u25b2 {s.goalPct.toFixed(0)}%</span>
          </div>
          <div className="ov-stat-val">{fmt(s.saved)}</div>
          <div style={{fontSize:12,color:'#6B7280'}}>Tabungan est.</div>
        </div>
        <div style={{...CARD,padding:'18px 20px',border:`1px solid ${s.onTrack?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}`}}>
          <div style={{width:36,height:36,borderRadius:8,background:s.onTrack?'#D1FAE5':'#FEE2E2',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12,fontSize:18}}>
            {s.onTrack?'\u2705':'\u26A0\uFE0F'}
          </div>
          <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:700,color:s.onTrack?'#065F46':'#991B1B',marginBottom:2}}>{s.onTrack?'On Track':'Over Budget'}</div>
          <div style={{fontSize:12,color:'#6B7280'}}>{s.onTrack?'Sesuai budget':'Melebihi budget'}</div>
        </div>
      </div>

      {/* charts */}
      <div className="ov-two-col">
        <div style={CARD}>
          <div style={CARD_HDR}>
            <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:600,margin:0,color:'#111827'}}>Tren 7 Hari</h3>
          </div>
          <div style={{padding:'12px 20px 20px'}}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={s.trendData}>
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false}/>
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtK} width={38}/>
                <Tooltip formatter={(v:number)=>[fmt(v),'Pengeluaran']} contentStyle={TT}/>
                <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2}
                  dot={{fill:'#fff',stroke:'#2563EB',r:3,strokeWidth:2}}
                  activeDot={{fill:'#2563EB',r:5,strokeWidth:0}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={CARD}>
          <div style={CARD_HDR}>
            <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:600,margin:0,color:'#111827'}}>Budget Bulan Ini</h3>
          </div>
          <div style={{padding:'8px 20px 16px',display:'flex',flexDirection:'column',gap:14}}>
            {s.catData.length===0
              ? <p style={{fontSize:13,color:'#9CA3AF',padding:'12px 0',margin:0}}>Belum ada data</p>
              : s.catData.slice(0,5).map(({name,value,color})=>{
                  const p=s.total>0?(value/s.total)*100:0;
                  return (
                    <div key={name}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <div style={{display:'flex',alignItems:'center',gap:7,fontSize:13,fontWeight:500,color:'#111827'}}>
                          <div style={{width:7,height:7,borderRadius:'50%',background:color,flexShrink:0}}/>
                          {name}
                        </div>
                        <span style={{fontSize:12,color:'#6B7280',fontWeight:500}}>{fmt(value)}</span>
                      </div>
                      <div style={{height:5,background:'#F1F4F8',borderRadius:99,overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:99,background:color,width:`${Math.min(p,100)}%`,transition:'width .8s cubic-bezier(.4,0,.2,1)'}}/>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </div>

      {/* recent + wallet */}
      <div className="ov-two-col">
        <div style={CARD}>
          <div style={CARD_HDR}>
            <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:600,margin:0,color:'#111827'}}>Transaksi Terbaru</h3>
            <button onClick={()=>navigate('/dashboard/transactions')}
              style={{fontSize:12,color:'#6B7280',cursor:'pointer',background:'none',border:'none',padding:'4px 8px',borderRadius:6}}>
              Lihat semua \u2192
            </button>
          </div>
          <div style={{padding:'4px 0'}}>
            {s.recent.map((t:any,i:number)=>{
              const cat=mapCat(t.category||'');
              const bg=CAT_BG[cat]||'#F1F4F8';
              const clr=CAT_COLOR[cat]||'#6B7280';
              const emoji=CAT_EMOJI[cat]||'\u2728';
              const ds=new Date(t.date).toLocaleDateString('id-ID',{day:'numeric',month:'short'});
              const isIn=t.transaction_type?.toLowerCase()==='income'||cat==='Pemasukan';
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 20px',
                  borderBottom:i<s.recent.length-1?'1px solid rgba(0,0,0,0.05)':'none',
                  cursor:'pointer',transition:'background .1s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.background='#F8F9FB';}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.background='';}}>
                  <div style={{width:40,height:40,borderRadius:8,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                    {emoji}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#111827'}}>
                      {t.merchant||t.item||cat}
                    </div>
                    <div style={{fontSize:11,color:'#9CA3AF',marginTop:2,display:'flex',alignItems:'center',gap:4}}>
                      <span style={{padding:'2px 7px',borderRadius:20,background:bg,color:clr,fontSize:10}}>{cat}</span>
                      {ds}
                    </div>
                  </div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:500,color:isIn?'#16A34A':'#111827',flexShrink:0}}>
                    {isIn?'+':'\u2212'} {fmt(Number(t.amount||0))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={CARD}>
          <div style={CARD_HDR}>
            <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:600,margin:0,color:'#111827'}}>Penggunaan Dompet</h3>
          </div>
          <div style={{padding:'12px 20px 20px'}}>
            {s.walletData.length===0
              ? <p style={{fontSize:13,color:'#9CA3AF',padding:'8px 0',margin:0}}>Belum ada data</p>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={s.walletData} barSize={28}>
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtK} width={38}/>
                    <Tooltip formatter={(v:number)=>[fmt(v),'Pengeluaran']} contentStyle={TT} cursor={{fill:'#F1F4F8'}}/>
                    <Bar dataKey="amount" fill="#2563EB" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>
      </div>

      {s.topCat && (
        <div style={{...CARD,padding:'16px 20px',display:'flex',alignItems:'flex-start',gap:12}}>
          <div style={{width:36,height:36,borderRadius:8,background:'#FEF3C7',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>\uD83D\uDCA1</div>
          <div>
            <p style={{fontSize:13,fontWeight:600,marginBottom:4,marginTop:0,color:'#111827'}}>Tips hemat minggu ini</p>
            <p style={{fontSize:13,color:'#6B7280',margin:0,lineHeight:1.5}}>
              Kategori terbesar minggu ini adalah <strong style={{color:'#111827'}}>{s.topCat}</strong> ({fmt(s.topAmt)}).
              Coba kurangi 15% untuk capai saving goal kamu.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
