import type { Class } from "./types"

// 使用Set来存储基本类型名称，以提高查找效率。
const basicTypes = new Set([
  "Object",
  "String",
  "Boolean",
  "Number",
  "Symbol",
  "Array",
  "Function",
  "Date",
  "Set",
  "Map",
  "WeakSet",
  "WeakMap",
  "RegExp",
  "Uint8Array",
  "Int8Array",
  "Uint16Array",
  "Int16Array",
  "Uint32Array",
  "Int32Array",
  "Float32Array",
  "Float64Array",
  "Uint8ClampedArray"
])

/* 判断给定的类是否是js的内置类型 */
export function isBasicType(type: Class): boolean {
  // 确保传入的是一个函数类型
  if (typeof type !== "function") {
    throw new TypeError("Expected a function type")
  }

  // 检查类型名称是否在基本类型集合中
  return basicTypes.has(type.name)
}
