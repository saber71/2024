import type { Class } from "@packages/common"
import { getDecoratedName } from "@packages/dependency-injection"
import type { InvokeChannelMap } from "@packages/exposed"

export const channels: Array<{ methodName: string; clazz: Class }> = []

export function Handler(channelName?: keyof InvokeChannelMap) {
  return (target: any, name: any) => {
    name = channelName ?? getDecoratedName(name)
    channels.push({ clazz: target.constructor, methodName: name })
  }
}

export const mockChannels: Array<{ channel: keyof InvokeChannelMap; clazz: Class; methodName: string }> = []

export function MockHandler(channel?: keyof InvokeChannelMap) {
  return (target: any, name: any) => {
    name = getDecoratedName(name)
    mockChannels.push({
      channel: channel || name,
      methodName: name,
      clazz: target.constructor
    })
  }
}
