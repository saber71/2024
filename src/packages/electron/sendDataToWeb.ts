import type { TransferDataToRendererChannelMap } from "@packages/exposed"
import { BrowserWindow } from "electron"

export function sendDataToWeb<Channel extends keyof TransferDataToRendererChannelMap>(
  window: BrowserWindow | number | undefined | null,
  channel: Channel,
  args?: TransferDataToRendererChannelMap[Channel]
) {
  if (typeof window === "number") window = BrowserWindow.fromId(window)
  if (!window) throw new Error("window cannot be null")
  window.webContents.send(channel, args)
}
