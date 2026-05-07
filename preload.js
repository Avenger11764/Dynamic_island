const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
