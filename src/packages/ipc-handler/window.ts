import { Handler } from "@packages/ipc-handler/decorator.ts"
import { BrowserWindow } from "electron"

export interface WindowInvokeChannelMap {
  // 获取窗口ID
  "window:id": {
    args: [] // 无参数
    return: number // 返回窗口ID
  }
  // 检查窗口是否最大化
  "window:isMaximized": {
    args: [] // 无参数
    return: boolean // 返回窗口是否最大化
  }
  // 最大化窗口
  "window:maximize": {
    args: [] // 无参数
    return: void // 无返回值
  }
  // 恢复窗口大小
  "window:unmaximize": {
    args: [] // 无参数
    return: void // 无返回值
  }
  // 最小化窗口
  "window:minimize": {
    args: [] // 无参数
    return: void // 无返回值
  }
  // 关闭窗口
  "window:close": {
    args: [] // 无参数
    return: void // 无返回值
  }
}

export class WindowIpcHandler {
  /**
   * 处理 `window:maximize` 频道的IPC事件，用于最大化窗口。
   * @param id - 窗口的ID。
   */
  @Handler("window:maximize") windowMaximize(id: number) {
    BrowserWindow.fromId(id)?.maximize() // 尝试最大化指定ID的窗口。
  }

  /**
   * 处理 `window:unmaximize` 频道的IPC事件，用于取消最大化窗口。
   * @param id - 窗口的ID。
   */
  @Handler("window:unmaximize") windowUnmaximize(id: number) {
    BrowserWindow.fromId(id)?.unmaximize() // 尝试取消最大化指定ID的窗口。
  }

  /**
   * 处理 `window:minimize` 频道的IPC事件，用于最小化窗口。
   * @param id - 窗口的ID。
   */
  @Handler("window:minimize") windowMinimize(id: number) {
    BrowserWindow.fromId(id)?.minimize() // 尝试最小化指定ID的窗口。
  }

  /**
   * 处理 `window:close` 频道的IPC事件，用于关闭窗口。
   * @param id - 窗口的ID。
   */
  @Handler("window:close") windowClose(id: number) {
    BrowserWindow.fromId(id)?.close() // 尝试关闭指定ID的窗口。
  }

  /**
   * 处理查询窗口是否最大化的方法。
   * @param id 窗口的ID，用于标识要查询的浏览器窗口。
   * @returns 返回一个布尔值，如果窗口被最大化，则为true；否则为false。
   */
  @Handler("window:isMaximized") getWindowIsMaximized(id: number) {
    // 通过窗口ID查询浏览器窗口，并检查该窗口是否被最大化。
    return BrowserWindow.fromId(id)?.isMaximized() ?? false
  }
}
