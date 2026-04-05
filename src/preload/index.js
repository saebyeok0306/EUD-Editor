import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  openScx: () => ipcRenderer.invoke('dialog:openScx'),
  onLanguageChanged: (callback) => {
    const listener = (_event, lang) => callback(lang)
    ipcRenderer.on('language-changed', listener)
    return () => ipcRenderer.removeListener('language-changed', listener)
  },
  getStarcraftPath: () => ipcRenderer.invoke('starcraft:getPath'),
  selectStarcraftFolder: () => ipcRenderer.invoke('starcraft:selectFolder'),
  extractStarcraftGraphics: (path) => ipcRenderer.invoke('starcraft:extract', path),
  getStarcraftFile: (path, fileName) => ipcRenderer.invoke('starcraft:getFile', path, fileName),
  listStarcraftFiles: (path, mask) => ipcRenderer.invoke('starcraft:listFiles', path, mask),
  onExtractProgress: (callback) => {
    const listener = (_event, progress) => callback(progress)
    ipcRenderer.on('starcraft:extract-progress', listener)
    return () => ipcRenderer.removeListener('starcraft:extract-progress', listener)
  },
  readLocalPalette: (filename) => ipcRenderer.invoke('app:readLocalPalette', filename),
  getDatapackFile: (internalPath) => ipcRenderer.invoke('app:getDatapackFile', internalPath),
  readImagesTbl: () => ipcRenderer.invoke('app:readImagesTbl'),
  saveUnitPreview: (unitId, dataUrl) => ipcRenderer.invoke('app:saveUnitPreview', { unitId, dataUrl }),
  getUnitPreviewUrl: (unitId) => ipcRenderer.invoke('app:getUnitPreviewUrl', unitId),
  saveImagePreview: (imageId, dataUrl) => ipcRenderer.invoke('app:saveImagePreview', { imageId, dataUrl }),
  getImagePreviewUrl: (imageId) => ipcRenderer.invoke('app:getImagePreviewUrl', imageId),
  getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath'),
  resetWindowSize: () => ipcRenderer.send('window:resetSize'),
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  deleteSettings: () => ipcRenderer.invoke('app:deleteSettings'),
  deleteDatapack: () => ipcRenderer.invoke('app:deleteDatapack')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
