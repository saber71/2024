import type { InvokeChannelMap } from "@packages/exposed"
import { BrowserWindow, dialog, ipcMain, type OpenDialogOptions, shell } from "electron"
import { promises } from "node:fs"
import { join } from "path"
import { channels, Handler } from "./handler.ts"
import "./photo.ts"

/**
 * `IpcHandler` 类用于安装和处理IPC（Inter-Process Communication）事件。
 * 该类提供了多个方法来处理不同的IPC频道事件，例如 `ping`，`showSaveDialog`等。
 */
export class IpcHandler {
  /**
   * 在静态方法 `install` 中，通过遍历 `channels` 数组来安装所有的IPC处理器。
   * 对于每个频道，它将创建一个实例（如果尚未创建），并为该频道绑定相应的事件处理函数。
   */
  static install() {
    const instanceMap = new Map() // 创建一个映射，用于存储处理器实例。
    for (let item of channels) {
      // 遍历所有通道配置项。
      let instance = instanceMap.get(item.clazz) // 尝试获取当前通道对应的实例。
      if (!instance) instanceMap.set(item.clazz, (instance = new item.clazz())) // 如果实例不存在，则创建并存储一个新实例。
      ipcMain.handle(item.channel, (e, ...args) => (instance as any)[item.methodName](...args, e)) // 绑定事件处理函数。
    }
  }

  /**
   * 处理 `ping` 频道的IPC事件。
   * @param args - 传递给 `ping` 方法的参数。
   */
  @Handler() ping(...args: InvokeChannelMap["ping"]["args"]) {
    console.log(...args) // 在控制台日志中输出传入的参数。
  }

  /**
   * 处理器函数，用于在文件夹中显示指定的项目。
   * @param path 项目文件的路径，必须为字符串格式。
   * 该函数没有返回值。
   */
  @Handler("showItemInFolder") showItemInFolder(path: string) {
    // 使用shell对象显示指定路径的文件夹中的项目
    shell.showItemInFolder(path)
  }

  /**
   * 处理 `showSaveDialog` 频道的IPC事件，用于显示保存对话框。
   * @param args - 传递给 `showSaveDialog` 方法的参数，第一个参数为对话框选项。
   * @returns 返回一个承诺，解析为 `dialog.showSaveDialog` 方法的返回值（文件路径）。
   */
  @Handler()
  async showSaveDialog(
    ...args: InvokeChannelMap["showSaveDialog"]["args"]
  ): Promise<InvokeChannelMap["showSaveDialog"]["return"]> {
    const option = args[0] // 提取对话框选项。
    const result = await dialog.showSaveDialog(option) // 显示保存对话框并等待结果。
    return result.filePath // 返回文件路径。
  }

  /**
   * 处理并显示打开文件对话框的请求。
   * @param option 包含打开对话框的配置选项，如初始路径、文件类型等。
   * @returns 返回一个Promise，该Promise解析为用户选择的文件路径数组。
   */
  @Handler("showOpenDialog") async showOpenDialog(option: OpenDialogOptions) {
    // 使用dialog模块显示打开文件的对话框，并等待用户进行选择
    const result = await dialog.showOpenDialog(option)
    // 返回用户选择的文件路径数组
    return result.filePaths
  }

  /**
   * 创建一个新的目录。
   *
   * @param parentDirectory 指定新目录的父目录路径。
   * @param newDirectoryName 指定要创建的新目录的名称。
   * @returns 如果目录创建成功则返回新目录的完整路径，否则为空字符串。
   */
  @Handler("createDirectory") async createDirectory(parentDirectory: string, newDirectoryName: string) {
    try {
      const path = join(parentDirectory, newDirectoryName)
      // 尝试使用 promises.mkdir 方法创建目录
      await promises.mkdir(path)
      return path
    } catch {
      // 如果创建目录过程中发生异常，则返回空字符串
      return ""
    }
  }

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
