/**
 * 检查当前环境是否为浏览器环境。
 * 通过判断全局 `process` 对象是否存在以及 `process.nextTick` 方法是否为函数来判断。
 */

const process = global.process
export const isBrowser = process && typeof process.nextTick === "function"

// 在 Node.js 环境中，`process` 是全局对象且提供了 `nextTick` 方法，
// 而在大多数浏览器环境中，`process` 未定义或不提供 `nextTick` 方法。
// 因此，通过检查 `process` 的存在性和 `nextTick` 方法的类型，可以区分当前环境是浏览器还是 Node.js。
