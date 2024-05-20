import { app } from "electron"
import ffmpeg from "fluent-ffmpeg"
import * as constants from "node:constants"
import { promises } from "node:fs"
import { basename, extname, join, resolve } from "node:path"

export async function createThumbnail(videoPath: string) {
  const folder = join(app.getPath("userData"), "thumbnails")
  const filename = basename(videoPath).replace(extname(videoPath), ".png")
  const resultImgPath = join(folder, filename)
  try {
    await promises.access(resultImgPath, constants.F_OK)
    return resultImgPath
  } catch {
    return new Promise<string>((resolve1, reject) => {
      videoPath = resolve(videoPath)
      ffmpeg(videoPath)
        .thumbnail({
          count: 1,
          folder,
          filename
        })
        .on("end", () => resolve1(resultImgPath))
        .on("error", reject)
    })
  }
}
