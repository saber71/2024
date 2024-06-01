import { extractFilePathFromAtomUrl, toAtomUrl } from "@packages/electron"
import type { InvokeChannelMap } from "@packages/exposed"
import { Ipc, IpcHandler } from "@packages/vue-class"
import clipboardFiles from "clipboard-files"
import { clipboard, dialog, type OpenDialogOptions, type SaveDialogOptions, shell } from "electron"
import fsExtra from "fs-extra"
import { promises } from "node:fs"
import { basename, dirname } from "node:path"
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
  /**
   * 复制文件或文件夹。
   * @param src 要复制的源文件或文件夹的路径数组。
   * @param dest 复制到的目标路径。
   * @param overwriteAsSameName 是否允许覆盖同名文件。
   * @param recursive 是否递归复制。如果指定路径为文件夹，此参数决定是否复制子目录。
   * @returns 返回一个Promise数组，包含每个复制操作的结果。
   */
  "fs:copy": {
    args: [{ src: string[]; dest: string; overwriteAsSameName: boolean; recursive?: boolean }]
    return: PromiseSettledResult<string>[]
  }
  /**
   * 移动文件或文件夹。
   * @param src 要移动的源文件或文件夹的路径数组。
   * @param dest 移动到的目标路径。
   * @param overwriteAsSameName 是否允许覆盖同名文件。
   * @returns 返回一个Promise数组，包含每个移动操作的结果。
   */
  "fs:move": {
    args: [{ src: string[]; dest: string; overwriteAsSameName: boolean }]
    return: PromiseSettledResult<string>[]
  }
  /**
   * 删除文件或目录
   *
   * @param args {string} 需要删除的文件或目录的路径
   * @return {string | undefined} 执行成功时返回undefined，失败时返回失败的原因。
   */
  "fs:rm": {
    args: [string]
    return: string | undefined
  }

  /**
   * 重命名文件或目录。
   * @param oldPath 原文件或目录的路径。
   * @return 返回新路径字符串。
   */
  "fs:rename": {
    args: [string, string] // 参数为一个旧路径, 一个新名字
    return: { filePath: string; atomPath: string; oldAtomPath: string } | Error // 返回值为新路径。
  }
  /**
   * 将指定内容复制到剪贴板。
   * @param {string} args - 需要复制到剪贴板的文本或数据。
   * @return {void} 无返回值。
   */
  "fs:copyIntoClipboard": {
    args: [string]
    return: void
  }
  /**
   * 将文件路径复制到剪贴板。
   * @param {string[]} args - 需要复制到剪贴板的文件路径。
   * @return {void} 无返回值。
   */
  "fs:copyFilesIntoClipboard": {
    args: [string[]]
    return: void
  }
}

@Ipc()
export class FsIpc {
  /**
   * 处理器函数，用于在文件夹中显示指定的项目。
   * @param path 项目文件的路径，必须为字符串格式。
   * 该函数没有返回值。
   */
  @IpcHandler("fs:showItemInFolder") showItemInFolder(path: string) {
    // 使用shell对象显示指定路径的文件夹中的项目
    shell.showItemInFolder(path)
  }

  /**
   * 处理 `fs:showSaveDialog` 频道的IPC事件，用于显示保存对话框。
   * @param args - 传递给 `fs:showSaveDialog` 方法的参数，第一个参数为对话框选项。
   * @returns 返回一个承诺，解析为 `dialog.showSaveDialog` 方法的返回值（文件路径）。
   */
  @IpcHandler("fs:showSaveDialog")
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
  @IpcHandler("fs:showOpenDialog")
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
  @IpcHandler("fs:createDirectory")
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
  @IpcHandler("fs:copy") async copy(option: FsInvokeChannelMap["fs:copy"]["args"][0]) {
    // 对每个源文件执行复制操作，并等待所有操作完成
    return await Promise.allSettled(
      option.src.map(async (src) => {
        src = extractFilePathFromAtomUrl(src)
        const dest = changePath(src, option.dest)
        await fsExtra.copy(extractFilePathFromAtomUrl(src), dest, {
          overwrite: option.overwriteAsSameName,
          recursive: option.recursive
        })
        return toAtomUrl(dest)
      })
    )
  }

  /**
   * 处理文件移动操作。
   * @param option 包含移动操作所需参数的对象，如源文件路径列表、目标文件路径和是否覆盖同名文件的选项。
   * @returns 返回一个Promise数组，每个元素表示一个移动操作的状态。
   */
  @IpcHandler("fs:move") async move(option: FsInvokeChannelMap["fs:copy"]["args"][0]) {
    // 对每个源文件执行移动操作，并等待所有操作完成
    return await Promise.allSettled(
      option.src.map(async (src) => {
        src = extractFilePathFromAtomUrl(src)
        const dest = changePath(src, option.dest)
        await fsExtra.move(src, dest, { overwrite: option.overwriteAsSameName })
        return toAtomUrl(dest)
      })
    )
  }

  /**
   * 从文件系统中删除指定路径的文件或目录。
   * @param path 要删除的文件或目录的路径。
   * @returns 返回一个Promise，若删除成功则解析为undefined，若删除失败则解析为错误信息字符串。
   */
  @IpcHandler("fs:rm") async rm(path: string) {
    // 使用fsExtra的rm方法递归删除指定路径，捕获任何异常并返回异常信息
    try {
      return await fsExtra.rm(path, { recursive: true })
    } catch (e) {
      return (e as Error).message
    }
  }

  /**
   * 重命名文件或目录。
   * @param oldPath 原文件或目录的路径，可以为Atom URL格式，需要转换为真实路径。
   * @param newName 新的文件或目录名。
   * @returns 返回新的文件或目录路径。
   */
  @IpcHandler("fs:rename") async rename(oldPath: string, newName: string) {
    const oldAtomPath = toAtomUrl(oldPath)
    // 从Atom URL格式的路径中提取真实的文件路径
    oldPath = extractFilePathFromAtomUrl(oldPath)
    // 构造新的文件或目录路径
    const newPath = join(dirname(oldPath), newName)
    try {
      // 执行重命名操作
      await fsExtra.rename(oldPath, newPath)
      // 返回新的路径
      return { filePath: newPath, atomPath: toAtomUrl(newPath), oldAtomPath }
    } catch (e) {
      return e
    }
  }

  @IpcHandler("fs:copyIntoClipboard") copyIntoClipboard(arg: string) {
    clipboard.writeText(arg, "clipboard")
  }

  @IpcHandler("fs:copyFilesIntoClipboard") copyFilesIntoClipboard(filePaths: string[]) {
    clipboardFiles.writeFiles(filePaths)
  }
}

function changePath(src: string, dst: string) {
  const srcName = basename(extractFilePathFromAtomUrl(src))
  return join(dst, srcName)
}
