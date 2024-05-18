import { is } from "@electron-toolkit/utils"
import { deepAssign } from "@packages/common"
import { BrowserWindow, type BrowserWindowConstructorOptions, shell } from "electron"
import { join } from "path"
import icon from "../../../resources/icon.png"

export interface CreateWindowOptions extends BrowserWindowConstructorOptions {
  html: "index" | "photo"
  maximize?: boolean
}

export function createWindow(options: CreateWindowOptions) {
  return new Promise<BrowserWindow>((resolve) => {
    // Create the browser window.
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

    window.webContents.once("did-finish-load", () => window.webContents.send("sendWindowId", window.id))

    window.on("maximize", () => window.webContents.send("isMaximized", window.isMaximized()))
    window.on("unmaximize", () => window.webContents.send("isMaximized", window.isMaximized()))
    window.on("show", () => window.webContents.send("isShow", true))
    window.on("hide", () => window.webContents.send("isShow", false))
    window.on("focus", () => window.webContents.send("isFocus", true))
    window.on("blur", () => window.webContents.send("isFocus", false))

    window.on("ready-to-show", () => {
      if (options.maximize) window.maximize()
      else window.show()
      resolve(window)
    })

    window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: "deny" }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      window.loadURL(process.env["ELECTRON_RENDERER_URL"] + ("/" + options.html).repeat(2))
    } else {
      window.loadFile(join(__dirname, `../renderer/${options.html}/${options.html}.html`))
    }
  })
}
