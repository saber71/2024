import { describe, expect, test } from "vitest"
import { type FilterCondition, matchFilterCondition } from "./index.ts"

// 创建一个模拟数据
const mockData = {
  _id: "123",
  name: "John",
  age: 25,
  gender: "male"
}

// 创建一个测试套件
describe("matchFilterCondition", () => {
  // 测试用例1：当数据和条件都为空时，应该返回true
  test("should return true when data and condition are empty", () => {
    const result = matchFilterCondition({} as any, {})
    expect(result).toBeTruthy()
  })

  // 测试用例2：当数据不为空，条件为空时，应该返回true
  test("should return true when data is not empty and condition is empty", () => {
    const result = matchFilterCondition(mockData, {})
    expect(result).toBeTruthy()
  })

  // 测试用例3：当数据为空，条件不为空时，应该返回false
  test("should return false when data is empty and condition is not empty", () => {
    const result = matchFilterCondition({} as any, { name: "John" })
    expect(result).toBeFalsy()
  })

  // 测试用例4：当数据和条件都不为空时，且数据满足条件，应该返回true
  test("should return true when data and condition are not empty and data matches condition", () => {
    const condition: FilterCondition<typeof mockData> = { name: "John" }
    const result = matchFilterCondition(mockData, condition)
    expect(result).toBeTruthy()
  })

  // 测试用例5：当数据和条件都不为空时，且数据不满足条件，应该返回false
  test("should return false when data and condition are not empty and data does not match condition", () => {
    const condition: FilterCondition<typeof mockData> = { name: "Jane" }
    const result = matchFilterCondition(mockData, condition)
    expect(result).toBeFalsy()
  })

  // 在这里添加更多的测试用例...
})
