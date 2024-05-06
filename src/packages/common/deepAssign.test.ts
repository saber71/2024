import { expect, test } from "vitest"
import { deepAssign } from "./deepAssign"

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
