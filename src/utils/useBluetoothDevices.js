import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Paired Bluetooth audio devices (headphones, speakers, headsets) and a way to
 * connect or disconnect them.
 *
 * Nothing is polled: the list is requested when a panel opens, and the main
 * process pushes a fresh one whenever a device connects, disconnects or a
 * request finishes. Windows offers no way to connect other kinds of Bluetooth
 * device (mice, keyboards) on demand, so only audio devices are listed.
 */
const ipc = typeof window !== 'undefined' ? window.electronAPI : null;
const GIVE_UP_MS = 15000;   // the worker reports back within ~12s; this is a safety net

export function useBluetoothDevices(active = true) {
  const [devices, setDevices] = useState(null);   // null until the first list arrives
  const [pending, setPending] = useState({});     // id -> 'connect' | 'disconnect'
  const [failedId, setFailedId] = useState(null);
  const timers = useRef({});

  const settle = useCallback((id, ok) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setPending((p) => { const next = { ...p }; delete next[id]; return next; });
    if (!ok) {
      setFailedId(id);
      setTimeout(() => setFailedId((f) => (f === id ? null : f)), 4000);
    }
  }, []);

  useEffect(() => {
    if (!ipc?.on || !active) return undefined;
    ipc.on('bt-devices', (list) => setDevices(Array.isArray(list) ? list : []));
    ipc.on('bt-set-result', (r) => { if (r?.id) settle(r.id, !!r.ok); });
    ipc.send('bt-panel', true);
    return () => {
      ipc.send('bt-panel', false);
      ipc.removeAllListeners('bt-devices');
      ipc.removeAllListeners('bt-set-result');
      Object.values(timers.current).forEach(clearTimeout);
      timers.current = {};
    };
  }, [active, settle]);

  const toggle = useCallback((device) => {
    if (!ipc || !device?.id || timers.current[device.id]) return;
    const connect = !device.connected;
    setFailedId(null);
    setPending((p) => ({ ...p, [device.id]: connect ? 'connect' : 'disconnect' }));
    timers.current[device.id] = setTimeout(() => settle(device.id, false), GIVE_UP_MS);
    ipc.send('bt-set-connection', device.id, connect);
  }, [settle]);

  const openSettings = useCallback(() => ipc?.send('open-bluetooth-settings'), []);

  return { devices, pending, failedId, toggle, openSettings };
}
