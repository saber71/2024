import { electronApp, optimizer } from "@electron-toolkit/utils"
import { path as FfmpegPath } from "@ffmpeg-installer/ffmpeg"
import { path as FfprobePath } from "@ffprobe-installer/ffprobe"
import { createWindow } from "@packages/electron"
import { IpcHandler } from "@packages/ipc-handler"
import { app, BrowserWindow, net, protocol, session } from "electron"
import ffmpeg from "fluent-ffmpeg"
import * as url from "node:url"

ffmpeg.setFfmpegPath(FfmpegPath)
ffmpeg.setFfprobePath(FfprobePath)

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron")

  /**
   * 监听Web请求的头信息接收事件。
   * 在接收到头信息后，对此头信息进行修改，主要是添加或修改Content-Security-Policy头部。
   *
   * @param details 包含请求的详细信息，如请求URL、请求方法、响应头等。
   * @param callback 回调函数，用于返回修改后的响应头信息。
   */
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // 使用扩展运算符复制原有的响应头信息，并添加或修改Content-Security-Policy头部
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": `default-src 'self' 'unsafe-eval'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: atom:`
      }
    })
  })

  /**
   * 处理自定义协议请求。atom协议用于处理本地文件请求。
   * @param protocol 协议处理对象，负责根据请求类型进行相应的处理。
   * @param request 请求对象，包含需要处理的URL信息。
   * @returns 返回一个Promise对象，该Promise最终解析为网络请求的结果。
   */
  protocol.handle("atom", (request) => {
    // 从请求URL中截取文件路径
    const filePath = request.url.slice("atom://".length)
    // 将文件路径转换为文件URL，并发起网络请求获取内容
    const path = process.platform === "win32" ? filePath[0] + ":" + filePath.substring(1) : filePath
    return net.fetch(url.pathToFileURL(path).toString())
  })

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 注册和初始化ipc事件
  IpcHandler.install()

  // 创建首屏窗口
  createIndexWindow()

  app.on("activate", function () {
    // On macOS, it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createIndexWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

/**
 * 创建一个无边框的首屏窗口，并在窗口关闭时退出应用程序。
 */
function createIndexWindow() {
  // 创建一个首页和无边框的窗口
  createWindow({ html: "index", frame: false }).then((window) => {
    // 当此窗口被关闭时，触发应用程序退出
    window.on("closed", () => app.exit())
  })
}
