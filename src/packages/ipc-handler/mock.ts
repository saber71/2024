import type { Exposed } from "@packages/exposed"
import { mockChannels, MockHandler } from "./handler.ts"

export class MockIpcHandler {
  static install(): Exposed["api"]["invoke"] {
    const instanceMap = new Map()
    const callbackMap = new Map()
    for (let item of mockChannels) {
      let instance = instanceMap.get(item.clazz)
      if (!instance) instanceMap.set(item.clazz, (instance = new item.clazz()))
      callbackMap.set(item.channel, instance[item.methodName].bind(instance))
    }
    return (channel: string, ...args: any[]): any => {
      const callback = callbackMap.get(channel)
      if (callback) return callback(...args)
      console.warn(`Not implement the channel ${channel} in mock`)
    }
  }

  @MockHandler() ping(...args: any) {
    console.log("ping", args)
  }

  @MockHandler("openPhoto") openPhoto() {
    window.open("/photo/photo.html")
  }
}
