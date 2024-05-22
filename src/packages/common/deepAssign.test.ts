import { describe, expect, it, test } from "vitest"
import { deepAssign } from "./deepAssign"

describe("deepAssign", () => {
  test("deepAssign", () => {
    expect(
      deepAssign(
        {
          a: {},
          b: {
            a: 12,
            b: { a: 20 }
          }
        },
        {
          a: 20,
          b: {
            a: {
              a: 12
            },
            b: {
              b: 20
            }
          }
        }
      )
    ).toEqual({
      a: 20,
      b: {
        a: {
          a: 12
        },
        b: {
          a: 20,
          b: 20
        }
      }
    })

    expect(
      deepAssign(
        {
          a: new Set([1, 2, { a: 12 }, 4, 5])
        },
        {
          a: new Set([10, 2, { a: 2 }])
        }
      )
    ).toStrictEqual({
      a: new Set([10, 2, { a: 2 }, 4, 5])
    })
  })

  it("should merge objects correctly", () => {
    const dst = { a: 1, b: { c: 2 } }
    const src = { b: { d: 3 }, e: 4 }
    const result = deepAssign(dst, src)
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 })
  })

  it("should merge arrays correctly", () => {
    const dst = [1, [2, 3]]
    const src = [4, [5, 6]]
    const result = deepAssign(dst, src)
    expect(result).toEqual([4, [5, 6]])
  })

  it("should merge Date objects correctly", () => {
    const dst = new Date(2020, 0, 1)
    const src = new Date(2021, 0, 1)
    const result = deepAssign(dst, src)
    expect(result.getTime()).toBe(src.getTime())
  })

  it("should merge Maps correctly", () => {
    const dst = new Map()
    dst.set("a", 1)
    const src = new Map()
    src.set("b", 2)
    const result = deepAssign(dst, src)
    expect(result.get("a")).toBe(1)
    expect(result.get("b")).toBe(2)
  })

  it("should merge Sets correctly", () => {
    const dst = new Set()
    dst.add(1)
    const src = new Set()
    src.add(2)
    src.add(1)
    const result = deepAssign(dst, src)
    expect(Array.from(result)).toEqual([2, 1])
  })

  it("should merge TypedArrays correctly", () => {
    const dst = new Int32Array([1, 2])
    const src = new Int32Array([3, 4])
    const result = deepAssign(dst, src)
    expect(result).toEqual(new Int32Array([3, 4]))
  })

  it("should return the source object if the destination is not an object", () => {
    const src = { a: 1 }
    const result = deepAssign(2, src)
    expect(result).toBe(src)
  })

  it("should return the source object if the source is null", () => {
    const src = null
    const result = deepAssign({ a: 1 }, src as any)
    expect(result).toBeNull()
  })
})
