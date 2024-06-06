import * as path from "node:path"

/**
 * 将文件路径转换为Atom的URL格式。
 * @param filePath - 需要转换的文件路径，使用平台的路径分隔符。
 * @returns 转换后的Atom URL字符串，路径分隔符被替换为"/"。
 */
export function toAtomUrl(filePath: string) {
  if (filePath.indexOf("atom://") === 0) return filePath
  if (process.platform === "win32")
    // 使用平台的路径分隔符将文件路径分割为数组，然后将分隔符替换为"/"，最后拼接为Atom的URL格式。
    return "atom://" + filePath.split(path.sep).join("/")
  else return "atom://" + filePath
}

/**
 * 从Atom URL中提取文件路径。
 *
 * 使用特殊的URL格式来引用文件，本函数旨在从这种URL格式中提取出文件的路径部分。
 * 主要处理的转换包括：移除URL前的"atom://"前缀，以及根据操作系统平台的不同，将路径分隔符从斜杠("/")转换为对应的系统路径分隔符。
 *
 * @param url Atom风格的文件URL，以"atom://"开头。
 * @returns 提取后的文件路径，根据操作系统平台可能包含系统路径分隔符。
 */
export function extractFilePathFromAtomUrl(url: string) {
  // 移除URL中的"atom://"前缀，得到基本的文件路径。
  const filePath = url.replace("atom://", "")

  // 根据操作系统的平台类型，对文件路径进行必要的格式转换。
  if (process.platform === "win32") {
    // 对于Windows平台，将路径中的斜杠("/")转换为反斜杠("\")。
    return filePath.split("/").join(path.sep)
  } else {
    // 对于非Windows平台，直接返回转换后的文件路径。
    return filePath
  }
}
