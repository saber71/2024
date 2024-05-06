const validChars: string[] = []

// A-Z
for (let i = 65; i <= 90; i++) validChars.push(String.fromCharCode(i))
// a-z
for (let i = 97; i <= 122; i++) validChars.push(String.fromCharCode(i))
// 0-9
for (let i = 48; i <= 57; i++) validChars.push(String.fromCharCode(i))

/* 从允许的字符（0-9A-Za-z）中随机生成指定长度的字符串 */
export function randomString(len: number) {
  let result = ""
  for (let i = 0; i < len; i++) {
    result += randomArrayItem(validChars)
  }
  return result
}

/* 随机数字 */
export function randomNumber(min: number, max: number) {
  return (max - min) * Math.random() + min
}

/* 随机整型数 */
export function randomInt(min: number, max: number) {
  return Math.round(randomNumber(min, max))
}

/* 随机返回数组元素 */
export function randomArrayItem<T>(array: T[]) {
  return array[randomInt(0, array.length - 1)]
}
