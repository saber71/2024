/**
 * 函数防抖动封装。
 * 函数防抖是一种优化策略，用于限制函数调用的频率。当一个函数连续调用时，防抖函数会推迟该函数的执行，直到调用停止超过指定的延迟时间。
 * @param fn 需要被防抖的函数。
 * @param delay 延迟时间（毫秒）。
 * @returns 返回一个经过防抖处理的函数。
 */
export function debounce<Fn extends Function>(fn: Fn, delay: number): Fn {
  // 上一次调用函数时的参数存储
  let lastArgs: any[] = []
  // 定时器句柄
  let handler: any

  // 返回一个封装函数，以实现防抖逻辑
  return ((...args: any[]) => {
    // 更新上一次的参数为当前调用的参数
    lastArgs = args
    // 如果存在定时器，则清除之前的定时器
    if (handler) clearTimeout(handler)
    // 设置新的定时器，延迟执行原函数
    handler = setTimeout(() => {
      handler = null // 清空定时器句柄
      fn(...lastArgs) // 执行原函数，传入上一次调用的参数
    }, delay)
  }) as any
}
