import { isTypedArray } from "./isTypedArray"
import type { DeepCloneOption } from "./types"

/**
 * 深度克隆对象。
 *
 * @param obj 要进行深度克隆的对象。
 * @param options 克隆选项，提供可选的配置项，例如是否克隆 Map 的键。
 * @returns 返回 obj 的深度克隆副本。如果 obj 不是对象类型、未定义或为 null，则直接返回 obj。
 */
export function deepClone<T>(obj: T, options: DeepCloneOption = {}): T {
  // 如果 obj 不是对象类型、未定义或为 null，则直接返回 obj
  if (typeof obj !== "object" || obj === undefined || obj === null) return obj
  // 如果 obj 是 RegExp 实例，直接返回 obj，不需要克隆
  if (obj instanceof RegExp) return obj
  // 处理 Set 对象的克隆
  if (obj instanceof Set) {
    const result = new Set()
    obj.forEach((value) => result.add(deepClone(value)))
    return result as T
    // 处理 Date 对象的克隆
  } else if (obj instanceof Date) {
    return new Date(obj) as T
    // 处理 Map 对象的克隆
  } else if (obj instanceof Map) {
    const result = new Map()
    obj.forEach((value, key) => {
      if (options.cloneMapKey) key = deepClone(key, options)
      result.set(key, deepClone(value))
    })
    return result as T
    // 处理 TypedArray 的克隆
  } else if (isTypedArray(obj)) {
    //@ts-ignore
    return new obj.constructor(obj)
    // 处理普通对象的克隆
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
