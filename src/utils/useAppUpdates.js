import { useCallback, useEffect, useState } from 'react';
import { compareVersions } from './versions';

/**
 * Shared update / "what's new" state for the notch and the Settings window.
 *
 * - Version, bundled changelog and update status come from the main process
 *   (updater.js), so there is exactly one source of truth.
 * - "What's new" is shown once after the installed version increases.
 *   `lastSeenVersion` lives in localStorage, shared by both windows.
 * - Each new available version is announced in the notch only once
 *   (`updateNotifiedVersion`); the settings badge stays until updated.
 */
const ipc = typeof window !== 'undefined' ? window.electronAPI : null;
const SEEN_KEY = 'lastSeenVersion';
const NOTIFIED_KEY = 'updateNotifiedVersion';

const read = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

export function useAppUpdates() {
  const [info, setInfo] = useState(null);
  const [whatsNew, setWhatsNew] = useState(false);
  const [notifiedVersion, setNotifiedVersion] = useState(() => read(NOTIFIED_KEY));

  useEffect(() => {
    if (!ipc) return undefined;
    let alive = true;
    ipc.invoke?.('get-app-info').then((s) => { if (alive && s) setInfo(s); }).catch(() => {});
    ipc.on?.('update-status', (s) => { if (s) setInfo(s); });
    ipc.on?.('whats-new-dismissed', () => setWhatsNew(false));
    return () => {
      alive = false;
      ipc.removeAllListeners?.('update-status');
      ipc.removeAllListeners?.('whats-new-dismissed');
    };
  }, []);

  // Decide once we know the installed version
  const current = info?.currentVersion;
  useEffect(() => {
    if (!current) return;
    const seen = read(SEEN_KEY);
    if (!seen) {
      // Fresh install: nothing to announce
      write(SEEN_KEY, current);
      setWhatsNew(false);
    } else {
      setWhatsNew(compareVersions(current, seen) > 0);
    }
  }, [current]);

  // Keep both windows in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === SEEN_KEY && current) setWhatsNew(compareVersions(current, e.newValue || '0') > 0);
      if (e.key === NOTIFIED_KEY) setNotifiedVersion(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [current]);

  const dismissWhatsNew = useCallback(() => {
    if (current) write(SEEN_KEY, current);
    setWhatsNew(false);
    ipc?.send?.('dismiss-whats-new');
  }, [current]);

  const updateAvailable = info?.status === 'available';
  const latestVersion = info?.latestVersion;

  const markUpdateNotified = useCallback(() => {
    if (!latestVersion) return;
    write(NOTIFIED_KEY, latestVersion);
    setNotifiedVersion(latestVersion);
  }, [latestVersion]);

  return {
    info,
    currentVersion: current || null,
    changelog: info?.changelog || [],
    updateAvailable,
    latestVersion,
    latestChangelog: info?.latestChangelog || [],
    isStore: !!info?.isStore,
    checking: info?.status === 'checking',
    checkedAt: info?.checkedAt || null,
    checkError: info?.status === 'error' ? info.error : null,
    whatsNew,
    dismissWhatsNew,
    updateNeedsNotice: updateAvailable && notifiedVersion !== latestVersion,
    markUpdateNotified,
    checkNow: () => ipc?.invoke?.('check-for-updates'),
    openUpdate: () => ipc?.send?.('open-update')
  };
}

/** Splits "Title: description" changelog entries for display. */
export const splitChangelog = (entry) => {
  const i = String(entry).indexOf(':');
  return i > 0 && i < 60 ? { title: entry.slice(0, i).trim(), body: entry.slice(i + 1).trim() } : { title: null, body: String(entry) };
};
