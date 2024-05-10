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
