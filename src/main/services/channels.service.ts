import { mainEventBus } from "@main/eventBus.ts"
import { WindowService } from "@main/services/window.service.ts"
import type { CreateWindowOptions } from "@main/utility"
import type { Class } from "@packages/common"
import { Inject } from "@packages/dependency-injection"
import { Channel } from "@packages/sync"
import { CustomHandler, EventListener, Service, VueClass } from "@packages/vue-class"

const LABEL_PREFIX = "$$window_channels$$:"

/**
 * 用于映射窗口类型到其对应的Channel类。
 */
const windowChannelsClassMap = new Map<CreateWindowOptions["html"], Class<WindowChannels>>()

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
 * 注入渠道信息到窗口配置中。
 *
 * @param type 创建窗口选项中的HTML类型参数。此参数定义了将要注入渠道信息的HTML内容或路径。
 */
export function InjectChannels(type: CreateWindowOptions["html"]) {
  return CustomHandler({
    fn: (instance, metadata, propName) => {
      const type = metadata.customHandlers[propName].args
      Object.defineProperty(instance, propName, {
        get(): any {
          return VueClass.getInstance(ChannelsService).getWindowChannels(type)
        }
      })
    },
    args: type
  })
}

/**
 * ChannelsService类，管理窗口间的通信渠道。
 */
@Service()
export class ChannelsService {
  @Inject() windowService: WindowService

  /**
   * 存储每个窗口类型的通信渠道实例。
   */
  private readonly _map = new Map<CreateWindowOptions["html"], WindowChannels>()

  /**
   * 根据窗口类型获取窗口通道。
   *
   * 本函数旨在通过类型参数从映射中检索相应的窗口通道。它支持通过类型索引映射，以获取特定类型窗口的通道信息。
   * 这对于管理不同类型的窗口并根据需要进行操作是非常有用的。
   *
   * @param type 窗口的HTML类型，用于查找对应的窗口通道。
   * @returns 返回与指定窗口类型关联的通道数组。如果没有找到匹配的类型，返回undefined。
   */
  getWindowChannels(type: CreateWindowOptions["html"]) {
    return this._map.get(type)
  }

  /**
   * 当窗口关闭时，清理对应的通信渠道。
   * @param type 窗口类型。
   */
  @EventListener(mainEventBus, "onWindowClosed") disposeChannels(type: CreateWindowOptions["html"]) {
    const channels = this._map.get(type)
    if (channels && channels.disposeOnWindowClosed) {
      channels.dispose()
      this._map.delete(type)
      VueClass.getContainer().unbind(LABEL_PREFIX + type)
    }
  }

  /**
   * 当创建新窗口时，更新或创建对应的通信渠道。
   * @param type 窗口类型。
   */
  @EventListener(mainEventBus, "onCreateWindow") update(type: CreateWindowOptions["html"]) {
    let channels = this._map.get(type)
    if (!channels) {
      const clazz = windowChannelsClassMap.get(type)
      const window = this.windowService.getWindow(type)
      if (clazz && window) {
        channels = new clazz(this.windowService, type, window.id)
        this._map.set(type, channels)
        VueClass.getContainer().bindValue(LABEL_PREFIX + type, channels)
      }
    } else {
      channels.updateWindowId()
    }
  }
}

/**
 * WindowChannels类，为特定窗口类型管理通信渠道。
 */
export class WindowChannels {
  disposeOnWindowClosed = false

  /**
   * 创建WindowChannels实例。
   * @param windowService 窗口服务，用于获取窗口信息。
   * @param windowType 窗口类型。
   * @param _windowId 窗口ID。
   */
  constructor(
    readonly windowService: WindowService,
    readonly windowType: CreateWindowOptions["html"],
    private _windowId: number
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
  updateWindowId() {
    const window = this.windowService.getWindow(this.windowType)
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
