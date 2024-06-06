import type { FsInvokeChannelMap } from "./fs.ipc.ts"
import type { PhotoInvokeChannelMap, PhotoTransferDataToRendererChannelMap } from "./photo.ipc.ts"
import type { WindowInvokeChannelMap } from "./window.ipc.ts"

export * from "./fs.ipc"
export * from "./photo.ipc"
export * from "./ping.ipc"
export * from "./window.ipc"

/**
 * 定义了一组channel映射，用于规范不同操作的参数和返回值。
 */
export interface IpcInvokeChannelMap extends PhotoInvokeChannelMap, FsInvokeChannelMap, WindowInvokeChannelMap {
  ping: {
    args: ["123", 1]
    return: void
  }
}

// 定义一组用于向渲染进程传输数据的channel映射
export interface TransferDataChannelMap extends PhotoTransferDataToRendererChannelMap {
  "window:isMaximized": boolean
  "window:isShow": boolean
  "window:isFocus": boolean
  "window:isFullscreen": boolean
  "window:size": [number, number]
}
