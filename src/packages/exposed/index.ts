import type { electronAPI } from "@electron-toolkit/preload"
import type { PhotoInvokeChannelMap, PhotoSendChannelMap } from "@packages/ipc-handler/photo.ts"
import type { OpenDialogOptions, SaveDialogOptions } from "electron"

export interface SendChannelMap extends PhotoSendChannelMap {
  sendWindowId: number
  "window:isMaximized": boolean
  "window:isShow": boolean
  "window:isFocus": boolean
  "window:size": [number, number]
}

export interface InvokeChannelMap extends PhotoInvokeChannelMap {
  ping: {
    args: ["123", 1]
    return: void
  }
  showSaveDialog: {
    args: [SaveDialogOptions]
    return: string
  }
  showOpenDialog: {
    args: [OpenDialogOptions]
    return: string
  }
  showItemInFolder: {
    args: [string]
    return: string
  }
  "window:id": {
    args: []
    return: number
  }
  "window:isMaximized": {
    args: []
    return: boolean
  }
  "window:maximize": {
    args: []
    return: void
  }
  "window:unmaximize": {
    args: []
    return: void
  }
  "window:minimize": {
    args: []
    return: void
  }
  "window:close": {
    args: []
    return: void
  }
}

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
