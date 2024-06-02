/**
 * 函数节流器
 * @param fn 要节流的函数
 * @param delay 延迟的毫秒数
 * @returns 返回一个新函数，新函数在调用时如果之前调用未超过指定的延时时间，则会阻止调用原函数，直到超过指定延时时间。
 */
export function throttle<F extends Function>(fn: F, delay: number) {
  let handler: any // 用于存储定时器的引用
  let lastArgs: any[] = [] //存储最近一次的入参

  // 返回一个封装函数来控制原函数的调用
  const func = function (...args: any[]) {
    lastArgs = args
    if (handler) return func // 如果定时器存在，则不执行原函数，直接返回

    // 设置定时器，并在延时后清除定时器并执行原函数
    handler = setTimeout(() => {
      handler = null // 清除定时器引用
      fn(...lastArgs) // 执行原函数，使用最新的入参
    }, delay)

    return func
  }
  func.cancel = () => {
    clearTimeout(handler)
    handler = null
  }
  func.immediate = () => {
    if (handler) {
      clearTimeout(handler)
      handler = null
    }
    fn(...lastArgs)
  }
  return func
}

export function throttleFnImmediate(fn: Function) {
  ;(fn as any).immediate()
}
