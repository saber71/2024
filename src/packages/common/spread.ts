/**
 * 使用给定的函数对指定范围内的每个数字进行处理，并返回处理结果的数组。
 * @param start 起始数字，包含在处理范围内。
 * @param end 结束数字，包含在处理范围内。
 * @param fn 一个函数，接受一个数字参数（在指定范围内），并返回一个结果。
 * @returns 返回一个数组，包含从起始数字到结束数字（包括两者）范围内，每个数字经过fn函数处理后的结果。
 */
export function spread<Result>(start: number, end: number, fn: (index: number) => Result): Result[] {
  const result: Result[] = [] // 初始化存储结果的数组

  // 遍历指定范围内的每个数字，使用fn函数处理，并将结果添加到结果数组中
  for (let i = start; i <= end; i++) {
    result.push(fn(i))
  }

  return result // 返回处理后的结果数组
}
