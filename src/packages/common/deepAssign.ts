import { isTypedArray } from "./isTypedArray"
import type { TypedArray } from "./types"

/* 合并两个对象，dst会被修改 */
export function deepAssign<T extends object>(dst: any, src: T): T {
  if (typeof src !== "object" || typeof dst !== "object" || !dst || !src) return src
  if (dst.constructor !== src.constructor) return assign()
  else if (dst instanceof Date) dst.setTime((src as Date).getTime())
  else if (src instanceof Array) {
    for (let i = 0; i < src.length; i++) {
      dst[i] = deepAssign(dst[i], src[i])
    }
  } else if (src instanceof Map) {
    const dstMap = dst as Map<any, any>
    src.forEach((value, key) => {
      dstMap.set(key, deepAssign(dstMap.get(key), value))
    })
  } else if (src instanceof Set) {
    const oldValues = Array.from(dst)
    const dstSet = dst as Set<any>
    dstSet.clear()
    Array.from(src).forEach((value, index) => dstSet.add(deepAssign(oldValues[index], value)))
    if (src.size < oldValues.length) oldValues.slice(src.size).forEach((val) => dstSet.add(val))
  } else if (isTypedArray(src)) {
    const dstTypedArray = dst as TypedArray
    const len = Math.min(src.length, dstTypedArray.length)
    for (let i = 0; i < len; i++) {
      dstTypedArray[i] = src[i]
    }
  } else return assign()
  return dst

  function assign() {
    if (src instanceof Date) return src
    for (let key in src) {
      const value = src[key]
      dst[key] = deepAssign((dst as any)[key], value as any)
    }
    return dst
  }
}
