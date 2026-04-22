import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Target, Calendar, TrendingUp, X, Check } from 'lucide-react';

const GOALS_KEY = 'mira_goals';

type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
};

const fmt = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');

const GOALS_CSS = `
  .gl-wrap { padding: 28px 32px 40px; max-width: 960px; margin: 0 auto; font-family: 'DM Sans', sans-serif; }
  .gl-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
  .gl-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
  .gl-modal-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .gl-modal { background: #fff; border-radius: 20px; width: 100%; max-width: 440px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2); font-family: 'DM Sans', sans-serif; }
  .gl-modal-hdr { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid rgba(0,0,0,0.07); }
  .gl-modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .gl-label { display: block; font-size: 12px; font-weight: 500; color: #6B7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px; }
  .gl-input { height: 44px; width: 100%; border: 1px solid rgba(0,0,0,0.10); border-radius: 10px; padding: 0 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; background: #F8F9FB; outline: none; box-sizing: border-box; color: #111827; }
  .gl-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
  .gl-submit { width: 100%; height: 48px; background: #2563EB; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: background .15s; }
  .gl-submit:hover { background: #1D4ED8; }
  @media (max-width: 900px) {
    .gl-wrap { padding: 16px 16px 24px; }
    .gl-stats { grid-template-columns: 1fr; gap: 10px; }
    .gl-grid  { grid-template-columns: 1fr; gap: 10px; }
  }
  @media (max-width: 600px) {
    .gl-stats { grid-template-columns: 1fr 1fr; }
  }
`;

const CARD: React.CSSProperties = {
  background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, overflow: 'hidden',
};

export function DashboardGoals() {
  const navigate  = useNavigate();
  const [goals,     setGoals]     = useState<Goal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name,      setName]      = useState('');
  const [target,    setTarget]    = useState('');
  const [current,   setCurrent]   = useState('');
  const [deadline,  setDeadline]  = useState('');
  const [saved,     setSaved]     = useState(false);

  useEffect(() => {
    const id = 'mira-gl-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = GOALS_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-gl-css')?.remove(); };
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }
    try {
      const raw = localStorage.getItem(`${GOALS_KEY}_${ph}`);
      if (raw) setGoals(JSON.parse(raw));
    } catch {}
  }, []);

  const saveGoals = (next: Goal[]) => {
    const ph = localStorage.getItem('mira_phone') || '';
    localStorage.setItem(`${GOALS_KEY}_${ph}`, JSON.stringify(next));
    setGoals(next);
  };

  const handleAdd = () => {
    if (!name.trim() || !target || !deadline) return;
    const newGoal: Goal = {
      id:       Date.now().toString(),
      name:     name.trim(),
      target:   Number(target),
      current:  Number(current) || 0,
      deadline,
    };
    saveGoals([...goals, newGoal]);
    setName(''); setTarget(''); setCurrent(''); setDeadline('');
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowModal(false); }, 800);
  };

  const handleDelete = (id: string) => {
    saveGoals(goals.filter(g => g.id !== id));
  };

  const handleUpdateProgress = (id: string, add: number) => {
    saveGoals(goals.map(g => g.id === id ? { ...g, current: Math.min(g.current + add, g.target) } : g));
  };

  const progress = (g: Goal) => Math.min((g.current / g.target) * 100, 100);
  const monthsLeft = (deadline: string) => {
    const months = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
    return Math.max(months, 0);
  };
  const monthlyNeeded = (g: Goal) => {
    const m = monthsLeft(g.deadline);
    return m > 0 ? (g.target - g.current) / m : g.target - g.current;
  };

  const totalTarget  = goals.reduce((s, g) => s + g.target, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.current, 0);

  return (
    <div className="gl-wrap">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 600, margin: 0, color: '#111827' }}>Target</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Track progress menuju target saving kamu</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
        >
          <Plus style={{ width: 16, height: 16 }} strokeWidth={2.5} /> Add Goal
        </button>
      </div>

      {/* Stats */}
      <div className="gl-stats">
        {[
          { label: 'Total Goals',   val: String(goals.length),  icon: '🎯', sub: 'active goals' },
          { label: 'Total Target',  val: fmt(totalTarget),       icon: '📈', sub: 'target amount' },
          { label: 'Total Terkumpul', val: fmt(totalCurrent),   icon: '💰', sub: 'current savings' },
        ].map(({ label, val, icon, sub }) => (
          <div key={label} style={{ ...CARD, padding: '18px 20px' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60, color: '#6B7280' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <p style={{ fontSize: 14, marginBottom: 20 }}>Belum ada goal. Mulai dengan menambahkan target pertama kamu!</p>
          <button onClick={() => setShowModal(true)}
            style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            + Add Goal Pertama
          </button>
        </div>
      ) : (
        <div className="gl-grid">
          {goals.map(g => {
            const pct  = progress(g);
            const ml   = monthsLeft(g.deadline);
            const mn   = monthlyNeeded(g);
            const done = pct >= 100;
            return (
              <div key={g.id} style={{ ...CARD }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{g.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Target: {fmt(g.target)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600, background: done ? '#D1FAE5' : pct >= 75 ? '#DBEAFE' : '#F1F4F8', color: done ? '#065F46' : pct >= 75 ? '#1D4ED8' : '#6B7280' }}>
                      {pct.toFixed(0)}%
                    </span>
                    <button onClick={() => handleDelete(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2, display: 'flex' }}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>

                <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Progress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ fontWeight: 500, color: '#111827' }}>{fmt(g.current)}</span>
                      <span style={{ color: '#9CA3AF' }}>{fmt(g.target - g.current)} lagi</span>
                    </div>
                    <div style={{ height: 8, background: '#F1F4F8', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: done ? '#16A34A' : '#2563EB', width: `${Math.min(pct, 100)}%`, transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9CA3AF', marginBottom: 3 }}>
                        <Calendar style={{ width: 12, height: 12 }} />
                        <span style={{ fontSize: 11 }}>Deadline</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>
                        {new Date(g.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{ml} bulan lagi</div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9CA3AF', marginBottom: 3 }}>
                        <TrendingUp style={{ width: 12, height: 12 }} />
                        <span style={{ fontSize: 11 }}>Per bulan</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{fmt(mn)}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>dibutuhkan</div>
                    </div>
                  </div>

                  {/* Status + quick add */}
                  <div style={{ background: done ? '#F0FDF4' : mn > 5000000 ? '#FFF1F2' : '#EFF6FF', borderRadius: 10, padding: '10px 12px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: done ? '#065F46' : mn > 5000000 ? '#DC2626' : '#1D4ED8' }}>
                      {done ? '🎉 Goal tercapai! Selamat!' : mn > 5000000 ? '⚠️ Target bulanan tinggi — pertimbangkan adjust deadline' : '✨ On track! Keep going!'}
                    </p>
                  </div>

                  {!done && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[100000, 500000, 1000000].map(v => (
                        <button key={v} onClick={() => handleUpdateProgress(g.id, v)}
                          style={{ flex: 1, height: 34, background: '#F8F9FB', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 8, fontSize: 11, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                          +{v >= 1000000 ? (v / 1000000) + 'jt' : v / 1000 + 'rb'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div style={{ ...CARD, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Target style={{ width: 16, height: 16, color: '#2563EB' }} />
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, color: '#111827' }}>Tips Mencapai Goal</span>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Set auto-transfer ke rekening saving setiap terima gaji',
            'Kurangi pengeluaran di kategori yang tidak penting',
            'Review progress setiap minggu dan adjust spending jika perlu',
          ].map(tip => (
            <li key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
              <span style={{ color: '#2563EB', fontWeight: 700, flexShrink: 0 }}>•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Add Goal Modal */}
      {showModal && (
        <div className="gl-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="gl-modal">
            <div className="gl-modal-hdr">
              <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 600, color: '#111827' }}>Tambah Goal</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div className="gl-modal-body">
              <div>
                <span className="gl-label">Nama Goal</span>
                <input className="gl-input" placeholder="e.g. Dana Liburan Bali" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span className="gl-label">Target (Rp)</span>
                  <input className="gl-input" type="number" placeholder="10000000" value={target} onChange={e => setTarget(e.target.value)} />
                </div>
                <div>
                  <span className="gl-label">Sudah Ada (Rp)</span>
                  <input className="gl-input" type="number" placeholder="0" value={current} onChange={e => setCurrent(e.target.value)} />
                </div>
              </div>
              <div>
                <span className="gl-label">Deadline</span>
                <input className="gl-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
              <button className="gl-submit" onClick={handleAdd} disabled={saved}>
                {saved ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Check style={{ width: 16, height: 16 }} /> Tersimpan!</span> : 'Simpan Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
