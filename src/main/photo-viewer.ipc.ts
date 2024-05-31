import { DataService } from "@main/data.service.ts"
import { Inject } from "@packages/dependency-injection"
import { createWindow, type ImageInfo, sendDataToWeb } from "@packages/electron"
import { Ipc, IpcHandler } from "@packages/vue-class"

export interface PhotoViewerInvokeChannelMap {
  "photo-viewer:open": {
    args: []
    return: void
  }
  "photo-viewer:getCurImageInfo": {
    args: []
    return: ImageInfo | undefined
  }
  "photo-viewer:getSlideImageInfos": {
    args: []
    return: ImageInfo[]
  }
  "photo-viewer:setCurImageInfo": {
    args: [ImageInfo | undefined]
    return: void
  }
  "photo-viewer:setSlideImageInfos": {
    args: [ImageInfo[]]
    return: void
  }
}

export interface PhotoViewerTransferDataToRendererChannelMap {
  "photo-viewer:transferCurImageInfo": ImageInfo | undefined
  "photo-viewer:transferSlideImageInfos": ImageInfo[]
}

@Ipc()
export class PhotoViewerIpc {
  @Inject() dataService: DataService

  @IpcHandler("photo-viewer:open") open() {
    // 如果窗口已存在，则使其获得焦点，不再创建新窗口
    if (this.dataService.photoViewerWindow) {
      this.dataService.photoViewerWindow.focus()
      return
    }
    // 创建一个新窗口用于显示照片，配置包括无边框、最大化、最小宽度和高度
    createWindow({ html: "photo-viewer", frame: false, maximize: true, minWidth: 900, minHeight: 670 }).then(
      (window) => {
        this.dataService.photoViewerWindow = window
        // 当窗口关闭时，重置photoWindow的引用，防止其泄露
        window.on("closed", () => (this.dataService.photoViewerWindow = undefined))
      }
    )
  }

  /**
   * 设置当前正在查看的图片信息。
   * 该方法通过接收图片信息，更新数据服务中的当前图片信息，并且如果图片查看器窗口已打开，
   * 则会将图片信息发送到Web端。
   *
   * @param info - 图片信息对象，如果当前没有图片则可以为undefined。
   */
  @IpcHandler("photo-viewer:setCurImageInfo") setCurImageInfo(info: ImageInfo | undefined) {
    this.dataService.photoViewerCurImageInfo = info // 更新数据服务中的当前图片信息
    if (this.dataService.photoViewerWindow) {
      sendDataToWeb(this.dataService.photoViewerWindow, "photo-viewer:transferCurImageInfo", info) // 如果图片查看器窗口已打开，发送图片信息到Web端
    }
  }

  /**
   * 设置幻灯片图片信息
   * @param infos 图片信息数组，包含多张图片的详细信息
   * 本函数会更新数据服务中的幻灯片图片信息，并将这些信息发送给相关的Web视图。
   */
  @IpcHandler("photo-viewer:setSlideImageInfos") setSlideImageInfos(infos: ImageInfo[]) {
    this.dataService.photoViewerSlideImageInfos = infos // 更新数据服务中的幻灯片图片信息
    if (this.dataService.photoViewerWindow) {
      sendDataToWeb(this.dataService.photoViewerWindow, "photo-viewer:transferSlideImageInfos", infos) // 如果存在相关Web视图，将图片信息发送给它
    }
  }
}
