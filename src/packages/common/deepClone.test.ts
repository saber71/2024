import { describe, expect, it } from "vitest"
import { deepClone } from "./deepClone"

describe("deepClone", () => {
  it("should clone a simple object", () => {
    const obj = { a: 1, b: "test", c: true }
    const clonedObj = deepClone(obj)
    expect(clonedObj).toEqual(obj)
    expect(clonedObj).not.toBe(obj)
  })

  it("should clone a nested object", () => {
    const obj = { a: 1, b: { c: 2 }, d: ["test1", "test2"] }
    const clonedObj = deepClone(obj)
    expect(clonedObj).toEqual(obj)
    expect(clonedObj).not.toBe(obj)
    expect(clonedObj.b).not.toBe(obj.b)
    expect(clonedObj.d).not.toBe(obj.d)
  })

  it("should clone a typed array", () => {
    const typedArray = new Int32Array([1, 2, 3])
    const clonedTypedArray = deepClone(typedArray)
    expect(clonedTypedArray).toEqual(typedArray)
    expect(clonedTypedArray).not.toBe(typedArray)
  })

  it("should clone a date object", () => {
    const date = new Date("2022-01-01T00:00:00Z")
    const clonedDate = deepClone(date)
    expect(clonedDate).toEqual(date)
    expect(clonedDate).not.toBe(date)
  })

  it("should clone a set", () => {
    const set = new Set([1, 2, 3])
    const clonedSet = deepClone(set)
    expect(clonedSet).toEqual(set)
    expect(clonedSet).not.toBe(set)
    expect(clonedSet.size).toBe(set.size)
    expect(clonedSet.has(1)).toBeTruthy()
    expect(clonedSet.has(2)).toBeTruthy()
    expect(clonedSet.has(3)).toBeTruthy()
  })

  it("should clone a map with cloneMapKey option", () => {
    const map = new Map()
    map.set(1, "test1")
    map.set("key2", "test2")
    const clonedMap = deepClone(map, { cloneMapKey: true })
    expect(clonedMap).toEqual(map)
    expect(clonedMap).not.toBe(map)
    expect(clonedMap.size).toBe(map.size)
    expect(clonedMap.has(1)).toBeTruthy()
    expect(clonedMap.has("key2")).toBeTruthy()
    expect(clonedMap.get(1)).toBe("test1")
    expect(clonedMap.get("key2")).toBe("test2")
  })

  it("should not clone a map without cloneMapKey option", () => {
    const map = new Map()
    map.set(1, "test1")
    map.set("key2", "test2")
    const clonedMap = deepClone(map)
    expect(clonedMap).toEqual(map)
    expect(clonedMap).not.toBe(map)
    expect(clonedMap.size).toBe(map.size)
    expect(clonedMap.has(1)).toBeTruthy()
    expect(clonedMap.has("key2")).toBeTruthy()
    expect(clonedMap.get(1)).toBe("test1")
    expect(clonedMap.get("key2")).toBe("test2")
  })

  it("should return the original value if the input is not an object", () => {
    const value = 1
    const clonedValue = deepClone(value)
    expect(clonedValue).toBe(value)
  })

  it("should return undefined if the input is undefined", () => {
    const value = undefined
    const clonedValue = deepClone(value)
    expect(clonedValue).toBe(value)
  })

  it("should return null if the input is null", () => {
    const value = null
    const clonedValue = deepClone(value)
    expect(clonedValue).toBe(value)
  })

  // Add more tests if needed
})
