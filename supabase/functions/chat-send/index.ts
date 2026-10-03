/**
 * chat-send
 * ─────────────────────────────────────────────────────────────────────────
 * Backend for the dashboard's web chat (src/app/pages/dashboard/chat.tsx).
 * Deliberately independent of the n8n/WhatsApp workflow — reuses the same
 * prompts (see prompts.ts, extracted from the n8n nodes) and the same
 * Supabase tables (users, user_states, expenses) so an expense logged here
 * shows up identically in WhatsApp-driven insights and vice versa, but runs
 * its own copy of the decision logic so WhatsApp/n8n stays untouched.
 *
 * SCOPE (v1): store/confirm/cancel/edit expense, query_expense, chat_response.
 * NOT yet ported: split_bill, log_investment, set_reminder, export_request,
 * insight_request — the system prompt tells the model to decline those
 * gracefully via chat_response rather than let the model hallucinate an
 * unhandled action.
 *
 * Required secrets (`supabase secrets set`):
 *   OPENROUTER_API_KEY  – https://openrouter.ai/keys
 *   GEMINI_API_KEY      – https://aistudio.google.com/apikey
 * Auto-injected by the Supabase runtime: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * ─────────────────────────────────────────────────────────────────────────
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  MIRA_BRAIN_SYSTEM, IMAGE_OCR_PROMPT, AUDIO_TRANSCRIBE_PROMPT, QUERY_REPLY_SYSTEM,
  buildBrainUserPrompt, buildQueryReplyUserPrompt,
} from './prompts.ts';
import { computeFinancialScores } from './scoring.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const BRAIN_MODEL = 'openai/gpt-4o-mini';

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

const fmtRp = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n));

/** "Today" in WIB (UTC+7), timezone-independent regardless of server clock. */
function todayWIB(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
}

const EXPENSE_CATEGORIES = [
  'Makanan & Minuman', 'Transport', 'Belanja Online', 'Tagihan & Utilitas', 'Kesehatan',
  'Hiburan & Lifestyle', 'Pendidikan', 'Kebutuhan Rumah', 'Keluarga & Sosial',
  'Fashion & Kecantikan', 'Savings & Investment', 'Lainnya',
];

interface DraftExpense {
  item?: string; merchant?: string; amount?: number; currency?: string; quantity?: number;
  date?: string; wallet?: string; category?: string; transaction_type?: 'expense' | 'income';
  items_detail?: unknown;
}

interface BrainResult {
  action: string;
  reply?: string;
  expenses?: DraftExpense[];
  query?: { type: 'sum' | 'list' | 'last'; filters?: { date?: { from?: string; to?: string }; merchant?: string; item?: string; category?: string } };
  edit_instruction?: string;
  delete_search?: string;
}

// ─── Gemini (image / audio analysis) ───────────────────────────────────────

function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/s);
  if (!m) return { mimeType: 'application/octet-stream', data: dataUrl };
  return { mimeType: m[1], data: m[2] };
}

async function analyzeMedia(dataUrl: string, prompt: string): Promise<string> {
  const { mimeType, data } = splitDataUrl(dataUrl);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data } }] }],
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini_failed:${res.status}:${await res.text().catch(() => '')}`);
  const data2 = await res.json();
  return data2?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── OpenRouter (MIRA AI Brain / query reply) ──────────────────────────────

async function callOpenRouter(system: string, user: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: BRAIN_MODEL,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`openrouter_failed:${res.status}:${await res.text().catch(() => '')}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function callMiraBrain(userPrompt: string): Promise<BrainResult> {
  const raw = await callOpenRouter(MIRA_BRAIN_SYSTEM, userPrompt);
  try {
    return JSON.parse(stripCodeFence(raw));
  } catch {
    // One retry asking the model to fix its own output into valid JSON.
    const fixed = await callOpenRouter(
      'Kamu memperbaiki output JSON yang tidak valid. Balas HANYA dengan JSON yang valid, tanpa teks lain.',
      `Perbaiki ini jadi JSON valid:\n${raw}`,
    );
    return JSON.parse(stripCodeFence(fixed));
  }
}

function stripCodeFence(s: string): string {
  const t = s.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1] : t;
}

// ─── Expense queries ────────────────────────────────────────────────────────

async function sumToday(phone_number: string): Promise<number> {
  const today = todayWIB();
  const { data } = await sb
    .from('expenses')
    .select('amount, transaction_type')
    .eq('phone_number', phone_number)
    .eq('date', today);
  return (data || [])
    .filter((t: any) => (t.transaction_type || 'expense').toLowerCase() !== 'income')
    .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
}

async function runQuery(phone_number: string, query: BrainResult['query']) {
  const from = query?.filters?.date?.from || '2020-01-01';
  const to = query?.filters?.date?.to || todayWIB();
  let q = sb.from('expenses').select('*').eq('phone_number', phone_number).gte('date', from).lte('date', to);
  if (query?.filters?.merchant) q = q.ilike('merchant', `%${query.filters.merchant}%`);
  if (query?.filters?.item) q = q.ilike('item', `%${query.filters.item}%`);
  if (query?.filters?.category) q = q.eq('category', query.filters.category);
  if (query?.type === 'last') q = q.order('date', { ascending: false }).limit(1);
  else q = q.order('date', { ascending: false }).limit(500);
  const { data } = await q;
  return data || [];
}

// ─── Draft / state helpers ──────────────────────────────────────────────────

async function upsertState(phone_number: string, state: string, draft_data: DraftExpense[] | null) {
  await sb.from('user_states').upsert(
    { phone_number, state, draft_data, updated_at: new Date().toISOString() },
    { onConflict: 'phone_number' },
  );
}

async function clearState(phone_number: string) {
  await upsertState(phone_number, 'idle', null);
}

function formatDraftSummary(expenses: DraftExpense[], edited = false): string {
  const fmt2 = (n: number) => fmtRp(n);
  const lines = expenses.map((e) => {
    const isIncome = e.transaction_type === 'income';
    return [
      `${isIncome ? '💰' : '💳'} ${e.item || e.merchant || 'Transaksi'}`,
      `💰 Nominal: ${fmt2(Number(e.amount || 0))}`,
      `🏷️ Kategori: ${e.category || '-'}`,
      `👛 Wallet: ${e.wallet || '-'}`,
      `📅 Tanggal: ${e.date || todayWIB()}`,
    ].join('\n');
  }).join('\n\n');
  const header = edited ? '✏️ Draft Diperbarui\n\n' : '';
  return `${header}${lines}\n\nGimana, udah pas belum? 👀\n• Ketik SIMPAN kalau oke\n• Kasih tau kalau ada yang mau diubah\n• Ketik BATAL kalau mau dibatalin`;
}

async function applyEditViaLLM(draft: DraftExpense[], instruction: string): Promise<DraftExpense[]> {
  const system = `Kamu mengedit draft transaksi keuangan berdasarkan instruksi user. Balas HANYA dengan JSON array yang sama strukturnya dengan draft asli, dengan field yang diminta user diubah dan field lain TIDAK diubah. Jangan tambah atau hapus item kecuali diminta eksplisit.`;
  const user = `Draft saat ini:\n${JSON.stringify(draft)}\n\nInstruksi edit dari user: "${instruction}"\n\nBalas HANYA JSON array hasil edit.`;
  try {
    const raw = await callOpenRouter(system, user);
    const parsed = JSON.parse(stripCodeFence(raw));
    return Array.isArray(parsed) ? parsed : draft;
  } catch {
    return draft; // edit failed — keep the draft unchanged rather than corrupt it
  }
}

// ─── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const phone_number = String(body.phone_number || '').trim();
  const textIn = typeof body.text === 'string' ? body.text.trim() : '';
  const imageB64 = typeof body.image_base64 === 'string' ? body.image_base64 : '';
  const audioB64 = typeof body.audio_base64 === 'string' ? body.audio_base64 : '';

  if (!phone_number) return json({ error: 'phone_number_required' }, 400);
  if (!textIn && !imageB64 && !audioB64) return json({ error: 'empty_message' }, 400);
  if (!OPENROUTER_API_KEY) return json({ error: 'backend_not_configured', detail: 'OPENROUTER_API_KEY missing' }, 503);

  const messageType: 'text' | 'image' | 'audio' = imageB64 ? 'image' : audioB64 ? 'audio' : 'text';

  await sb.from('chat_messages').insert({
    phone_number, direction: 'user', message_type: messageType,
    content: messageType === 'text' ? textIn : null,
  });

  const reply = async (text: string, extra: Partial<{ saved: boolean }> = {}) => {
    await sb.from('chat_messages').insert({ phone_number, direction: 'mira', message_type: 'text', content: text });
    return json({ reply: text, saved: !!extra.saved });
  };

  try {
    // 1. user + membership
    const { data: user } = await sb.from('users').select('*').eq('primary_phone', phone_number).maybeSingle();
    if (!user) return await reply('Nomor ini belum terdaftar di MIRA. Daftar dulu yuk di halo-mira.com 🙏');

    const now = new Date();
    if (user.valid_to && new Date(user.valid_to) < now) {
      return await reply('Langganan MIRA kamu udah habis. Yuk perpanjang dulu di halo-mira.com/subscription biar bisa lanjut nyatet 🙏');
    }
    const accStatus = (user.account_status || '').toLowerCase();
    if (accStatus !== 'pro' && accStatus !== 'paid') {
      return await reply('Akun kamu belum aktif sebagai member MIRA. Selesaikan pembayaran dulu ya di halo-mira.com 🙏');
    }

    // 2. normalize input
    let normalizedText = textIn;
    if (messageType === 'image') {
      if (!GEMINI_API_KEY) return await reply('Fitur foto struk belum aktif sepenuhnya, coba lagi nanti ya 🙏');
      normalizedText = (await analyzeMedia(imageB64, IMAGE_OCR_PROMPT)).trim();
      if (!normalizedText) return await reply('Fotonya kurang jelas nih 😅 Bisa kasih tau nominalnya berapa?');
    } else if (messageType === 'audio') {
      if (!GEMINI_API_KEY) return await reply('Fitur voice note belum aktif sepenuhnya, coba lagi nanti ya 🙏');
      normalizedText = (await analyzeMedia(audioB64, AUDIO_TRANSCRIBE_PROMPT)).trim();
      if (!normalizedText) return await reply('Voice note-nya kurang jelas nih, coba rekam ulang ya 🙏');
    }

    // 3. conversation state
    const { data: stateRow } = await sb.from('user_states').select('*').eq('phone_number', phone_number).maybeSingle();
    let currentState: string = stateRow?.state || 'idle';
    let draftData: DraftExpense[] | null = stateRow?.draft_data
      ? (Array.isArray(stateRow.draft_data) ? stateRow.draft_data : [stateRow.draft_data])
      : null;

    // State-clearing heuristic (ported from n8n's Build Context) — a photo/voice
    // note, or a fresh-looking expense message, breaks out of a stale
    // waiting_confirmation instead of being misread as an edit to it.
    if (currentState === 'waiting_confirmation') {
      const t = normalizedText.toLowerCase().trim();
      const isDraftRelated = /simpan|buang|batal|cancel|\bya\b|\biya\b|\bok\b|\boke\b|\byep\b|\bgas\b|\bsip\b|\bdone\b|lanjut|\bbener\b|ganti|ubah|salah|bukan|harusnya|mestinya|edit|koreksi|tambah|kurang|pake|pakai/.test(t);
      const isAmountEdit = /totalnya|harganya|nominalnya|harusnya|seharusnya|sebenarnya/.test(t) && /\d/.test(t);
      const isMedia = messageType !== 'text';
      const isNewExpense = /\d/.test(t) && !isDraftRelated && !isAmountEdit;
      if (isMedia || isNewExpense) {
        currentState = 'idle';
        draftData = null;
      }
    }

    // 4. financial scores + brain call
    const scoring = computeFinancialScores(user);
    const brainUserPrompt = buildBrainUserPrompt({
      normalized_text: normalizedText,
      current_date: todayWIB(),
      default_wallet: user.primary_wallet || 'Cash',
      payment_method_ranking: user.payment_method_ranking || '',
      all_wallets: [user.primary_wallet].filter(Boolean),
      current_state: currentState,
      draft_data: draftData,
      reminder_style: (user.reminder_style || 'santai').toLowerCase(),
      income_range: user.income_range || '',
      income_type: user.income_type || '',
      saving_goals: user.saving_goals || '',
      biggest_spend_category: user.biggest_spend_category || '',
      impulse_buy_frequency: user.impulse_buy_frequency || '',
      expense_allocation_pct: Number(user.expense_allocation_pct || 85),
      saving_allocation_pct: Number(user.saving_allocation_pct || 15),
      emergency_fund_duration: user.emergency_fund_duration || '',
      investment_status: user.investment_status || '',
      debt_status: user.debt_status || '',
      paylater_habit: user.paylater_habit || '',
      financial_scores: scoring.financial_scores,
      daily_safe_limit: scoring.daily_safe_limit,
    });

    const brain = await callMiraBrain(brainUserPrompt);

    // 5. branch on action
    switch (brain.action) {
      case 'store_expense': {
        const expenses = (brain.expenses || []).map((e) => ({ ...e, date: e.date || todayWIB() }));
        if (!expenses.length) return await reply('Berapa yang dikeluarin? 🍽️');
        await upsertState(phone_number, 'waiting_confirmation', expenses);
        return await reply(formatDraftSummary(expenses));
      }

      case 'confirm_expense': {
        if (currentState !== 'waiting_confirmation' || !draftData?.length) {
          return await reply('Gak ada draft yang perlu disimpan nih 🤔');
        }
        for (const e of draftData) {
          await sb.from('expenses').insert({
            phone_number,
            amount: Number(e.amount || 0),
            category: e.category || 'Lainnya',
            merchant: e.merchant || e.item || null,
            item: e.item || e.merchant || null,
            wallet: e.wallet || user.primary_wallet || 'Cash',
            date: e.date || todayWIB(),
            currency: e.currency || 'IDR',
            quantity: e.quantity ?? null,
            transaction_type: e.transaction_type || 'expense',
            items_detail: e.items_detail ? JSON.stringify(e.items_detail) : null,
          });
        }
        await clearState(phone_number);
        const total = await sumToday(phone_number);
        return await reply(`✅ Tersimpan!\n📊 Total pengeluaran hari ini: ${fmtRp(total)}`, { saved: true });
      }

      case 'cancel_expense': {
        await clearState(phone_number);
        return await reply('Oke, dibatalin ya 👍');
      }

      case 'edit_expense': {
        if (!draftData?.length) return await reply('Gak ada draft yang bisa diedit nih 🤔');
        const edited = await applyEditViaLLM(draftData, brain.edit_instruction || normalizedText);
        await upsertState(phone_number, 'waiting_confirmation', edited);
        return await reply(formatDraftSummary(edited, true));
      }

      case 'query_expense': {
        const txns = await runQuery(phone_number, brain.query);
        const queryUserPrompt = buildQueryReplyUserPrompt({
          normalized_text: normalizedText,
          user_name: user.name || '',
          current_date: todayWIB(),
          reminder_style: (user.reminder_style || 'santai').toLowerCase(),
          limit_method: user.limit_method || 'nominal',
          limit_nominal: Number(user.limit_nominal || 0),
          limit_percentage: Number(user.limit_percentage || 0),
          income_range: user.income_range || '',
          biggest_spend_category: user.biggest_spend_category || '',
          count: txns.length,
          transactions: txns,
        });
        const answer = await callOpenRouter(QUERY_REPLY_SYSTEM, queryUserPrompt);
        return await reply(answer.trim() || 'Belum ada data untuk pertanyaan ini.');
      }

      case 'chat_response': {
        return await reply(brain.reply || 'Halo! Ada yang bisa MIRA bantu? 😊');
      }

      case 'delete_expense': {
        return await reply('Hapus transaksi lewat chat belum tersedia di web — buka halaman Transaksi untuk menghapusnya ya 🙏');
      }

      default: {
        return await reply('Fitur ini belum tersedia di chat web — split bill, investasi, reminder, export, dan insight masih dalam pengembangan di sini. Sementara pakai WhatsApp MIRA dulu ya 🙏');
      }
    }
  } catch (err) {
    console.error('chat-send error:', err);
    return await reply('Waduh, ada gangguan di sisi MIRA. Coba lagi beberapa saat ya 🙏');
  }
});
