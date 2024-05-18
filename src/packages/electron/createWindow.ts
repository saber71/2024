import { is } from "@electron-toolkit/utils"
import { deepAssign } from "@packages/common"
import { BrowserWindow, type BrowserWindowConstructorOptions, shell } from "electron"
import { join } from "path"
import icon from "../../../resources/icon.png"

export interface CreateWindowOptions extends BrowserWindowConstructorOptions {
  html: "index" | "photo"
}

export function createWindow(options: CreateWindowOptions) {
  return new Promise<BrowserWindow>((resolve) => {
    // Create the browser window.
    const mainWindow = new BrowserWindow(
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

    mainWindow.on("ready-to-show", () => {
      mainWindow.show()
      resolve(mainWindow)
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: "deny" }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"] + ("/" + options.html).repeat(2))
    } else {
      mainWindow.loadFile(join(__dirname, `../renderer/${options.html}/${options.html}.html`))
    }
  })
}
