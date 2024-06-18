import type { CreateWindowOptions } from "@main/utility"
import type { Class } from "@packages/common"
import type { BrowserWindow } from "electron"
import { Channel } from "./Channel"

/**
 * 用于映射窗口类型到其对应的Channel类。
 */
const windowChannelsClassMap = new Map<CreateWindowOptions["html"], Class<WindowChannels>>()

/**
 * 根据窗口类型获取对应的窗口渠道类。
 *
 * 本函数旨在通过给定的窗口HTML类型，从一个映射表中检索相应的窗口渠道类。这允许对不同类型的窗口应用特定的逻辑或配置，
 * 从而实现窗口的灵活管理和定制。
 *
 * @param type 窗口的HTML类型，用于在映射表中查找对应的窗口渠道类。
 * @returns 返回查找到的窗口渠道类，如果未找到则返回undefined。
 */
export function getWindowChannelsClass(type: CreateWindowOptions["html"]) {
  return windowChannelsClassMap.get(type)
}

/**
 * 注册一个窗口Channel类。
 * @param type 窗口类型，用于唯一标识。
 */
export function Channels(type: CreateWindowOptions["html"]) {
  return (clazz: Class<WindowChannels>) => {
    windowChannelsClassMap.set(type, clazz)
  }
}

/**
 * WindowChannels类，为特定窗口类型管理通信渠道。
 */
export class WindowChannels {
  disposeOnWindowClosed = false

  /**
   * 创建WindowChannels实例。
   * @param windowType 窗口类型。
   * @param _windowId 窗口ID。
   */
  constructor(
    readonly windowType: CreateWindowOptions["html"],
    private _windowId: number = Channel.curDefaultWindowId
  ) {
    Channel.curDefaultWindowId = _windowId
  }

  /**
   * 清理所有通信渠道。
   */
  dispose() {
    this.getChannels().forEach((channel) => channel.dispose())
  }

  /**
   * 更新窗口ID，当窗口ID发生变化时调用。
   */
  updateWindowId(window: BrowserWindow) {
    if (window && window.id !== this._windowId) {
      this._windowId = window.id
      this.getChannels().forEach((channel) => (channel.relateWindowId = window.id))
    }
    return this
  }

  /**
   * 获取所有通信渠道。
   * @returns 当前实例包含的所有通信渠道。
   */
  getChannels(): Channel<any>[] {
    return Object.values(this).filter((val) => val instanceof Channel)
  }
}

// 在渲染进程中创建WindowChannels实例
export function createWindowChannels<T extends WindowChannels>(clazz: Class<T>): T {
  return new clazz("")
}
