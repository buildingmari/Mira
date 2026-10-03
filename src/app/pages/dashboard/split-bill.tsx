import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera, Sparkles, Pencil, Plus, X, Check, Loader2, Users, Receipt, Share2, Lock, Send, Trash2, Mic, Square,
} from 'lucide-react';
import { compressImage } from '../../lib/image';
import { useVoiceRecorder, fmtSeconds, type VoiceNote } from '../../lib/voice';
import { SPLIT_PREFILL_KEY } from '../../components/MiraChat';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const HR = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };
const TOOLS_URL = `${SUPA_URL}/functions/v1/mira-tools`;

const WALLETS = ['Cash', 'BCA', 'BRI', 'Mandiri', 'BNI', 'CIMB', 'Jenius', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'];

// ─── Split math — a copy of supabase/functions/_shared/split.ts computeSplit;
//     keep the two in sync (the server re-computes on save regardless). ─────

interface SplitItem { name: string; price: number; qty: number; assignees: string[] }
interface Participant {
  name: string; is_me: boolean; amount: number;
  fixed?: number | null; paid?: boolean; asset_id?: string | null;
}
interface Draft {
  merchant: string; date: string; wallet: string;
  items: SplitItem[]; tax: number; discount: number; total: number;
  mode: 'item' | 'equal' | 'manual';
  participants: Participant[];
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const subtotalOf = (d: Draft) => d.items.reduce((s, it) => s + num(it.price) * (num(it.qty) || 1), 0);
const totalOf = (d: Draft) => (num(d.total) > 0 ? num(d.total) : Math.max(0, subtotalOf(d) + num(d.tax) - num(d.discount)));
const isFixed = (p: Participant) =>
  p.fixed !== null && p.fixed !== undefined && Number.isFinite(Number(p.fixed)) && Number(p.fixed) >= 0;

function computeSplit(d: Draft): Draft {
  const people = d.participants.length ? d.participants : [{ name: 'Kamu', is_me: true, amount: 0 }];
  if (d.mode === 'manual') {
    const ps = people.map((p) => ({ ...p, fixed: null, amount: Math.max(0, Math.round(num(p.amount))) }));
    return { ...d, total: ps.reduce((s, p) => s + p.amount, 0), participants: ps };
  }
  const fixedSum = people.filter(isFixed).reduce((s, p) => s + Math.round(num(p.fixed)), 0);
  const total = totalOf(d) > 0 ? totalOf(d) : fixedSum;
  const free = people.filter((p) => !isFixed(p));
  const remaining = Math.max(0, total - fixedSum);

  const weight: Record<string, number> = {};
  free.forEach((p) => { weight[p.name] = 0; });
  if (d.mode === 'item' && d.items.length) {
    const all = people.map((p) => p.name);
    for (const it of d.items) {
      const line = num(it.price) * (num(it.qty) || 1);
      const owners = (it.assignees || []).filter((n) => all.includes(n));
      const share = owners.length ? owners : all;
      share.forEach((n) => { if (n in weight) weight[n] += line / share.length; });
    }
  }
  let wsum = Object.values(weight).reduce((s, w) => s + w, 0);
  if (wsum <= 0) { free.forEach((p) => { weight[p.name] = 1; }); wsum = free.length; }

  const rounded = people.map((p) => ({
    ...p,
    amount: isFixed(p) ? Math.round(num(p.fixed)) : wsum > 0 ? Math.round((remaining * weight[p.name]) / wsum) : 0,
  }));
  if (free.length) {
    const diff = Math.round(fixedSum + remaining) - rounded.reduce((s, p) => s + p.amount, 0);
    const meFree = rounded.findIndex((p) => p.is_me && !isFixed(p));
    const idx = meFree >= 0 ? meFree : rounded.findIndex((p) => !isFixed(p));
    if (idx >= 0) rounded[idx].amount = Math.max(0, rounded[idx].amount + diff);
  }
  return { ...d, total, participants: rounded };
}

/** With itemized lines the bill total is derived (subtotal + tax − discount),
 *  so later item edits flow through. An AI/receipt total that doesn't match
 *  the items is folded into tax/discount once, here. */
function adopt(raw: Partial<Draft> | null | undefined): Draft {
  const d: Draft = {
    merchant: String(raw?.merchant || ''),
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(raw?.date || '')) ? String(raw!.date) : todayWIB(),
    wallet: String(raw?.wallet || defaultWallet()),
    items: Array.isArray(raw?.items) ? raw!.items.map((it) => ({
      name: String(it?.name || 'Item'), price: Math.max(0, Math.round(num(it?.price))),
      qty: Math.max(1, Math.round(num(it?.qty)) || 1), assignees: Array.isArray(it?.assignees) ? it.assignees.map(String) : [],
    })) : [],
    tax: Math.max(0, Math.round(num(raw?.tax))),
    discount: Math.max(0, Math.round(num(raw?.discount))),
    total: Math.max(0, Math.round(num(raw?.total))),
    mode: raw?.mode === 'item' || raw?.mode === 'manual' ? raw.mode : 'equal',
    participants: Array.isArray(raw?.participants) && raw!.participants.length
      ? raw!.participants.map((p) => ({
        name: p?.is_me ? 'Kamu' : String(p?.name || 'Teman'), is_me: !!p?.is_me,
        amount: Math.max(0, Math.round(num(p?.amount))),
        fixed: p?.fixed === null || p?.fixed === undefined ? null : Math.round(num(p.fixed)),
      }))
      : [{ name: 'Kamu', is_me: true, amount: 0, fixed: null }],
  };
  if (!d.participants.some((p) => p.is_me)) d.participants.unshift({ name: 'Kamu', is_me: true, amount: 0, fixed: null });
  if (d.mode !== 'manual' && d.items.length && d.total > 0) {
    const diff = Math.round(d.total - (subtotalOf(d) + d.tax - d.discount));
    if (diff > 0) d.tax += diff;
    if (diff < 0) d.discount += -diff;
  }
  return recompute(d);
}

function recompute(d: Draft): Draft {
  return computeSplit(d.mode !== 'manual' && d.items.length ? { ...d, total: 0 } : d);
}

// ─── helpers ──────────────────────────────────────────────────────────────

const fmt = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n || 0));
function todayWIB() { return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10); }
function defaultWallet() {
  try { const u = localStorage.getItem('mira_user'); if (u) return JSON.parse(u).primary_wallet || 'Cash'; } catch {}
  return 'Cash';
}
const emptyDraft = (): Draft => recompute({
  merchant: '', date: todayWIB(), wallet: defaultWallet(), items: [], tax: 0, discount: 0, total: 0,
  mode: 'equal', participants: [{ name: 'Kamu', is_me: true, amount: 0, fixed: null }],
});
const fmtDate = (s: string) => {
  try { return new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return s; }
};

async function callTools<T>(body: Record<string, unknown>): Promise<T> {
  const phone = localStorage.getItem('mira_phone') || '';
  const res = await fetch(TOOLS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPA_ANON}`, apikey: SUPA_ANON },
    body: JSON.stringify({ phone_number: phone, ...body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Gagal terhubung ke MIRA. Coba lagi ya.');
  return data as T;
}

function MoneyInput({ value, onChange, placeholder, autoFocus, onEnter, small }: {
  value: number; onChange: (n: number) => void; placeholder?: string; autoFocus?: boolean; onEnter?: () => void; small?: boolean;
}) {
  return (
    <div className={`sb-money${small ? ' sm' : ''}`}>
      <span>Rp</span>
      <input
        inputMode="numeric"
        autoFocus={autoFocus}
        placeholder={placeholder || '0'}
        value={value ? new Intl.NumberFormat('id-ID').format(value) : ''}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
        onKeyDown={(e) => { if (e.key === 'Enter') onEnter?.(); }}
      />
    </div>
  );
}

const CSS = `
  .sb-wrap { padding: 24px 32px 48px; max-width: 760px; margin: 0 auto; font-family: 'DM Sans', sans-serif; color: #111827; }
  .sb-card { background:#fff; border:1px solid rgba(0,0,0,0.07); border-radius:16px; margin-bottom:14px; overflow:hidden; }
  .sb-card-hd { padding:14px 18px; border-bottom:1px solid rgba(0,0,0,0.05); display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .sb-card-hd h3 { margin:0; font-family:'Sora',sans-serif; font-size:14px; font-weight:600; display:flex; align-items:center; gap:8px; }
  .sb-card-bd { padding:16px 18px; }
  .sb-tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .sb-tab { border:1.5px solid rgba(0,0,0,0.08); background:#F8F9FB; border-radius:12px; padding:12px 8px; cursor:pointer;
            display:flex; flex-direction:column; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:#374151; font-family:'DM Sans',sans-serif; }
  .sb-tab.on { border-color:#2563EB; background:#EFF6FF; color:#1D4ED8; }
  .sb-tab small { font-weight:400; color:#6B7280; font-size:11px; text-align:center; }
  .sb-drop { width:100%; border:1.5px dashed rgba(37,99,235,0.35); background:#F8FAFF; border-radius:14px; padding:22px 14px; cursor:pointer;
             display:flex; flex-direction:column; align-items:center; gap:6px; color:#1D4ED8; font-weight:600; font-size:13.5px; font-family:'DM Sans',sans-serif; }
  .sb-label { display:block; font-size:11.5px; font-weight:600; color:#6B7280; margin:0 0 6px; letter-spacing:.3px; text-transform:uppercase; }
  .sb-input, .sb-select, .sb-textarea { width:100%; box-sizing:border-box; border:1px solid rgba(0,0,0,0.10); border-radius:10px;
              background:#F8F9FB; font-size:14px; font-family:'DM Sans',sans-serif; color:#111827; outline:none; }
  .sb-input, .sb-select { height:42px; padding:0 12px; }
  .sb-textarea { padding:10px 12px; resize:vertical; min-height:74px; line-height:1.5; }
  .sb-input:focus, .sb-select:focus, .sb-textarea:focus { border-color:#2563EB; background:#fff; }
  .sb-money { display:flex; align-items:center; height:42px; border:1px solid rgba(0,0,0,0.10); border-radius:10px; background:#F8F9FB; padding:0 10px; gap:6px; }
  .sb-money:focus-within { border-color:#2563EB; background:#fff; }
  .sb-money span { font-size:12.5px; color:#6B7280; font-weight:500; }
  .sb-money input { flex:1; min-width:0; border:none; background:transparent; outline:none; font-size:14px; font-family:'DM Sans',sans-serif; color:#111827; }
  .sb-money.sm { height:36px; }
  .sb-grid3 { display:grid; grid-template-columns:2fr 1.2fr 1.2fr; gap:10px; }
  .sb-chips { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .sb-chip { display:inline-flex; align-items:center; gap:5px; padding:6px 10px; border-radius:99px; font-size:12.5px; font-weight:600;
             background:#EFF6FF; color:#1D4ED8; border:1px solid rgba(37,99,235,0.15); }
  .sb-chip.me { background:#2563EB; color:#fff; border-color:#2563EB; }
  .sb-chip button { background:none; border:none; cursor:pointer; color:inherit; display:flex; padding:0; opacity:.7; }
  .sb-add { display:flex; gap:6px; flex:1; min-width:180px; }
  .sb-seg { display:grid; grid-template-columns:repeat(3,1fr); background:#F1F4F8; border-radius:11px; padding:3px; gap:3px; }
  .sb-seg button { border:none; background:transparent; border-radius:9px; padding:8px 4px; font-size:12.5px; font-weight:600; color:#6B7280; cursor:pointer; font-family:'DM Sans',sans-serif; }
  .sb-seg button.on { background:#fff; color:#111827; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
  .sb-item { border:1px solid rgba(0,0,0,0.07); border-radius:12px; padding:10px; margin-bottom:8px; background:#FCFCFD; }
  .sb-item-row { display:grid; grid-template-columns:1fr 64px 130px 30px; gap:6px; align-items:center; }
  .sb-mini { display:inline-flex; align-items:center; padding:4px 9px; border-radius:99px; font-size:11.5px; font-weight:600; cursor:pointer;
             border:1px solid rgba(0,0,0,0.1); background:#fff; color:#6B7280; font-family:'DM Sans',sans-serif; }
  .sb-mini.on { background:#2563EB; border-color:#2563EB; color:#fff; }
  .sb-ghost { background:none; border:1px dashed rgba(0,0,0,0.18); border-radius:10px; padding:8px 12px; font-size:12.5px; font-weight:600; color:#374151; cursor:pointer;
              display:inline-flex; align-items:center; gap:6px; font-family:'DM Sans',sans-serif; }
  .sb-icon { width:30px; height:30px; border-radius:8px; border:none; background:transparent; color:#9CA3AF; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .sb-icon:hover { background:#F1F4F8; color:#6B7280; }
  .sb-sum { display:flex; justify-content:space-between; font-size:13px; color:#6B7280; padding:3px 0; }
  .sb-sum.total { font-size:15px; color:#111827; font-weight:700; font-family:'Sora',sans-serif; padding-top:8px; border-top:1px dashed rgba(0,0,0,0.12); margin-top:6px; }
  .sb-person { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid rgba(0,0,0,0.05); }
  .sb-person:last-child { border-bottom:none; }
  .sb-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Sora',sans-serif; font-weight:700; font-size:12px; flex-shrink:0; }
  .sb-tag { font-size:10.5px; font-weight:700; padding:2px 7px; border-radius:99px; background:#FEF3C7; color:#92400E; display:inline-flex; align-items:center; gap:3px; }
  .sb-btn { height:46px; border:none; border-radius:12px; padding:0 18px; font-size:14.5px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif;
            display:inline-flex; align-items:center; justify-content:center; gap:8px; }
  .sb-btn.primary { background:#2563EB; color:#fff; }
  .sb-btn.primary:hover:not(:disabled) { background:#1D4ED8; }
  .sb-btn.wa { background:#16A34A; color:#fff; }
  .sb-btn.light { background:#F1F4F8; color:#374151; }
  .sb-btn:disabled { opacity:.55; cursor:not-allowed; }
  .sb-err { font-size:13px; color:#B91C1C; background:#FEF2F2; border:1px solid rgba(239,68,68,0.2); border-radius:10px; padding:10px 12px; margin-top:10px; }
  .sb-warn { font-size:12.5px; color:#92400E; background:#FFFBEB; border:1px solid rgba(217,119,6,0.2); border-radius:10px; padding:8px 12px; margin-top:8px; }
  .sb-ai { display:flex; gap:8px; margin-top:12px; }
  .sb-row { display:flex; align-items:center; gap:12px; padding:12px 18px; border-bottom:1px solid rgba(0,0,0,0.05); }
  .sb-row:last-child { border-bottom:none; }
  .sb-pill { font-size:11px; font-weight:600; padding:3px 8px; border-radius:99px; }
  .sb-empty { padding:22px 18px; text-align:center; color:#9CA3AF; font-size:13px; }
  .sb-spin { animation: sb-spin .8s linear infinite; }
  @keyframes sb-spin { to { transform: rotate(360deg); } }
  .dark .sb-wrap { color:#F1F5F9; }
  .dark .sb-card { background:#1E293B; border-color:rgba(255,255,255,0.08); }
  .dark .sb-card-hd { border-bottom-color:rgba(255,255,255,0.06); }
  .dark .sb-input, .dark .sb-select, .dark .sb-textarea, .dark .sb-money { background:#0F172A; border-color:rgba(255,255,255,0.12); color:#F1F5F9; }
  .dark .sb-money input { color:#F1F5F9; }
  .dark .sb-tab { background:#0F172A; border-color:rgba(255,255,255,0.1); color:#CBD5E1; }
  .dark .sb-tab.on { background:rgba(37,99,235,0.18); color:#93C5FD; border-color:#2563EB; }
  .dark .sb-item { background:#0F172A; border-color:rgba(255,255,255,0.08); }
  .dark .sb-seg { background:#0F172A; }
  .dark .sb-seg button.on { background:#1E293B; color:#F1F5F9; }
  .dark .sb-sum.total { color:#F1F5F9; }
  @media (max-width: 900px) {
    .sb-wrap { padding: 16px 16px 40px; }
    .sb-grid3 { grid-template-columns: 1fr 1fr; }
    .sb-grid3 > :first-child { grid-column: 1 / -1; }
    .sb-item-row { grid-template-columns: 1fr 52px 30px; }
    .sb-item-row .sb-money { grid-column: 1 / 3; grid-row: 2; }
  }
`;

type InputTab = 'scan' | 'ai' | 'manual';

interface PiutangRow { id: string; name: string; value: number; created_at?: string }
interface SplitRow {
  id: string; merchant: string; date: string; total: number; source: string; created_at: string;
  participants: Participant[];
}

export function DashboardSplitBill() {
  const [tab, setTab] = useState<InputTab>('scan');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [fromChat, setFromChat] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [story, setStory] = useState('');
  const [voiceNote, setVoiceNote] = useState<VoiceNote | null>(null);
  const voice = useVoiceRecorder((n) => { setVoiceNote(n); setErr(null); }, (m) => setErr(m));
  const [aiEdit, setAiEdit] = useState('');
  const [newFriend, setNewFriend] = useState('');
  const [editingFixed, setEditingFixed] = useState<string | null>(null);
  const [fixedVal, setFixedVal] = useState(0);
  const [busy, setBusy] = useState<'' | 'parse' | 'tweak' | 'save'>('');
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ message: string; draft: Draft } | null>(null);
  const [piutang, setPiutang] = useState<PiutangRow[]>([]);
  const [history, setHistory] = useState<SplitRow[]>([]);
  const [settling, setSettling] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!document.getElementById('sb-css')) {
      const s = document.createElement('style');
      s.id = 'sb-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  // A draft handed over from the chat ("Atur detail").
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SPLIT_PREFILL_KEY);
      if (raw) {
        sessionStorage.removeItem(SPLIT_PREFILL_KEY);
        setDraft(adopt(JSON.parse(raw)));
        setFromChat(true);
      }
    } catch {}
  }, []);

  const loadLists = useCallback(async () => {
    const phone = localStorage.getItem('mira_phone') || '';
    if (!phone) return;
    try {
      const [pRes, hRes] = await Promise.all([
        fetch(`${SUPA_URL}/rest/v1/user_assets?phone_number=eq.${phone}&category=eq.piutang&select=id,name,value,created_at&order=created_at.desc`, { headers: HR }),
        fetch(`${SUPA_URL}/rest/v1/split_bills?phone_number=eq.${phone}&select=id,merchant,date,total,source,created_at,participants&order=created_at.desc&limit=20`, { headers: HR }),
      ]);
      if (pRes.ok) setPiutang(await pRes.json());
      if (hRes.ok) setHistory(await hRes.json());
    } catch {}
  }, []);

  useEffect(() => { loadLists(); }, [loadLists]);

  const scrollToEditor = () => setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

  const update = (fn: (d: Draft) => Draft) => setDraft((d) => (d ? recompute(fn(d)) : d));

  // ── Input: scan / story / manual ──
  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setErr(null);
    try { setPhoto(await compressImage(f)); } catch { setErr('Fotonya gagal dibuka, coba pilih ulang ya.'); }
  };

  const parse = async (payload: { text?: string; image_base64?: string; audio_base64?: string }) => {
    setBusy('parse'); setErr(null); setSaved(null);
    try {
      const res = await callTools<{ draft: Draft }>({ op: 'parse_split', ...payload });
      setDraft(adopt(res.draft));
      setFromChat(false);
      scrollToEditor();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy('');
    }
  };

  /** Mic button + status chip for telling MIRA who had what by voice. */
  const voiceControl = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
      <button
        className="sb-btn light"
        style={{ height: 38, padding: '0 12px', fontSize: 13, ...(voice.recording ? { background: '#FEE2E2', color: '#DC2626' } : {}) }}
        onClick={voice.recording ? voice.stop : voice.start}
        disabled={busy === 'parse' || voice.preparing}
      >
        {voice.recording ? <><Square size={13} /> Stop {fmtSeconds(voice.seconds)}</> : <><Mic size={15} /> {voiceNote ? 'Rekam ulang' : 'Rekam suara'}</>}
      </button>
      <span style={{ fontSize: 12, color: '#6B7280', flex: 1 }}>
        {voice.recording ? 'Ceritain siapa aja & siapa makan apa…'
          : voice.preparing ? 'Nyiapin voice note…'
          : voiceNote ? `🎤 Voice note ${fmtSeconds(voiceNote.seconds)} siap` : 'atau ceritain pakai suara'}
      </span>
      {voiceNote && !voice.recording && (
        <button className="sb-icon" onClick={() => setVoiceNote(null)} title="Hapus voice note"><X size={15} /></button>
      )}
    </div>
  );

  const startManual = () => { setDraft(emptyDraft()); setFromChat(false); setSaved(null); setErr(null); scrollToEditor(); };

  // ── Editor actions ──
  const addFriend = () => {
    const name = newFriend.replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!name || !draft) return;
    if (/^(kamu|aku|saya|gua|gue)$/i.test(name) || draft.participants.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setNewFriend(''); return;
    }
    update((d) => ({ ...d, participants: [...d.participants, { name, is_me: false, amount: 0, fixed: null }] }));
    setNewFriend('');
  };
  const removeFriend = (name: string) => update((d) => ({
    ...d,
    participants: d.participants.filter((p) => p.name !== name),
    items: d.items.map((it) => ({ ...it, assignees: it.assignees.filter((a) => a !== name) })),
  }));
  // Switching to manual starts from the current amounts (they become editable);
  // locked "tetap" amounts only mean something in the automatic modes.
  const setMode = (mode: Draft['mode']) => update((d) => ({
    ...d, mode,
    participants: d.participants.map((p) => ({ ...p, fixed: mode === 'manual' ? null : p.fixed })),
  }));
  const setItem = (i: number, patch: Partial<SplitItem>) => update((d) => ({ ...d, items: d.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));
  const toggleAssignee = (i: number, name: string) => update((d) => ({
    ...d,
    items: d.items.map((it, j) => j !== i ? it : {
      ...it, assignees: it.assignees.includes(name) ? it.assignees.filter((a) => a !== name) : [...it.assignees, name],
    }),
  }));
  const addItem = () => update((d) => ({ ...d, items: [...d.items, { name: '', price: 0, qty: 1, assignees: [] }] }));
  const removeItem = (i: number) => update((d) => ({ ...d, items: d.items.filter((_, j) => j !== i) }));
  const clearItems = () => update((d) => ({ ...d, total: totalOf(d), items: [], tax: 0, discount: 0, mode: d.mode === 'item' ? 'equal' : d.mode }));
  const setFixed = (name: string, value: number | null) => update((d) => ({
    ...d, participants: d.participants.map((p) => (p.name === name ? { ...p, fixed: value } : p)),
  }));
  const setManualAmount = (name: string, amount: number) => update((d) => ({
    ...d, participants: d.participants.map((p) => (p.name === name ? { ...p, amount } : p)),
  }));

  const tweakWithAI = async () => {
    if (!draft || !aiEdit.trim()) return;
    setBusy('tweak'); setErr(null);
    try {
      const res = await callTools<{ draft: Draft }>({ op: 'parse_split', text: aiEdit.trim(), current: draft });
      setDraft(adopt(res.draft));
      setAiEdit('');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy('');
    }
  };

  // ── Validation + save ──
  const friends = draft?.participants.filter((p) => !p.is_me) ?? [];
  const total = draft ? totalOf(draft) : 0;
  const assigned = draft ? draft.participants.reduce((s, p) => s + p.amount, 0) : 0;
  const fixedSum = draft ? draft.participants.filter(isFixed).reduce((s, p) => s + num(p.fixed), 0) : 0;
  const overFixed = !!draft && draft.mode !== 'manual' && total > 0 && fixedSum > total;
  const problem =
    !draft ? '' :
    total <= 0 ? (draft.mode === 'manual' ? 'Isi nominal tiap orang dulu ya.' : 'Isi total tagihan (atau item-itemnya) dulu ya.') :
    friends.length === 0 ? 'Tambahin minimal 1 teman yang ikut patungan.' :
    overFixed ? `Nominal tetap (${fmt(fixedSum)}) melebihi total tagihan.` :
    draft.items.some((it) => !it.name.trim() || it.price <= 0) ? 'Ada item yang nama atau harganya masih kosong.' :
    '';

  const save = async () => {
    if (!draft || problem) return;
    setBusy('save'); setErr(null);
    try {
      const res = await callTools<{ id: string; message: string }>({
        op: 'save_split', draft: { ...draft, merchant: draft.merchant.trim() || 'Split Bill' }, clear_chat_state: fromChat,
      });
      setSaved({ message: res.message, draft });
      setDraft(null); setPhoto(null); setNote(''); setStory(''); setVoiceNote(null); setFromChat(false);
      window.dispatchEvent(new CustomEvent('mira:tx-added'));
      loadLists();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy('');
    }
  };

  const shareText = (d: Draft) => [
    `🍕 Split Bill — ${d.merchant.trim() || 'Patungan'} (${fmtDate(d.date)})`,
    `Total: ${fmt(totalOf(d))}`,
    '',
    ...d.participants.filter((p) => !p.is_me && p.amount > 0).map((p) => `• ${p.name}: ${fmt(p.amount)}`),
    '',
    'Transfer ke aku ya 🙏',
    '— dicatat pakai MIRA (halo-mira.com)',
  ].join('\n');

  const openWA = (text: string) => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');

  const settle = async (row: PiutangRow) => {
    setSettling(row.id);
    try {
      await callTools({ op: 'settle_piutang', asset_id: row.id });
      setPiutang((list) => list.filter((p) => p.id !== row.id));
      loadLists();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSettling(null);
    }
  };

  const remindText = (row: PiutangRow) => {
    const m = /^Piutang (.+) \((.+)\)$/.exec(row.name || '');
    const who = m ? m[1] : 'kak';
    const what = m ? m[2] : 'patungan kemarin';
    return `Halo ${who}! 😊 Mau ngingetin patungan ${what} sebesar ${fmt(row.value)} ya. Makasih! 🙏`;
  };

  const piutangTotal = piutang.reduce((s, p) => s + num(p.value), 0);

  return (
    <div className="sb-wrap">
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickPhoto} />

      {/* ── Saved confirmation ── */}
      {saved && (
        <div className="sb-card" style={{ borderColor: 'rgba(22,163,74,0.35)' }}>
          <div className="sb-card-bd">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div className="sb-avatar" style={{ background: '#DCFCE7', color: '#15803D' }}><Check size={16} /></div>
              <div style={{ flex: 1, whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.55 }}>{saved.message}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button className="sb-btn wa" onClick={() => openWA(shareText(saved.draft))}><Share2 size={16} /> Kirim ke grup WhatsApp</button>
              <button className="sb-btn light" onClick={() => setSaved(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Start: scan / story / manual ── */}
      {!draft && (
        <div className="sb-card">
          <div className="sb-card-hd"><h3><Users size={16} color="#2563EB" /> Split bill baru</h3></div>
          <div className="sb-card-bd">
            <div className="sb-tabs">
              <button className={`sb-tab${tab === 'scan' ? ' on' : ''}`} onClick={() => setTab('scan')}>
                <Camera size={18} /> Scan struk <small>MIRA baca itemnya</small>
              </button>
              <button className={`sb-tab${tab === 'ai' ? ' on' : ''}`} onClick={() => setTab('ai')}>
                <Sparkles size={18} /> Ceritain <small>tulis bebas aja</small>
              </button>
              <button className={`sb-tab${tab === 'manual' ? ' on' : ''}`} onClick={() => setTab('manual')}>
                <Pencil size={18} /> Manual <small>isi sendiri</small>
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              {tab === 'scan' && (
                <>
                  {photo ? (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                      <img src={photo} alt="Struk" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)' }} />
                      <div style={{ flex: 1, fontSize: 13, color: '#6B7280' }}>Struk siap dibaca MIRA ✨</div>
                      <button className="sb-icon" onClick={() => setPhoto(null)} title="Hapus foto"><X size={16} /></button>
                    </div>
                  ) : (
                    <button className="sb-drop" onClick={() => fileRef.current?.click()}>
                      <Camera size={24} /> Foto / pilih struk
                      <span style={{ fontWeight: 400, fontSize: 12, color: '#6B7280' }}>Item, pajak & total kebaca otomatis</span>
                    </button>
                  )}
                  <label className="sb-label" style={{ marginTop: 12 }}>Siapa aja yang ikut? (opsional)</label>
                  <textarea className="sb-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder='Misal: "sama Raras & Taufan. Gua nasi goreng, Raras mie ayam, es teh buat semua"' />
                  {voiceControl}
                  <button className="sb-btn primary" style={{ width: '100%', marginTop: 10 }}
                    disabled={!photo || busy === 'parse' || voice.recording || voice.preparing}
                    onClick={() => photo && parse({ image_base64: photo, text: note.trim() || undefined, audio_base64: voiceNote?.dataUrl })}>
                    {busy === 'parse' ? <><Loader2 size={16} className="sb-spin" /> MIRA lagi baca struk…</> : <><Sparkles size={16} /> Bagi pakai MIRA</>}
                  </button>
                </>
              )}

              {tab === 'ai' && (
                <>
                  <textarea className="sb-textarea" rows={4} value={story} onChange={(e) => setStory(e.target.value)}
                    placeholder='Contoh: "Makan di Solaria 156rb bertiga sama Raras & Taufan. Gua nasi goreng 35rb, Raras mie ayam 30rb, Taufan ayam bakar 45rb, es teh 3 buat semua. Taufan bayar 50rb aja."' />
                  {voiceControl}
                  <button className="sb-btn primary" style={{ width: '100%', marginTop: 10 }}
                    disabled={(!story.trim() && !voiceNote) || busy === 'parse' || voice.recording || voice.preparing}
                    onClick={() => parse({ text: story.trim() || undefined, audio_base64: voiceNote?.dataUrl })}>
                    {busy === 'parse' ? <><Loader2 size={16} className="sb-spin" /> MIRA lagi ngitung…</> : <><Sparkles size={16} /> Bagi pakai MIRA</>}
                  </button>
                </>
              )}

              {tab === 'manual' && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 12px' }}>
                    Isi total, tambahin teman, terus pilih cara bagi: rata, per item, atau nominal sendiri.
                  </p>
                  <button className="sb-btn primary" style={{ width: '100%' }} onClick={startManual}><Pencil size={16} /> Mulai isi manual</button>
                </div>
              )}
              {err && <div className="sb-err">{err}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Editor ── */}
      {draft && (
        <div className="sb-card" ref={editorRef}>
          <div className="sb-card-hd">
            <h3><Receipt size={16} color="#2563EB" /> {fromChat ? 'Draft dari chat MIRA' : 'Atur pembagian'}</h3>
            <button className="sb-icon" title="Buang draft" onClick={() => { setDraft(null); setErr(null); setFromChat(false); }}><Trash2 size={15} /></button>
          </div>
          <div className="sb-card-bd">
            <div className="sb-grid3">
              <div>
                <label className="sb-label">Nama tagihan</label>
                <input className="sb-input" value={draft.merchant} placeholder="Misal: Makan Solaria"
                  onChange={(e) => update((d) => ({ ...d, merchant: e.target.value }))} />
              </div>
              <div>
                <label className="sb-label">Tanggal</label>
                <input className="sb-input" type="date" value={draft.date} onChange={(e) => update((d) => ({ ...d, date: e.target.value }))} />
              </div>
              <div>
                <label className="sb-label">Dibayar pakai</label>
                <select className="sb-select" value={draft.wallet} onChange={(e) => update((d) => ({ ...d, wallet: e.target.value }))}>
                  {[...new Set([draft.wallet, ...WALLETS])].map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <label className="sb-label" style={{ marginTop: 16 }}>Siapa aja yang ikut?</label>
            <div className="sb-chips">
              {draft.participants.map((p) => (
                <span key={p.name} className={`sb-chip${p.is_me ? ' me' : ''}`}>
                  {p.is_me ? 'Kamu' : p.name}
                  {!p.is_me && <button onClick={() => removeFriend(p.name)} title={`Hapus ${p.name}`}><X size={12} /></button>}
                </span>
              ))}
              <div className="sb-add">
                <input className="sb-input" style={{ height: 34 }} value={newFriend} placeholder="+ Nama teman"
                  onChange={(e) => setNewFriend(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFriend(); } }} />
                <button className="sb-btn light" style={{ height: 34, padding: '0 12px', fontSize: 13 }} onClick={addFriend} disabled={!newFriend.trim()}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <label className="sb-label" style={{ marginTop: 16 }}>Cara bagi</label>
            <div className="sb-seg">
              <button className={draft.mode === 'equal' ? 'on' : ''} onClick={() => setMode('equal')}>Bagi rata</button>
              <button className={draft.mode === 'item' ? 'on' : ''} onClick={() => setMode('item')}>Per item</button>
              <button className={draft.mode === 'manual' ? 'on' : ''} onClick={() => setMode('manual')}>Manual</button>
            </div>

            {/* Items (needed for per-item; optional otherwise) */}
            {(draft.items.length > 0 || draft.mode === 'item') && draft.mode !== 'manual' && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="sb-label" style={{ margin: 0 }}>Item</label>
                  {draft.items.length > 0 && draft.mode !== 'item' && (
                    <button className="sb-mini" onClick={clearItems}>Pakai total aja</button>
                  )}
                </div>
                {draft.items.map((it, i) => (
                  <div className="sb-item" key={i}>
                    <div className="sb-item-row">
                      <input className="sb-input" style={{ height: 36 }} value={it.name} placeholder="Nama item"
                        onChange={(e) => setItem(i, { name: e.target.value })} />
                      <input className="sb-input" style={{ height: 36, textAlign: 'center' }} inputMode="numeric" value={it.qty} title="Jumlah"
                        onChange={(e) => setItem(i, { qty: Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1) })} />
                      <MoneyInput small value={it.price} onChange={(n) => setItem(i, { price: n })} placeholder="Harga satuan" />
                      <button className="sb-icon" onClick={() => removeItem(i)} title="Hapus item"><X size={15} /></button>
                    </div>
                    {draft.mode === 'item' && (
                      <div className="sb-chips" style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>Punya:</span>
                        {draft.participants.map((p) => (
                          <button key={p.name} className={`sb-mini${it.assignees.includes(p.name) ? ' on' : ''}`} onClick={() => toggleAssignee(i, p.name)}>
                            {p.is_me ? 'Kamu' : p.name}
                          </button>
                        ))}
                        {it.assignees.length === 0 && <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>· dibagi semua</span>}
                      </div>
                    )}
                  </div>
                ))}
                <button className="sb-ghost" onClick={addItem}><Plus size={14} /> Tambah item</button>

                {draft.items.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div className="sb-sum"><span>Subtotal</span><span>{fmt(subtotalOf(draft))}</span></div>
                    <div className="sb-sum" style={{ alignItems: 'center' }}>
                      <span>Pajak / service / ongkir</span>
                      <div style={{ width: 150 }}><MoneyInput small value={draft.tax} onChange={(n) => update((d) => ({ ...d, tax: n }))} /></div>
                    </div>
                    <div className="sb-sum" style={{ alignItems: 'center' }}>
                      <span>Diskon</span>
                      <div style={{ width: 150 }}><MoneyInput small value={draft.discount} onChange={(n) => update((d) => ({ ...d, discount: n }))} /></div>
                    </div>
                    <div className="sb-sum total"><span>Total tagihan</span><span>{fmt(total)}</span></div>
                  </div>
                )}
              </div>
            )}

            {/* Plain total (no itemization) */}
            {draft.items.length === 0 && draft.mode !== 'manual' && (
              <div style={{ marginTop: 16 }}>
                <label className="sb-label">Total tagihan</label>
                <MoneyInput value={draft.total} onChange={(n) => update((d) => ({ ...d, total: n }))} placeholder="Misal 300.000" />
                {draft.mode === 'item' && <div className="sb-warn">Tambah item dulu biar bisa dibagi per item — sementara dibagi rata.</div>}
              </div>
            )}

            {/* Result per person */}
            <label className="sb-label" style={{ marginTop: 18 }}>
              {draft.mode === 'manual' ? 'Isi nominal tiap orang' : 'Hasil pembagian'}
            </label>
            <div>
              {draft.participants.map((p) => (
                <div className="sb-person" key={p.name}>
                  <div className="sb-avatar" style={{ background: p.is_me ? '#2563EB' : '#EFF6FF', color: p.is_me ? '#fff' : '#1D4ED8' }}>
                    {(p.is_me ? 'K' : p.name.charAt(0)).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.is_me ? 'Kamu' : p.name}</div>
                    <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>
                      {p.is_me ? 'masuk ke pengeluaranmu' : 'dicatat sebagai piutang'}
                    </div>
                  </div>
                  {draft.mode === 'manual' ? (
                    <div style={{ width: 150 }}><MoneyInput small value={p.amount} onChange={(n) => setManualAmount(p.name, n)} /></div>
                  ) : editingFixed === p.name ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <div style={{ width: 130 }}>
                        <MoneyInput small autoFocus value={fixedVal} onChange={setFixedVal}
                          onEnter={() => { setFixed(p.name, fixedVal); setEditingFixed(null); }} />
                      </div>
                      <button className="sb-icon" style={{ color: '#16A34A' }} onClick={() => { setFixed(p.name, fixedVal); setEditingFixed(null); }}><Check size={16} /></button>
                      <button className="sb-icon" onClick={() => setEditingFixed(null)}><X size={15} /></button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isFixed(p) && (
                        <span className="sb-tag" title="Nominal tetap — sisanya dibagi ke yang lain">
                          <Lock size={10} /> tetap
                          <button onClick={() => setFixed(p.name, null)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', display: 'flex' }}><X size={10} /></button>
                        </span>
                      )}
                      <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14.5 }}>{fmt(p.amount)}</span>
                      <button className="sb-icon" title="Atur nominal tetap untuk orang ini"
                        onClick={() => { setEditingFixed(p.name); setFixedVal(isFixed(p) ? num(p.fixed) : p.amount); }}>
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {draft.mode !== 'manual' && (
              <p style={{ fontSize: 11.5, color: '#9CA3AF', margin: '6px 0 0' }}>
                Tap ✏️ buat kunci nominal seseorang (misal "Taufan cuma 50rb") — sisanya otomatis dibagi ke yang lain.
              </p>
            )}
            {draft.mode === 'manual' && total > 0 && (
              <div className="sb-sum total"><span>Total</span><span>{fmt(assigned)}</span></div>
            )}

            {/* AI tweak */}
            <div className="sb-ai">
              <input className="sb-input" value={aiEdit} onChange={(e) => setAiEdit(e.target.value)}
                placeholder='✨ Minta MIRA ubah, misal "Raras ga ikut minum"'
                onKeyDown={(e) => { if (e.key === 'Enter') tweakWithAI(); }} />
              <button className="sb-btn light" style={{ height: 42, padding: '0 14px' }} onClick={tweakWithAI} disabled={!aiEdit.trim() || busy === 'tweak'}>
                {busy === 'tweak' ? <Loader2 size={16} className="sb-spin" /> : <Send size={16} />}
              </button>
            </div>

            {problem && total > 0 && <div className="sb-warn">{problem}</div>}
            {err && <div className="sb-err">{err}</div>}

            <button className="sb-btn primary" style={{ width: '100%', marginTop: 14 }} disabled={!!problem || busy === 'save'} onClick={save}>
              {busy === 'save' ? <><Loader2 size={16} className="sb-spin" /> Menyimpan…</> : <><Check size={16} /> Simpan split bill</>}
            </button>
            {problem && total <= 0 && <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', margin: '8px 0 0' }}>{problem}</p>}
          </div>
        </div>
      )}

      {/* ── Active piutang ── */}
      <div className="sb-card">
        <div className="sb-card-hd">
          <h3>💰 Piutang aktif</h3>
          {piutang.length > 0 && <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: '#D97706' }}>{fmt(piutangTotal)}</span>}
        </div>
        {piutang.length === 0 ? (
          <div className="sb-empty">Belum ada yang ngutang. Aman! 🎉</div>
        ) : piutang.map((row) => {
          const m = /^Piutang (.+) \((.+)\)$/.exec(row.name || '');
          return (
            <div className="sb-row" key={row.id}>
              <div className="sb-avatar" style={{ background: '#FFFBEB', color: '#D97706' }}>{(m ? m[1] : row.name).charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m ? m[1] : row.name}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m ? m[2] : ''}</div>
              </div>
              <span style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap' }}>{fmt(row.value)}</span>
              <button className="sb-icon" title="Ingatkan lewat WhatsApp" onClick={() => openWA(remindText(row))}><Send size={14} /></button>
              <button className="sb-mini on" style={{ background: '#16A34A', borderColor: '#16A34A' }} disabled={settling === row.id} onClick={() => settle(row)}>
                {settling === row.id ? <Loader2 size={12} className="sb-spin" /> : 'Lunas'}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── History ── */}
      <div className="sb-card">
        <div className="sb-card-hd"><h3>🧾 Riwayat split</h3></div>
        {history.length === 0 ? (
          <div className="sb-empty">Belum ada split bill. Coba scan struk pertama kamu!</div>
        ) : history.map((h) => {
          const others = (h.participants || []).filter((p) => !p.is_me && num(p.amount) > 0);
          const allPaid = others.length > 0 && others.every((p) => p.paid);
          return (
            <div className="sb-row" key={h.id} style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{h.merchant || 'Split Bill'}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{fmtDate(h.date)} · {h.source === 'chat' ? 'via chat' : 'via Split Bill'}</div>
                <div className="sb-chips" style={{ marginTop: 6 }}>
                  {others.map((p) => (
                    <span key={p.name} className="sb-pill" style={p.paid ? { background: '#DCFCE7', color: '#15803D' } : { background: '#FFFBEB', color: '#92400E' }}>
                      {p.paid ? '✓ ' : ''}{p.name} {fmt(p.amount)}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{fmt(h.total)}</div>
                {allPaid && <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>Lunas semua</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
