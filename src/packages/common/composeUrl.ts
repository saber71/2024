/**
 * 将给定的字符串片段组合成一个URL。
 * @param items 字符串数组，代表URL的各个部分。
 * @returns 组合后的URL字符串，确保每个部分都被正确地连接，且没有多余的斜杠。
 */
export function composeUrl(...items: string[]) {
  // 移除每个部分两端的斜杠，过滤掉长度为0的字符串，然后将所有部分用斜杠连接起来
  return (
    "/" +
    items
      .map((str) => removeHeadTailChar(str, "/"))
      .filter((str) => str.length > 0)
      .join("/")
  )
}

/**
 * 移除给定字符串两端指定的字符。
 * @param str 待处理的字符串。
 * @param char 需要移除的字符。
 * @returns 处理后的字符串，确保两端没有指定的字符。
 */
export function removeHeadTailChar(str: string, char: string) {
  // 循环移除字符串开头的指定字符
  while (str[0] === char) str = str.slice(1)
  // 循环移除字符串末尾的指定字符
  while (str[str.length - 1] === char) str = str.slice(0, str.length - 1)
  return str
}
