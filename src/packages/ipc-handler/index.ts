import type { InvokeChannelMap } from "@packages/exposed"
import { ipcMain, type IpcMainInvokeEvent } from "electron"
import { dialog } from "electron"
import { getDecoratedName } from "@packages/dependency-injection"

type IpcHandlerInterface = {
  [Key in keyof InvokeChannelMap]: (
    e: IpcMainInvokeEvent,
    ...args: InvokeChannelMap[Key]["args"]
  ) => InvokeChannelMap[Key]["return"] | Promise<InvokeChannelMap[Key]["return"]>
}

const channels: Array<string> = []

function Handler() {
  return (target: any, name: any) => {
    name = getDecoratedName(name)
    channels.push(name)
  }
}

export class IpcHandler implements IpcHandlerInterface {
  static install() {
    const instance = new IpcHandler()
    for (let item of channels) {
      ipcMain.handle(item, (instance as any)[item].bind(instance))
    }
  }

  @Handler() ping(e: IpcMainInvokeEvent, ...args: InvokeChannelMap["ping"]["args"]) {
    console.log(...args)
  }

  @Handler()
  async showSaveDialog(
    e: IpcMainInvokeEvent,
    ...args: InvokeChannelMap["showSaveDialog"]["args"]
  ): Promise<InvokeChannelMap["showSaveDialog"]["return"]> {
    const option = args[0]
    const result = await dialog.showSaveDialog(option)
    return result.filePath
  }
}
