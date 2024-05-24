import { describe, expect, test, vi } from "vitest"
import { If } from "./If"

describe("If", () => {
  test("should return then value when condition is true", () => {
    const condition = true
    const thenValue = 1
    const result = If(condition).then(thenValue).done()
    expect(result).toBe(thenValue)
  })

  test("should return else value when condition is false", () => {
    const condition = false
    const thenValue = 1
    const elseValue = 2
    const result = If(condition).then(thenValue).else(elseValue)
    expect(result).toBe(elseValue)
  })

  test("should return elseIf value when condition is true", () => {
    const condition = false
    const thenValue = 1
    const elseIfValue = 2
    const result = If(condition)
      .then(thenValue)
      .elseIf(() => true)
      .then(elseIfValue)
      .done()
    expect(result).toBe(elseIfValue)
  })

  test("should return else value when all conditions are false", () => {
    const condition = false
    const thenValue = 1
    const elseIfValue = 2
    const elseValue = 3
    const result = If(condition)
      .then(thenValue)
      .elseIf(() => false)
      .then(elseIfValue)
      .else(elseValue)
    expect(result).toBe(elseValue)
  })

  test("should call condition and then functions when appropriate", () => {
    const conditionFn = vi.fn(() => true)
    const thenFn = vi.fn(() => 1)
    const result = If(conditionFn).then(thenFn).done()
    expect(conditionFn).toHaveBeenCalled()
    expect(thenFn).toHaveBeenCalled()
    expect(result).toBe(1)
  })
})
