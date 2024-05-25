import type { Class } from "@packages/common"
import { getDecoratedName } from "@packages/dependency-injection"
import type { InvokeChannelMap } from "@packages/exposed"

// 定义一个数组，用来存储方法与通信频道的映射关系
export const channels: Array<{ methodName: string; clazz: Class; channel: string }> = []

/**
 * Handler 装饰器，用于标记方法为处理程序，并将其与通信频道关联起来。
 * @param channelName 可选参数，指定方法应关联的通信频道的名称。
 * @returns 返回一个函数，该函数用于动态修改目标对象的方法。
 */
export function Handler(channelName?: keyof InvokeChannelMap) {
  return (target: any, name: any) => {
    name = getDecoratedName(name) // 获取装饰过的方法名
    channels.push({ clazz: target.constructor, methodName: name, channel: channelName || name })
  }
}
