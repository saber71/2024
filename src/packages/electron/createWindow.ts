import { is } from "@electron-toolkit/utils"
import { deepAssign } from "@packages/common"
import { sendToWeb } from "@packages/electron/sendToWeb.ts"
import { BrowserWindow, type BrowserWindowConstructorOptions, shell } from "electron"
import { join } from "path"
import icon from "../../../resources/icon.png"

export interface CreateWindowOptions extends BrowserWindowConstructorOptions {
  html: "index" | "photo"
  maximize?: boolean
}

/**
 * 创建一个新的BrowserWindow，并根据提供的选项进行配置。
 * @param options 创建窗口的配置选项，继承自BrowserWindowConstructorOptions并包括html和maximize选项。
 * @returns 返回一个Promise，该Promise在窗口准备显示时解析为创建的BrowserWindow实例。
 */
export function createWindow(options: CreateWindowOptions) {
  return new Promise<BrowserWindow>((resolve) => {
    // 配置基础的浏览器窗口选项，并根据平台和提供的选项进行深度合并。
    const window = new BrowserWindow(
      deepAssign(
        {
          width: 900,
          height: 670,
          show: false,
          autoHideMenuBar: true,
          ...(process.platform === "linux" ? { icon } : {}),
          webPreferences: {
            preload: join(__dirname, "../preload/index.mjs"),
            sandbox: false
          }
        },
        options
      )
    )

    // 通过ipc事件向页面发送其所属窗口id
    window.webContents.ipc.handle("window:id", () => window.id)

    // 当浏览器窗口大小发生改变时，会将当前窗口的大小信息发送到渲染进程
    window.on("resize", () => sendToWeb(window, "window:size", window.getSize() as any))

    // 监听窗口的最大化和取消最大化事件，向渲染进程发送当前状态。
    window.on("maximize", () => sendToWeb(window, "window:isMaximized", window.isMaximized()))
    window.on("unmaximize", () => sendToWeb(window, "window:isMaximized", window.isMaximized()))

    // 监听窗口的全屏事件，向渲染进程发送当前状态。
    window.on("enter-full-screen", () => sendToWeb(window, "window:isFullscreen", true))
    window.on("leave-full-screen", () => sendToWeb(window, "window:isFullscreen", false))

    // 监听窗口的显示和隐藏事件，向渲染进程发送当前状态。
    window.on("show", () => sendToWeb(window, "window:isShow", true))
    window.on("hide", () => sendToWeb(window, "window:isShow", false))

    // 监听窗口的聚焦和失焦事件，向渲染进程发送当前状态。
    window.on("focus", () => sendToWeb(window, "window:isFocus", true))
    window.on("blur", () => sendToWeb(window, "window:isFocus", false))

    // 当窗口准备好显示时，根据选项决定是最大化窗口还是直接显示，并解决Promise。
    window.on("ready-to-show", () => {
      if (options.maximize) window.maximize()
      else window.show()
      resolve(window)
    })

    // 设置窗口打开处理器，用于处理外部链接的打开。
    window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: "deny" }
    })

    // 热模块替换(HMR)相关配置，根据环境加载远程URL或本地HTML文件。
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      window.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}${("/" + options.html).repeat(2)}.html`)
    } else {
      window.loadFile(join(__dirname, `../renderer/${options.html}/${options.html}.html`))
    }
  })
}
