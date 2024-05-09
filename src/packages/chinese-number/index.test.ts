import { chineseNumber } from "@packages/chinese-number/index"
import { expect, test } from "vitest"

test("chineseNumber", () => {
  expect(chineseNumber(123)).toBe("一百二十三")
  expect(chineseNumber(123.0123)).toBe("一百二十三点零一二三")
  expect(chineseNumber(1234)).toBe("一千二百三十四")
  expect(chineseNumber(1034)).toBe("一千零三十四")
  expect(chineseNumber(12301234)).toBe("一千二百三十万一千二百三十四")
  expect(chineseNumber(1034567890)).toBe("十亿三千四百五十六万七千八百九十")
})
