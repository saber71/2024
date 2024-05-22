import { describe, expect, test } from "vitest"
import { composeUrl, removeHeadTailChar } from "./composeUrl"

describe("composeUrl", () => {
  test("should combine empty parts into an / string", () => {
    expect(composeUrl()).toBe("/")
  })

  test("should combine single part into a string", () => {
    expect(composeUrl("part1")).toBe("/part1")
  })

  test("should combine multiple parts into a string with slashes", () => {
    expect(composeUrl("part1", "part2", "part3")).toBe("/part1/part2/part3")
  })

  test("should remove leading and trailing slashes from each part", () => {
    expect(composeUrl("//part1", "part2/", "/part3")).toBe("/part1/part2/part3")
  })

  test("should filter out empty parts", () => {
    expect(composeUrl("part1", "", "part2", "", "part3")).toBe("/part1/part2/part3")
  })
})

describe("removeHeadTailChar", () => {
  test("should remove leading and trailing characters from a string", () => {
    expect(removeHeadTailChar("///string///", "/")).toBe("string")
  })

  test("should return the same string if there are no leading or trailing characters", () => {
    expect(removeHeadTailChar("string", "/")).toBe("string")
  })

  test("should return an empty string if all characters are removed", () => {
    expect(removeHeadTailChar("///", "/")).toBe("")
  })
})
