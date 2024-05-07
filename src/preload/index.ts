import { electronAPI } from "@electron-toolkit/preload"
import type { Exposed } from "@packages/exposed"
import { contextBridge } from "electron"

// Custom APIs for renderer
export const api: Exposed["api"] = {
  invoke(channel: string, ...args: any): Promise<any> {
    return electronAPI.ipcRenderer.invoke(channel, ...(args as any))
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", electronAPI)
    contextBridge.exposeInMainWorld("api", api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electronAPI = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
