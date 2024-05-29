import type { Class } from "@packages/common"
import type { InvokeChannelMap } from "@packages/exposed"
import type { FsInvokeChannelMap } from "@packages/ipc-handler/fs.ts"
import type { PhotoInvokeChannelMap } from "@packages/ipc-handler/photo.ts"
import type { WindowInvokeChannelMap } from "@packages/ipc-handler/window.ts"
import { ipcMain } from "electron"
import { channels, Handler } from "./decorator.ts"
import "./photo.ts"
import "./fs.ts"
import "./window.ts"

/**
 * 定义了一组channel映射，用于规范不同操作的参数和返回值。
 */
export interface IpcInvokeChannelMap extends PhotoInvokeChannelMap, FsInvokeChannelMap, WindowInvokeChannelMap {
  ping: {
    args: ["123", 1]
    return: void
  }
}

/**
 * `IpcHandler` 类用于安装和处理IPC（Inter-Process Communication）事件。
 */
export class IpcHandler {
  private static readonly _instances = new Map<Class, InstanceType<any>>()

  /**
   * 在静态方法 `install` 中，通过遍历 `channels` 数组来安装所有的IPC处理器。
   * 对于每个频道，它将创建一个实例（如果尚未创建），并为该频道绑定相应的事件处理函数。
   */
  static install() {
    for (let item of channels) {
      // 遍历所有通道配置项。
      let instance = this._instances.get(item.clazz) // 尝试获取当前通道对应的实例。
      if (!instance) this._instances.set(item.clazz, (instance = new item.clazz())) // 如果实例不存在，则创建并存储一个新实例。
      ipcMain.handle(item.channel, (e, ...args) => instance[item.methodName](...args, e)) // 绑定事件处理函数。
    }
  }

  /**
   * 获取指定类的实例。
   * @param clazz 需要获取实例的类，类型为 Class<T>。
   * @returns 返回该类的实例，类型为 T。
   * @throws 如果该类的实例不存在，则抛出错误。
   */
  static getInstance<T>(clazz: Class<T>): T {
    // 尝试从实例缓存中获取 clazz 的实例
    const result = this._instances.get(clazz)
    if (!result) throw new Error(`${clazz.name} instance not found`)
    return result
  }

  /**
   * 处理 `ping` 频道的IPC事件。测试用
   * @param args - 传递给 `ping` 方法的参数。
   */
  @Handler() ping(...args: InvokeChannelMap["ping"]["args"]) {
    console.log(...args) // 在控制台日志中输出传入的参数。
  }
}
