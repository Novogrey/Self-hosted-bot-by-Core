const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('coreBot', {
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (env) => ipcRenderer.invoke('config:save', env),
  loadCommands: () => ipcRenderer.invoke('commands:load'),
  startBot: () => ipcRenderer.invoke('bot:start'),
  stopBot: () => ipcRenderer.invoke('bot:stop'),
  emergencyStop: () => ipcRenderer.invoke('bot:emergencyStop'),
  restartBot: () => ipcRenderer.invoke('bot:restart'),
  getStatus: () => ipcRenderer.invoke('bot:status'),
  chooseDatabase: () => ipcRenderer.invoke('dialog:chooseDatabase'),
  chooseJson: () => ipcRenderer.invoke('dialog:chooseJson'),
  exportHosting: (env) => ipcRenderer.invoke('hosting:export', env),
  setupScamTrapChannel: (env) => ipcRenderer.invoke('scamTrap:setupChannel', env),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  onLogLine: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('log:line', listener);
    return () => ipcRenderer.removeListener('log:line', listener);
  },
  onStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('bot:status', listener);
    return () => ipcRenderer.removeListener('bot:status', listener);
  }
});
