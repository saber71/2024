import type { electronAPI } from "@electron-toolkit/preload"
import type { PhotoInvokeChannelMap } from "@packages/ipc-handler/photo.ts"
import type { SaveDialogOptions } from "electron"

export interface InvokeChannelMap extends PhotoInvokeChannelMap {
  ping: {
    args: ["123", 1]
    return: void
  }
  showSaveDialog: {
    args: [SaveDialogOptions]
    return: string
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
