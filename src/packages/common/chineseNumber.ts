/**
 * 将数字转换为中文表示形式
 * @param number 要转换的数字
 * @returns 转换后的中文数字字符串
 */
export function chineseNumber(number: number) {
  // 将输入的数字转换为字符串，并根据小数点分割整数部分和小数部分
  const str = String(number).split(".")
  const int = str[0] || "0" // 整数部分
  const float = str[1] // 小数部分

  let intResult = "" // 整数部分的中文结果
  let floatResult = "" // 小数部分的中文结果

  // 处理小数部分
  if (float) {
    for (let i = 0; i < float.length; i++) {
      floatResult += charMap[float[i]] // 将每个数字转换为对应的中文字符
    }
  }

  // 初始化变量，用于处理整数部分的中文转换
  let yi = 1, // 亿级单位
    unit = 1 // 万级单位
  let wanIndex = int.length - 1 // 记录当前处理的数字是否在万位之后

  // 处理仅有一个数字的情况
  if (int.length === 1) {
    intResult = charMap[int[0]]
  } else {
    // 从整数部分的最高位开始，逐位处理
    for (let i = int.length - 1; i >= 0; i--) {
      // 每当达到亿级别时，进行单位转换
      if (yi >= 100000000) {
        yi /= 100000000
        unit = 1
        wanIndex = i
        if (intResult[0] === "万") intResult = intResult.slice(1)
        intResult = "亿" + intResult
      }
      // 每当达到万级别时，进行单位转换
      if (unit >= 10000) {
        unit /= 10000
        intResult = "万" + intResult
        wanIndex = i
      }

      const char = int[i] // 当前处理的数字字符
      // 处理数字为0的情况，添加适当的中文字符
      if (char === "0") {
        let enableZero = false
        for (let j = i; j <= wanIndex; j++) {
          if (int[j] !== "0") enableZero = true
        }
        if (intResult[0] !== "零" && enableZero) intResult = charMap[char] + intResult
      }

      // 处理非0数字，添加适当的中文字符
      if (char !== "0" && unit >= 10) {
        intResult = charMap[unit] + intResult
        if (unit !== 10 || char !== "1") intResult = charMap[char] + intResult
      } else if (char !== "0") intResult = charMap[char] + intResult

      yi *= 10
      unit *= 10
    }
  }

  // 如果有小数部分，将整数部分和小数部分合并返回
  if (floatResult) return `${intResult}点${floatResult}`
  return intResult
}

// 定义数字到中文字符的映射
const charMap: any = {
  0: "零",
  1: "一",
  2: "二",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
  7: "七",
  8: "八",
  9: "九",
  10: "十",
  100: "百",
  1000: "千",
  10000: "万"
}
