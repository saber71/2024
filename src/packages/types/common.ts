/* 类的定义 */
export type Class<T = any, P extends Array<any> = Array<any>> = {
  new (...args: P): T
}

/* 抽取出Promise泛型类型*/
export type ExtractPromiseGenericType<T> = T extends Promise<infer U> ? U : T

export type DeepCloneOption = Partial<{
  cloneMapKey: boolean
}>

export type TypedArray =
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array
