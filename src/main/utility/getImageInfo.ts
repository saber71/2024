import { isVideoExtName } from "@packages/common"
import ffmpeg from "fluent-ffmpeg"
import imageSize from "image-size"
import { promises, type Stats } from "node:fs"
import { basename, dirname, extname, resolve } from "node:path"
import { promisify } from "node:util"
import { createThumbnail } from "./createThumbnail.ts"
import { toAtomUrl } from "./toAtomUrl.ts"

// 将image-size库的同步方法转换为异步Promise形式
const sizeOf = promisify(imageSize)

/**
 * 定义一个包含图像宽高和文件状态信息的接口
 */
export interface ImageInfo extends Stats {
  name: string
  nameWithoutExt: string
  extName: string
  width: number
  height: number
  atomPath: string //如果是视频的话此处是缩略图atom地址，否则是图片atom地址
  filePath: string
  directoryPath: string
}

/**
 * 异步获取指定路径图像的宽高信息和文件状态。
 * @param path - 图像文件的路径，可以是相对路径或绝对路径。
 * @returns 返回一个Promise，解析为一个包含图像宽、高和文件状态信息的对象。如果无法获取尺寸信息，则返回undefined。
 */
export async function getImageInfo(path: string) {
  // 将传入的路径解析为绝对路径
  const absolutePath = resolve(path)

  // 获取文件扩展名，并转换为小写
  const extName = extname(absolutePath).toLowerCase().slice(1)

  // 同时获取图像的尺寸和文件状态信息
  const [size, stats] = await Promise.all([
    isVideoExtName(extName) ? videoSize(absolutePath) : sizeOf(absolutePath),
    promises.stat(absolutePath)
  ])

  // 如果无法获取到图像尺寸或宽高信息，则提前返回undefined
  if (!size || !size.width || !size.height) return

  // 将文件状态信息和图像尺寸信息合并为ImageInfo类型
  const result: ImageInfo = stats as any
  result.width = size.width
  result.height = size.height
  result.extName = extName
  result.atomPath = toAtomUrl(absolutePath)
  result.filePath = absolutePath
  result.name = basename(absolutePath)
  result.nameWithoutExt = result.name.replace(new RegExp(`\.${extName}$`), "")
  result.directoryPath = dirname(absolutePath)

  // 如果文件扩展名为视频，则创建缩略图
  if (isVideoExtName(extName)) {
    // 创建缩略图，并获取其路径
    const thumbnailPath = await createThumbnail(absolutePath)
    // 将缩略图路径设置到结果对象中的 path 属性
    result.atomPath = toAtomUrl(thumbnailPath)
  }

  return result
}

/**
 * 获取视频的尺寸信息。
 *
 * 通过调用ffmpeg库，此函数承诺返回一个包含视频宽度和高度的对象。
 * 如果无法获取信息，Promise将被拒绝，并传递错误。
 *
 * @param path 视频文件的路径。
 * @returns 返回一个Promise，解析为包含视频宽度和高度的对象，或者在失败时拒绝。
 */
function videoSize(path: string) {
  return new Promise<{ width?: number; height?: number }>((resolve1, reject) => {
    ffmpeg.ffprobe(path, (err, data) => {
      if (err) reject(err)
      else
        resolve1({
          width: data.streams[0].width,
          height: data.streams[0].height
        })
    })
  })
}
