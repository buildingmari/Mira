import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { X, Check, Sparkles, Camera, Loader2, Users, Pencil, Mic, Square } from 'lucide-react';
import { compressImage } from '../lib/image';
import { useVoiceRecorder, fmtSeconds, type VoiceNote } from '../lib/voice';
import { isReadOnlyError, openRenewSheet } from '../lib/subscription';
import { parseItems, serializeItems, type ItemLine } from '../lib/items';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const HW = {
  apikey: SUPA_ANON,
  Authorization: 'Bearer ' + SUPA_ANON,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const CATEGORIES = [
  'Makanan', 'Transport', 'Belanja', 'Tagihan',
  'Kesehatan', 'Hiburan', 'Pemasukan', 'Lainnya',
];
const WALLETS = [
  'BCA', 'BRI', 'Mandiri', 'BNI', 'CIMB', 'Jenius',
  'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja', 'Cash',
];

const CAT_TO_DB: Record<string, string> = {
  Makanan: 'food', Transport: 'transport', Belanja: 'shopping',
  Tagihan: 'bills', Kesehatan: 'health', Hiburan: 'entertainment',
  Pemasukan: 'income', Lainnya: 'others',
};

const MODAL_CSS = `
  .atm-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
    display: flex; align-items: flex-end; justify-content: center;
  }
  @media (min-width: 600px) {
    .atm-overlay { align-items: center; }
  }
  .atm-sheet {
    background: #fff; width: 100%; max-width: 480px;
    border-radius: 24px 24px 0 0; padding: 0 0 calc(24px + env(safe-area-inset-bottom,0px));
    box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
    font-family: 'DM Sans', sans-serif;
    max-height: 92vh; max-height: 92dvh; overflow-y: auto; overscroll-behavior: contain;
  }
  @media (min-width: 600px) {
    .atm-sheet { border-radius: 20px; max-height: 88vh; }
  }
  .atm-handle {
    width: 36px; height: 4px; background: #E5E7EB;
    border-radius: 99px; margin: 12px auto 0; display: block;
  }
  .atm-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px 12px;
    border-bottom: 1px solid rgba(0,0,0,0.07);
  }
  .atm-title {
    font-family: 'Sora', sans-serif; font-size: 16px;
    font-weight: 600; color: #111827; margin: 0;
  }
  .atm-close {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid rgba(0,0,0,0.10); background: #F8F9FB;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
  }
  .atm-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .atm-label {
    display: block; font-size: 12px; font-weight: 500;
    color: #6B7280; margin-bottom: 6px; letter-spacing: 0.3px;
    text-transform: uppercase;
  }
  .atm-input {
    height: 46px; width: 100%; border: 1px solid rgba(0,0,0,0.10);
    border-radius: 10px; padding: 0 14px; font-size: 15px;
    font-family: 'DM Sans', sans-serif; background: #F8F9FB;
    outline: none; box-sizing: border-box; color: #111827;
  }
  .atm-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); background: #fff; }
  .atm-select {
    height: 46px; width: 100%; border: 1px solid rgba(0,0,0,0.10);
    border-radius: 10px; padding: 0 14px; font-size: 15px;
    font-family: 'DM Sans', sans-serif; background: #F8F9FB;
    outline: none; cursor: pointer; box-sizing: border-box; color: #111827;
  }
  .atm-select:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
  .atm-type-row { display: flex; gap: 8px; }
  .atm-type-btn {
    flex: 1; height: 42px; border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.10);
    font-size: 14px; font-weight: 500; font-family: 'DM Sans', sans-serif;
    cursor: pointer; background: #F8F9FB; color: #6B7280; transition: all .15s;
  }
  .atm-type-btn.active-expense {
    background: #FEF2F2; border-color: #EF4444; color: #DC2626; font-weight: 600;
  }
  .atm-type-btn.active-income {
    background: #F0FDF4; border-color: #16A34A; color: #15803D; font-weight: 600;
  }
  .atm-amount-wrap { position: relative; }
  .atm-amount-prefix {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    font-size: 15px; font-weight: 500; color: #6B7280; pointer-events: none;
  }
  .atm-amount-input {
    height: 54px; width: 100%; border: 1.5px solid rgba(0,0,0,0.10);
    border-radius: 12px; padding: 0 14px 0 42px; font-size: 20px;
    font-family: 'Sora', sans-serif; font-weight: 600; background: #F8F9FB;
    outline: none; box-sizing: border-box; color: #111827; letter-spacing: -0.5px;
  }
  .atm-amount-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); background: #fff; }
  .atm-submit {
    width: 100%; height: 50px; background: #2563EB; color: #fff;
    border: none; border-radius: 12px; font-size: 15px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .15s, transform .1s; margin-top: 4px;
  }
  .atm-submit:hover:not(:disabled) { background: #1D4ED8; }
  .atm-submit:active:not(:disabled) { transform: scale(0.98); }
  .atm-submit:disabled { opacity: 0.65; cursor: not-allowed; }
  .atm-submit.ok { background: #16A34A; }
  .atm-err {
    font-size: 13px; color: #EF4444; background: #FEF2F2;
    border-radius: 8px; padding: 10px 14px;
  }
  .atm-seg { display: grid; grid-template-columns: 1fr 1fr; background: #F1F4F8; border-radius: 11px; padding: 3px; gap: 3px; margin: 14px 20px 0; }
  .atm-seg button { border: none; background: transparent; border-radius: 9px; padding: 8px; font-size: 13px; font-weight: 600; color: #6B7280;
                    cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .atm-seg button.on { background: #fff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .atm-textarea { width: 100%; box-sizing: border-box; border: 1.5px solid rgba(37,99,235,0.25); border-radius: 14px; padding: 12px 14px;
                  font-size: 15px; font-family: 'DM Sans', sans-serif; background: #F8FAFF; outline: none; resize: none; line-height: 1.5; color: #111827; }
  .atm-textarea:focus { border-color: #2563EB; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
  .atm-examples { display: flex; flex-wrap: wrap; gap: 6px; }
  .atm-ex { border: 1px solid rgba(0,0,0,0.08); background: #fff; border-radius: 99px; padding: 5px 11px; font-size: 12px; color: #4B5563;
            cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .atm-ex:hover { border-color: #2563EB; color: #1D4ED8; }
  .atm-row { display: flex; gap: 8px; align-items: center; }
  .atm-photo-btn { height: 46px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.12); background: #fff; padding: 0 14px; display: flex;
                   align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; color: #374151; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .atm-card { border: 1px solid rgba(0,0,0,0.08); border-radius: 14px; padding: 12px; background: #FCFCFD; display: flex; flex-direction: column; gap: 8px; }
  .atm-items { border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 8px; display: flex; flex-direction: column; gap: 4px; }
  .atm-items-hd { font-size: 11.5px; font-weight: 600; color: #6B7280; margin-bottom: 2px; }
  .atm-item { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px; color: #374151; }
  .atm-item span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dark .atm-items { border-top-color: rgba(255,255,255,0.1); }
  .dark .atm-item { color: #CBD5E1; }
  .atm-card-top { display: flex; align-items: center; gap: 8px; }
  .atm-pill { border: none; border-radius: 99px; padding: 4px 10px; font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .atm-pill.exp { background: #FEF2F2; color: #DC2626; }
  .atm-pill.inc { background: #F0FDF4; color: #15803D; }
  .atm-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
  .atm-sm { height: 38px !important; font-size: 13px !important; padding: 0 10px !important; }
  .atm-link { background: none; border: none; color: #2563EB; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center;
              justify-content: center; gap: 6px; padding: 4px; font-family: 'DM Sans', sans-serif; }
  .atm-spin { animation: atm-spin .8s linear infinite; }
  @keyframes atm-spin { to { transform: rotate(360deg); } }
  @media (max-width: 420px) { .atm-grid { grid-template-columns: 1fr 1fr; } }
`;

const TOOLS_URL = `${SUPA_URL}/functions/v1/mira-tools`;

interface AiTx {
  item: string; merchant: string | null; amount: number; category: string;
  wallet: string; date: string; transaction_type: 'expense' | 'income';
  /** Receipt rows, when MIRA read them (photo / itemised text). */
  items?: ItemLine[];
}

const AI_EXAMPLES = [
  'kopi 25rb pake gopay, parkir 5rb',
  'kemarin isi bensin 50rb pake BCA',
  'gajian 8jt masuk mandiri',
];

/** Today in WIB — `new Date().toISOString()` is UTC and shows yesterday before 07:00 WIB. */
const todayWIB = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0];

const fmtRp = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n || 0));

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddTransactionModal({ onClose, onSuccess }: Props) {
  const phone = localStorage.getItem('mira_phone') || '';
  const navigate = useNavigate();

  // ✨ AI is the default way in — it's the fastest, and shows off what MIRA
  // can do; the classic form stays one tap away (remembered per device).
  const [entry, setEntry] = useState<'ai' | 'manual'>(() => {
    try { return localStorage.getItem('mira_add_mode') === 'manual' ? 'manual' : 'ai'; } catch { return 'ai'; }
  });
  // The plan ran out while the modal was open — show the renew sheet instead.
  const failed = (e: any, fallback: string) => {
    if (isReadOnlyError(e?.message)) { onClose(); openRenewSheet('Langganan kamu baru saja berakhir.'); return; }
    setErr(e?.message || fallback);
  };

  const switchEntry = (m: 'ai' | 'manual') => {
    setEntry(m); setErr(null);
    try { localStorage.setItem('mira_add_mode', m); } catch {}
  };

  const [aiText,   setAiText]   = useState('');
  const [aiPhoto,  setAiPhoto]  = useState<string | null>(null);
  const [aiBusy,   setAiBusy]   = useState(false);
  const [aiNote,   setAiNote]   = useState<string | null>(null);
  const [aiTxs,    setAiTxs]    = useState<AiTx[] | null>(null);
  const [aiVoice,  setAiVoice]  = useState<VoiceNote | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const voice = useVoiceRecorder((note) => { setAiVoice(note); setErr(null); }, (message) => setErr(message));

  const today = todayWIB();
  const [type,     setType]     = useState<'expense' | 'income'>('expense');
  const [amount,   setAmount]   = useState('');
  const [category, setCategory] = useState('Makanan');
  const [merchant, setMerchant] = useState('');
  const [wallet,   setWallet]   = useState(() => {
    try { const u = localStorage.getItem('mira_user'); if (u) return JSON.parse(u).primary_wallet || 'GoPay'; } catch {}
    return 'GoPay';
  });
  const [date,     setDate]     = useState(today);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState<string | null>(null);

  // Inject CSS once
  if (!document.getElementById('atm-css')) {
    const s = document.createElement('style');
    s.id = 'atm-css'; s.textContent = MODAL_CSS;
    document.head.appendChild(s);
  }

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) { setErr('Masukkan nominal yang valid.'); return; }
    if (!phone) { setErr('Sesi tidak ditemukan. Silakan login ulang.'); return; }

    setSaving(true); setErr(null);
    try {
      const payload = {
        phone_number:     phone,
        amount:           Number(amount),
        category:         CAT_TO_DB[category] || 'others',
        merchant:         merchant.trim() || category,
        wallet,
        date,
        transaction_type: type,
        created_at:       new Date().toISOString(),
      };
      const r = await fetch(`${SUPA_URL}/rest/v1/expenses`, {
        method: 'POST',
        headers: { ...HW, Prefer: 'return=minimal' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        throw new Error(txt || 'Gagal menyimpan transaksi');
      }
      setDone(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1000);
    } catch (e: any) {
      failed(e, 'Terjadi kesalahan. Coba lagi.');
    }
    setSaving(false);
  };

  // ── ✨ AI entry ──
  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try { setAiPhoto(await compressImage(f)); setErr(null); } catch { setErr('Fotonya gagal dibuka, coba pilih ulang ya.'); }
  };

  const runAi = async () => {
    if (aiBusy || voice.recording || (!aiText.trim() && !aiPhoto && !aiVoice)) return;
    if (!phone) { setErr('Sesi tidak ditemukan. Silakan login ulang.'); return; }
    setAiBusy(true); setErr(null); setAiNote(null);
    try {
      const r = await fetch(TOOLS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPA_ANON}`, apikey: SUPA_ANON },
        body: JSON.stringify({
          op: 'parse_expense', phone_number: phone,
          ...(aiText.trim() ? { text: aiText.trim() } : {}),
          ...(aiPhoto ? { image_base64: aiPhoto } : {}),
          ...(aiVoice ? { audio_base64: aiVoice.dataUrl } : {}),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.message || 'MIRA lagi gangguan, coba lagi ya.');
      const list: AiTx[] = Array.isArray(data.expenses) ? data.expenses : [];
      if (!list.length) { setAiNote(data.note || 'MIRA belum nemu nominalnya. Coba tulis lebih jelas ya.'); return; }
      setAiTxs(list.map((t) => ({ ...t, items: parseItems(t.items), wallet: WALLETS.includes(t.wallet) ? t.wallet : wallet })));
    } catch (e: any) {
      failed(e, 'Gagal terhubung ke MIRA.');
    } finally {
      setAiBusy(false);
    }
  };

  const patchTx = (i: number, patch: Partial<AiTx>) =>
    setAiTxs((list) => list ? list.map((t, j) => (j === i ? { ...t, ...patch } : t)) : list);
  const removeTx = (i: number) =>
    setAiTxs((list) => { const next = list ? list.filter((_, j) => j !== i) : list; return next && next.length ? next : null; });

  const saveAi = async () => {
    if (!aiTxs?.length || !phone) return;
    if (aiTxs.some((t) => !t.amount || t.amount <= 0)) { setErr('Ada nominal yang masih kosong.'); return; }
    setSaving(true); setErr(null);
    try {
      const now = new Date().toISOString();
      // Same row shape as the manual form below, so dashboards treat both alike.
      const rows = aiTxs.map((t) => ({
        phone_number:     phone,
        amount:           Math.round(t.amount),
        category:         CAT_TO_DB[t.transaction_type === 'income' ? 'Pemasukan' : t.category] || 'others',
        merchant:         (t.merchant || t.item || t.category).trim(),
        item:             (t.item || t.merchant || t.category).trim(),
        wallet:           t.wallet,
        date:             t.date || today,
        transaction_type: t.transaction_type,
        items_detail:     serializeItems(t.items || []),
        created_at:       now,
      }));
      const r = await fetch(`${SUPA_URL}/rest/v1/expenses`, {
        method: 'POST',
        headers: { ...HW, Prefer: 'return=minimal' },
        body: JSON.stringify(rows),
      });
      if (!r.ok) throw new Error((await r.text().catch(() => '')) || 'Gagal menyimpan transaksi');
      setDone(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1000);
    } catch (e: any) {
      failed(e, 'Terjadi kesalahan. Coba lagi.');
    }
    setSaving(false);
  };

  const goSplit = () => { onClose(); navigate('/dashboard/split-bill'); };

  return (
    <div className="atm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="atm-sheet">
        <span className="atm-handle" />

        <div className="atm-header">
          <h2 className="atm-title">Catat Transaksi</h2>
          <button className="atm-close" onClick={onClose}>
            <X style={{ width: 16, height: 16, color: '#6B7280' }} />
          </button>
        </div>

        <div className="atm-seg">
          <button className={entry === 'ai' ? 'on' : ''} onClick={() => switchEntry('ai')}>
            <Sparkles style={{ width: 14, height: 14, color: '#2563EB' }} /> Pakai AI
          </button>
          <button className={entry === 'manual' ? 'on' : ''} onClick={() => switchEntry('manual')}>
            <Pencil style={{ width: 13, height: 13 }} /> Manual
          </button>
        </div>

        {entry === 'ai' && (
          <div className="atm-body">
            <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickPhoto} />

            {!aiTxs ? (
              <>
                <div>
                  <span className="atm-label">Ceritain aja ke MIRA</span>
                  <textarea
                    className="atm-textarea"
                    rows={3}
                    placeholder="Misal: kopi 25rb pake gopay, parkir 5rb, kemarin gajian 8jt"
                    value={aiText}
                    onChange={e => setAiText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runAi(); } }}
                  />
                </div>
                {!aiText && !aiPhoto && !aiVoice && !voice.recording && (
                  <div className="atm-examples">
                    {AI_EXAMPLES.map(ex => (
                      <button key={ex} className="atm-ex" onClick={() => setAiText(ex)}>{ex}</button>
                    ))}
                  </div>
                )}
                {aiPhoto && (
                  <div className="atm-row" style={{ background: '#F8F9FB', borderRadius: 12, padding: 8 }}>
                    <img src={aiPhoto} alt="Struk" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                    <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>Struk siap dibaca MIRA</span>
                    <button className="atm-close" onClick={() => setAiPhoto(null)}><X style={{ width: 14, height: 14, color: '#6B7280' }} /></button>
                  </div>
                )}
                {(aiVoice || voice.recording || voice.preparing) && (
                  <div className="atm-row" style={{ background: voice.recording ? '#FEF2F2' : '#F8F9FB', borderRadius: 12, padding: '10px 12px' }}>
                    <Mic style={{ width: 16, height: 16, color: voice.recording ? '#DC2626' : '#2563EB' }} />
                    <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>
                      {voice.recording ? `Merekam… ${fmtSeconds(voice.seconds)} — tap ■ kalau udah`
                        : voice.preparing ? 'Nyiapin voice note…'
                        : `Voice note ${fmtSeconds(aiVoice!.seconds)} siap`}
                    </span>
                    {aiVoice && !voice.recording && (
                      <button className="atm-close" onClick={() => setAiVoice(null)}><X style={{ width: 14, height: 14, color: '#6B7280' }} /></button>
                    )}
                  </div>
                )}
                {aiNote && <div className="atm-err" style={{ color: '#92400E', background: '#FFFBEB' }}>{aiNote}</div>}
                {err && <div className="atm-err">{err}</div>}
                <div className="atm-row">
                  <button className="atm-photo-btn" onClick={() => photoRef.current?.click()} disabled={aiBusy || voice.recording} title="Foto struk / bukti transfer">
                    <Camera style={{ width: 16, height: 16 }} />
                  </button>
                  <button
                    className="atm-photo-btn"
                    style={voice.recording ? { background: '#FEE2E2', borderColor: 'rgba(239,68,68,0.35)', color: '#DC2626' } : undefined}
                    onClick={voice.recording ? voice.stop : voice.start}
                    disabled={aiBusy || voice.preparing}
                    title={voice.recording ? 'Berhenti merekam' : 'Rekam voice note'}
                  >
                    {voice.recording ? <Square style={{ width: 14, height: 14 }} /> : <Mic style={{ width: 16, height: 16 }} />}
                  </button>
                  <button className="atm-submit" style={{ marginTop: 0, flex: 1 }} onClick={runAi}
                    disabled={aiBusy || voice.recording || voice.preparing || (!aiText.trim() && !aiPhoto && !aiVoice)}>
                    {aiBusy
                      ? <><Loader2 className="atm-spin" style={{ width: 16, height: 16 }} /> MIRA lagi baca…</>
                      : <><Sparkles style={{ width: 16, height: 16 }} /> Proses</>}
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="atm-label" style={{ marginBottom: -4 }}>
                  MIRA nemu {aiTxs.length} transaksi — cek dulu ya
                </span>
                {aiTxs.map((t, i) => (
                  <div className="atm-card" key={i}>
                    <div className="atm-card-top">
                      <button
                        className={`atm-pill ${t.transaction_type === 'income' ? 'inc' : 'exp'}`}
                        title="Tap untuk ganti jenis"
                        onClick={() => patchTx(i, t.transaction_type === 'income'
                          ? { transaction_type: 'expense', category: 'Lainnya' }
                          : { transaction_type: 'income', category: 'Pemasukan' })}
                      >{t.transaction_type === 'income' ? '↓ Pemasukan' : '↑ Pengeluaran'}</button>
                      <input className="atm-input atm-sm" style={{ flex: 1 }} value={t.item}
                        onChange={e => patchTx(i, { item: e.target.value })} />
                      <button className="atm-close" onClick={() => removeTx(i)} title="Hapus"><X style={{ width: 14, height: 14, color: '#6B7280' }} /></button>
                    </div>
                    <div className="atm-amount-wrap">
                      <span className="atm-amount-prefix">Rp</span>
                      <input className="atm-amount-input" style={{ height: 46, fontSize: 18 }} inputMode="numeric"
                        value={t.amount ? new Intl.NumberFormat('id-ID').format(t.amount) : ''}
                        onChange={e => patchTx(i, { amount: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
                    </div>
                    <div className="atm-grid">
                      <select className="atm-select atm-sm" value={t.category} onChange={e => patchTx(i, { category: e.target.value })}>
                        {(t.transaction_type === 'income' ? ['Pemasukan'] : CATEGORIES.filter(c => c !== 'Pemasukan')).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select className="atm-select atm-sm" value={t.wallet} onChange={e => patchTx(i, { wallet: e.target.value })}>
                        {WALLETS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                      <input className="atm-input atm-sm" type="date" value={t.date} onChange={e => patchTx(i, { date: e.target.value })} />
                    </div>
                    {!!t.items?.length && (
                      <div className="atm-items">
                        <div className="atm-items-hd">Rincian {t.items.length} item · bisa diubah nanti di menu Transaksi</div>
                        {t.items.slice(0, 6).map((it, j) => (
                          <div className="atm-item" key={j}>
                            <span>{it.qty > 1 ? `${it.qty}× ` : ''}{it.item}</span>
                            <span>{fmtRp(it.subtotal)}</span>
                          </div>
                        ))}
                        {t.items.length > 6 && <div className="atm-item" style={{ color: '#9CA3AF' }}>+{t.items.length - 6} item lagi</div>}
                      </div>
                    )}
                  </div>
                ))}
                {err && <div className="atm-err">{err}</div>}
                <button className={`atm-submit${done ? ' ok' : ''}`} onClick={saveAi} disabled={saving || done}>
                  {done
                    ? <><Check style={{ width: 16, height: 16 }} /> Tersimpan!</>
                    : saving ? 'Menyimpan...'
                    : aiTxs.length > 1 ? `Simpan ${aiTxs.length} transaksi` : `Simpan · ${fmtRp(aiTxs[0].amount)}`}
                </button>
                <button className="atm-link" onClick={() => { setAiTxs(null); setErr(null); }} disabled={saving || done}>← Ubah teks</button>
              </>
            )}

            <button className="atm-link" onClick={goSplit}>
              <Users style={{ width: 14, height: 14 }} /> Mau bagi tagihan bareng teman? Split bill →
            </button>
          </div>
        )}

        {entry === 'manual' && (
        <div className="atm-body">
          {/* Type toggle */}
          <div>
            <span className="atm-label">Jenis</span>
            <div className="atm-type-row">
              <button
                className={`atm-type-btn${type === 'expense' ? ' active-expense' : ''}`}
                onClick={() => { setType('expense'); if (category === 'Pemasukan') setCategory('Makanan'); }}
              >Pengeluaran</button>
              <button
                className={`atm-type-btn${type === 'income' ? ' active-income' : ''}`}
                onClick={() => { setType('income'); setCategory('Pemasukan'); }}
              >Pemasukan</button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <span className="atm-label">Nominal</span>
            <div className="atm-amount-wrap">
              <span className="atm-amount-prefix">Rp</span>
              <input
                className="atm-amount-input"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <span className="atm-label">Kategori</span>
            <select
              className="atm-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {(type === 'income' ? ['Pemasukan'] : CATEGORIES.filter(c => c !== 'Pemasukan')).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Merchant / Description */}
          <div>
            <span className="atm-label">Merchant / Keterangan</span>
            <input
              className="atm-input"
              type="text"
              placeholder={type === 'income' ? 'e.g. Gaji, Freelance' : 'e.g. Warung Bu Sari'}
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
            />
          </div>

          {/* Wallet + Date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <span className="atm-label">Wallet</span>
              <select className="atm-select" value={wallet} onChange={e => setWallet(e.target.value)}>
                {WALLETS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <span className="atm-label">Tanggal</span>
              <input className="atm-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          {err && <div className="atm-err">{err}</div>}

          <button
            className={`atm-submit${done ? ' ok' : ''}`}
            onClick={handleSubmit}
            disabled={saving || done}
          >
            {done
              ? <><Check style={{ width: 16, height: 16 }} /> Tersimpan!</>
              : saving ? 'Menyimpan...' : 'Simpan Transaksi'
            }
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
