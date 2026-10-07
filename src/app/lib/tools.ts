/**
 * Calls the mira-tools Edge Function for the logged-in account (structured
 * AI + writes that need the service role: split bills, piutang, target
 * history). Throws with MIRA's own message on failure.
 */
import { SUPA_ANON, SUPA_URL } from './google-auth';

const TOOLS_URL = `${SUPA_URL}/functions/v1/mira-tools`;

export async function callTools<T>(body: Record<string, unknown>): Promise<T> {
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
