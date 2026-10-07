/**
 * Target — saving goals with a history of every deposit / withdrawal.
 *   user_goals          the goal (name, target, deadline, achieved_amount)
 *   user_goal_entries   history (+ nabung / − ambil) via mira-tools; a DB
 *                       trigger keeps achieved_amount = earlier balance + entries
 * Goals themselves are created / edited / deleted through the REST API like
 * before; what was saved before history existed shows as "Saldo awal".
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Pencil, Trash2, Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { isReadOnlyError, openRenewSheet, requireActive } from '../../lib/subscription';
import { callTools } from '../../lib/tools';
import { MiraIcon, type IconName } from '../../components/icons/MiraIcon';
import { AmountInput, Sheet } from '../../components/Sheet';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const HR = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };
const HW = { ...HR, 'Content-Type': 'application/json', Prefer: 'return=representation' };

type Goal = {
  id: string;
  name: string;
  category?: string | null;
  target_amount: number;
  achieved_amount: number;
  deadline?: string | null;
  created_at?: string;
};
type Entry = { id: string; amount: number; note: string | null; date: string; created_at: string };

const fmt = (n: number) => 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');
/** Summary tiles: Rp10jt / Rp1,5jt so big targets fit on a phone. */
const fmtShort = (n: number) => (Math.abs(n) >= 1e6 ? 'Rp' + (Math.abs(n) / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + 'jt' : fmt(n));
const todayWIB = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const parseDay = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const fmtDate = (s?: string | null, long = false) => (s ? parseDay(s.slice(0, 10)).toLocaleDateString('id-ID', { day: 'numeric', month: long ? 'long' : 'short', year: 'numeric' }) : '');

const GOAL_CATS: { key: string; icon: IconName; match: RegExp }[] = [
  { key: 'Dana Darurat', icon: 'shield', match: /darurat|emergency/i },
  { key: 'Rumah & Properti', icon: 'dream-house', match: /rumah|properti|kavling|apartemen|house|kpr/i },
  { key: 'Kendaraan', icon: 'car', match: /kendaraan|mobil|motor|mclaren|car\b/i },
  { key: 'Liburan', icon: 'plane', match: /liburan|travel|trip|holiday|jalan/i },
  { key: 'Pendidikan', icon: 'grad-cap', match: /pendidikan|sekolah|kuliah|kursus|edu/i },
  { key: 'Menikah', icon: 'ring', match: /nikah|wedding|lamaran/i },
  { key: 'Gadget', icon: 'gadget', match: /gadget|hp\b|laptop|iphone|kamera/i },
  { key: 'Bisnis', icon: 'shop', match: /bisnis|usaha|modal/i },
  { key: 'Investasi & Pensiun', icon: 'growth', match: /invest|pensiun|haji|umroh|saham/i },
  { key: 'Lainnya', icon: 'target', match: /$^/ },
];
const catOf = (g: Pick<Goal, 'category' | 'name'>) =>
  GOAL_CATS.find((c) => c.key === g.category) ||
  GOAL_CATS.find((c) => c.match.test(g.category || '')) ||
  GOAL_CATS.find((c) => c.match.test(g.name || '')) ||
  GOAL_CATS[GOAL_CATS.length - 1];

const pctOf = (g: Goal) => (g.target_amount > 0 ? Math.min((g.achieved_amount / g.target_amount) * 100, 100) : 0);
/** Whole months from today to the deadline (at least 1 while it's in the future). */
const monthsLeft = (deadline?: string | null) => {
  if (!deadline) return 0;
  const d = parseDay(deadline), t = parseDay(todayWIB());
  if (d <= t) return 0;
  const m = (d.getFullYear() - t.getFullYear()) * 12 + (d.getMonth() - t.getMonth()) + (d.getDate() >= t.getDate() ? 0 : -1);
  return Math.max(1, m);
};

const CSS = `
  .gl-wrap { padding: 24px 32px 48px; max-width: 960px; margin: 0 auto; font-family: 'DM Sans', sans-serif; color: #111827; }
  .gl-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .gl-head h1 { font: 600 20px 'Sora', sans-serif; margin: 0; }
  .gl-head p { font-size: 13px; color: #6B7280; margin: 3px 0 0; }
  .gl-add { display: inline-flex; align-items: center; gap: 6px; background: #2563EB; color: #fff; border: 0; border-radius: 12px; padding: 10px 16px;
    font: 600 14px 'DM Sans', sans-serif; cursor: pointer; }
  .gl-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
  .gl-stat { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 14px; padding: 12px 14px; min-width: 0; }
  .gl-stat-l { font-size: 12px; color: #6B7280; }
  .gl-stat-v { font: 700 16px 'Sora', sans-serif; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .gl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .gl-card { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 12px;
    cursor: pointer; text-align: left; font-family: inherit; color: inherit; transition: box-shadow .15s, transform .1s; -webkit-tap-highlight-color: transparent; }
  .gl-card:hover { box-shadow: 0 6px 20px rgba(15,23,42,.06); }
  .gl-card:active { transform: scale(.99); }
  .gl-card-top { display: flex; gap: 12px; align-items: center; }
  .gl-name { font: 600 15px 'Sora', sans-serif; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .gl-sub { font-size: 12px; color: #6B7280; margin-top: 2px; }
  .gl-pct { margin-left: auto; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: #F1F5F9; color: #475569; flex-shrink: 0; }
  .gl-pct.done { background: #DCFCE7; color: #166534; }
  .gl-bar { height: 8px; background: #EEF1F6; border-radius: 99px; overflow: hidden; }
  .gl-bar > div { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #2563EB, #22D3EE); transition: width .6s cubic-bezier(.4,0,.2,1); }
  .gl-bar.done > div { background: #16A34A; }
  .gl-amts { display: flex; justify-content: space-between; font-size: 12.5px; }
  .gl-amts strong { font-family: 'Sora', sans-serif; }
  .gl-meta { display: flex; gap: 8px; flex-wrap: wrap; font-size: 12px; color: #475569; }
  .gl-meta span { background: #F8FAFC; border-radius: 8px; padding: 4px 8px; }
  .gl-acts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .gl-act { height: 38px; border-radius: 11px; border: 1.5px solid #E5E7EB; background: #fff; font: 600 13px 'DM Sans', sans-serif; color: #374151;
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  .gl-act.in { border-color: #BBF7D0; background: #F0FDF4; color: #15803D; }
  .gl-empty { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 18px; padding: 40px 20px; text-align: center; color: #6B7280; font-size: 14px; }
  .gl-hist-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,.05); }
  .gl-hist-row:last-child { border-bottom: 0; }
  .gl-hist-ic { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .gl-hist-amt { font: 700 14px 'Sora', sans-serif; white-space: nowrap; }
  .gl-mini { width: 30px; height: 30px; border-radius: 8px; border: 0; background: transparent; color: #9CA3AF; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
  .gl-mini:hover { background: #F1F5F9; color: #374151; }
  .gl-big { text-align: center; padding: 4px 0 14px; }
  .gl-big-amt { font: 800 26px 'Sora', sans-serif; }
  .gl-cats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .gl-cat { border: 1.5px solid #E5E7EB; background: #fff; border-radius: 12px; padding: 7px 2px 6px; cursor: pointer; display: flex; flex-direction: column;
    align-items: center; gap: 3px; font: 600 10.5px 'DM Sans', sans-serif; color: #374151; text-align: center; line-height: 1.2; }
  .gl-cat.on { border-color: #2563EB; background: #EFF6FF; color: #1D4ED8; }
  .gl-tips { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 16px; padding: 14px 16px; }
  .gl-tips li { font-size: 13px; color: #374151; margin: 6px 0; }
  @media (max-width: 900px) {
    .gl-wrap { padding: 16px 12px 28px; }
    .gl-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 480px) {
    .gl-stats { gap: 6px; }
    .gl-stat { padding: 10px; }
    .gl-stat-v { font-size: 13.5px; }
    .gl-cats { grid-template-columns: repeat(4, 1fr); }
  }
  .dark .gl-wrap { color: #F1F5F9; }
  .dark .gl-stat, .dark .gl-card, .dark .gl-empty, .dark .gl-tips { background: #1E293B; border-color: rgba(255,255,255,.08); }
  .dark .gl-stat-l, .dark .gl-sub, .dark .gl-head p { color: #94A3B8; }
  .dark .gl-pct { background: #334155; color: #CBD5E1; }
  .dark .gl-pct.done { background: rgba(22,163,74,.2); color: #86EFAC; }
  .dark .gl-bar { background: #334155; }
  .dark .gl-meta { color: #CBD5E1; }
  .dark .gl-meta span { background: #0F172A; }
  .dark .gl-act { background: #0F172A; border-color: rgba(255,255,255,.12); color: #E2E8F0; }
  .dark .gl-act.in { background: rgba(22,163,74,.15); border-color: rgba(74,222,128,.3); color: #86EFAC; }
  .dark .gl-hist-row { border-color: rgba(255,255,255,.06); }
  .dark .gl-mini:hover { background: #334155; color: #E2E8F0; }
  .dark .gl-cat { background: #0F172A; border-color: rgba(255,255,255,.1); color: #CBD5E1; }
  .dark .gl-cat.on { background: rgba(37,99,235,.18); border-color: #3B82F6; color: #93C5FD; }
  .dark .gl-tips li { color: #CBD5E1; }
`;

type Panel =
  | { kind: 'form'; goal: Goal | null }
  | { kind: 'move'; goal: Goal; dir: 1 | -1; entry?: Entry }
  | { kind: 'detail'; goal: Goal };

export function DashboardGoals() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<Panel | null>(null);

  useEffect(() => {
    const id = 'mira-gl-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const fetchGoals = useCallback(async (ph: string) => {
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/user_goals?phone_number=eq.${ph}&order=created_at.desc`, { headers: HR });
      if (r.ok) { const a = await r.json(); if (Array.isArray(a)) setGoals(a.map((g) => ({ ...g, target_amount: Number(g.target_amount || 0), achieved_amount: Number(g.achieved_amount || 0) }))); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }
    setPhone(ph);
    void fetchGoals(ph);
  }, []);

  const refresh = () => phone && fetchGoals(phone);
  const patchGoal = (id: string, p: Partial<Goal>) => {
    setGoals((list) => list.map((g) => (g.id === id ? { ...g, ...p } : g)));
    setPanel((pn) => (pn && 'goal' in pn && pn.goal?.id === id ? { ...pn, goal: { ...pn.goal, ...p } } as Panel : pn));
  };

  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.achieved_amount, 0);
  const guard = (msg: string, then: () => void) => { if (requireActive(msg)) then(); };

  return (
    <div className="gl-wrap">
      <div className="gl-head">
        <div>
          <h1>Target</h1>
          <p>Nabung pelan-pelan, semua tercatat di riwayat</p>
        </div>
        <button className="gl-add" onClick={() => guard('Tambah target butuh langganan aktif.', () => setPanel({ kind: 'form', goal: null }))}>
          <Plus size={16} strokeWidth={2.5} /> Target baru
        </button>
      </div>

      <div className="gl-stats">
        <div className="gl-stat"><div className="gl-stat-l">Target aktif</div><div className="gl-stat-v">{goals.length}</div></div>
        <div className="gl-stat"><div className="gl-stat-l">Terkumpul</div><div className="gl-stat-v" style={{ color: '#16A34A' }}>{fmtShort(totalSaved)}</div></div>
        <div className="gl-stat"><div className="gl-stat-l">Dari total</div><div className="gl-stat-v">{fmtShort(totalTarget)}</div></div>
      </div>

      {loading ? (
        <div className="gl-empty">Memuat target…</div>
      ) : goals.length === 0 ? (
        <div className="gl-empty">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><MiraIcon name="target" size={64} /></div>
          Belum ada target. Mulai dari yang kecil — dana darurat, liburan, atau gadget impian.
          <div style={{ marginTop: 14 }}>
            <button className="gl-add" onClick={() => guard('Tambah target butuh langganan aktif.', () => setPanel({ kind: 'form', goal: null }))}>
              <Plus size={16} strokeWidth={2.5} /> Bikin target pertama
            </button>
          </div>
        </div>
      ) : (
        <div className="gl-grid">
          {goals.map((g) => {
            const pct = pctOf(g);
            const done = pct >= 100;
            const ml = monthsLeft(g.deadline);
            const need = Math.max(0, g.target_amount - g.achieved_amount);
            return (
              <div key={g.id} className="gl-card" role="button" tabIndex={0}
                onClick={() => setPanel({ kind: 'detail', goal: g })} onKeyDown={(e) => e.key === 'Enter' && setPanel({ kind: 'detail', goal: g })}>
                <div className="gl-card-top">
                  <MiraIcon name={catOf(g).icon} size={44} />
                  <div style={{ minWidth: 0 }}>
                    <div className="gl-name">{g.name}</div>
                    <div className="gl-sub">Target {fmt(g.target_amount)}</div>
                  </div>
                  <span className={`gl-pct${done ? ' done' : ''}`}>{done ? 'Tercapai' : `${pct < 1 && pct > 0 ? '<1' : Math.round(pct)}%`}</span>
                </div>
                <div className={`gl-bar${done ? ' done' : ''}`}><div style={{ width: `${pct}%` }} /></div>
                <div className="gl-amts">
                  <span><strong>{fmt(g.achieved_amount)}</strong> terkumpul</span>
                  <span style={{ color: '#6B7280' }}>{done ? 'Selamat!' : `${fmt(need)} lagi`}</span>
                </div>
                {!done && g.deadline && (
                  <div className="gl-meta">
                    <span>Deadline {fmtDate(g.deadline)}</span>
                    {ml > 0 ? <span>≈ {fmt(Math.ceil(need / ml))}/bulan</span> : <span style={{ color: '#DC2626' }}>Lewat deadline</span>}
                  </div>
                )}
                <div className="gl-acts" onClick={(e) => e.stopPropagation()}>
                  <button className="gl-act in" onClick={() => guard('Nabung ke target butuh langganan aktif.', () => setPanel({ kind: 'move', goal: g, dir: 1 }))}>
                    <ArrowDownLeft size={15} /> Nabung
                  </button>
                  <button className="gl-act" disabled={g.achieved_amount <= 0}
                    onClick={() => guard('Ambil dana target butuh langganan aktif.', () => setPanel({ kind: 'move', goal: g, dir: -1 }))}>
                    <ArrowUpRight size={15} /> Ambil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="gl-tips">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontFamily: "'Sora',sans-serif", fontSize: 14 }}>
          <MiraIcon name="bulb" size={28} /> Tips
        </div>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          <li>Nabung tepat setelah gajian, sebelum belanja — catat di sini biar progresnya kelihatan.</li>
          <li>Pecah target besar jadi setoran bulanan; MIRA hitung kebutuhan per bulannya.</li>
          <li>Kepakai sebagian? Pakai "Ambil" supaya saldo target tetap jujur.</li>
        </ul>
      </div>

      {panel?.kind === 'form' && (
        <GoalForm goal={panel.goal} phone={phone} onClose={() => setPanel(null)}
          onSaved={(g, isNew) => { if (isNew) void refresh(); else patchGoal(g.id, g); setPanel(isNew ? null : { kind: 'detail', goal: { ...(panel.goal as Goal), ...g } }); }} />
      )}
      {panel?.kind === 'move' && (
        <MoveSheet goal={panel.goal} dir={panel.dir} entry={panel.entry}
          onClose={() => setPanel(panel.entry ? { kind: 'detail', goal: panel.goal } : null)}
          onDone={(achieved) => { patchGoal(panel.goal.id, { achieved_amount: achieved }); setPanel({ kind: 'detail', goal: { ...panel.goal, achieved_amount: achieved } }); }} />
      )}
      {panel?.kind === 'detail' && (
        <GoalDetail goal={panel.goal} onClose={() => setPanel(null)}
          onMove={(dir, entry) => guard('Ubah riwayat target butuh langganan aktif.', () => setPanel({ kind: 'move', goal: panel.goal, dir, entry }))}
          onEdit={() => guard('Ubah target butuh langganan aktif.', () => setPanel({ kind: 'form', goal: panel.goal }))}
          onAchieved={(a) => patchGoal(panel.goal.id, { achieved_amount: a })}
          onDeleted={() => { setGoals((l) => l.filter((x) => x.id !== panel.goal.id)); setPanel(null); }} />
      )}
    </div>
  );
}

/* ── Create / edit a goal ─────────────────────────────────────────── */

function GoalForm({ goal, phone, onClose, onSaved }: {
  goal: Goal | null; phone: string; onClose: () => void; onSaved: (g: Goal, isNew: boolean) => void;
}) {
  const [name, setName] = useState(goal?.name || '');
  const [cat, setCat] = useState(goal ? catOf(goal).key : 'Dana Darurat');
  const [target, setTarget] = useState(goal?.target_amount || 0);
  const [initial, setInitial] = useState(0);
  const [deadline, setDeadline] = useState(goal?.deadline?.slice(0, 10) || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!name.trim()) { setErr('Kasih nama targetnya dulu.'); return; }
    if (target <= 0) { setErr('Isi nominal targetnya.'); return; }
    setBusy(true); setErr('');
    try {
      const body: Record<string, unknown> = { name: name.trim(), category: cat, target_amount: target, deadline: deadline || null, updated_at: new Date().toISOString() };
      const r = goal
        ? await fetch(`${SUPA_URL}/rest/v1/user_goals?id=eq.${goal.id}`, { method: 'PATCH', headers: HW, body: JSON.stringify(body) })
        : await fetch(`${SUPA_URL}/rest/v1/user_goals`, { method: 'POST', headers: HW, body: JSON.stringify({ ...body, phone_number: phone, achieved_amount: initial }) });
      if (!r.ok) throw new Error((await r.text().catch(() => '')) || 'Gagal menyimpan target');
      const rows = await r.json().catch(() => []);
      onSaved({ ...(goal || {}), ...body, ...(rows?.[0] || {}) } as Goal, !goal);
    } catch (e: any) {
      if (isReadOnlyError(e?.message)) { onClose(); openRenewSheet('Langganan kamu baru saja berakhir.'); return; }
      setErr('Gagal menyimpan. Coba lagi ya.');
    }
    setBusy(false);
  };

  return (
    <Sheet title={goal ? 'Edit target' : 'Target baru'} onClose={onClose} busy={busy}>
      <div className="msh-field">
        <span className="msh-label">Nama target</span>
        <input className="msh-input" placeholder="Misal: Liburan ke Jepang" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="msh-field">
        <span className="msh-label">Jenis</span>
        <div className="gl-cats">
          {GOAL_CATS.map((c) => (
            <button key={c.key} className={`gl-cat${cat === c.key ? ' on' : ''}`} onClick={() => setCat(c.key)}>
              <MiraIcon name={c.icon} size={26} />{c.key}
            </button>
          ))}
        </div>
      </div>
      <div className="msh-field">
        <span className="msh-label">Nominal target</span>
        <AmountInput value={target} onChange={setTarget} />
      </div>
      <div className={goal ? 'msh-field' : 'msh-two msh-field'}>
        {!goal && (
          <div>
            <span className="msh-label">Sudah terkumpul</span>
            <input className="msh-input" inputMode="numeric" placeholder="0" value={initial ? initial.toLocaleString('id-ID') : ''}
              onChange={(e) => setInitial(Number(e.target.value.replace(/\D/g, '')) || 0)} />
          </div>
        )}
        <div>
          <span className="msh-label">Deadline (opsional)</span>
          <input className="msh-input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>
      {err && <div className="msh-err">{err}</div>}
      <div className="msh-btns">
        <button className="msh-btn ghost" onClick={onClose} disabled={busy}>Batal</button>
        <button className="msh-btn primary" onClick={() => void save()} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    </Sheet>
  );
}

/* ── Nabung / ambil (new or edited history entry) ─────────────────── */

function MoveSheet({ goal, dir, entry, onClose, onDone }: {
  goal: Goal; dir: 1 | -1; entry?: Entry; onClose: () => void; onDone: (achieved: number) => void;
}) {
  const [amount, setAmount] = useState(entry ? Math.abs(entry.amount) : 0);
  const [note, setNote] = useState(entry?.note || '');
  const [date, setDate] = useState(entry?.date || todayWIB());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const sign = entry ? Math.sign(entry.amount) || 1 : dir;
  const left = Math.max(0, goal.target_amount - goal.achieved_amount);

  const save = async () => {
    if (amount <= 0) { setErr('Isi nominalnya dulu.'); return; }
    setBusy(true); setErr('');
    try {
      if (entry) {
        await callTools({ op: 'goal_entry_update', entry_id: entry.id, amount: sign * amount, note, date });
        onDone(goal.achieved_amount + sign * amount - entry.amount);
      } else {
        const r = await callTools<{ achieved_amount: number }>({ op: 'goal_entry_add', goal_id: goal.id, amount: sign * amount, note, date });
        onDone(r.achieved_amount);
      }
    } catch (e: any) {
      if (isReadOnlyError(e?.message)) { onClose(); openRenewSheet('Langganan kamu baru saja berakhir.'); return; }
      setErr(e?.message || 'Gagal menyimpan. Coba lagi ya.');
      setBusy(false);
    }
  };

  return (
    <Sheet title={`${entry ? 'Edit' : ''} ${sign > 0 ? 'Nabung' : 'Ambil dana'} · ${goal.name}`.trim()} onClose={onClose} busy={busy}>
      <div className="msh-field">
        <span className="msh-label">{sign > 0 ? 'Nominal ditabung' : 'Nominal diambil'}</span>
        <AmountInput value={amount} onChange={setAmount} />
        <div className="msh-chips">
          {(sign > 0 ? [50000, 100000, 500000, 1000000] : [50000, 100000, 500000]).map((v) => (
            <button key={v} className="msh-chip" onClick={() => setAmount((a) => a + v)}>+{v >= 1e6 ? v / 1e6 + 'jt' : v / 1000 + 'rb'}</button>
          ))}
          {sign > 0 && left > 0 && <button className="msh-chip" onClick={() => setAmount(left)}>Lunasi {fmt(left)}</button>}
          {sign < 0 && <button className="msh-chip" onClick={() => setAmount(goal.achieved_amount + (entry ? Math.abs(entry.amount) : 0))}>Semua</button>}
        </div>
      </div>
      <div className="msh-two msh-field">
        <div>
          <span className="msh-label">Catatan</span>
          <input className="msh-input" placeholder={sign > 0 ? 'Misal: sisa gaji' : 'Misal: servis motor'} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div>
          <span className="msh-label">Tanggal</span>
          <input className="msh-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      {err && <div className="msh-err">{err}</div>}
      <div className="msh-btns">
        <button className="msh-btn ghost" onClick={onClose} disabled={busy}>Batal</button>
        <button className={`msh-btn ${sign > 0 ? 'green' : 'primary'}`} onClick={() => void save()} disabled={busy || amount <= 0}>
          {busy ? 'Menyimpan…' : sign > 0 ? `Tabung ${amount ? fmt(amount) : ''}` : `Ambil ${amount ? fmt(amount) : ''}`}
        </button>
      </div>
    </Sheet>
  );
}

/* ── Goal detail + history ────────────────────────────────────────── */

function GoalDetail({ goal, onClose, onMove, onEdit, onAchieved, onDeleted }: {
  goal: Goal; onClose: () => void; onMove: (dir: 1 | -1, entry?: Entry) => void; onEdit: () => void;
  onAchieved: (a: number) => void; onDeleted: () => void;
}) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await callTools<{ entries: Entry[]; achieved_amount: number }>({ op: 'goal_entries', goal_id: goal.id });
      setEntries(r.entries.map((e) => ({ ...e, amount: Number(e.amount) })));
      if (r.achieved_amount !== goal.achieved_amount) onAchieved(r.achieved_amount);
    } catch (e: any) { setErr(e?.message || 'Gagal memuat riwayat.'); setEntries([]); }
  }, [goal.id]);
  useEffect(() => { void load(); }, [load]);

  const removeEntry = async (e: Entry) => {
    if (!requireActive('Ubah riwayat target butuh langganan aktif.')) return;
    setErr('');
    try {
      await callTools({ op: 'goal_entry_delete', entry_id: e.id });
      setEntries((l) => (l || []).filter((x) => x.id !== e.id));
      onAchieved(goal.achieved_amount - e.amount);
    } catch (x: any) { setErr(x?.message || 'Gagal menghapus.'); }
  };

  const removeGoal = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/user_goals?id=eq.${goal.id}`, { method: 'DELETE', headers: HR });
      if (!r.ok) throw new Error();
      onDeleted();
    } catch { setErr('Gagal menghapus target.'); setBusy(false); }
  };

  const pct = pctOf(goal);
  const ml = monthsLeft(goal.deadline);
  const need = Math.max(0, goal.target_amount - goal.achieved_amount);
  const sumEntries = (entries || []).reduce((s, e) => s + e.amount, 0);
  const opening = goal.achieved_amount - sumEntries; // saved before history existed
  const cat = catOf(goal);

  return (
    <Sheet title={goal.name} onClose={onClose} busy={busy}>
      <div className="gl-big">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}><MiraIcon name={cat.icon} size={52} /></div>
        <div className="gl-big-amt">{fmt(goal.achieved_amount)}</div>
        <div style={{ fontSize: 13, color: '#6B7280' }}>dari {fmt(goal.target_amount)} · {Math.round(pct)}%</div>
        <div className={`gl-bar${pct >= 100 ? ' done' : ''}`} style={{ marginTop: 10 }}><div style={{ width: `${pct}%` }} /></div>
        <div className="gl-meta" style={{ justifyContent: 'center', marginTop: 10 }}>
          <span>{cat.key}</span>
          {goal.deadline && <span>Deadline {fmtDate(goal.deadline, true)}</span>}
          {need > 0 && ml > 0 && <span>≈ {fmt(Math.ceil(need / ml))}/bulan · {ml} bln lagi</span>}
        </div>
      </div>

      <div className="msh-btns" style={{ marginBottom: 14 }}>
        <button className="msh-btn green" onClick={() => onMove(1)}><ArrowDownLeft size={16} />Nabung</button>
        <button className="msh-btn ghost" onClick={() => onMove(-1)} disabled={goal.achieved_amount <= 0}><ArrowUpRight size={16} />Ambil</button>
      </div>

      <div className="msh-label">Riwayat</div>
      {err && <div className="msh-err">{err}</div>}
      {entries === null ? (
        <div style={{ fontSize: 13, color: '#9CA3AF', padding: '10px 0' }}>Memuat…</div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          {entries.length === 0 && opening === 0 && <div style={{ fontSize: 13, color: '#9CA3AF', padding: '10px 0' }}>Belum ada setoran. Tap "Nabung" buat mulai.</div>}
          {entries.map((e) => (
            <div className="gl-hist-row" key={e.id}>
              <div className="gl-hist-ic" style={{ background: e.amount > 0 ? '#DCFCE7' : '#FEF3C7', color: e.amount > 0 ? '#15803D' : '#B45309' }}>
                {e.amount > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.note || (e.amount > 0 ? 'Nabung' : 'Ambil dana')}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{fmtDate(e.date)}</div>
              </div>
              <div className="gl-hist-amt" style={{ color: e.amount > 0 ? '#16A34A' : '#B45309' }}>{e.amount > 0 ? '+' : '−'}{fmt(e.amount)}</div>
              <button className="gl-mini" aria-label="Edit" onClick={() => onMove(e.amount > 0 ? 1 : -1, e)}><Pencil size={14} /></button>
              <button className="gl-mini" aria-label="Hapus" onClick={() => void removeEntry(e)}><Trash2 size={14} /></button>
            </div>
          ))}
          {opening !== 0 && (
            <div className="gl-hist-row">
              <div className="gl-hist-ic" style={{ background: '#EEF2FF', color: '#4338CA' }}><Check size={16} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Saldo awal</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Terkumpul sebelum riwayat dicatat{goal.created_at ? ` · ${fmtDate(goal.created_at)}` : ''}</div>
              </div>
              <div className="gl-hist-amt">{opening < 0 ? '−' : ''}{fmt(opening)}</div>
            </div>
          )}
        </div>
      )}

      {confirmDel ? (
        <>
          <div className="msh-confirm"><strong>Hapus target ini?</strong> {goal.name} beserta riwayatnya akan dihapus permanen.</div>
          <div className="msh-btns">
            <button className="msh-btn ghost" onClick={() => setConfirmDel(false)} disabled={busy}>Batal</button>
            <button className="msh-btn danger-solid" onClick={() => void removeGoal()} disabled={busy}>{busy ? 'Menghapus…' : 'Ya, hapus'}</button>
          </div>
        </>
      ) : (
        <div className="msh-btns">
          <button className="msh-btn danger" onClick={() => { if (requireActive('Hapus target butuh langganan aktif.')) setConfirmDel(true); }}><Trash2 size={16} />Hapus</button>
          <button className="msh-btn primary" onClick={onEdit}><Pencil size={16} />Edit target</button>
        </div>
      )}
    </Sheet>
  );
}
