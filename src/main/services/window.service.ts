import { mainEventBus } from "@main/eventBus.ts"
import { createWindow, type CreateWindowOptions } from "@main/utility"
import { Service } from "@packages/vue-class"
import type { BrowserWindow } from "electron"

/**
 * `WindowService` 类用于管理应用程序的窗口。
 * 它使用一个映射来跟踪已创建的窗口，以确保相同的HTML内容只创建一个窗口。
 * 提供异步的窗口打开方法，如果窗口已存在，则激活现有窗口；否则，创建新窗口。
 */
@Service()
export class WindowService {
  /**
   * 使用HTML内容作为键，存储已创建的窗口实例的映射。
   * 这样做的目的是为了确保相同的HTML内容只创建一个窗口。
   */
  private readonly _map = new Map<CreateWindowOptions["html"], BrowserWindow>()

  getWindow(key: CreateWindowOptions["html"]) {
    return this._map.get(key)
  }

  /**
   * 根据提供的选项异步打开一个窗口。
   * 如果已存在具有相同HTML内容的窗口，则激活该窗口；否则，创建并显示一个新窗口。
   * @param option 创建窗口的选项，包括HTML内容等。
   */
  async open(option: CreateWindowOptions) {
    const { html } = option
    // 检查是否已存在相同HTML内容的窗口
    if (this._map.has(html)) {
      const win = this._map.get(html)!
      // 如果存在，显示并聚焦到该窗口
      win.show()
      win.focus()
      return win
    } else {
      // 如果不存在，创建一个新窗口
      const win = await createWindow(option)
      this._map.set(html, win)
      mainEventBus.emit("onCreateWindow", html)
      // 在窗口关闭时，从映射中删除对应的条目
      win.on("closed", () => {
        this._map.delete(html)
        mainEventBus.emit("onWindowClosed", html)
      })
      return win
    }
  }
}
