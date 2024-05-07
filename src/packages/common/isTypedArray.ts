import type { TypedArray } from "./types"

export function isTypedArray(arr: any): arr is TypedArray {
  return (
    arr instanceof Uint8Array ||
    arr instanceof Uint8ClampedArray ||
    arr instanceof Uint16Array ||
    arr instanceof Uint32Array ||
    arr instanceof Int8Array ||
    arr instanceof Int16Array ||
    arr instanceof Int32Array ||
    arr instanceof Float32Array ||
    arr instanceof Float64Array
  )
}
