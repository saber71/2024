import type { electronAPI } from "@electron-toolkit/preload"
import type { IpcInvokeChannelMap, TransferDataChannelMap } from "@main/ipc"

export interface TransferDataToMainChannelMap {
  ping: number
}

export interface TransferDataToRendererChannelMap extends TransferDataChannelMap {}

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
