import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Gift, Copy, Users, TrendingUp } from 'lucide-react';

const AFF_CSS = `
  .aff-wrap { padding: 28px 32px 40px; max-width: 680px; margin: 0 auto; font-family: 'DM Sans', sans-serif; }
  .aff-card { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; overflow: hidden; margin-bottom: 16px; }
  .aff-card-hdr { padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.07); display: flex; align-items: center; gap: 8px; }
  .aff-card-hdr h3 { margin: 0; font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600; color: #111827; }
  .aff-card-body { padding: 20px; }
  .aff-stat { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
  @media (max-width: 900px) { .aff-wrap { padding: 16px 16px 40px; } .aff-stat { grid-template-columns: 1fr 1fr; } }
`;

const CARD: React.CSSProperties = {
  background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, overflow: 'hidden',
};

export function DashboardAffiliate() {
  const navigate = useNavigate();

  useEffect(() => {
    const id = 'mira-aff-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = AFF_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-aff-css')?.remove(); };
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); }
  }, []);

  const phone = localStorage.getItem('mira_phone') || '';
  const refCode = 'MIRA' + phone.slice(-4).toUpperCase();

  const copyCode = () => {
    navigator.clipboard.writeText(refCode).catch(() => {});
  };

  return (
    <div className="aff-wrap">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 600, margin: 0, color: '#111827' }}>Affiliate</h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Ajak teman & dapatkan reward eksklusif</p>
      </div>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg,#7C3AED 0%,#2563EB 100%)',
        borderRadius: 20, padding: '28px 32px', color: '#fff', marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Kode Referral Kamu</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>{refCode}</span>
          <button
            onClick={copyCode}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 500 }}
          >
            <Copy style={{ width: 14, height: 14 }} /> Salin
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
          Bagikan kode ini ke teman. Setiap teman yang daftar dan aktif, kamu dapat reward!
        </p>
      </div>

      {/* Stats */}
      <div className="aff-stat">
        {[
          { label: 'Total Referral', val: '0', icon: <Users style={{ width: 18, height: 18 }} />, bg: '#EFF6FF', color: '#1D4ED8' },
          { label: 'Aktif', val: '0', icon: <TrendingUp style={{ width: 18, height: 18 }} />, bg: '#F0FDF4', color: '#16A34A' },
          { label: 'Reward', val: 'Rp 0', icon: <Gift style={{ width: 18, height: 18 }} />, bg: '#FFFBEB', color: '#D97706' },
        ].map(({ label, val, icon, bg, color }) => (
          <div key={label} style={{ ...CARD, padding: '16px 18px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 10 }}>
              {icon}
            </div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{val}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="aff-card">
        <div className="aff-card-hdr">
          <Gift style={{ width: 15, height: 15, color: '#6B7280' }} />
          <h3>Cara Kerja Program Affiliate</h3>
        </div>
        <div className="aff-card-body">
          {[
            { num: '1', title: 'Bagikan Kode', desc: 'Share kode referral kamu ke teman via WhatsApp, Instagram, atau media sosial lainnya.' },
            { num: '2', title: 'Teman Daftar', desc: 'Temanmu daftar MIRA menggunakan kode referralmu dan mulai menggunakan platform.' },
            { num: '3', title: 'Dapat Reward', desc: 'Setiap teman aktif yang daftar, kamu akan mendapatkan reward eksklusif dari MIRA.' },
          ].map(({ num, title, desc }) => (
            <div key={num} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: '#1D4ED8', flexShrink: 0 }}>{num}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
          <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '12px 14px', marginTop: 4 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#15803D', fontWeight: 500 }}>
              🎉 Program affiliate akan segera diluncurkan. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
