import type { electronAPI } from "@electron-toolkit/preload"
import type { SaveDialogOptions } from "electron"

export interface InvokeChannelMap {
  ping: {
    args: ["123", 1]
    return: void
  }
  showSaveDialog: {
    args: [SaveDialogOptions]
    return: string
  }
  openPhoto: {
    args: []
    return: void
  }
  "window:maximize": {
    args: []
    return: void
  }
  "window:isMaximize": {
    args: []
    return: boolean
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
