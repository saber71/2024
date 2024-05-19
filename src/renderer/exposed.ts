import type { IpcRendererListener } from "@electron-toolkit/preload"
import type { Exposed } from "@packages/exposed"
import { ref, type Ref, type UnwrapRef } from "vue"

export const exposed: Exposed = window as any

const electronApi = exposed.electronApi ?? {
  ipcRenderer: {
    on(channel: string, listener: IpcRendererListener) {},
    once(channel: string, listener: IpcRendererListener) {}
  }
}

const receiveWindowIdPromise = new Promise<number>((resolve) => {
  electronApi.ipcRenderer.once("sendWindowId", (_, id: number) => resolve(id))
})

export const api = exposed.api ?? {
  invoke: (await import("@packages/ipc-handler/mock.ts")).MockIpcHandler.install()
}

export const invoke: Exposed["api"]["invoke"] = async (...args: any[]) => {
  return (api.invoke as any)(...args, await receiveWindowIdPromise)
}

function hook<Value>(eventName: string, initValue: Value): Ref<UnwrapRef<Value>> {
  const result = ref(initValue)
  electronApi.ipcRenderer.on(eventName, (_, value) => (result.value = value))
  return result
}

export const windowInfo = Object.freeze({
  isShow: hook("isShow", true),
  isMaximize: hook("isMaximized", false),
  isFocus: hook("isFocus", false),
  id: receiveWindowIdPromise
})
