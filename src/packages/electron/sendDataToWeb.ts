import type { TransferDataToRendererChannelMap } from "@packages/exposed"
import type { BrowserWindow } from "electron"

export function sendDataToWeb<Channel extends keyof TransferDataToRendererChannelMap>(
  window: BrowserWindow,
  channel: Channel,
  args?: TransferDataToRendererChannelMap[Channel]
) {
  window.webContents.send(channel, args)
}
