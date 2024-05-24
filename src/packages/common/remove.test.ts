import { describe, expect, test } from "vitest"
import { remove } from "./remove"

describe("remove", () => {
  test("should remove a single item from an array", () => {
    const arr = [1, 2, 3, 4, 5]
    const result = remove(arr, 3)
    expect(result).toEqual([1, 2, 4, 5])
  })

  test("should remove multiple items from an array", () => {
    const arr = [1, 2, 3, 4, 5]
    const result = remove(arr, [3, 4])
    expect(result).toEqual([1, 2, 5])
  })

  test("should remove items from an array using a predicate function", () => {
    const arr = [1, 2, 3, 4, 5]
    const result = remove(arr, (item) => item % 2 === 0)
    expect(result).toEqual([1, 3, 5])
  })

  test("should remove a single item from a set", () => {
    const set = new Set([1, 2, 3, 4, 5])
    const result = remove(set, 3)
    expect(Array.from(result)).toEqual([1, 2, 4, 5])
  })

  test("should remove multiple items from a set", () => {
    const set = new Set([1, 2, 3, 4, 5])
    const result = remove(set, [3, 4])
    expect(Array.from(result)).toEqual([1, 2, 5])
  })

  test("should remove items from a set using a predicate function", () => {
    const set = new Set([1, 2, 3, 4, 5])
    const result = remove(set, (item) => item % 2 === 0)
    expect(Array.from(result)).toEqual([1, 3, 5])
  })
})
