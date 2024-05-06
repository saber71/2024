import type { DeepCloneOption } from "../types"
import { isTypedArray } from "./isTypedArray"

export function deepClone<T>(obj: T, options: DeepCloneOption = {}): T {
  if (typeof obj !== "object" || obj === undefined || obj === null) return obj
  if (obj instanceof RegExp) return obj
  if (obj instanceof Set) {
    const result = new Set()
    obj.forEach((value) => result.add(deepClone(value)))
    return result as T
  } else if (obj instanceof Date) {
    return new Date(obj) as T
  } else if (obj instanceof Map) {
    const result = new Map()
    obj.forEach((value, key) => {
      if (options.cloneMapKey) key = deepClone(key, options)
      result.set(key, deepClone(value))
    })
    return result as T
  } else if (isTypedArray(obj)) {
    //@ts-ignore
    return new obj.constructor(obj)
  } else {
    //@ts-ignore
    const result = new (obj.constructor || Object)()
    Object.assign(result, obj)
    for (let objKey in obj as any) {
      const value = (obj as any)[objKey]
      result[objKey] = deepClone(value, options)
    }
    return result
  }
}
