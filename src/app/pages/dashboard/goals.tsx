import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Target, Calendar, TrendingUp, X, Check, RotateCcw } from 'lucide-react';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const HR = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };
const HW = { ...HR, 'Content-Type': 'application/json', Prefer: 'return=representation' };

// Table: user_goals
// Key fields: achieved_amount (not current_amount), target_amount, deadline
type Goal = {
  id: string;
  phone_number: string;
  name: string;
  target_amount: number;
  achieved_amount: number;
  deadline?: string;
  created_at?: string;
  category?: string;
  icon?: string;
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
  .gl-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .gl-progress-input { height: 36px; border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; padding: 0 10px; font-size: 13px; font-family: 'DM Sans', sans-serif; background: #F8F9FB; outline: none; box-sizing: border-box; color: #111827; width: 100%; min-width: 0; }
  .gl-progress-input:focus { border-color: #2563EB; box-shadow: 0 0 0 2px rgba(37,99,235,0.08); }
  .gl-quick-btn { flex: 1; height: 32px; background: #F8F9FB; border: 1px solid rgba(0,0,0,0.10); border-radius: 7px; font-size: 11px; font-weight: 500; color: #374151; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; transition: background .12s, border-color .12s; }
  .gl-quick-btn:hover { background: #EFF6FF; border-color: #BFDBFE; color: #1D4ED8; }
  .gl-save-btn { height: 32px; padding: 0 14px; background: #2563EB; color: #fff; border: none; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; }
  .gl-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .gl-reset-btn { height: 32px; width: 32px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 7px; color: #DC2626; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .gl-reset-btn:hover { background: #FEE2E2; }
  @media (max-width: 900px) {
    .gl-wrap { padding: 16px 16px 24px; }
    .gl-stats { grid-template-columns: 1fr; gap: 10px; }
    .gl-grid  { grid-template-columns: 1fr; gap: 10px; }
  }
  @media (max-width: 600px) {
    .gl-stats { grid-template-columns: 1fr 1fr; }
  }

  .dark .gl-modal { background: #1E293B; }
  .dark .gl-modal-hdr { border-bottom-color: rgba(255,255,255,0.07); }
  .dark .gl-label { color: #94A3B8; }
  .dark .gl-input { background: #0F172A; border-color: rgba(255,255,255,0.12); color: #F1F5F9; }
  .dark .gl-input::placeholder { color: #475569; }
  .dark .gl-progress-input { background: #0F172A; border-color: rgba(255,255,255,0.12); color: #F1F5F9; }
  .dark .gl-progress-input::placeholder { color: #475569; }
  .dark .gl-quick-btn { background: #0F172A; border-color: rgba(255,255,255,0.10); color: #CBD5E1; }
  .dark .gl-quick-btn:hover { background: rgba(37,99,235,0.15); border-color: rgba(59,130,246,0.4); color: #93C5FD; }
  .dark .gl-reset-btn { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.3); color: #FCA5A5; }
`;

const CARD: React.CSSProperties = {
  background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, overflow: 'hidden',
};

export function DashboardGoals() {
  const navigate   = useNavigate();
  const [phone,     setPhone]     = useState('');
  const [goals,     setGoals]     = useState<Goal[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name,      setName]      = useState('');
  const [target,    setTarget]    = useState('');
  const [current,   setCurrent]   = useState('');
  const [deadline,  setDeadline]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [err,       setErr]       = useState<string | null>(null);

  // Per-card progress input state: goalId -> input string
  const [progressInputs, setProgressInputs] = useState<Record<string, string>>({});
  const [savingProgress, setSavingProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = 'mira-gl-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = GOALS_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-gl-css')?.remove(); };
  }, []);

  const fetchGoals = useCallback(async (ph: string) => {
    setLoading(true);
    try {
      const r = await fetch(
        `${SUPA_URL}/rest/v1/user_goals?phone_number=eq.${ph}&order=created_at.desc`,
        { headers: HR }
      );
      if (r.ok) {
        const a = await r.json();
        if (Array.isArray(a)) setGoals(a);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }
    setPhone(ph);
    fetchGoals(ph);
  }, []);

  const handleAdd = async () => {
    if (!name.trim() || !target || !deadline) return;
    setSaving(true); setErr(null);
    try {
      const payload: any = {
        phone_number:    phone,
        name:            name.trim(),
        target_amount:   Number(target),
        achieved_amount: Number(current) || 0,
        deadline,
      };
      const r = await fetch(`${SUPA_URL}/rest/v1/user_goals`, {
        method: 'POST',
        headers: HW,
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      setSaved(true);
      setName(''); setTarget(''); setCurrent(''); setDeadline('');
      await fetchGoals(phone);
      setTimeout(() => { setSaved(false); setShowModal(false); }, 800);
    } catch (e: any) {
      setErr(e.message || 'Gagal menyimpan goal');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${SUPA_URL}/rest/v1/user_goals?id=eq.${id}`, {
        method: 'DELETE', headers: HR,
      });
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch {}
  };

  // Save achieved_amount directly (manual input value)
  const handleSaveProgress = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const raw = progressInputs[id] ?? String(goal.achieved_amount);
    const newAmount = Math.min(Math.max(Number(raw) || 0, 0), goal.target_amount);
    setSavingProgress(p => ({ ...p, [id]: true }));
    setGoals(prev => prev.map(g => g.id === id ? { ...g, achieved_amount: newAmount } : g));
    try {
      await fetch(`${SUPA_URL}/rest/v1/user_goals?id=eq.${id}`, {
        method: 'PATCH',
        headers: HW,
        body: JSON.stringify({ achieved_amount: newAmount }),
      });
    } catch {
      setGoals(prev => prev.map(g => g.id === id ? goal : g));
    }
    setSavingProgress(p => ({ ...p, [id]: false }));
  };

  // Quick-add: add preset amount to the input field (not saved yet)
  const handleQuickAdd = (id: string, add: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const current = Number(progressInputs[id] ?? goal.achieved_amount) || goal.achieved_amount;
    const next = Math.min(current + add, goal.target_amount);
    setProgressInputs(p => ({ ...p, [id]: String(next) }));
  };

  // Reset input to current DB value
  const handleResetInput = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    setProgressInputs(p => ({ ...p, [id]: String(goal.achieved_amount) }));
  };

  const progress = (g: Goal) => g.target_amount > 0 ? Math.min((g.achieved_amount / g.target_amount) * 100, 100) : 0;
  const monthsLeft = (deadline?: string) => {
    if (!deadline) return 0;
    const months = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
    return Math.max(months, 0);
  };
  const monthlyNeeded = (g: Goal) => {
    const m = monthsLeft(g.deadline);
    return m > 0 ? (g.target_amount - g.achieved_amount) / m : g.target_amount - g.achieved_amount;
  };

  const totalTarget   = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalCurrent  = goals.reduce((s, g) => s + g.achieved_amount, 0);

  return (
    <div className="gl-wrap">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 600, margin: 0, color: '#111827' }}>Target</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Track progress menuju target saving kamu</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setErr(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
        >
          <Plus style={{ width: 16, height: 16 }} strokeWidth={2.5} /> Add Goal
        </button>
      </div>

      {/* Stats */}
      <div className="gl-stats">
        {[
          { label: 'Total Goals',     val: String(goals.length), icon: '🎯', sub: 'active goals' },
          { label: 'Total Target',    val: fmt(totalTarget),     icon: '📈', sub: 'target amount' },
          { label: 'Total Terkumpul', val: fmt(totalCurrent),    icon: '💰', sub: 'current savings' },
        ].map(({ label, val, icon }) => (
          <div key={label} style={{ ...CARD, padding: '18px 20px' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Goals list */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingTop: 40 }}>Memuat goals...</p>
      ) : goals.length === 0 ? (
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
            const inputVal = progressInputs[g.id] ?? String(g.achieved_amount);
            const isSaving = savingProgress[g.id] || false;
            return (
              <div key={g.id} style={{ ...CARD }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                      {g.icon ? `${g.icon} ` : ''}{g.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>Target: {fmt(g.target_amount)}</div>
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
                      <span style={{ fontWeight: 500, color: '#111827' }}>{fmt(g.achieved_amount)}</span>
                      <span style={{ color: '#9CA3AF' }}>{fmt(g.target_amount - g.achieved_amount)} lagi</span>
                    </div>
                    <div style={{ height: 8, background: '#F1F4F8', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: done ? '#16A34A' : '#2563EB', width: `${Math.min(pct, 100)}%`, transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
                    </div>
                  </div>

                  {/* Details */}
                  {g.deadline && (
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
                  )}

                  {/* Status */}
                  <div style={{ background: done ? '#F0FDF4' : mn > 5000000 ? '#FFF1F2' : '#EFF6FF', borderRadius: 10, padding: '10px 12px' }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: done ? '#065F46' : mn > 5000000 ? '#DC2626' : '#1D4ED8' }}>
                      {done ? '🎉 Goal tercapai! Selamat!' : mn > 5000000 ? '⚠️ Target bulanan tinggi — pertimbangkan adjust deadline' : '✨ On track! Keep going!'}
                    </p>
                  </div>

                  {/* Progress update — manual input + quick add buttons */}
                  {!done && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {/* Manual input + save + reset */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#6B7280', pointerEvents: 'none' }}>Rp</span>
                          <input
                            className="gl-progress-input"
                            type="number"
                            style={{ paddingLeft: 30 }}
                            value={inputVal}
                            onChange={e => setProgressInputs(p => ({ ...p, [g.id]: e.target.value }))}
                            placeholder="0"
                            min={0}
                            max={g.target_amount}
                          />
                        </div>
                        <button
                          className="gl-save-btn"
                          disabled={isSaving}
                          onClick={() => handleSaveProgress(g.id)}
                        >
                          {isSaving ? '...' : <Check style={{ width: 13, height: 13 }} />}
                        </button>
                        <button
                          className="gl-reset-btn"
                          onClick={() => handleResetInput(g.id)}
                          title="Reset ke nilai tersimpan"
                        >
                          <RotateCcw style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                      {/* Quick-add chips */}
                      <div style={{ display: 'flex', gap: 5 }}>
                        {[100000, 500000, 1000000].map(v => (
                          <button key={v} onClick={() => handleQuickAdd(g.id, v)} className="gl-quick-btn">
                            +{v >= 1000000 ? (v / 1000000) + 'jt' : v / 1000 + 'rb'}
                          </button>
                        ))}
                      </div>
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
              {err && <div style={{ fontSize: 13, color: '#EF4444', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8 }}>{err}</div>}
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
              <button className="gl-submit" onClick={handleAdd} disabled={saving || saved || !name.trim() || !target || !deadline}>
                {saved ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Check style={{ width: 16, height: 16 }} /> Tersimpan!</span>
                       : saving ? 'Menyimpan...' : 'Simpan Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
