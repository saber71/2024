import imageSize from "image-size"
import { promises, type Stats } from "node:fs"
import { resolve } from "node:path"
import { promisify } from "node:util"

const sizeOf = promisify(imageSize)

export interface ImageInfo extends Stats {
  width: number
  height: number
}

export async function getImageInfo(path: string) {
  const absolutePath = resolve(path)
  const [size, stats] = await Promise.all([sizeOf(absolutePath), promises.stat(absolutePath)])
  if (!size || !size.width || !size.height) return
  const result: ImageInfo = stats as any
  result.width = size.width
  result.height = size.height
  return result
}
