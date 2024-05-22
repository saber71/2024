import { isTypedArray } from "./isTypedArray"
import type { TypedArray } from "./types"

/**
 * 深度合并源对象到目标对象。
 * @param dst 目标对象，任意类型。
 * @param src 源对象，类型为 T，将被合并到目标对象。
 * @returns 合并后的对象，其类型为 T。
 *
 * 函数会递归地合并 src 对象的属性到 dst 对象。如果遇到特殊类型如日期、数组、Map 或 Set，
 * 以及TypedArray，将进行特殊处理以确保合并的正确性。
 */
export function deepAssign<T extends object>(dst: any, src: T): T {
  // 如果源或目标不是对象，或任一为 null，则直接返回源对象
  if (typeof src !== "object" || typeof dst !== "object" || !dst || !src) return src

  // 如果目标和源对象的构造函数不一致，则直接当作普通对象进行深度合并
  if (dst.constructor !== src.constructor) return assign()
  // 特殊处理日期对象
  else if (dst instanceof Date) dst.setTime((src as Date).getTime())
  // 特殊处理数组对象
  else if (src instanceof Array) {
    for (let i = 0; i < src.length; i++) {
      dst[i] = deepAssign(dst[i], src[i])
    }
  }
  // 特殊处理 Map 对象
  else if (src instanceof Map) {
    const dstMap = dst as Map<any, any>
    src.forEach((value, key) => {
      dstMap.set(key, deepAssign(dstMap.get(key), value))
    })
  }
  // 特殊处理 Set 对象
  else if (src instanceof Set) {
    const oldValues = Array.from(dst)
    const dstSet = dst as Set<any>
    dstSet.clear()
    Array.from(src).forEach((value, index) => dstSet.add(deepAssign(oldValues[index], value)))
    if (src.size < oldValues.length) oldValues.slice(src.size).forEach((val) => dstSet.add(val))
  }
  // 特殊处理 TypedArray 对象
  else if (isTypedArray(src)) {
    const dstTypedArray = dst as TypedArray
    const len = Math.min(src.length, dstTypedArray.length)
    for (let i = 0; i < len; i++) {
      dstTypedArray[i] = src[i]
    }
  }
  // 默认处理，适用于普通对象
  else return assign()

  return dst

  // 辅助函数，用于处理普通对象的合并
  function assign() {
    if (src instanceof Date) return src // 如果源对象是日期，则直接返回，不做合并
    for (let key in src) {
      const value = src[key]
      dst[key] = deepAssign((dst as any)[key], value as any)
    }
    return dst
  }
}
