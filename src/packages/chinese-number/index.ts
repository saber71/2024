export function chineseNumber(number: number) {
  const str = String(number).split(".")
  const int = str[0] || "0"
  const float = str[1]
  let intResult = ""
  let floatResult = ""
  if (float) {
    for (let i = 0; i < float.length; i++) {
      floatResult += charMap[float[i]]
    }
  }
  let yi = 1,
    unit = 1
  let wanIndex = int.length - 1
  for (let i = int.length - 1; i >= 0; i--) {
    if (yi >= 100000000) {
      yi /= 100000000
      unit = 1
      wanIndex = i
      intResult = "亿" + intResult
    }
    if (unit >= 10000) {
      unit /= 10000
      intResult = "万" + intResult
      wanIndex = i
    }
    const char = int[i]
    if (char === "0") {
      let enableZero = false
      for (let j = i; j <= wanIndex; j++) {
        if (int[j] !== "0") enableZero = true
      }
      if (intResult[0] !== "零" && enableZero) intResult = charMap[char] + intResult
    }
    if (char !== "0" && unit >= 10) {
      intResult = charMap[unit] + intResult
      if (unit !== 10 || char !== "1") intResult = charMap[char] + intResult
    } else if (char !== "0") intResult = charMap[char] + intResult
    yi *= 10
    unit *= 10
  }
  if (floatResult) return `${intResult}点${floatResult}`
  return intResult
}

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
