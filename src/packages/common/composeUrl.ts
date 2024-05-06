/* 组装url */
export function composeUrl(...items: string[]) {
  return (
    "/" +
    items
      .map((str) => removeHeadTailChar(str, "/"))
      .filter((str) => str.length > 0)
      .join("/")
  )
}

/* 删除字符串头尾的指定字符 */
export function removeHeadTailChar(str: string, char: string) {
  while (str[0] === char) str = str.slice(1)
  while (str[str.length - 1] === char) str = str.slice(0, str.length - 1)
  return str
}
