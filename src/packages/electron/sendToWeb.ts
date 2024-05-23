import type { SendChannelMap } from "@packages/exposed"
import type { BrowserWindow } from "electron"

export function sendToWeb<Channel extends keyof SendChannelMap>(
  window: BrowserWindow,
  channel: Channel,
  ...args: SendChannelMap[Channel]
) {
  window.webContents.send(channel, ...args)
}
