import { electronApp, optimizer } from "@electron-toolkit/utils"
import { path as FfmpegPath } from "@ffmpeg-installer/ffmpeg"
import { path as FfprobePath } from "@ffprobe-installer/ffprobe"
import { Channel, SyncData } from "@packages/sync"
import { VueClass } from "@packages/vue-class"
import { VueClassMetadata } from "@packages/vue-class/metadata.ts"
import { app, BrowserWindow, ipcMain, net, Notification, protocol, session } from "electron"
import ffmpeg from "fluent-ffmpeg"
import * as process from "node:process"
import * as url from "node:url"
import "./ipc"
import { createWindow, RunningAnimal } from "./utility"
import "@main/services/data.service.ts"

// 设置FFmpeg可执行文件的路径
ffmpeg.setFfmpegPath(FfmpegPath)

// 设置FFprobe可执行文件的路径
ffmpeg.setFfprobePath(FfprobePath)

/**
 * 监听特定通道的消息，并同步发送到所有相关窗口。
 *
 * 此函数通过ipcMain监听指定通道的消息。当收到消息时，不仅会执行回调函数，
 * 还会将消息重新发送到所有窗口，但排除消息来源窗口。
 *
 * @param channel 消息通道名称，用于监听和发送消息。
 * @param cb 收到消息时执行的回调函数，参数为接收到的消息。
 */
SyncData.on = (channel, cb) => {
  ipcMain.on(channel, (_, args) => {
    cb(args)
    SyncData.emit(channel, args)
  })
}

/**
 * 向除指定窗口外的所有窗口发送消息。
 *
 * 此函数用于将消息发送到所有当前打开的浏览器窗口，但不会发送到消息来源的窗口。
 * 这是实现窗口间数据同步的一种方式。
 *
 * @param channel 消息通道名称，用于发送消息。
 * @param args 要发送的消息内容，包含消息来源窗口的ID等信息。
 */
SyncData.emit = (channel, args) => {
  BrowserWindow.getAllWindows().forEach((window) => {
    if (window.id === args.fromId) return
    window.webContents.send(channel, args)
  })
}

Channel.on = (channel, callback) => {
  ipcMain.on(channel, (_, args) => callback(args))
}

Channel.emit = (channel, data) => {
  const window = BrowserWindow.fromId(data.windowId)
  if (window) window.webContents.send(channel, data)
  else throw new Error("Unable to find window object corresponding to windowId " + data.windowId)
}

Channel.off = (channel) => {
  ipcMain.removeAllListeners(channel)
}

VueClassMetadata.ipcHandler = (channel, callback) => {
  ipcMain.handle(channel, (event, ...args) => callback(...args, event))
}

VueClassMetadata.listenIpc = (channel, callback: any) => {
  ipcMain.on(channel, (event, ...args) => callback(...args, event))
  return () => ipcMain.off(channel, callback)
}

VueClassMetadata.catchError = (e) => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) {
    window.webContents.send("error", e)
  } else {
    new Notification({ title: "Error", body: e.message }).show()
  }
  console.error(e)
}

// 加载所有已添加vue-class装饰器的类进容器
VueClass.load()

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron")

  /**
   * 创建并初始化一个正在奔跑的动物实例，在系统托盘展示它。
   * 这段代码首先实例化一个RunningAnimal对象，然后在初始化完成后展示这个动物。
   */

  // 实例化一个RunningAnimal对象
  const runningAnimal = new RunningAnimal()

  // 初始化RunningAnimal实例，完成后执行回调函数
  runningAnimal.init().then(() => {
    // 展示初始化完成的动物实例
    runningAnimal.show()
  })

  /**
   * 监听Web请求的头信息接收事件。
   * 在接收到头信息后，对此头信息进行修改，主要是添加或修改Content-Security-Policy头部。
   *
   * @param details 包含请求的详细信息，如请求URL、请求方法、响应头等。
   * @param callback 回调函数，用于返回修改后的响应头信息。
   */
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // 使用复制原有的响应头信息，并添加或修改Content-Security-Policy头部
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
    return net.fetch(url.pathToFileURL(decodeURI(path)).toString())
  })

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

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
