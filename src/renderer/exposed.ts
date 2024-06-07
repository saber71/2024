/**
 * 主要负责初始化和提供与 Electron IPC 渲染器通信的相关功能。
 * 包括设置初始的 Electron API 实例，监听和处理来自 IPC 的消息，
 * 以及提供用于动态获取窗口信息和与 IPC 通信的函数。
 */
import type { Exposed, TransferDataToMainChannelMap, TransferDataToRendererChannelMap } from "@packages/exposed"
import { Channel, SyncData } from "@packages/sync"
import { VueClassMetadata } from "@packages/vue-class/metadata.ts"
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
function hook<
  Channel extends keyof TransferDataToRendererChannelMap,
  Value extends TransferDataToRendererChannelMap[Channel]
>(eventName: Channel, initValue: Value): Ref<UnwrapRef<Value>> {
  const result = ref(initValue)
  let gotIt = false
  listenIpcFromMain(eventName, (value: any) => {
    result.value = value
    gotIt = true
  })
  if (eventName === "window:isMaximized")
    invoke("window:isMaximized").then((val) => {
      if (!gotIt) result.value = val as any
    })
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
  isFullscreen: hook("window:isFullscreen", false),
  id: windowIdPromise,
  size: hook("window:size", [0, 0])
})

/**
 * 注册一个 IPC 事件的监听器。
 * @param channel - IPC 事件的频道名称。
 * @param callback - 当接收到 IPC 消息时执行的回调函数。
 * @returns 返回一个函数，调用该函数可取消事件监听。
 */
export function listenIpcFromMain<Channel extends keyof TransferDataToRendererChannelMap>(
  channel: Channel,
  callback: (args: TransferDataToRendererChannelMap[Channel]) => void
): () => void {
  return electronApi.ipcRenderer.on(channel, (_, args) => callback(args))
}

/**
 * 将数据传输到主进程。
 *
 * @param channel - 用于传输数据的通道名称，该通道必须是 `TransferDataToMainChannelMap` 中定义的键。
 * @param value - 要发送到主进程的数据，其类型取决于指定的通道名称。
 *
 * @typeparam Channel - `TransferDataToMainChannelMap` 中的键类型，限定了可以使用的通道名称。
 */
export function transferDataToMain<Channel extends keyof TransferDataToMainChannelMap>(
  channel: Channel,
  value: TransferDataToMainChannelMap[Channel]
) {
  // 通过 electronApi.ipcRenderer 发送数据到主进程。
  electronApi.ipcRenderer.send(channel, value)
}

// 等待窗口信息异步获取窗口ID
SyncData.id = await windowInfo.id

/**
 * 在客户端上注册一个IPC监听器。
 * @param channel IPC通道名称。
 * @param callback 接收到消息时调用的回调函数。
 */
SyncData.on = (channel, callback) => {
  electronApi.ipcRenderer.on(channel, (_, args) => callback(args))
}

/**
 * 向主进程发送IPC消息。
 * @param channel IPC通道名称。
 * @param args 传递给主进程的消息参数。
 */
SyncData.emit = (channel, args) => {
  electronApi.ipcRenderer.send(channel, args)
}

// 将窗口ID赋值给Channel对象
Channel.curDefaultWindowId = Channel.windowId = SyncData.id

/**
 * 在客户端上注册一个IPC监听器。
 * @param channel IPC通道名称。
 * @param callback 接收到消息时调用的回调函数。
 */
Channel.on = (channel, callback) => {
  electronApi.ipcRenderer.on(channel, (_, args) => callback(args))
}

/**
 * 向主进程发送IPC消息。
 * @param channel IPC通道名称。
 * @param args 传递给主进程的消息参数。
 */
Channel.emit = (channel, args) => {
  electronApi.ipcRenderer.send(channel, args)
}

Channel.off = (channel) => {
  electronApi.ipcRenderer.removeAllListeners(channel)
}

// 为Vue类元数据提供方法调用
VueClassMetadata.invokeFn = invoke
// 为Vue类元数据提供IPC监听方法
VueClassMetadata.listenIpc = listenIpcFromMain as any
