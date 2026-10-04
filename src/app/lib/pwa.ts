/**
 * pwa — "Pasang MIRA" (Add to Home Screen)
 * Chrome/Edge/Samsung fire `beforeinstallprompt` once, early, so initPwa()
 * runs from main.tsx before React and keeps the event for the install
 * buttons. iOS has no prompt API: the UI shows Share → Add to Home Screen
 * steps instead. The service worker (public/sw.js) only adds an offline page.
 */
import { useEffect, useState } from 'react';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function initPwa(): void {
  document.documentElement.classList.toggle('pwa-standalone', isStandalone());
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // our own banner/button asks instead of the mini-infobar
    deferred = e as InstallEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => { deferred = null; emit(); });
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  }
}

/** Running as the installed app (home-screen icon), not in a browser tab. */
export const isStandalone = (): boolean =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;

export const isIOS = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isMobile = (): boolean => isIOS() || /android/i.test(navigator.userAgent);

/** Opens the native install prompt; resolves false when there isn't one. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const e = deferred;
  deferred = null;
  emit();
  await e.prompt();
  await e.userChoice.catch(() => null);
  return true;
}

export function usePwaInstall() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return { installed: isStandalone(), canPrompt: !!deferred, ios: isIOS() };
}

/** Any "Pasang" button: native prompt when available, else the how-to sheet. */
export async function openInstall(): Promise<void> {
  if (await promptInstall()) return;
  window.dispatchEvent(new CustomEvent('mira:install-help'));
}
