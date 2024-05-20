import { electronApp, optimizer } from "@electron-toolkit/utils"
import { path as FfmpegPath } from "@ffmpeg-installer/ffmpeg"
import { path as FfprobePath } from "@ffprobe-installer/ffprobe"
import { createThumbnail, createWindow } from "@packages/electron"
import { IpcHandler } from "@packages/ipc-handler"
import { app, BrowserWindow } from "electron"
import ffmpeg from "fluent-ffmpeg"

ffmpeg.setFfmpegPath(FfmpegPath)
ffmpeg.setFfprobePath(FfprobePath)

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron")

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  IpcHandler.install()

  createWindow({ html: "index" }).then((window) => {
    window.on("closed", () => app.exit())
  })

  app.on("activate", function () {
    // On macOS, it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow({ html: "index" })
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

console.log(
  await createThumbnail("D:\\BaiduNetdiskDownload\\xvideos\\xvideos.com_ed43fee71f4c797a267f21f4498f8a0f-1.mp4")
)
