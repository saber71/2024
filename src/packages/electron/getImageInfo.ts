import imageSize from "image-size"
import { promises, type Stats } from "node:fs"
import { resolve } from "node:path"
import { promisify } from "node:util"

// 将image-size库的同步方法转换为异步Promise形式
const sizeOf = promisify(imageSize)

/**
 * 定义一个包含图像宽高和文件状态信息的接口
 */
export interface ImageInfo extends Stats {
  width: number
  height: number
}

/**
 * 异步获取指定路径图像的宽高信息和文件状态。
 * @param path - 图像文件的路径，可以是相对路径或绝对路径。
 * @returns 返回一个Promise，解析为一个包含图像宽、高和文件状态信息的对象。如果无法获取尺寸信息，则返回undefined。
 */
export async function getImageInfo(path: string) {
  // 将传入的路径解析为绝对路径
  const absolutePath = resolve(path)

  // 同时获取图像的尺寸和文件状态信息
  const [size, stats] = await Promise.all([sizeOf(absolutePath), promises.stat(absolutePath)])

  // 如果无法获取到图像尺寸或宽高信息，则提前返回undefined
  if (!size || !size.width || !size.height) return

  // 将文件状态信息和图像尺寸信息合并为ImageInfo类型
  const result: ImageInfo = stats as any
  result.width = size.width
  result.height = size.height

  return result
}
