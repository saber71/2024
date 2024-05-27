const videoExtensions = new Set(["mp4", "webm", "ogg"])

/**
 * 检查给定的扩展名是否为视频文件支持的格式。
 * @param extName 文件扩展名，可以以点号开头（例如“.mp4”），也可以不带点号（例如“mp4”）。
 * @returns 返回一个布尔值，如果扩展名是视频文件支持的格式，则为true；否则为false。
 */
export function isVideoExtName(extName: string) {
  // 如果扩展名以点号开头，则移除点号
  if (extName[0] === ".") extName = extName.slice(1)
  // 将扩展名转换为小写，并检查集合中是否包含该扩展名
  return videoExtensions.has(extName.toLowerCase())
}
