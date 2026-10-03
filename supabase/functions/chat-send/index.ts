/**
 * chat-send
 * ─────────────────────────────────────────────────────────────────────────
 * Backend for the dashboard's web chat (MiraChat.tsx, used by both the full
 * chat page and the floating widget). Deliberately independent of the n8n/
 * WhatsApp workflow — reuses the same prompts (see prompts.ts, extracted
 * from the n8n nodes) and the same Supabase tables (users, user_states,
 * expenses) so an expense logged here shows up identically in WhatsApp-
 * driven insights and vice versa, but runs its own copy of the decision
 * logic so WhatsApp/n8n stays untouched.
 *
 * SCOPE: store/confirm/cancel/edit expense, query_expense, chat_response,
 * split bill (split_bill / edit_split / confirm_split / cancel_split — the
 * math + persistence live in ../_shared/split*.ts, shared with mira-tools).
 * NOT yet ported: log_investment, set_reminder, export_request,
 * insight_request — the system prompt tells the model to decline those
 * gracefully via chat_response rather than let the model hallucinate an
 * unhandled action.
 *
 * Request body:
 *   { phone_number, text? , image_base64? | audio_base64? }  — normal message
 *     (text alongside an image is its caption and is kept, like WhatsApp)
 *   { phone_number, action: 'confirm_expense' | 'cancel_expense' | 'confirm_split' | 'cancel_split' }
 *     — deterministic fast path for the UI's action buttons: skips OCR/
 *       transcription and the MIRA AI Brain call entirely (no LLM round
 *       trip needed to know what a button tap means), acting directly on
 *       the current draft in user_states. Faster and immune to NLU
 *       ambiguity compared to routing "simpan"/"batal" back through the
 *       brain — which still also works for anyone who types it instead.
 *
 * Response: { reply, saved, awaiting, draft? } — awaiting is 'confirm' when
 * the reply is an expense draft (Simpan/Batal buttons), 'confirm_split' when
 * it's a split bill draft (draft = the SplitDraft, for "Atur di Split Bill").
 *
 * user_states.state 'waiting_split_confirm' holds a SplitDraft object in
 * draft_data. It's web-only; WhatsApp's own split flow uses its own state.
 *
 * Required secret (`supabase secrets set`):
 *   OPENROUTER_API_KEY  – https://openrouter.ai/keys (all models, incl. Gemini, go through OpenRouter)
 * Auto-injected by the Supabase runtime: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * ─────────────────────────────────────────────────────────────────────────
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  MIRA_BRAIN_SYSTEM, IMAGE_OCR_PROMPT, AUDIO_TRANSCRIBE_PROMPT, QUERY_REPLY_SYSTEM,
  buildBrainUserPrompt, buildQueryReplyUserPrompt,
} from './prompts.ts';
import { computeFinancialScores } from './scoring.ts';
import { formatSplitSummary, saveSplit, totalOf, type SplitDraft } from '../_shared/split.ts';
import { parseSplitWithAI } from '../_shared/split_ai.ts';
import { analyzeMedia, callGemini, callOpenRouter, stripCodeFence, UnsupportedMediaError } from '../_shared/ai.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';

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

// ─── MIRA AI Brain (all models via OpenRouter — plumbing in ../_shared/ai.ts) ─

/** gpt-4o-mini (same brain as n8n) with Gemini as a fallback model, so a
 *  single provider outage doesn't take the chat down. */
async function llm(system: string, user: string, json = false): Promise<string> {
  try {
    return await callOpenRouter(system, user);
  } catch (e) {
    console.warn('openrouter failed, falling back to gemini', String(e).slice(0, 200));
    return await callGemini(system, user, { json });
  }
}

async function callMiraBrain(userPrompt: string): Promise<BrainResult> {
  const raw = await llm(MIRA_BRAIN_SYSTEM, userPrompt, true);
  try {
    return JSON.parse(stripCodeFence(raw));
  } catch {
    // One retry asking the model to fix its own output into valid JSON.
    const fixed = await llm(
      'Kamu memperbaiki output JSON yang tidak valid. Balas HANYA dengan JSON yang valid, tanpa teks lain.',
      `Perbaiki ini jadi JSON valid:\n${raw}`,
      true,
    );
    return JSON.parse(stripCodeFence(fixed));
  }
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

async function upsertState(phone_number: string, state: string, draft_data: DraftExpense[] | SplitDraft | null) {
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
  return `${header}${lines}\n\nGimana, udah pas belum? 👀`;
}

async function applyEditViaLLM(draft: DraftExpense[], instruction: string): Promise<DraftExpense[]> {
  const system = `Kamu mengedit draft transaksi keuangan berdasarkan instruksi user. Balas HANYA dengan JSON array yang sama strukturnya dengan draft asli, dengan field yang diminta user diubah dan field lain TIDAK diubah. Jangan tambah atau hapus item kecuali diminta eksplisit.`;
  const user = `Draft saat ini:\n${JSON.stringify(draft)}\n\nInstruksi edit dari user: "${instruction}"\n\nBalas HANYA JSON array hasil edit.`;
  try {
    const raw = await llm(system, user, true);
    const parsed = JSON.parse(stripCodeFence(raw));
    if (!Array.isArray(parsed)) return draft;
    if (parsed.length !== draft.length) return parsed;
    // The model sometimes "tidies up" fields nobody asked about (e.g. a price
    // fix silently resetting GoPay -> Cash). Keep those unless mentioned.
    const mentionsWallet = WALLET_WORDS.test(instruction);
    const mentionsDate = DATE_WORDS.test(instruction);
    return parsed.map((e: DraftExpense, i: number) => ({
      ...e,
      wallet: mentionsWallet ? e.wallet : draft[i].wallet,
      date: mentionsDate ? e.date : draft[i].date,
    }));
  } catch {
    return draft; // edit failed — keep the draft unchanged rather than corrupt it
  }
}

const WALLET_WORDS = /wallet|dompet|pake|pakai|via|lewat|bca|bri|bni|mandiri|cimb|jenius|jago|seabank|gopay|ovo|dana|shopee|linkaja|cash|tunai|kartu|kredit|debit|qris|paylater/i;
const DATE_WORDS = /tanggal|tgl|kemarin|hari ini|tadi|lusa|minggu|bulan|senin|selasa|rabu|kamis|jumat|sabtu|\d{1,2}\s*[/-]\s*\d{1,2}/i;

async function doConfirm(phone_number: string, user: any, currentState: string, draftData: DraftExpense[] | null) {
  if (currentState !== 'waiting_confirmation' || !draftData?.length) {
    return { text: 'Gak ada draft yang perlu disimpan nih 🤔', saved: false };
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
  return { text: `✅ Tersimpan!\n📊 Total pengeluaran hari ini: ${fmtRp(total)}`, saved: true };
}

async function doCancel(phone_number: string) {
  await clearState(phone_number);
  return { text: 'Oke, dibatalin ya 👍', saved: false };
}

// ─── Split bill ───────────────────────────────────────────────────────────

const SPLIT_STATE = 'waiting_split_confirm';

function splitDraftOf(stateRow: { state?: string; draft_data?: unknown } | null): SplitDraft | null {
  if (stateRow?.state !== SPLIT_STATE || !stateRow.draft_data) return null;
  const d = Array.isArray(stateRow.draft_data) ? stateRow.draft_data[0] : stateRow.draft_data;
  return d && typeof d === 'object' && Array.isArray((d as SplitDraft).participants) ? (d as SplitDraft) : null;
}

function splitPrompt(d: SplitDraft, edited = false): string {
  const lines: string[] = [];
  if (edited) lines.push('✏️ Split bill diperbarui', '');
  lines.push(formatSplitSummary(d));
  if (d.participants.some((p) => !p.is_me)) {
    lines.push('', 'Udah pas? Tinggal Simpan — atau bilang aja kalau mau diubah (misal "Raras ga ikut minum" atau "bagi rata aja").');
  }
  return lines.join('\n');
}

async function doConfirmSplit(phone_number: string, draft: SplitDraft | null) {
  if (!draft) return { text: 'Gak ada split bill yang perlu disimpan nih 🤔', saved: false };
  if (totalOf(draft) <= 0) return { text: 'Totalnya belum ada nih — kirim foto struknya atau sebutin nominalnya dulu ya 🧾', saved: false };
  const result = await saveSplit(sb, phone_number, draft, 'chat');
  await clearState(phone_number);
  return { text: result.message, saved: true };
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
  const action = typeof body.action === 'string' ? body.action : '';
  const textIn = typeof body.text === 'string' ? body.text.trim() : '';
  const imageB64 = typeof body.image_base64 === 'string' ? body.image_base64 : '';
  const audioB64 = typeof body.audio_base64 === 'string' ? body.audio_base64 : '';

  if (!phone_number) return json({ error: 'phone_number_required' }, 400);
  const FAST_ACTIONS = ['confirm_expense', 'cancel_expense', 'confirm_split', 'cancel_split'];
  const isFastAction = FAST_ACTIONS.includes(action);
  if (!isFastAction && !textIn && !imageB64 && !audioB64) return json({ error: 'empty_message' }, 400);
  if (!isFastAction && !OPENROUTER_API_KEY) return json({ error: 'backend_not_configured', detail: 'OPENROUTER_API_KEY missing' }, 503);

  const messageType: 'text' | 'image' | 'audio' = imageB64 ? 'image' : audioB64 ? 'audio' : 'text';
  const userLogContent = isFastAction
    ? (action.startsWith('confirm') ? '✅ Simpan' : '❌ Batal')
    : (textIn || null); // for photos this is the caption, if any

  await sb.from('chat_messages').insert({
    phone_number, direction: 'user', message_type: messageType,
    content: userLogContent,
  });

  type Awaiting = 'confirm' | 'confirm_split' | null;
  const reply = async (text: string, extra: Partial<{ saved: boolean; awaiting: Awaiting; draft: SplitDraft }> = {}) => {
    await sb.from('chat_messages').insert({ phone_number, direction: 'mira', message_type: 'text', content: text });
    return json({ reply: text, saved: !!extra.saved, awaiting: extra.awaiting ?? null, draft: extra.draft ?? null });
  };

  try {
    // 1. user + membership (shared by both the fast path and the full brain path)
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

    // 1b. Fast path for the UI's action buttons — no LLM round trip at all.
    if (isFastAction) {
      const { data: stateRow } = await sb.from('user_states').select('*').eq('phone_number', phone_number).maybeSingle();
      const currentState: string = stateRow?.state || 'idle';
      if (action === 'confirm_split') {
        const result = await doConfirmSplit(phone_number, splitDraftOf(stateRow));
        return await reply(result.text, { saved: result.saved });
      }
      if (action === 'cancel_split' || action === 'cancel_expense') {
        const result = await doCancel(phone_number);
        return await reply(result.text, { saved: result.saved });
      }
      const draftData: DraftExpense[] | null = stateRow?.draft_data && currentState !== SPLIT_STATE
        ? (Array.isArray(stateRow.draft_data) ? stateRow.draft_data : [stateRow.draft_data])
        : null;
      const result = await doConfirm(phone_number, user, currentState, draftData);
      return await reply(result.text, { saved: result.saved });
    }

    // 2. normalize input
    let normalizedText = textIn;
    try {
      if (messageType === 'image') {
        const ocr = (await analyzeMedia(imageB64, IMAGE_OCR_PROMPT)).trim();
        if (!ocr && !textIn) return await reply('Fotonya kurang jelas nih 😅 Bisa kasih tau nominalnya berapa?');
        // Keep the caption (e.g. "split sama Raras") — same as n8n's WhatsApp flow.
        normalizedText = textIn ? `${textIn}\n${ocr}` : ocr;
      } else if (messageType === 'audio') {
        const heard = (await analyzeMedia(audioB64, AUDIO_TRANSCRIBE_PROMPT)).trim();
        if (!heard) return await reply('Voice note-nya kurang jelas nih, coba rekam ulang ya 🙏');
        normalizedText = textIn ? `${textIn}\n${heard}` : heard;
      }
    } catch (e) {
      if (e instanceof UnsupportedMediaError) {
        return await reply(messageType === 'audio'
          ? 'Format voice note-nya belum kebaca nih 😅 Coba rekam ulang langsung dari tombol mic ya.'
          : 'Format filenya belum didukung — kirim foto JPG/PNG ya 🙏');
      }
      throw e;
    }

    // 3. conversation state
    const { data: stateRow } = await sb.from('user_states').select('*').eq('phone_number', phone_number).maybeSingle();
    let currentState: string = stateRow?.state || 'idle';
    const splitDraft = splitDraftOf(stateRow);
    let draftData: DraftExpense[] | null = stateRow?.draft_data && currentState !== SPLIT_STATE
      ? (Array.isArray(stateRow.draft_data) ? stateRow.draft_data : [stateRow.draft_data])
      : null;
    if (currentState === SPLIT_STATE && !splitDraft) currentState = 'idle';

    // A receipt photo / voice note while a split is being set up fills in
    // that split (e.g. "split sama Raras & Taufan" first, then the struk).
    if (splitDraft && messageType !== 'text') {
      const edited = await parseSplitWithAI(normalizedText, { current: splitDraft });
      await upsertState(phone_number, SPLIT_STATE, edited);
      return await reply(splitPrompt(edited, true), { awaiting: 'confirm_split', draft: edited });
    }

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
      draft_data: splitDraft
        ? { split_bill: splitDraft.merchant, total: totalOf(splitDraft), participants: splitDraft.participants.map((p) => `${p.name}: ${p.amount}`) }
        : draftData,
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

    // The model occasionally answers a split draft with the expense-flavoured
    // action names — map them onto the split equivalents.
    // And the reverse: split-flavoured actions with no split in progress.
    const alias: Record<string, string> = splitDraft
      ? { confirm_expense: 'confirm_split', cancel_expense: 'cancel_split', edit_expense: 'edit_split' }
      : { edit_split: 'split_bill', ...(draftData?.length ? { confirm_split: 'confirm_expense', cancel_split: 'cancel_expense' } : {}) };
    if (alias[brain.action]) brain.action = alias[brain.action];

    // 5. branch on action
    switch (brain.action) {
      case 'split_bill': {
        // Splitting an expense draft that's still waiting for confirmation:
        // carry its numbers over so the user doesn't have to repeat them.
        const base = draftData?.length
          ? draftData.map((e) => `Tagihan: ${e.item || e.merchant || 'Transaksi'}${e.merchant ? ` di ${e.merchant}` : ''}, total ${Number(e.amount || 0)}, tanggal ${e.date || todayWIB()}${e.wallet ? `, dibayar pakai ${e.wallet}` : ''}.`).join('\n') + '\n'
          : '';
        const draft = await parseSplitWithAI(base + normalizedText, { wallet: user.primary_wallet || 'Cash' });
        await upsertState(phone_number, SPLIT_STATE, draft);
        if (totalOf(draft) <= 0) {
          return await reply('Siap, kita split! 🍕 Totalnya berapa? Kirim foto struknya atau sebutin nominalnya ya 🧾', { awaiting: null });
        }
        return await reply(splitPrompt(draft), { awaiting: 'confirm_split', draft });
      }

      case 'edit_split': {
        if (!splitDraft) return await reply('Gak ada split bill yang lagi dibuat nih 🤔 Mau split apa? Ceritain aja, misal "makan 300rb bertiga sama Raras & Taufan".');
        // The user's own words, not the brain's paraphrase of them — the
        // paraphrase tends to drop names ("Dimas ikut" -> "tambah 1 orang").
        const edited = await parseSplitWithAI(normalizedText, { current: splitDraft });
        await upsertState(phone_number, SPLIT_STATE, edited);
        if (totalOf(edited) <= 0) {
          return await reply('Totalnya masih belum ada nih — kirim foto struknya atau sebutin nominalnya ya 🧾');
        }
        return await reply(splitPrompt(edited, true), { awaiting: 'confirm_split', draft: edited });
      }

      case 'confirm_split': {
        const result = await doConfirmSplit(phone_number, splitDraft);
        return await reply(result.text, { saved: result.saved });
      }

      case 'cancel_split': {
        const result = await doCancel(phone_number);
        return await reply(result.text, { saved: result.saved });
      }

      case 'store_expense': {
        const expenses = (brain.expenses || []).map((e) => ({ ...e, date: e.date || todayWIB() }));
        if (!expenses.length) return await reply('Berapa yang dikeluarin? 🍽️');
        await upsertState(phone_number, 'waiting_confirmation', expenses);
        return await reply(formatDraftSummary(expenses), { awaiting: 'confirm' });
      }

      case 'confirm_expense': {
        const result = await doConfirm(phone_number, user, currentState, draftData);
        return await reply(result.text, { saved: result.saved });
      }

      case 'cancel_expense': {
        const result = await doCancel(phone_number);
        return await reply(result.text, { saved: result.saved });
      }

      case 'edit_expense': {
        if (!draftData?.length) return await reply('Gak ada draft yang bisa diedit nih 🤔');
        const edited = await applyEditViaLLM(draftData, brain.edit_instruction || normalizedText);
        await upsertState(phone_number, 'waiting_confirmation', edited);
        return await reply(formatDraftSummary(edited, true), { awaiting: 'confirm' });
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
        const answer = await llm(QUERY_REPLY_SYSTEM, queryUserPrompt);
        return await reply(answer.trim() || 'Belum ada data untuk pertanyaan ini.');
      }

      case 'chat_response': {
        return await reply(brain.reply || 'Halo! Ada yang bisa MIRA bantu? 😊');
      }

      case 'delete_expense': {
        return await reply('Hapus transaksi lewat chat belum tersedia di web — buka halaman Transaksi untuk menghapusnya ya 🙏');
      }

      default: {
        return await reply('Fitur ini belum tersedia di chat web — investasi, reminder, export, dan insight masih dalam pengembangan di sini. Sementara pakai WhatsApp MIRA dulu ya 🙏');
      }
    }
  } catch (err) {
    console.error('chat-send error:', err);
    return await reply('Waduh, ada gangguan di sisi MIRA. Coba lagi beberapa saat ya 🙏');
  }
});
