import type { InvokeChannelMap } from "@packages/exposed"
import { BrowserWindow, dialog, ipcMain } from "electron"
import { channels, Handler } from "./handler.ts"
import "./photo.ts"

export class IpcHandler {
  static install() {
    const instanceMap = new Map()
    for (let item of channels) {
      let instance = instanceMap.get(item.clazz)
      if (!instance) instanceMap.set(item.clazz, (instance = new item.clazz()))
      ipcMain.handle(item.channel, (e, ...args) => (instance as any)[item.methodName](...args, e))
    }
  }

  @Handler() ping(...args: InvokeChannelMap["ping"]["args"]) {
    console.log(...args)
  }

  @Handler()
  async showSaveDialog(
    ...args: InvokeChannelMap["showSaveDialog"]["args"]
  ): Promise<InvokeChannelMap["showSaveDialog"]["return"]> {
    const option = args[0]
    const result = await dialog.showSaveDialog(option)
    return result.filePath
  }

  @Handler("window:maximize") windowMaximize(id: number) {
    BrowserWindow.fromId(id)?.maximize()
  }

  @Handler("window:unmaximize") windowUnmaximize(id: number) {
    BrowserWindow.fromId(id)?.unmaximize()
  }

  @Handler("window:minimize") windowMinimize(id: number) {
    BrowserWindow.fromId(id)?.minimize()
  }

  @Handler("window:close") windowClose(id: number) {
    BrowserWindow.fromId(id)?.close()
  }
}
