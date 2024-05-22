import { Collection } from "@packages/collection"
import { createWindow } from "@packages/electron"
import type { FilterItem } from "@packages/filter"
import { Handler } from "@packages/ipc-handler/handler.ts"
import { app } from "electron"
import { basename } from "node:path"

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
  "photo:allImages": {
    args: []
    return: void
  }
}

const ALL_DIRECTORIES = "all_directories"

export class Photo {
  readonly collection = new Collection("photo")

  @Handler("photo:open") open() {
    createWindow({ html: "photo", frame: false, maximize: true })
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

  @Handler("photo:allImages") allImage() {}
}
