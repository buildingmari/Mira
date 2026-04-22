import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Briefcase, TrendingUp, Plus, X } from 'lucide-react';

const ASSETS_KEY = 'mira_assets';

type Asset = {
  id: string;
  name: string;
  type: string;
  value: number;
};

const fmt = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');

const ASSET_TYPES = ['Tabungan', 'Investasi', 'Properti', 'Kendaraan', 'Emas', 'Kripto', 'Lainnya'];

const AST_CSS = `
  .ast-wrap  { padding: 28px 32px 40px; max-width: 680px; margin: 0 auto; font-family: 'DM Sans', sans-serif; }
  .ast-card  { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; overflow: hidden; margin-bottom: 14px; }
  .ast-card-hdr { padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.07); display: flex; align-items: center; gap: 8px; }
  .ast-card-hdr h3 { margin: 0; font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600; color: #111827; }
  .ast-modal-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .ast-modal { background: #fff; border-radius: 20px; width: 100%; max-width: 420px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2); font-family: 'DM Sans', sans-serif; }
  .ast-input { height: 44px; width: 100%; border: 1px solid rgba(0,0,0,0.10); border-radius: 10px; padding: 0 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; background: #F8F9FB; outline: none; box-sizing: border-box; }
  .ast-input:focus { border-color: #2563EB; }
  .ast-select { height: 44px; width: 100%; border: 1px solid rgba(0,0,0,0.10); border-radius: 10px; padding: 0 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; background: #F8F9FB; outline: none; cursor: pointer; box-sizing: border-box; }
  @media (max-width: 900px) { .ast-wrap { padding: 16px 16px 40px; } }
`;

const CARD: React.CSSProperties = {
  background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, overflow: 'hidden',
};

export function DashboardAssets() {
  const navigate = useNavigate();
  const [assets,    setAssets]    = useState<Asset[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [aName,     setAName]     = useState('');
  const [aType,     setAType]     = useState('Tabungan');
  const [aValue,    setAValue]    = useState('');

  useEffect(() => {
    const id = 'mira-ast-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = AST_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-ast-css')?.remove(); };
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }
    try {
      const raw = localStorage.getItem(`${ASSETS_KEY}_${ph}`);
      if (raw) setAssets(JSON.parse(raw));
    } catch {}
  }, []);

  const save = (next: Asset[]) => {
    const ph = localStorage.getItem('mira_phone') || '';
    localStorage.setItem(`${ASSETS_KEY}_${ph}`, JSON.stringify(next));
    setAssets(next);
  };

  const handleAdd = () => {
    if (!aName.trim() || !aValue) return;
    save([...assets, { id: Date.now().toString(), name: aName.trim(), type: aType, value: Number(aValue) }]);
    setAName(''); setAType('Tabungan'); setAValue('');
    setShowModal(false);
  };

  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const byType: Record<string, number> = {};
  assets.forEach(a => { byType[a.type] = (byType[a.type] || 0) + a.value; });

  return (
    <div className="ast-wrap">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 600, margin: 0, color: '#111827' }}>Aset & Net Worth</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Pantau total kekayaan bersih kamu</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: -1, marginBottom: 6 }}>{fmt(totalAssets)}</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{assets.length} aset tercatat</div>
      </div>

      {/* Breakdown by type */}
      {Object.keys(byType).length > 0 && (
        <div style={{ ...CARD, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 14 }}>Breakdown per Kategori</div>
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, val]) => {
            const pct = totalAssets > 0 ? (val / totalAssets) * 100 : 0;
            return (
              <div key={type} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 5 }}>
                  <span>{type}</span>
                  <span style={{ color: '#6B7280' }}>{fmt(val)}</span>
                </div>
                <div style={{ height: 6, background: '#F1F4F8', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: '#10B981', width: `${Math.min(pct, 100)}%`, transition: 'width .6s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset list */}
      {assets.length === 0 ? (
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
          {assets.map((a, i) => (
            <div key={a.id} style={{ ...CARD, marginBottom: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Briefcase style={{ width: 18, height: 18, color: '#10B981' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{a.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{a.type}</div>
              </div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, color: '#111827' }}>{fmt(a.value)}</div>
              <button onClick={() => save(assets.filter(x => x.id !== a.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4, display: 'flex' }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ))}
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
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Nama Aset</label>
                <input className="ast-input" placeholder="e.g. Tabungan BCA" value={aName} onChange={e => setAName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Kategori</label>
                <select className="ast-select" value={aType} onChange={e => setAType(e.target.value)}>
                  {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Nilai (Rp)</label>
                <input className="ast-input" type="number" placeholder="0" value={aValue} onChange={e => setAValue(e.target.value)} />
              </div>
              <button
                onClick={handleAdd}
                disabled={!aName.trim() || !aValue}
                style={{ height: 48, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", opacity: (!aName.trim() || !aValue) ? 0.5 : 1 }}
              >Simpan Aset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
