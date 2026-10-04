/**
 * subscription — is this MIRA account allowed to record things right now?
 *
 * Same rule as isActiveMember() in the Edge Functions and mira_is_active()
 * in the database: account_status 'pro'/'paid' and valid_to in the future.
 * An inactive account is read-only — history stays visible, but nothing can
 * be added or changed (the database enforces this too, see
 * trg_guard_member_writes). Trials are users.plan_id = 'trial'.
 *
 * The dashboard layout publishes the fresh users row with
 * setSubscriptionUser(); any component reads it with useSubscription().
 * requireActive() is the guard for write buttons: it opens the renew sheet
 * (mounted in the layout) and returns false when the account is read-only.
 */
import { useEffect, useState } from 'react';

const DAY = 86_400_000;

export interface Subscription {
  /** May record transactions, chat with MIRA, etc. */
  active: boolean;
  trial: boolean;
  expired: boolean;
  /** Whole days left (ceil), null without an end date. 0 once expired. */
  daysLeft: number | null;
  validTo: Date | null;
  planLabel: string;
}

export function subscriptionOf(user: Record<string, any> | null | undefined): Subscription {
  const status = String(user?.account_status || '').toLowerCase();
  const validTo = user?.valid_to ? new Date(user.valid_to) : null;
  const msLeft = validTo ? validTo.getTime() - Date.now() : null;
  const expired = msLeft !== null && msLeft <= 0;
  const trial = user?.plan_id === 'trial';
  return {
    // No user loaded yet → don't flash read-only UI; the server still checks.
    active: !user || ((status === 'pro' || status === 'paid') && !expired),
    trial,
    expired,
    daysLeft: msLeft === null ? null : Math.max(0, Math.ceil(msLeft / DAY)),
    validTo,
    planLabel: trial ? 'Trial' : user?.plan_name || 'Personal',
  };
}

let currentUser: Record<string, unknown> | null = (() => {
  try { return JSON.parse(localStorage.getItem('mira_user') || 'null'); } catch { return null; }
})();
const listeners = new Set<() => void>();

export function setSubscriptionUser(user: Record<string, unknown> | null): void {
  currentUser = user;
  listeners.forEach((l) => l());
}

export function useSubscription(): Subscription {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return subscriptionOf(currentUser);
}

export const RENEW_PATH = '/dashboard/langganan';

/** Set when the Langganan page sends someone to Midtrans; payment-success
 *  reads it to say "diperpanjang" instead of "akun aktif". */
export const RENEWAL_MARKER = 'mira_renewal_started';

/** Opens the "perpanjang" sheet (rendered by the dashboard layout). */
export function openRenewSheet(reason?: string): void {
  window.dispatchEvent(new CustomEvent('mira:renew', { detail: { reason } }));
}

/** Guard for anything that writes. false (and the renew sheet) when read-only. */
export function requireActive(reason?: string): boolean {
  if (subscriptionOf(currentUser).active) return true;
  openRenewSheet(reason);
  return false;
}

/** The database's read-only error (trg_guard_member_writes) or mira-tools' 403. */
export function isReadOnlyError(text: string | null | undefined): boolean {
  return /MIRA_READ_ONLY|"inactive"|tidak aktif/i.test(String(text || ''));
}
