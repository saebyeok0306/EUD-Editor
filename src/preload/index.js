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
