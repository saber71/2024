import type { InvokeChannelMap } from "@packages/exposed"
import { ipcMain } from "electron"
import { dialog } from "electron"
import { getDecoratedName } from "@packages/dependency-injection"
import type { Class } from "@packages/common"

const channels: Array<{ methodName: string; clazz: Class }> = []

export function Handler(channelName?: keyof InvokeChannelMap) {
  return (target: any, name: any) => {
    name = channelName ?? getDecoratedName(name)
    channels.push({ clazz: target.constructor, methodName: name })
  }
}

export class IpcHandler {
  static install() {
    const instanceMap = new Map()
    for (let item of channels) {
      let instance = instanceMap.get(item.clazz)
      if (!instance) instanceMap.set(item.clazz, (instance = new item.clazz()))
      ipcMain.handle(item.methodName, (e, ...args) => (instance as any)[item.methodName](...args, e))
    }
  }

  @Handler() ping(...args: InvokeChannelMap["ping"]["args"]) {
    console.log(...args)
  }

  @Handler() async showSaveDialog(
    ...args: InvokeChannelMap["showSaveDialog"]["args"]
  ): Promise<InvokeChannelMap["showSaveDialog"]["return"]> {
    const option = args[0]
    const result = await dialog.showSaveDialog(option)
    return result.filePath
  }
}
