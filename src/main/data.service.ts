import { Collection } from "@packages/collection"
import type { ImageInfo } from "@packages/electron"
import { IpcHandler, Service, SyncData } from "@packages/vue-class"
import type { BrowserWindow } from "electron"

@Service()
export class DataService {
  // 创建一个名为"main"的集合，用于存储目录信息。
  readonly collection = new Collection("main")

  // 照片窗口的对象
  photoWindow?: BrowserWindow

  // 展示图片的窗口的对象
  photoViewerWindow?: BrowserWindow

  /**
   * 正在查看的图片信息
   * 用于处理从photo-viewer获取当前图片信息的IPC事件。
   * @IpcHandler("photo-viewer:getCurImageInfo") - 标记此属性为一个IPC处理器，当从photo-viewer接收到"getCurImageInfo"事件时，会调用此处理器。
   * @returns {ImageInfo} - 返回当前图片的详细信息
   */
  @IpcHandler("photo-viewer:getCurImageInfo") photoViewerCurImageInfo?: ImageInfo

  @IpcHandler("photo-viewer:getSlideImageInfos") photoViewerSlideImageInfos: ImageInfo[] = []

  readonly name = SyncData.create("name", "123")
}
