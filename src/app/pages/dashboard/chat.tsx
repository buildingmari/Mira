import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Mic, Square, X, Loader2 } from 'lucide-react';

// NOTE: not yet linked from the sidebar/routes — see the comment block at the
// bottom of this file for why, and what has to land before it's wired in.

const SUPA_URL = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
// Edge Function this page calls once it exists. Until then, sendToMira()
// catches the 404 and shows a clear "not live yet" bubble instead of hanging
// or crashing — see sendToMira() below.
const CHAT_FN_URL = `${SUPA_URL}/functions/v1/chat-send`;

const CHAT_CSS = `
  .mc-wrap { display:flex; flex-direction:column; height:calc(100vh - 58px); max-width:820px; margin:0 auto; font-family:'DM Sans',sans-serif; }
  .mc-log  { flex:1; overflow-y:auto; padding:20px 24px; display:flex; flex-direction:column; gap:14px; }
  .mc-row  { display:flex; gap:10px; max-width:78%; }
  .mc-row.user { align-self:flex-end; flex-direction:row-reverse; }
  .mc-row.mira { align-self:flex-start; }
  .mc-avatar { width:30px; height:30px; border-radius:9px; flex-shrink:0; display:flex; align-items:center; justify-content:center;
               font-family:'Sora',sans-serif; font-weight:700; font-size:12px; }
  .mc-avatar.mira { background:#2563EB; color:#fff; }
  .mc-avatar.user { background:#DBEAFE; color:#1D4ED8; }
  .mc-bubble { padding:11px 14px; border-radius:14px; font-size:13.5px; line-height:1.55; white-space:pre-wrap; word-break:break-word; }
  .mc-bubble.user { background:#2563EB; color:#fff; border-bottom-right-radius:4px; }
  .mc-bubble.mira { background:#fff; color:#111827; border:1px solid rgba(0,0,0,0.07); border-bottom-left-radius:4px; }
  .mc-bubble.error { background:#FEF2F2; color:#991B1B; border:1px solid rgba(239,68,68,0.25); }
  .mc-img { max-width:220px; border-radius:10px; display:block; margin-bottom:6px; }
  .mc-audio-chip { display:flex; align-items:center; gap:8px; }
  .mc-typing { display:flex; gap:4px; padding:4px 0; }
  .mc-typing span { width:6px; height:6px; border-radius:50%; background:#9CA3AF; animation:mc-bounce 1.2s infinite ease-in-out; }
  .mc-typing span:nth-child(2) { animation-delay:.15s; }
  .mc-typing span:nth-child(3) { animation-delay:.3s; }
  @keyframes mc-bounce { 0%,60%,100%{ transform:translateY(0); opacity:.5; } 30%{ transform:translateY(-4px); opacity:1; } }
  .mc-composer { border-top:1px solid rgba(0,0,0,0.07); background:#fff; padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px)); }
  .mc-preview { display:flex; align-items:center; gap:8px; padding:6px 10px; margin-bottom:8px; background:#F8F9FB; border-radius:10px; font-size:12px; color:#374151; }
  .mc-bar { display:flex; align-items:flex-end; gap:8px; }
  .mc-input { flex:1; border:1px solid rgba(0,0,0,0.12); border-radius:12px; padding:10px 14px; font-size:14px;
              font-family:'DM Sans',sans-serif; resize:none; max-height:120px; outline:none; }
  .mc-input:focus { border-color:#2563EB; }
  .mc-icon-btn { width:38px; height:38px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); background:#fff;
                 display:flex; align-items:center; justify-content:center; cursor:pointer; color:#6B7280; flex-shrink:0; }
  .mc-icon-btn:hover { background:#F8F9FB; }
  .mc-icon-btn.recording { background:#FEE2E2; border-color:rgba(239,68,68,0.3); color:#DC2626; }
  .mc-send-btn { width:38px; height:38px; border-radius:10px; border:none; background:#2563EB; color:#fff;
                 display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
  .mc-send-btn:disabled { opacity:.4; cursor:not-allowed; }
  .mc-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:#6B7280; padding:32px; }
`;

type Attachment =
  | { kind: 'image'; dataUrl: string; file: File }
  | { kind: 'audio'; dataUrl: string; blob: Blob; durationSec: number };

interface ChatMsg {
  id: string;
  from: 'user' | 'mira';
  text?: string;
  attachment?: Attachment;
  pending?: boolean;
  error?: boolean;
}

function useAutoScroll(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [dep]);
  return ref;
}

export function DashboardChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useAutoScroll(messages.length);

  useEffect(() => {
    const id = 'mira-chat-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = CHAT_CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    mediaRecorderRef.current?.state === 'recording' && mediaRecorderRef.current.stop();
  }, []);

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingAttachment({ kind: 'image', dataUrl: reader.result as string, file });
    reader.readAsDataURL(file);
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
          setPendingAttachment({ kind: 'audio', dataUrl: reader.result as string, blob, durationSec: recordSec });
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

  const sendToMira = async (userMsg: ChatMsg) => {
    const phone = localStorage.getItem('mira_phone') || '';
    const placeholderId = crypto.randomUUID();
    setMessages((m) => [...m, { id: placeholderId, from: 'mira', pending: true }]);

    try {
      const body: Record<string, any> = { phone_number: phone };
      if (userMsg.text) body.text = userMsg.text;
      if (userMsg.attachment?.kind === 'image') body.image_base64 = userMsg.attachment.dataUrl;
      if (userMsg.attachment?.kind === 'audio') body.audio_base64 = userMsg.attachment.dataUrl;

      const res = await fetch(CHAT_FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 404) {
        // Backend not deployed yet — fail loudly but gracefully, not silently.
        setMessages((m) => m.map((msg) => msg.id === placeholderId ? {
          ...msg, pending: false, error: true,
          text: 'Chat AI di web app belum aktif — masih dalam pengembangan. Sementara pakai WhatsApp MIRA ya 🙏',
        } : msg));
        return;
      }
      if (!res.ok) throw new Error(await res.text().catch(() => 'request failed'));

      const data = await res.json();
      setMessages((m) => m.map((msg) => msg.id === placeholderId ? {
        ...msg, pending: false, text: data.reply || '(tidak ada balasan)',
      } : msg));

      if (data.saved) window.dispatchEvent(new CustomEvent('mira:tx-added'));
    } catch {
      setMessages((m) => m.map((msg) => msg.id === placeholderId ? {
        ...msg, pending: false, error: true,
        text: 'Gagal mengirim pesan. Coba lagi beberapa saat.',
      } : msg));
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (sending) return;
    if (!text.trim() && !pendingAttachment) return;

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      from: 'user',
      text: text.trim() || undefined,
      attachment: pendingAttachment || undefined,
    };

    setMessages((m) => [...m, userMsg]);
    setText('');
    setPendingAttachment(null);
    setSending(true);
    sendToMira(userMsg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mc-wrap">
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePickImage} />

      <div className="mc-log" ref={logRef}>
        {messages.length === 0 && (
          <div className="mc-empty">
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Chat sama MIRA</p>
            <p style={{ fontSize: 13, margin: 0, maxWidth: 320 }}>
              Catat pengeluaran, kirim foto struk, atau rekam voice note — sama seperti di WhatsApp.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`mc-row ${msg.from}`}>
            <div className={`mc-avatar ${msg.from}`}>{msg.from === 'mira' ? 'M' : 'Y'}</div>
            <div className={`mc-bubble ${msg.from}${msg.error ? ' error' : ''}`}>
              {msg.attachment?.kind === 'image' && <img className="mc-img" src={msg.attachment.dataUrl} alt="Lampiran" />}
              {msg.attachment?.kind === 'audio' && (
                <div className="mc-audio-chip">
                  <Mic size={14} /> Voice note · {fmtSec(msg.attachment.durationSec)}
                </div>
              )}
              {msg.pending ? (
                <div className="mc-typing"><span /><span /><span /></div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mc-composer">
        {pendingAttachment && (
          <div className="mc-preview">
            {pendingAttachment.kind === 'image' ? (
              <>
                <img src={pendingAttachment.dataUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                <span>Foto siap dikirim</span>
              </>
            ) : (
              <>
                <Mic size={14} />
                <span>Voice note · {fmtSec(pendingAttachment.durationSec)}</span>
              </>
            )}
            <button onClick={clearAttachment} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="mc-bar">
          <button className="mc-icon-btn" title="Lampirkan foto" onClick={() => fileInputRef.current?.click()} disabled={recording}>
            <Paperclip size={17} />
          </button>
          <button
            className={`mc-icon-btn${recording ? ' recording' : ''}`}
            title={recording ? 'Berhenti merekam' : 'Rekam voice note'}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? <Square size={15} /> : <Mic size={17} />}
          </button>

          <textarea
            className="mc-input"
            rows={1}
            placeholder={recording ? `Merekam… ${fmtSec(recordSec)}` : 'Tulis pesan ke MIRA…'}
            value={text}
            disabled={recording}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button className="mc-send-btn" onClick={handleSend} disabled={sending || recording || (!text.trim() && !pendingAttachment)}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * STATUS: UI complete, not yet linked into the sidebar/mobile nav or
 * routes.tsx on purpose — sendToMira() posts to a Supabase Edge Function
 * (chat-send) that doesn't exist yet, so shipping a nav link today would
 * point real users at a dead endpoint. It degrades gracefully (catches the
 * 404 and shows an explanatory bubble) rather than hanging, but it's still
 * not a finished feature.
 *
 * To go live: build + deploy the chat-send Edge Function (reusing the MIRA
 * AI Brain / Analyze image / Analyze audio prompts pulled from n8n), add a
 * route for this page in routes.tsx, and add a nav entry in
 * dashboard/layout.tsx's NAV_SECTIONS — then test end-to-end against real
 * data before anyone sees the link.
 */
