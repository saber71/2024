import { DataService, WindowService } from "@main/services"
import { getImageInfo, type ImageInfo, sendDataToWeb } from "@main/utility"
import { isImageExtName, isVideoExtName } from "@packages/common"
import { Inject } from "@packages/dependency-injection"
import { Ipc, IpcHandler } from "@packages/vue-class"
import { app, BrowserWindow, dialog } from "electron"
import electronPosPrinter from "electron-pos-printer"
import { promises } from "node:fs"
import { basename, extname } from "node:path"
import { join } from "path"

const { PosPrinter } = electronPosPrinter

// 定义了一个目录的基本属性
export interface Directory {
  name: string //目录的名称
  path: string //目录的路径
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
   * 查询所有收藏的照片。
   *
   * 该函数不接受任何参数。
   * 返回一个字符串数组，包含所有收藏照片的atomPath。
   */
  "photo:allFavorites": {
    args: []
    return: string[]
  }

  /**
   * 更新用户的照片收藏。
   *
   * 该函数接受一个字符串数组作为参数。
   * 参数中的每个字符串代表一个照片的atomPath，用于指定要存储的收藏照片。
   * 函数执行成功后不返回任何值。
   */
  "photo:updateFavorites": {
    args: [string[]]
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

  "photo:print": {
    args: [string]
    return: void
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
const ALL_FAVORITE = "photo:all_favorites"

@Ipc()
export class PhotoIpc {
  @Inject() dataService: DataService
  @Inject() windowService: WindowService

  /**
   * 打开一个照片窗口。
   */
  @IpcHandler("photo:open")
  async open() {
    await this.windowService.open({ html: "photo", frame: false, maximize: true, minWidth: 900, minHeight: 670 })
  }

  /**
   * 更新所有收藏的照片路径。
   * 通过这个函数，可以保存用户的收藏列表，以便后续访问。
   *
   * @param atomPaths 收藏照片的路径列表。
   */
  @IpcHandler("photo:updateFavorites")
  async updateFavorites(atomPaths: string[]) {
    await this.dataService.set<string[]>(ALL_FAVORITE, atomPaths)
  }

  /**
   * 获取所有收藏的照片路径。
   * 这个函数用于检索用户当前的所有收藏照片路径，如果尚未保存过收藏列表，则创建一个新的空列表。
   *
   * @returns 所有收藏照片的路径数组。
   */
  @IpcHandler("photo:allFavorites")
  async allFavorites() {
    let data = await this.dataService.get<string[]>(ALL_FAVORITE)
    if (!data) {
      // 如果记录不存在，则创建一个
      data = await this.dataService.set<string[]>(ALL_FAVORITE, [])
    }
    return data
  }

  /**
   * 添加一个图片目录。
   * @param directories 图片目录的路径。
   */
  @IpcHandler("photo:updateDirectories")
  async updateDirectories(directories: Directory[]) {
    await this.dataService.set<Directory[]>(ALL_DIRECTORIES, directories)
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
    let data = await this.dataService.get<Directory[]>(ALL_DIRECTORIES)
    if (!data) {
      // 如果记录不存在，则创建一个包含图片路径的记录。
      const picturePath = app.getPath("pictures")
      const directoryName = basename(picturePath)
      data = await this.dataService.set<Directory[]>(ALL_DIRECTORIES, [{ name: directoryName, path: picturePath }])
    }
    return data
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

  @IpcHandler("photo:print") print(imageFilePath: string) {
    PosPrinter.print(
      [
        {
          type: "image",
          path: imageFilePath,
          position: "center"
        }
      ],
      { boolean: undefined }
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
