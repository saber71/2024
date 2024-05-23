import { Collection } from "@packages/collection"
import { createWindow, getImageInfo, type ImageInfo, sendToWeb } from "@packages/electron"
import type { FilterItem } from "@packages/filter"
import { Handler } from "@packages/ipc-handler/handler.ts"
import { app, BrowserWindow } from "electron"
import { promises } from "node:fs"
import { basename, extname } from "node:path"
import { join } from "path"

export interface Directory {
  name: string
  path: string
}

export interface PhotoInvokeChannelMap {
  "photo:open": {
    args: []
    return: void
  }
  "photo:allDirectories": {
    args: []
    return: Directory[]
  }
  "photo:addDirectory": {
    args: [string]
    return: void
  }
  "photo:removeDirectory": {
    args: [string]
    return: void
  }
  "photo:readImages": {
    args: [Directory[]]
    return: void
  }
}

export interface PhotoSendChannelMap {
  "photo:sendImageInfo": [ImageInfo[]]
  "photo:sendImageInfoEnd": []
}

const ALL_DIRECTORIES = "all_directories"
const validExtNames = new Set(["jpeg", "jpg", "png", "bmp", "mp4"])

export class Photo {
  readonly collection = new Collection("photo")

  @Handler("photo:open") open() {
    createWindow({ html: "photo", frame: false, maximize: true })
  }

  @Handler("photo:addDirectory") async addDirectory(path: string) {
    const allDirectories = await this.allDirectories()
    if (allDirectories.find((item) => item.path === path)) return
    allDirectories.push({
      name: basename(path),
      path
    })
    await this.collection.save(allDirectories)
  }

  @Handler("photo:removeDirectory") async removeDirectory(path: string) {
    const allDirectories = await this.allDirectories()
    const index = allDirectories.findIndex((val) => (val.path = path))
    if (index >= 0) {
      allDirectories.splice(index, 1)
      await this.collection.save(allDirectories)
    }
  }

  @Handler("photo:allDirectories") async allDirectories() {
    interface Directories extends FilterItem {
      array: Directory[]
    }
    let data = await this.collection.getById<Directories>(ALL_DIRECTORIES)
    if (!data) {
      const picturePath = app.getPath("pictures")
      const directoryName = basename(picturePath)
      const array = await this.collection.save<Directories>({
        data: [{ name: directoryName, path: picturePath }],
        _id: ALL_DIRECTORIES
      })
      data = array[0]
    }
    return data.array
  }

  @Handler("photo:readImages") async allImage(directories: Directory[], windowId: number) {
    const result = (
      await Promise.all(
        directories.map((directory) =>
          promises.readdir(directory.path).then((files) =>
            files
              .filter((path) => {
                const extName = extname(path).toLowerCase()
                return validExtNames.has(extName)
              })
              .map((path) => join(directory.path, path))
          )
        )
      )
    ).flat()
    sendImageInfos(windowId, result)
  }
}

async function sendImageInfos(windowId: number, filePaths: string[]) {
  const window = BrowserWindow.fromId(windowId)
  if (!window) return
  for (let i = 0; i < filePaths.length; i++) {
    let j = i
    const promises: Promise<ImageInfo | undefined>[] = []
    for (; j < i + 10 && j < filePaths.length; j++) {
      promises.push(getImageInfo(filePaths[j]))
    }
    const result = await Promise.all(promises)
    sendToWeb(window, "photo:sendImageInfo", result.filter((item) => !!item) as ImageInfo[])
    i = j
  }
  sendToWeb(window, "photo:sendImageInfoEnd")
}
