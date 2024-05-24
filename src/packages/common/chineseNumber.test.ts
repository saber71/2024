import { describe, expect, test } from "vitest"
import { chineseNumber } from "./chineseNumber"

describe("chineseNumber", () => {
  test('converts 0 to "零"', () => {
    expect(chineseNumber(0)).toBe("零")
  })

  test('converts 1 to "一"', () => {
    expect(chineseNumber(1)).toBe("一")
  })

  test('converts 10 to "十"', () => {
    expect(chineseNumber(10)).toBe("十")
  })

  test('converts 100 to "百"', () => {
    expect(chineseNumber(100)).toBe("一百")
  })

  test('converts 1000 to "千"', () => {
    expect(chineseNumber(1000)).toBe("一千")
  })

  test('converts 10000 to "万"', () => {
    expect(chineseNumber(10000)).toBe("一万")
  })

  test('converts 100000000 to "亿"', () => {
    expect(chineseNumber(100000000)).toBe("一亿")
  })

  test('converts 1.23 to "一点二三"', () => {
    expect(chineseNumber(1.23)).toBe("一点二三")
  })

  test('converts 123456789.45 to "一亿二千三百四十五万六千七百八十九点四五"', () => {
    expect(chineseNumber(123456789.45)).toBe("一亿二千三百四十五万六千七百八十九点四五")
  })

  test("chineseNumber", () => {
    expect(chineseNumber(123)).toBe("一百二十三")
    expect(chineseNumber(123.0123)).toBe("一百二十三点零一二三")
    expect(chineseNumber(1234)).toBe("一千二百三十四")
    expect(chineseNumber(1034)).toBe("一千零三十四")
    expect(chineseNumber(12301234)).toBe("一千二百三十万一千二百三十四")
    expect(chineseNumber(1034567890)).toBe("十亿三千四百五十六万七千八百九十")
    expect(chineseNumber(3134567890)).toBe("三十一亿三千四百五十六万七千八百九十")
  })
})
