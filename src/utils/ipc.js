// Universal Electron IPC wrapper that safely handles context isolation and HMR
export const getIpc = () => {
  if (typeof window === 'undefined') return null;
  return window.electronAPI || (window.require ? window.require('electron').ipcRenderer : null) || null;
};

export const sendIpc = (channel, ...args) => {
  const ipc = getIpc();
  if (ipc && typeof ipc.send === 'function') {
    try {
      ipc.send(channel, ...args);
    } catch (e) {
      console.warn(`[sendIpc] Error sending to channel "${channel}":`, e);
    }
  } else {
    console.warn(`[sendIpc] IPC unavailable for channel "${channel}"`);
  }
};

export const invokeIpc = async (channel, ...args) => {
  const ipc = getIpc();
  if (ipc && typeof ipc.invoke === 'function') {
    try {
      return await ipc.invoke(channel, ...args);
    } catch (e) {
      console.warn(`[invokeIpc] Error invoking channel "${channel}":`, e);
    }
  }
  return null;
};
