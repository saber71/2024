import { DataService } from "@main/data.service.ts"
import { isImageExtName, isVideoExtName } from "@packages/common"
import { Inject } from "@packages/dependency-injection"
import { createWindow, getImageInfo, type ImageInfo, sendDataToWeb } from "@packages/electron"
import type { FilterItem } from "@packages/filter"
import { Ipc, IpcHandler } from "@packages/vue-class"
import { app, BrowserWindow, dialog } from "electron"
import { promises } from "node:fs"
import { basename, extname } from "node:path"
import { join } from "path"

// 定义了一个目录的基本属性
export interface Directory {
  name: string //目录的名称
  path: string //目录的路径
}

interface Directories extends FilterItem {
  array: Directory[]
}

export interface PhotoInvokeChannelMap {
  /**
   * 打开照片应用或界面。
   * 无参数。
   * 无返回值。
   */
  "photo:open": {
    args: []
    return: void
  }

  /**
   * 打开系统对话框选择目录
   * 无参数
   * 无返回值
   */
  "photo:selectDirectory": {
    args: [] // 参数列表为空
    return: Directory | undefined // 选中的目录对象和缩略图，如果未选中则返回undefined
  }

  /**
   * 获取所有照片目录列表。
   * 无参数。
   * 返回 Directory 数组，表示所有可用的照片目录。
   */
  "photo:allDirectories": {
    args: []
    return: Directory[]
  }

  /**
   * 更新照片目录。
   * 参数：Directory 数组，表示要更新的目录路径。
   * 无返回值。
   */
  "photo:updateDirectories": {
    args: [Directory[]]
    return: void
  }

  /**
   * 读取指定目录中的图片。
   * 参数：Directory[] 类型，表示要读取图片的目录列表。
   * 无返回值，但会触发相应的图片加载操作。
   */
  "photo:readImages": {
    args: [Directory[]]
    return: void
  }

  /**
   * 获取目录缩略图
   *
   * @param args 目录数组，包含一系列目录信息
   * @return 返回一个字符串数组，包含缩略图的路径或标识
   */
  "photo:getDirectoryThumbnail": {
    args: [Directory[]] // 参数为一个目录数组
    return: string[] // 返回值为图片地址数组
  }
}

export interface PhotoTransferDataToRendererChannelMap {
  /**
   * 消息类型 "photo:transferImageInfo"，表示传输图片信息。
   * 参数是一个ImageInfo类型的数组，用于包含多个图片的详细信息。
   */
  "photo:transferImageInfo": ImageInfo[]

  /**
   * 消息类型 "photo:transferImageInfoEnd"，表示传输图片信息结束。
   * 此消息类型不接受任何参数。
   */
  "photo:transferImageInfoEnd": void
}

const ALL_DIRECTORIES = "photo:all_directories"

@Ipc()
export class PhotoIpc {
  /**
   * 通过@Inject装饰器注入DataService实例
   * 该注入操作主要用于依赖注入，使得在当前类中可以直接使用dataService实例来调用DataService提供的功能。
   */
  @Inject() dataService: DataService

  /**
   * 打开一个照片窗口。
   */
  @IpcHandler("photo:open") open() {
    // 如果照片窗口已存在，则使其获得焦点，不再创建新窗口
    if (this.dataService.photoWindow) {
      this.dataService.photoWindow.focus()
      return
    }
    // 创建一个新窗口用于显示照片，配置包括无边框、最大化、最小宽度和高度
    createWindow({ html: "photo", frame: false, maximize: true, minWidth: 900, minHeight: 670 }).then((window) => {
      this.dataService.photoWindow = window
      // 当窗口关闭时，重置photoWindow的引用，防止其泄露
      window.on("closed", () => (this.dataService.photoWindow = undefined))
    })
  }

  /**
   * 添加一个图片目录。
   * @param directories 图片目录的路径。
   */
  @IpcHandler("photo:updateDirectories")
  async updateDirectories(directories: Directory[]) {
    await this.dataService.collection.save<Directories>({
      _id: ALL_DIRECTORIES,
      array: directories
    })
  }

  /**
   * 处理选择目录的请求。
   * 该函数通过一个对话框让用户选择一个目录，然后返回该目录的信息
   */
  @IpcHandler("photo:selectDirectory")
  async selectDirectory(): Promise<PhotoInvokeChannelMap["photo:selectDirectory"]["return"]> {
    // 显示一个打开目录的对话框，并等待用户选择。
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    })

    // 如果用户选择了目录，则处理选择的目录。
    if (result.filePaths.length) {
      // 创建一个包含目录路径和名称的对象。
      return {
        path: result.filePaths[0],
        name: basename(result.filePaths[0])
      }
    }
  }

  /**
   * 获取所有图片目录。
   * @returns 返回目录列表。
   */
  @IpcHandler("photo:allDirectories")
  async allDirectories() {
    let data = await this.dataService.collection.getById<Directories>(ALL_DIRECTORIES)
    if (!data) {
      // 如果记录不存在，则创建一个包含图片路径的记录。
      const picturePath = app.getPath("pictures")
      const directoryName = basename(picturePath)
      const array = await this.dataService.collection.save<Directories>({
        array: [{ name: directoryName, path: picturePath }],
        _id: ALL_DIRECTORIES
      })
      data = array[0]
    }
    return data.array
  }

  /**
   * 读取指定目录中的所有图片信息。
   * @param directories 目录列表。
   * @param windowId 窗口ID。
   */
  @IpcHandler("photo:readImages")
  async allImage(directories: Directory[], windowId: number) {
    // 并行读取所有目录中的图片文件，然后发送图片信息到指定窗口。
    const result = (await getDirectoryImagePaths(directories)).flat()
    sendImageInfos(windowId, result)
  }

  /**
   * 处理获取目录缩略图的请求。
   * @param directories 目录数组，包含了需要获取缩略图的目录信息。
   * @returns 返回一个Promise，该Promise解析为一个字符串数组，包含目录中图片的路径。
   *          如果目录中没有图片，则对应位置返回空字符串。
   */
  @IpcHandler("photo:getDirectoryThumbnail")
  async getDirectoryThumbnail(directories: Directory[]) {
    // 获取目录中所有图片的路径
    const imagePaths = await getDirectoryImagePaths(directories)
    return Promise.all(
      imagePaths.map((paths) => {
        const firstPath = paths[0]
        // 如果目录中没有图片，则直接返回空字符串
        if (!firstPath) return ""
        // 获取第一个图片的详细信息，然后返回其路径
        return getImageInfo(firstPath).then((info) => info?.atomPath ?? "")
      })
    )
  }
}

/**
 * 获取指定目录中所有图片文件的路径。
 * @param directories 目录数组，每个目录包含一个路径属性。
 * @returns 返回一个Promise，该Promise解析为一个包含所有目录中图片文件路径的数组。
 */
function getDirectoryImagePaths(directories: Directory[]) {
  return Promise.all(
    directories.map((directory) =>
      promises.readdir(directory.path).then((files) =>
        // 过滤出目录中的图片文件并保留其完整路径。
        files
          .filter((path) => {
            // 过滤条件：仅保留有效的图片文件扩展名。
            const extName = extname(path).toLowerCase().slice(1)
            return isImageExtName(extName) || isVideoExtName(extName)
          })
          .map((path) => join(directory.path, path))
      )
    )
  )
}

/**
 * 异步发送图片信息到指定的浏览器窗口。
 * @param windowId 浏览器窗口的ID，用于定位目标窗口。
 * @param filePaths 图片文件的路径数组。
 * 函数会分批获取图片信息，并将信息发送到对应的浏览器窗口，最后发送结束信号。
 */
async function sendImageInfos(windowId: number, filePaths: string[]) {
  // 通过窗口ID获取浏览器窗口对象
  const window = BrowserWindow.fromId(windowId)
  // 如果找不到对应的窗口，则直接返回
  if (!window) return

  // 遍历文件路径数组，分批处理图片信息
  for (let i = 0; i < filePaths.length; ) {
    let j = i
    const promises: Promise<ImageInfo | undefined>[] = []

    // 每次处理最多10个文件的图片信息
    for (; j < i + 10 && j < filePaths.length; j++) {
      promises.push(getImageInfo(filePaths[j]))
    }

    // 等待所有图片信息获取的Promise完成
    const result = await Promise.all(promises)

    // 将获取到的图片信息（过滤掉未定义项）发送到Web视图
    sendDataToWeb(window, "photo:transferImageInfo", result.filter((item) => !!item) as ImageInfo[])

    // 更新循环索引，以便下一次循环能够继续从正确的位置开始
    i = j
  }

  // 发送图片信息发送结束的信号
  sendDataToWeb(window, "photo:transferImageInfoEnd")
}
