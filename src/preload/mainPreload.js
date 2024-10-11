import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

window.$id = (id) => { return document.getElementById(id) }
window.$qs = (s) => { return document.querySelector(s) }
window.$qsa = (s) => { return document.querySelectorAll(s) }
window.mainLog = (s, hereLog = 0) => {
  ipcRenderer.send('log', s)
  if (hereLog == 1) console.log(s);
}

// Custom APIs for renderer
const api = {
  InspectAtMouse: (x, y) => {
    ipcRenderer.send('action', { name: 'inspect-at', data: { x, y } });
  },
  ipcAction: (actionName, data = {}) => {
    ipcRenderer.send('action', { name: actionName, data: data })
  },
  ipcGet: (dataName) => {
    ipcRenderer.send('get', dataName)
  }
}

document.addEventListener('mousedown', function (ev) {
  if (ev.ctrlKey && ev.altKey && !ev.shiftKey) {
    // ctrl + alt + Lclick = InspectElement
    api.InspectAtMouse(ev.clientX, ev.clientY)
  }
})

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


addEventListener("DOMContentLoaded", () => {


})