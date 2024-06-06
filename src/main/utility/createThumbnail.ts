import { app } from "electron"
import ffmpeg from "fluent-ffmpeg"
import * as constants from "node:constants"
import { promises } from "node:fs"
import { basename, extname, join, resolve } from "node:path"

/**
 * 创建视频的缩略图。
 * @param videoPath - 视频文件的路径。
 * @returns 返回缩略图的文件路径。如果缩略图已存在，则直接返回该路径；否则，生成缩略图并返回其路径。
 */
export async function createThumbnail(videoPath: string) {
  // 拼接缩略图存储文件夹路径和文件名
  const folder = join(app.getPath("userData"), "thumbnails")
  const filename = basename(videoPath).replace(extname(videoPath), ".png")
  const resultImgPath = join(folder, filename)

  // 尝试访问结果图片路径，如果存在则直接返回路径
  try {
    await promises.access(resultImgPath, constants.F_OK)
    return resultImgPath
  } catch {
    // 如果不存在，则使用ffmpeg生成缩略图
    return new Promise<string>((resolve1, reject) => {
      videoPath = resolve(videoPath) // 解析绝对路径
      ffmpeg(videoPath)
        .thumbnail({
          count: 1, // 生成1个缩略图
          folder, // 指定存储文件夹
          filename // 指定文件名
        })
        .on("end", () => resolve1(resultImgPath)) // 生成结束时返回路径
        .on("error", reject) // 发生错误时拒绝承诺
    })
  }
}
