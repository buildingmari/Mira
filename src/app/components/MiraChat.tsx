import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Send, Paperclip, Mic, Square, X, Loader2, Trash2, Check, Ban, SlidersHorizontal } from 'lucide-react';
import { compressImage } from '../lib/image';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const H = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, 'Content-Type': 'application/json' };
// chat-send requires a valid Supabase JWT (verify_jwt: true) — the anon key
// satisfies that gate the same way every other Supabase call in this app
// already sends it, without granting any extra access.
const CHAT_FN_URL = `${SUPA_URL}/functions/v1/chat-send`;

const CSS = `
  .mirac-root { display:flex; flex-direction:column; height:100%; font-family:'DM Sans',sans-serif; background:#F8F9FB; }
  .mirac-head { display:flex; align-items:center; justify-content:space-between; padding:12px 16px;
                border-bottom:1px solid rgba(0,0,0,0.07); background:#fff; flex-shrink:0; }
  .mirac-head-title { display:flex; align-items:center; gap:8px; font-family:'Sora',sans-serif; font-weight:600; font-size:14px; color:#111827; }
  .mirac-head-dot { width:7px; height:7px; border-radius:50%; background:#16A34A; }
  .mirac-icon-btn-sm { background:none; border:none; cursor:pointer; color:#9CA3AF; padding:6px; border-radius:7px; display:flex; }
  .mirac-icon-btn-sm:hover { background:#F1F4F8; color:#6B7280; }
  .mirac-log  { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; min-height:0; }
  .mirac-row  { display:flex; gap:8px; max-width:86%; }
  .mirac-row.user { align-self:flex-end; flex-direction:row-reverse; }
  .mirac-row.mira { align-self:flex-start; }
  .mirac-avatar { width:26px; height:26px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
               font-family:'Sora',sans-serif; font-weight:700; font-size:11px; }
  .mirac-avatar.mira { background:#2563EB; color:#fff; }
  .mirac-avatar.user { background:#DBEAFE; color:#1D4ED8; }
  .mirac-col { display:flex; flex-direction:column; gap:6px; min-width:0; }
  .mirac-bubble { padding:10px 13px; border-radius:14px; font-size:13.5px; line-height:1.55; white-space:pre-wrap; word-break:break-word; }
  .mirac-bubble.user { background:#2563EB; color:#fff; border-bottom-right-radius:4px; }
  .mirac-bubble.mira { background:#fff; color:#111827; border:1px solid rgba(0,0,0,0.07); border-bottom-left-radius:4px; }
  .mirac-bubble.error { background:#FEF2F2; color:#991B1B; border:1px solid rgba(239,68,68,0.25); }
  .mirac-img { max-width:200px; border-radius:10px; display:block; margin-bottom:6px; }
  .mirac-audio-chip { display:flex; align-items:center; gap:8px; }
  .mirac-actions { display:flex; gap:8px; }
  .mirac-act-btn { display:flex; align-items:center; gap:5px; border-radius:10px; padding:8px 13px; font-size:12.5px; font-weight:600;
                   border:1px solid rgba(0,0,0,0.1); background:#fff; color:#374151; cursor:pointer; font-family:'DM Sans',sans-serif; }
  .mirac-act-btn:hover { background:#F8F9FB; }
  .mirac-act-btn.primary { background:#16A34A; border-color:#16A34A; color:#fff; }
  .mirac-act-btn.primary:hover { background:#15803D; }
  .mirac-act-btn.danger { color:#DC2626; }
  .mirac-act-btn:disabled { opacity:.5; cursor:not-allowed; }
  .mirac-hint { font-size:11px; color:#9CA3AF; }
  .mirac-typing { display:flex; gap:4px; padding:4px 0; }
  .mirac-typing span { width:6px; height:6px; border-radius:50%; background:#9CA3AF; animation:mirac-bounce 1.2s infinite ease-in-out; }
  .mirac-typing span:nth-child(2) { animation-delay:.15s; }
  .mirac-typing span:nth-child(3) { animation-delay:.3s; }
  @keyframes mirac-bounce { 0%,60%,100%{ transform:translateY(0); opacity:.5; } 30%{ transform:translateY(-4px); opacity:1; } }
  .mirac-composer { border-top:1px solid rgba(0,0,0,0.07); background:#fff; padding:10px 12px; flex-shrink:0; }
  .mirac-preview { display:flex; align-items:center; gap:8px; padding:6px 10px; margin-bottom:8px; background:#F8F9FB; border-radius:10px; font-size:12px; color:#374151; }
  .mirac-bar { display:flex; align-items:flex-end; gap:6px; }
  .mirac-input { flex:1; border:1px solid rgba(0,0,0,0.12); border-radius:12px; padding:9px 13px; font-size:13.5px;
              font-family:'DM Sans',sans-serif; resize:none; max-height:100px; outline:none; }
  .mirac-input:focus { border-color:#2563EB; }
  .mirac-icon-btn { width:34px; height:34px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); background:#fff;
                 display:flex; align-items:center; justify-content:center; cursor:pointer; color:#6B7280; flex-shrink:0; }
  .mirac-icon-btn:hover { background:#F8F9FB; }
  .mirac-icon-btn.recording { background:#FEE2E2; border-color:rgba(239,68,68,0.3); color:#DC2626; }
  .mirac-send-btn { width:34px; height:34px; border-radius:10px; border:none; background:#2563EB; color:#fff;
                 display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
  .mirac-send-btn:disabled { opacity:.4; cursor:not-allowed; }
  .mirac-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:#6B7280; padding:28px; }
`;

type Attachment =
  | { kind: 'image'; dataUrl: string }
  | { kind: 'audio'; dataUrl: string; durationSec: number };

interface ChatMsg {
  id: string;
  from: 'user' | 'mira';
  text?: string;
  attachment?: Attachment;
  pending?: boolean;
  error?: boolean;
  awaiting?: 'confirm' | 'confirm_split' | null;
  /** The split draft behind an awaiting:'confirm_split' bubble (for "Atur di Split Bill"). */
  draft?: unknown;
}

/** sessionStorage key the Split Bill page reads a chat draft from. */
export const SPLIT_PREFILL_KEY = 'mira_split_prefill';

function injectCssOnce() {
  if (!document.getElementById('mirac-css')) {
    const s = document.createElement('style');
    s.id = 'mirac-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }
}

export function MiraChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [text, setText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { injectCssOnce(); }, []);

  useEffect(() => () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    mediaRecorderRef.current?.state === 'recording' && mediaRecorderRef.current.stop();
  }, []);

  // Load the last 24h of chat history, and reconstruct whether the most
  // recent MIRA message is still an open draft (so Simpan/Batal buttons
  // reappear correctly after a reload or reopening the floating widget,
  // without needing a dedicated column on chat_messages).
  useEffect(() => {
    const phone = localStorage.getItem('mira_phone') || '';
    if (!phone) { setLoadingHistory(false); return; }
    (async () => {
      try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const [msgsRes, stateRes] = await Promise.all([
          fetch(`${SUPA_URL}/rest/v1/chat_messages?phone_number=eq.${phone}&created_at=gte.${since}&order=created_at.asc&limit=200`, { headers: H }),
          fetch(`${SUPA_URL}/rest/v1/user_states?phone_number=eq.${phone}&select=state,draft_data`, { headers: H }),
        ]);
        const rows = msgsRes.ok ? await msgsRes.json() : [];
        const stateRows = stateRes.ok ? await stateRes.json() : [];
        const st = Array.isArray(stateRows) ? stateRows[0] : null;
        const awaiting: ChatMsg['awaiting'] =
          st?.state === 'waiting_confirmation' ? 'confirm'
          : st?.state === 'waiting_split_confirm' && st?.draft_data ? 'confirm_split'
          : null;

        const loaded: ChatMsg[] = (Array.isArray(rows) ? rows : []).map((r: any) => ({
          id: r.id,
          from: r.direction,
          text: r.content || (r.message_type === 'image' ? '📷 Foto' : r.message_type === 'audio' ? '🎤 Voice note' : undefined),
        }));

        if (awaiting) {
          for (let i = loaded.length - 1; i >= 0; i--) {
            if (loaded[i].from === 'mira') {
              loaded[i].awaiting = awaiting;
              if (awaiting === 'confirm_split') loaded[i].draft = st.draft_data;
              break;
            }
          }
        }
        setMessages(loaded);
      } catch {
        // History is a nice-to-have — a failed load just starts an empty chat.
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, loadingHistory]);

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPendingAttachment({ kind: 'image', dataUrl: await compressImage(file) });
    } catch {
      setMessages((m) => [...m, { id: crypto.randomUUID(), from: 'mira', error: true, text: 'Fotonya gagal dibuka, coba pilih ulang ya.' }]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          setPendingAttachment({ kind: 'audio', dataUrl: reader.result as string, durationSec: recordSec });
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordSec(0);
      recordTimerRef.current = setInterval(() => setRecordSec((s) => s + 1), 1000);
    } catch {
      setMessages((m) => [...m, {
        id: crypto.randomUUID(), from: 'mira', error: true,
        text: 'MIRA butuh izin mikrofon buat rekam voice note. Izinkan dulu ya di pengaturan browser.',
      }]);
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const clearAttachment = () => setPendingAttachment(null);
  const fmtSec = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  /** Clears any `awaiting:'confirm'` left on prior messages once the user
   *  moves on, so stale buttons never linger under an old draft bubble. */
  const clearAwaiting = () => setMessages((m) => m.map((msg) => msg.awaiting ? { ...msg, awaiting: undefined } : msg));

  const send = async (payload: { text?: string; image_base64?: string; audio_base64?: string; action?: string }, userBubble: ChatMsg | null) => {
    const phone = localStorage.getItem('mira_phone') || '';
    clearAwaiting();
    if (userBubble) setMessages((m) => [...m, userBubble]);
    const placeholderId = crypto.randomUUID();
    setMessages((m) => [...m, { id: placeholderId, from: 'mira', pending: true }]);
    setSending(true);

    try {
      const res = await fetch(CHAT_FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPA_ANON}`, apikey: SUPA_ANON },
        body: JSON.stringify({ phone_number: phone, ...payload }),
      });

      if (res.status === 404) {
        setMessages((m) => m.map((msg) => msg.id === placeholderId ? {
          ...msg, pending: false, error: true,
          text: 'Chat AI di web app belum aktif — masih dalam pengembangan. Sementara pakai WhatsApp MIRA ya 🙏',
        } : msg));
        return;
      }
      if (res.status === 503) {
        setMessages((m) => m.map((msg) => msg.id === placeholderId ? {
          ...msg, pending: false, error: true,
          text: 'Chat AI lagi disiapkan di sisi server, bentar lagi aktif. Sementara pakai WhatsApp MIRA ya 🙏',
        } : msg));
        return;
      }
      if (!res.ok) throw new Error(await res.text().catch(() => 'request failed'));

      const data = await res.json();
      setMessages((m) => m.map((msg) => msg.id === placeholderId ? {
        ...msg, pending: false, text: data.reply || '(tidak ada balasan)',
        awaiting: data.awaiting || undefined, draft: data.draft || undefined,
      } : msg));

      if (data.saved) window.dispatchEvent(new CustomEvent('mira:tx-added'));
    } catch {
      setMessages((m) => m.map((msg) => msg.id === placeholderId ? {
        ...msg, pending: false, error: true, text: 'Gagal mengirim pesan. Coba lagi beberapa saat.',
      } : msg));
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (sending) return;
    if (!text.trim() && !pendingAttachment) return;

    const userMsg: ChatMsg = { id: crypto.randomUUID(), from: 'user', text: text.trim() || undefined, attachment: pendingAttachment || undefined };
    const payload: { text?: string; image_base64?: string; audio_base64?: string } = {};
    if (userMsg.text) payload.text = userMsg.text;
    if (pendingAttachment?.kind === 'image') payload.image_base64 = pendingAttachment.dataUrl;
    if (pendingAttachment?.kind === 'audio') payload.audio_base64 = pendingAttachment.dataUrl;

    setText('');
    setPendingAttachment(null);
    send(payload, userMsg);
  };

  const handleConfirm = () => send({ action: 'confirm_expense' }, { id: crypto.randomUUID(), from: 'user', text: '✅ Simpan' });
  const handleCancelDraft = () => send({ action: 'cancel_expense' }, { id: crypto.randomUUID(), from: 'user', text: '❌ Batal' });
  const handleEditTap = () => { clearAwaiting(); textareaRef.current?.focus(); };
  const handleConfirmSplit = () => send({ action: 'confirm_split' }, { id: crypto.randomUUID(), from: 'user', text: '✅ Simpan' });
  const handleCancelSplit = () => send({ action: 'cancel_split' }, { id: crypto.randomUUID(), from: 'user', text: '❌ Batal' });
  /** Opens the draft in the full Split Bill editor (items, per-person tweaks). */
  const handleOpenSplitEditor = (draft: unknown) => {
    try { sessionStorage.setItem(SPLIT_PREFILL_KEY, JSON.stringify(draft)); } catch {}
    window.dispatchEvent(new CustomEvent('mira:chat-close'));
    navigate('/dashboard/split-bill');
  };

  const handleClearHistory = async () => {
    const phone = localStorage.getItem('mira_phone') || '';
    if (!phone) return;
    if (!window.confirm('Hapus semua riwayat chat ini? Transaksi yang sudah tersimpan tidak akan terhapus.')) return;
    try {
      await fetch(`${SUPA_URL}/rest/v1/chat_messages?phone_number=eq.${phone}`, { method: 'DELETE', headers: H });
    } catch {}
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="mirac-root">
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePickImage} />

      <div className="mirac-head">
        <div className="mirac-head-title"><span className="mirac-head-dot" /> Chat MIRA</div>
        {messages.length > 0 && (
          <button className="mirac-icon-btn-sm" title="Hapus riwayat chat" onClick={handleClearHistory}>
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="mirac-log">
        {!loadingHistory && messages.length === 0 && (
          <div className="mirac-empty">
            <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Chat sama MIRA</p>
            <p style={{ fontSize: 12.5, margin: 0, maxWidth: 280 }}>
              Catat pengeluaran, kirim foto struk, rekam voice note, atau split bill bareng teman — tinggal ketik aja.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`mirac-row ${msg.from}`}>
            <div className={`mirac-avatar ${msg.from}`}>{msg.from === 'mira' ? 'M' : 'Y'}</div>
            <div className="mirac-col">
              <div className={`mirac-bubble ${msg.from}${msg.error ? ' error' : ''}`}>
                {msg.attachment?.kind === 'image' && <img className="mirac-img" src={msg.attachment.dataUrl} alt="Lampiran" />}
                {msg.attachment?.kind === 'audio' && (
                  <div className="mirac-audio-chip"><Mic size={13} /> Voice note · {fmtSec(msg.attachment.durationSec)}</div>
                )}
                {msg.pending ? <div className="mirac-typing"><span /><span /><span /></div> : msg.text}
              </div>
              {msg.awaiting === 'confirm' && (
                <>
                  <div className="mirac-actions">
                    <button className="mirac-act-btn primary" onClick={handleConfirm} disabled={sending}>
                      <Check size={13} /> Simpan
                    </button>
                    <button className="mirac-act-btn" onClick={handleEditTap} disabled={sending}>
                      Edit
                    </button>
                    <button className="mirac-act-btn danger" onClick={handleCancelDraft} disabled={sending}>
                      <Ban size={13} /> Batal
                    </button>
                  </div>
                  <span className="mirac-hint">atau ketik langsung kalau ada yang mau diubah</span>
                </>
              )}
              {msg.awaiting === 'confirm_split' && (
                <>
                  <div className="mirac-actions" style={{ flexWrap: 'wrap' }}>
                    <button className="mirac-act-btn primary" onClick={handleConfirmSplit} disabled={sending}>
                      <Check size={13} /> Simpan
                    </button>
                    {!!msg.draft && (
                      <button className="mirac-act-btn" onClick={() => handleOpenSplitEditor(msg.draft)} disabled={sending}>
                        <SlidersHorizontal size={13} /> Atur detail
                      </button>
                    )}
                    <button className="mirac-act-btn danger" onClick={handleCancelSplit} disabled={sending}>
                      <Ban size={13} /> Batal
                    </button>
                  </div>
                  <span className="mirac-hint">atau ketik aja, misal "Raras ga ikut minum"</span>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      <div className="mirac-composer">
        {pendingAttachment && (
          <div className="mirac-preview">
            {pendingAttachment.kind === 'image' ? (
              <><img src={pendingAttachment.dataUrl} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }} /><span>Foto siap dikirim</span></>
            ) : (
              <><Mic size={13} /><span>Voice note · {fmtSec(pendingAttachment.durationSec)}</span></>
            )}
            <button onClick={clearAttachment} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
              <X size={13} />
            </button>
          </div>
        )}

        <div className="mirac-bar">
          <button className="mirac-icon-btn" title="Lampirkan foto" onClick={() => fileInputRef.current?.click()} disabled={recording}>
            <Paperclip size={16} />
          </button>
          <button
            className={`mirac-icon-btn${recording ? ' recording' : ''}`}
            title={recording ? 'Berhenti merekam' : 'Rekam voice note'}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? <Square size={14} /> : <Mic size={16} />}
          </button>

          <textarea
            ref={textareaRef}
            className="mirac-input"
            rows={1}
            placeholder={recording ? `Merekam… ${fmtSec(recordSec)}` : 'Tulis pesan ke MIRA…'}
            value={text}
            disabled={recording}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button className="mirac-send-btn" onClick={handleSend} disabled={sending || recording || (!text.trim() && !pendingAttachment)}>
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
