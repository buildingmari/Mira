import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Gift, Copy, Users, TrendingUp, Check, User } from 'lucide-react';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const HR = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };

// ── phone normalizer: ensure 628xxx format to match DB ───────────────
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('08')) return '62' + digits.slice(1);
  if (digits.startsWith('8'))  return '62' + digits;
  return digits;
}

// ── masking helpers ──────────────────────────────────────────────────
function maskName(name: string): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const n = parts[0];
    return n.length <= 2 ? n : n[0] + '**';
  }
  return parts[0] + ' ' + parts[1][0] + '**';
}

function maskPhone(phone: string): string {
  if (!phone) return '—';
  const p = phone.replace(/\D/g, '');
  if (p.length < 7) return p;
  return p.slice(0, 4) + '****' + p.slice(-3);
}

// ── referral row type ────────────────────────────────────────────────
type ReferredUser = {
  referee_phone: string;
  name: string;
};

const AFF_CSS = `
  .aff-wrap { padding: 28px 32px 40px; max-width: 680px; margin: 0 auto; font-family: 'DM Sans', sans-serif; }
  .aff-card { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; overflow: hidden; margin-bottom: 16px; }
  .aff-card-hdr { padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.07); display: flex; align-items: center; gap: 8px; }
  .aff-card-hdr h3 { margin: 0; font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600; color: #111827; }
  .aff-card-body { padding: 20px; }
  .aff-stat { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
  .aff-stat-item { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; padding: 16px 18px; }
  .aff-stat-val { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 2px; }
  .aff-stat-lbl { font-size: 12px; color: #6B7280; }
  .aff-page-title { font-family: 'Sora',sans-serif; font-size: 20px; font-weight: 600; margin: 0; color: #111827; }
  .aff-page-sub { font-size: 13px; color: #6B7280; margin: 3px 0 0; }
  .aff-step-title { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 3px; }
  .aff-step-desc { font-size: 13px; color: #6B7280; line-height: 1.5; }
  .aff-ref-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
  .aff-ref-row:last-child { border-bottom: none; }
  .aff-ref-name { font-size: 14px; font-weight: 500; color: #111827; }
  .aff-ref-phone { font-size: 12px; color: #6B7280; margin-top: 1px; }
  @media (max-width: 900px) { .aff-wrap { padding: 16px 16px 40px; } .aff-stat { grid-template-columns: 1fr 1fr; } }

  .dark .aff-card { background: #1E293B !important; border-color: rgba(255,255,255,0.08) !important; }
  .dark .aff-card-hdr { border-bottom-color: rgba(255,255,255,0.07) !important; }
  .dark .aff-card-hdr h3 { color: #F1F5F9 !important; }
  .dark .aff-stat-item { background: #1E293B !important; border-color: rgba(255,255,255,0.08) !important; }
  .dark .aff-stat-val { color: #F1F5F9 !important; }
  .dark .aff-stat-lbl { color: #94A3B8 !important; }
  .dark .aff-page-title { color: #F1F5F9 !important; }
  .dark .aff-page-sub { color: #94A3B8 !important; }
  .dark .aff-step-title { color: #F1F5F9 !important; }
  .dark .aff-step-desc { color: #94A3B8 !important; }
  .dark .aff-card-body { color: #CBD5E1 !important; }
  .dark .aff-ref-row { border-bottom-color: rgba(255,255,255,0.05) !important; }
  .dark .aff-ref-name { color: #F1F5F9 !important; }
  .dark .aff-ref-phone { color: #94A3B8 !important; }
`;

export function DashboardAffiliate() {
  const navigate = useNavigate();
  const [phone,        setPhone]        = useState('');
  const [affCode,      setAffCode]      = useState('');
  const [refCount,     setRefCount]     = useState(0);
  const [referredList, setReferredList] = useState<ReferredUser[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [copied,       setCopied]       = useState(false);

  useEffect(() => {
    const id = 'mira-aff-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = AFF_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-aff-css')?.remove(); };
  }, []);

  useEffect(() => {
    const rawPhone = localStorage.getItem('mira_phone');
    if (!rawPhone) { navigate('/', { replace: true }); return; }

    // Normalize to 628xxx format — DB stores phones as 628xxx
    const ph = normalizePhone(rawPhone);
    setPhone(ph);

    console.log('[affiliate] rawPhone from localStorage:', rawPhone);
    console.log('[affiliate] normalized phone for query:', ph);

    (async () => {
      try {
        // 1. Get affiliate_code from users table using primary_phone
        const ur = await fetch(
          `${SUPA_URL}/rest/v1/users?primary_phone=eq.${encodeURIComponent(ph)}&select=affiliate_code`,
          { headers: HR }
        );
        if (ur.ok) {
          const users = await ur.json();
          console.log('[affiliate] users result:', users);
          if (Array.isArray(users) && users.length > 0) {
            setAffCode(users[0].affiliate_code || '');
          }
        }

        // 2. Fetch referrals from affiliate_referrals WHERE referrer_phone = current user
        //    COLUMN: referee_phone (NOT referred_phone)
        const rrUrl = `${SUPA_URL}/rest/v1/affiliate_referrals?referrer_phone=eq.${encodeURIComponent(ph)}&select=referee_phone,referee_name`;
        console.log('[affiliate] referrals query URL:', rrUrl);
        const rr = await fetch(rrUrl, { headers: HR });

        if (rr.ok) {
          const refs = await rr.json();
          console.log('[affiliate] referrals result:', refs);

          if (Array.isArray(refs) && refs.length > 0) {
            setRefCount(refs.length);

            // Build list directly from referee_name in affiliate_referrals
            // No join needed — referee_name is already stored in the table
            const list: ReferredUser[] = refs.map((r: any) => ({
              referee_phone: r.referee_phone || '',
              name: r.referee_name || '',
            }));
            console.log('[affiliate] referral list built:', list);
            setReferredList(list);
          } else {
            console.log('[affiliate] no referrals found — check phone format match in DB');
            setRefCount(0);
            setReferredList([]);
          }
        } else {
          const errText = await rr.text();
          console.error('[affiliate] referrals fetch error:', rr.status, errText);
        }
      } catch (err) {
        console.error('[affiliate] unexpected error:', err);
      }
      setLoading(false);
    })();
  }, []);

  const copyCode = () => {
    if (!affCode) return;
    navigator.clipboard.writeText(affCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="aff-wrap">
      <div style={{ marginBottom: 20 }}>
        <h1 className="aff-page-title">Affiliate</h1>
        <p className="aff-page-sub">Ajak teman & dapatkan reward eksklusif</p>
      </div>

      {/* Hero — referral code from DB */}
      <div style={{
        background: 'linear-gradient(135deg,#7C3AED 0%,#2563EB 100%)',
        borderRadius: 20, padding: '28px 32px', color: '#fff', marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6, color: '#fff' }}>Kode Referral Kamu</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: 2, color: '#fff' }}>
            {loading ? '...' : (affCode || '—')}
          </span>
          {affCode && (
            <button
              onClick={copyCode}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 500 }}
            >
              {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
              {copied ? 'Tersalin!' : 'Salin'}
            </button>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.85, color: '#fff' }}>
          Bagikan kode ini ke teman. Setiap teman yang daftar dan aktif, kamu dapat reward!
        </p>
      </div>

      {/* Stats — real counts from DB */}
      <div className="aff-stat">
        {[
          { label: 'Total Referral', val: loading ? '—' : String(refCount),           icon: <Users style={{ width: 18, height: 18 }} />, bg: '#EFF6FF', color: '#1D4ED8' },
          { label: 'Terdaftar',      val: loading ? '—' : String(referredList.length), icon: <TrendingUp style={{ width: 18, height: 18 }} />, bg: '#F0FDF4', color: '#16A34A' },
          { label: 'Reward',         val: 'Rp 0',                                      icon: <Gift style={{ width: 18, height: 18 }} />, bg: '#FFFBEB', color: '#D97706' },
        ].map(({ label, val, icon, bg, color }) => (
          <div key={label} className="aff-stat-item">
            <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 10 }}>
              {icon}
            </div>
            <div className="aff-stat-val">{val}</div>
            <div className="aff-stat-lbl">{label}</div>
          </div>
        ))}
      </div>

      {/* Referral list — real data from DB, masked */}
      <div className="aff-card">
        <div className="aff-card-hdr">
          <Users style={{ width: 15, height: 15, color: '#6B7280' }} />
          <h3>Daftar Referral</h3>
        </div>
        <div className="aff-card-body" style={{ padding: referredList.length === 0 ? '20px' : '8px 20px' }}>
          {loading ? (
            <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>Memuat data...</p>
          ) : referredList.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>Belum ada referral. Mulai bagikan kode kamu!</p>
          ) : (
            referredList.map((r, i) => (
              <div key={i} className="aff-ref-row">
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User style={{ width: 16, height: 16, color: '#1D4ED8' }} />
                </div>
                <div>
                  <div className="aff-ref-name">{maskName(r.name)}</div>
                  <div className="aff-ref-phone">{maskPhone(r.referee_phone)}</div>
                </div>
              </div>
            ))
          )}
        </div>
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
                <div className="aff-step-title">{title}</div>
                <div className="aff-step-desc">{desc}</div>
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
