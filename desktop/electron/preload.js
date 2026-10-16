const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  reloadApp: () => ipcRenderer.send('app-reload'),
  quitApp: () => ipcRenderer.send('app-quit')
});
