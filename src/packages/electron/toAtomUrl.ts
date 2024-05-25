import * as path from "node:path"

/**
 * 将文件路径转换为Atom的URL格式。
 * @param filePath - 需要转换的文件路径，使用平台的路径分隔符。
 * @returns 转换后的Atom URL字符串，路径分隔符被替换为"/"。
 */
export function toAtomUrl(filePath: string) {
  if (process.platform === "win32")
    // 使用平台的路径分隔符将文件路径分割为数组，然后将分隔符替换为"/"，最后拼接为Atom的URL格式。
    return "atom://" + filePath.split(path.sep).join("/")
  else return "atom://" + filePath
}
