import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Briefcase, Plus, X, Banknote, TrendingUp, Car, Home, Receipt } from 'lucide-react';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const HR = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };
const HW = { ...HR, 'Content-Type': 'application/json', Prefer: 'return=representation' };

type Asset = {
  id: string;
  phone_number: string;
  category: string;
  subtype: string;
  name: string;
  value: number;
  updated_date?: string;
  created_at?: string;
};

// ─── Category definitions ────────────────────────────────────────────────────
export const ASSET_GROUPS = [
  {
    key: 'cash',
    label: 'Uang & Setara Uang',
    icon: Banknote,
    color: '#2563EB',
    bg: '#EFF6FF',
    subtypes: ['Tabungan', 'Deposito', 'Kas', 'Cash'],
    categories: ['cash', 'uang', 'tabungan', 'deposito'],
  },
  {
    key: 'piutang',
    label: 'Piutang',
    icon: Receipt,
    color: '#D97706',
    bg: '#FFFBEB',
    subtypes: ['Piutang'],
    categories: ['piutang', 'receivable'],
  },
  {
    key: 'investasi',
    label: 'Surat Berharga / Investasi',
    icon: TrendingUp,
    color: '#059669',
    bg: '#ECFDF5',
    subtypes: ['Saham', 'Reksa Dana', 'Obligasi', 'Kripto', 'Emas', 'Reksadana', 'ETF', 'SBN'],
    categories: ['investasi', 'investment', 'saham', 'reksa dana', 'obligasi', 'kripto', 'emas'],
  },
  {
    key: 'aset_bergerak',
    label: 'Aset Bergerak',
    icon: Car,
    color: '#7C3AED',
    bg: '#F5F3FF',
    subtypes: ['Kendaraan', 'Mobil', 'Motor', 'Kendaraan Bermotor'],
    categories: ['kendaraan', 'vehicle', 'aset bergerak', 'bergerak'],
  },
  {
    key: 'aset_tidak_bergerak',
    label: 'Aset Tidak Bergerak',
    icon: Home,
    color: '#DB2777',
    bg: '#FDF2F8',
    subtypes: ['Properti', 'Rumah', 'Tanah', 'Apartemen', 'Ruko'],
    categories: ['properti', 'property', 'rumah', 'tanah', 'aset tidak bergerak'],
  },
  {
    key: 'lainnya',
    label: 'Lainnya',
    icon: Briefcase,
    color: '#6B7280',
    bg: '#F1F4F8',
    subtypes: ['Lainnya', 'Others'],
    categories: ['lainnya', 'others'],
  },
] as const;

function classifyAsset(a: Asset): string {
  const subLow = (a.subtype || '').toLowerCase().trim();
  const catLow = (a.category || '').toLowerCase().trim();

  for (const group of ASSET_GROUPS) {
    if (group.subtypes.some(s => s.toLowerCase() === subLow)) return group.key;
    if (group.categories.some(c => catLow.includes(c))) return group.key;
  }
  return 'lainnya';
}

const fmt = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');

const ASSET_SUBTYPES = ['Tabungan', 'Deposito', 'Piutang', 'Saham', 'Reksa Dana', 'Obligasi', 'Kripto', 'Emas', 'Kendaraan', 'Properti', 'Lainnya'];

function subtypeToCategory(sub: string): string {
  const group = ASSET_GROUPS.find(g => g.subtypes.some(s => s.toLowerCase() === sub.toLowerCase()));
  return group ? group.key : 'lainnya';
}

const AST_CSS = `
  .ast-wrap  { padding: 28px 32px 40px; max-width: 720px; margin: 0 auto; font-family: 'DM Sans', sans-serif; }
  .ast-modal-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .ast-modal { background: #fff; border-radius: 20px; width: 100%; max-width: 420px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2); font-family: 'DM Sans', sans-serif; }
  .ast-input { height: 44px; width: 100%; border: 1px solid rgba(0,0,0,0.10); border-radius: 10px; padding: 0 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; background: #F8F9FB; outline: none; box-sizing: border-box; }
  .ast-input:focus { border-color: #2563EB; }
  .ast-select { height: 44px; width: 100%; border: 1px solid rgba(0,0,0,0.10); border-radius: 10px; padding: 0 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; background: #F8F9FB; outline: none; cursor: pointer; box-sizing: border-box; }
  .ast-group  { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; overflow: hidden; margin-bottom: 14px; }
  .ast-group-hdr { padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
  .ast-group-hdr:hover { background: #F8F9FB; }
  .ast-item { display: flex; align-items: center; gap: 12px; padding: 13px 18px; border-bottom: 1px solid rgba(0,0,0,0.04); }
  .ast-item:last-child { border-bottom: none; }
  .dark .ast-modal { background: #1E293B; }
  .dark .ast-input, .dark .ast-select { background: #0F172A; border-color: rgba(255,255,255,0.12); color: #F1F5F9; }
  .dark .ast-group { background: #1E293B; border-color: rgba(255,255,255,0.08); }
  .dark .ast-group-hdr:hover { background: rgba(255,255,255,0.04); }
  @media (max-width: 900px) { .ast-wrap { padding: 16px 16px 40px; } }
`;

export function DashboardAssets() {
  const navigate = useNavigate();
  const [phone,     setPhone]     = useState('');
  const [assets,    setAssets]    = useState<Asset[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [aName,     setAName]     = useState('');
  const [aSubtype,  setASubtype]  = useState('Tabungan');
  const [aValue,    setAValue]    = useState('');
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState<string | null>(null);
  // collapsed state per group key
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = 'mira-ast-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = AST_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-ast-css')?.remove(); };
  }, []);

  const fetchAssets = useCallback(async (ph: string) => {
    setLoading(true);
    try {
      const r = await fetch(
        `${SUPA_URL}/rest/v1/user_assets?phone_number=eq.${ph}&order=created_at.desc`,
        { headers: HR }
      );
      if (r.ok) {
        const a = await r.json();
        if (Array.isArray(a)) setAssets(a);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }
    setPhone(ph);
    fetchAssets(ph);
  }, []);

  const handleAdd = async () => {
    if (!aName.trim() || !aValue) return;
    setSaving(true); setErr(null);
    try {
      const payload = {
        phone_number:  phone,
        name:          aName.trim(),
        category:      subtypeToCategory(aSubtype),
        subtype:       aSubtype,
        value:         Number(aValue),
        updated_date:  new Date().toISOString().split('T')[0],
      };
      const r = await fetch(`${SUPA_URL}/rest/v1/user_assets`, {
        method: 'POST', headers: HW, body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      setAName(''); setASubtype('Tabungan'); setAValue('');
      setShowModal(false);
      await fetchAssets(phone);
    } catch (e: any) {
      setErr(e.message || 'Gagal menyimpan aset');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    try {
      await fetch(`${SUPA_URL}/rest/v1/user_assets?id=eq.${id}`, {
        method: 'DELETE', headers: HR,
      });
    } catch {
      fetchAssets(phone);
    }
  };

  const toggleGroup = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const totalAssets = assets.reduce((s, a) => s + (a.value || 0), 0);

  // Group assets
  const grouped = ASSET_GROUPS.map(group => ({
    ...group,
    items: assets.filter(a => classifyAsset(a) === group.key),
    subtotal: assets.filter(a => classifyAsset(a) === group.key).reduce((s, a) => s + (a.value || 0), 0),
  })).filter(g => g.items.length > 0);

  return (
    <div className="ast-wrap">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 600, margin: 0, color: '#111827' }}>Aset & Net Worth</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Pantau total kekayaan bersih kamu</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setErr(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
        >
          <Plus style={{ width: 16, height: 16 }} strokeWidth={2.5} /> Tambah Aset
        </button>
      </div>

      {/* Net Worth Hero */}
      <div style={{
        background: 'linear-gradient(135deg,#065F46 0%,#10B981 100%)',
        borderRadius: 20, padding: '28px 32px', color: '#fff', marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Total Net Worth</div>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: -1, marginBottom: 6 }}>
          {loading ? '—' : fmt(totalAssets)}
        </div>
        {/* Per-category pills */}
        {!loading && grouped.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {grouped.map(g => (
              <div key={g.key} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '3px 10px', fontSize: 11 }}>
                {g.label}: {fmt(g.subtotal)}
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>{assets.length} aset tercatat · {grouped.length} kategori</div>
      </div>

      {/* Grouped Asset Sections */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingTop: 40 }}>Memuat aset...</p>
      ) : assets.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60, color: '#6B7280' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
          <p style={{ fontSize: 14, marginBottom: 20 }}>Belum ada aset. Mulai catat aset pertama kamu!</p>
          <button onClick={() => setShowModal(true)}
            style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            + Tambah Aset Pertama
          </button>
        </div>
      ) : (
        <div>
          {grouped.map(group => {
            const Icon = group.icon;
            const isOpen = !collapsed[group.key];
            const pct = totalAssets > 0 ? (group.subtotal / totalAssets) * 100 : 0;
            return (
              <div key={group.key} className="ast-group">
                {/* Group header */}
                <div className="ast-group-hdr" onClick={() => toggleGroup(group.key)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: group.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: 17, height: 17, color: group.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: "'Sora',sans-serif" }}>{group.label}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{group.items.length} aset · {pct.toFixed(1)}% dari total</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: '#111827' }}>{fmt(group.subtotal)}</div>
                      {/* Mini bar */}
                      <div style={{ height: 4, width: 80, background: '#F1F4F8', borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ height: '100%', borderRadius: 99, background: group.color, width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</div>
                  </div>
                </div>

                {/* Items */}
                {isOpen && group.items.map(a => (
                  <div key={a.id} className="ast-item">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{a.subtype || a.category}</div>
                    </div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 600, color: '#111827', flexShrink: 0 }}>{fmt(a.value)}</div>
                    <button onClick={() => handleDelete(a.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: '4px 6px', display: 'flex', marginLeft: 4 }}>
                      <X style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="ast-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="ast-modal">
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 600, color: '#111827' }}>Tambah Aset</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {err && <div style={{ fontSize: 13, color: '#EF4444', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8 }}>{err}</div>}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Nama Aset</label>
                <input className="ast-input" placeholder="e.g. Tabungan BCA" value={aName} onChange={e => setAName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Tipe Aset</label>
                <select className="ast-select" value={aSubtype} onChange={e => setASubtype(e.target.value)}>
                  {ASSET_SUBTYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Nilai (Rp)</label>
                <input className="ast-input" type="number" placeholder="0" value={aValue} onChange={e => setAValue(e.target.value)} />
              </div>
              <button
                onClick={handleAdd}
                disabled={saving || !aName.trim() || !aValue}
                style={{ height: 48, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", opacity: (saving || !aName.trim() || !aValue) ? 0.5 : 1 }}
              >{saving ? 'Menyimpan...' : 'Simpan Aset'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
