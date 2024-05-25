/**
 * 主要负责初始化和提供与 Electron IPC 渲染器通信的相关功能。
 * 包括设置初始的 Electron API 实例，监听和处理来自 IPC 的消息，
 * 以及提供用于动态获取窗口信息和与 IPC 通信的函数。
 */
import type { Exposed, SendChannelMap } from "@packages/exposed"
import { ref, type Ref, unref, type UnwrapRef } from "vue"

// 将 `window` 对象强制转换为 `Exposed` 类型，以获取或设置其特定属性。
const exposed: Exposed = window as any

/**
 * 获取并保存electronApi的引用
 * 该操作不接受任何参数
 * 也不直接返回任何值，但保存了electronApi的引用以供后续使用
 */
const electronApi = exposed.electronApi

/**
 * 获取并保存exposed对象中的api属性。
 */
const api = exposed.api

// 获取当前窗口的id
const windowIdPromise = api.invoke("window:id")

/**
 * 提供一个用于调用 IPC 接口的函数。
 * @param args - 调用 IPC 接口所需的参数。
 * @returns 返回 IPC 调用的结果。
 */
export const invoke: Exposed["api"]["invoke"] = async (...args: any[]) => {
  return (api.invoke as any)(...args.map((item) => unref(item)), await windowIdPromise)
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
  id: windowIdPromise
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
