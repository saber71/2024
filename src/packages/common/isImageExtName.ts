/**
 * 创建一个包含常见图片扩展名的Set集合。
 * 该集合用于后续函数中对图片扩展名的快速查证。
 */
const imageExtensions = new Set(["jpg", "jpeg", "png", "bmp", "webp"])

/**
 * 检查提供的扩展名是否为常见的图片格式。
 *
 * @param extName 要检查的文件扩展名，可以带点号（.），不区分大小写。
 * @returns 返回一个布尔值，如果提供的扩展名是图片格式，则为true，否则为false。
 */
export function isImageExtName(extName: string) {
  // 如果扩展名以点号开头，移除点号
  if (extName[0] === ".") extName = extName.slice(1)
  // 利用Set集合的has方法，检查传入的扩展名是否存在于集合中，结果不区分大小写。
  return imageExtensions.has(extName.toLowerCase())
}
