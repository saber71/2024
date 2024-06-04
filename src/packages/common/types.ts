/**
 * 类型定义了一个类，其中T表示类实例的类型，P是一个参数数组的类型。
 * 这个类型确保你可以定义一个类，并指定它在实例化时接受的参数类型和返回的实例类型。
 */
export type Class<T = any, P extends Array<any> = Array<any>> = {
  new (...args: P): T
}

/**
 * 类型推断：如果T是Promise类型，则提取并返回Promise内部的泛型类型U；否则，直接返回T。
 * 主要用于获取Promise的泛型参数类型。
 */
export type ExtractPromiseGenericType<T> = T extends Promise<infer U> ? U : T

/**
 * 提取数组泛型的元素类型。
 *
 * 该类型别名用于判断一个泛型T是否为数组类型，并从中提取出数组元素的类型。
 * 如果泛型T不是数组类型，则直接返回T。
 * 这种类型操作在处理泛型数组或需要获取数组元素类型的情境中非常有用。
 *
 * @param T - 被检查的泛型类型，它可以是任何类型，包括数组类型。
 * @returns 如果T是数组类型，则返回数组的元素类型；否则返回T本身。
 */
export type ExtractArrayGenericType<T> = T extends Array<infer U> ? U : T

export type DeepCloneOption = Partial<{
  cloneMapKey: boolean
}>

/**
 * TypedArray 是一组TypedArray类型的联合类型。
 * TypedArray 是一种特殊的Array，用于存储固定大小的数值类型元素，提供了更高的性能和类型安全。
 */
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
