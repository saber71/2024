import type { InvokeChannelMap } from "@packages/exposed"
import { Handler } from "@packages/ipc-handler/decorator.ts"
import { dialog, type OpenDialogOptions, type SaveDialogOptions, shell } from "electron"
import fsExtra from "fs-extra"
import { promises } from "node:fs"
import { join } from "path"

export interface FsInvokeChannelMap {
  // 显示保存对话框
  "fs:showSaveDialog": {
    args: [SaveDialogOptions] // 参数为保存对话框选项
    return: string // 返回选定的文件路径
  }
  // 显示打开对话框
  "fs:showOpenDialog": {
    args: [OpenDialogOptions] // 参数为打开对话框选项
    return: string // 返回选定的文件路径
  }
  // 在文件夹中显示项目
  "fs:showItemInFolder": {
    args: [string] // 参数为文件项目的路径
    return: string // 返回操作结果描述
  }
  // 创建目录
  "fs:createDirectory": {
    args: [string, string] // 参数为父路径和新目录名
    return: string // 如果创建成功返回新目录的完整路径，失败则返回空字符串
  }
  "fs:copy": {
    args: [{ src: string[]; dest: string; overwriteAsSameName: boolean; recursive?: boolean }]
    return: PromiseSettledResult<void>[]
  }
  "fs:move": {
    args: [{ src: string[]; dest: string; overwriteAsSameName: boolean }]
    return: PromiseSettledResult<void>[]
  }
}

export class FsIpcHandler {
  /**
   * 处理器函数，用于在文件夹中显示指定的项目。
   * @param path 项目文件的路径，必须为字符串格式。
   * 该函数没有返回值。
   */
  @Handler("fs:showItemInFolder") showItemInFolder(path: string) {
    // 使用shell对象显示指定路径的文件夹中的项目
    shell.showItemInFolder(path)
  }

  /**
   * 处理 `fs:showSaveDialog` 频道的IPC事件，用于显示保存对话框。
   * @param args - 传递给 `fs:showSaveDialog` 方法的参数，第一个参数为对话框选项。
   * @returns 返回一个承诺，解析为 `dialog.showSaveDialog` 方法的返回值（文件路径）。
   */
  @Handler()
  async showSaveDialog(
    ...args: InvokeChannelMap["fs:showSaveDialog"]["args"]
  ): Promise<InvokeChannelMap["fs:showSaveDialog"]["return"]> {
    const option = args[0] // 提取对话框选项。
    const result = await dialog.showSaveDialog(option) // 显示保存对话框并等待结果。
    return result.filePath // 返回文件路径。
  }

  /**
   * 处理并显示打开文件对话框的请求。
   * @param option 包含打开对话框的配置选项，如初始路径、文件类型等。
   * @returns 返回一个Promise，该Promise解析为用户选择的文件路径数组。
   */
  @Handler("fs:showOpenDialog")
  async showOpenDialog(option: OpenDialogOptions) {
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
  @Handler("fs:createDirectory")
  async createDirectory(parentDirectory: string, newDirectoryName: string) {
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
   * 处理文件复制操作。
   * @param option 包含复制操作所需参数的对象，如源文件路径列表、目标文件路径和是否覆盖同名文件的选项。
   * @returns 返回一个Promise数组，每个元素表示一个复制操作的状态。
   */
  @Handler("fs:copy") async copy(option: FsInvokeChannelMap["fs:copy"]["args"][0]) {
    // 对每个源文件执行复制操作，并等待所有操作完成
    return await Promise.allSettled(
      option.src.map((src) =>
        fsExtra.copy(src, option.dest, { overwrite: option.overwriteAsSameName, recursive: option.recursive })
      )
    )
  }

  /**
   * 处理文件移动操作。
   * @param option 包含移动操作所需参数的对象，如源文件路径列表、目标文件路径和是否覆盖同名文件的选项。
   * @returns 返回一个Promise数组，每个元素表示一个移动操作的状态。
   */
  @Handler("fs:move") async move(option: FsInvokeChannelMap["fs:copy"]["args"][0]) {
    // 对每个源文件执行移动操作，并等待所有操作完成
    return await Promise.allSettled(
      option.src.map((src) => fsExtra.move(src, option.dest, { overwrite: option.overwriteAsSameName }))
    )
  }
}
