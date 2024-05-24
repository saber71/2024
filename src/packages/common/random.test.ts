import { describe, expect, it } from "vitest"
import { randomArrayItem, randomInt, randomNumber, randomString } from "./random.ts"

describe("randomString", () => {
  it("should generate a string of specified length", () => {
    const len = 10
    const result = randomString(len)
    expect(result).toHaveLength(len)
    expect(result).toMatch(/^[0-9A-Za-z]+$/)
  })
})

describe("randomNumber", () => {
  it("should generate a number within specified range", () => {
    const min = 0
    const max = 10
    const result = randomNumber(min, max)
    expect(result).toBeGreaterThanOrEqual(min)
    expect(result).toBeLessThanOrEqual(max)
  })
})

describe("randomInt", () => {
  it("should generate a random integer within specified range", () => {
    const min = 0
    const max = 10
    const result = randomInt(min, max)
    expect(result).toBeGreaterThanOrEqual(min)
    expect(result).toBeLessThanOrEqual(max)
    expect(Number.isInteger(result)).toBeTruthy()
  })
})

describe("randomArrayItem", () => {
  it("should return a random item from the array", () => {
    const array = ["a", "b", "c"]
    const result = randomArrayItem(array)
    expect(array).toContain(result)
  })
})
