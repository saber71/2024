import type { electronAPI } from "@electron-toolkit/preload"
import type { IpcInvokeChannelMap } from "@packages/ipc-handler"
import type { PhotoSendChannelMap } from "@packages/ipc-handler/photo.ts"

export interface SendChannelMap extends PhotoSendChannelMap {
  sendWindowId: number
  "window:isMaximized": boolean
  "window:isShow": boolean
  "window:isFocus": boolean
  "window:isFullscreen": boolean
  "window:size": [number, number]
}

export interface InvokeChannelMap extends IpcInvokeChannelMap {}

interface Api {
  invoke<Channel extends keyof InvokeChannelMap>(
    channel: Channel,
    ...args: InvokeChannelMap[Channel]["args"]
  ): Promise<InvokeChannelMap[Channel]["return"]>
}

export interface Exposed {
  readonly api: Api
  readonly electronApi: typeof electronAPI
}
