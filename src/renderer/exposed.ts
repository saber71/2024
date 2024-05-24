/**
 * 主要负责初始化和提供与 Electron IPC 渲染器通信的相关功能。
 * 包括设置初始的 Electron API 实例，监听和处理来自 IPC 的消息，
 * 以及提供用于动态获取窗口信息和与 IPC 通信的函数。
 */
import type { IpcRendererListener } from "@electron-toolkit/preload"
import type { Exposed, SendChannelMap } from "@packages/exposed"
import { ref, type Ref, type UnwrapRef } from "vue"

// 将 `window` 对象强制转换为 `Exposed` 类型，以获取或设置其特定属性。
const exposed: Exposed = window as any

// 如果 `exposed.electronApi` 未定义，则提供一个默认的 `ipcRenderer` 实现。
const electronApi = exposed.electronApi ?? {
  ipcRenderer: {
    on(channel: string, listener: IpcRendererListener) {},
    once(channel: string, listener: IpcRendererListener) {}
  }
}

// 创建一个 Promise，用于在接收到 "sendWindowId" 事件时解析窗口 ID。
const receiveWindowIdPromise = new Promise<number>((resolve) => {
  listenIpcRenderer("sendWindowId", (id) => resolve(id))
})

// 如果 `exposed.api` 未定义，则提供一个默认的 API 实现。
const api = exposed.api ?? {
  invoke: (await import("@packages/ipc-handler/mock.ts")).MockIpcHandler.install()
}

/**
 * 提供一个用于调用 IPC 接口的函数。
 * @param args - 调用 IPC 接口所需的参数。
 * @returns 返回 IPC 调用的结果。
 */
export const invoke: Exposed["api"]["invoke"] = async (...args: any[]) => {
  return (api.invoke as any)(...args, await receiveWindowIdPromise)
}

/**
 * 为指定的 IPC 事件创建一个响应式数据。
 * @param eventName - IPC 事件的名称。
 * @param initValue - 响应式数据的初始值。
 * @returns 返回一个响应式变量，其值会随着 IPC 事件的消息更新。
 */
function hook<Channel extends keyof SendChannelMap, Value extends SendChannelMap[Channel]>(
  eventName: Channel,
  initValue: Value
): Ref<UnwrapRef<Value>> {
  const result = ref(initValue)
  listenIpcRenderer(eventName, (value: any) => (result.value = value))
  return result
}

/**
 * 提供有关当前窗口的信息，包括是否显示、最大化和聚焦，以及窗口的 ID。
 * 信息通过与 IPC 通信获取，并以只读的冻结对象形式提供。
 */
export const windowInfo = Object.freeze({
  isShow: hook("window:isShow", true),
  isMaximize: hook("window:isMaximized", false),
  isFocus: hook("window:isFocus", false),
  id: receiveWindowIdPromise
})

/**
 * 注册一个 IPC 事件的监听器。
 * @param channel - IPC 事件的频道名称。
 * @param callback - 当接收到 IPC 消息时执行的回调函数。
 * @returns 返回一个函数，调用该函数可取消事件监听。
 */
export function listenIpcRenderer<Channel extends keyof SendChannelMap>(
  channel: Channel,
  callback: (args: SendChannelMap[Channel]) => void
): () => void {
  return electronApi.ipcRenderer.on(channel, (_, args) => callback(args))
}
