import type { Class } from "@packages/common"
import { getDecoratedName } from "@packages/dependency-injection"
import type { InvokeChannelMap } from "@packages/exposed"

export const channels: Array<{ methodName: string; clazz: Class; channel: string }> = []

export function Handler(channelName?: keyof InvokeChannelMap) {
  return (target: any, name: any) => {
    name = getDecoratedName(name)
    channels.push({ clazz: target.constructor, methodName: name, channel: channelName || name })
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
