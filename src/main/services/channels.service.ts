import { mainEventBus } from "@main/eventBus.ts"
import { WindowService } from "@main/services/window.service.ts"
import type { CreateWindowOptions } from "@main/utility"
import { Inject } from "@packages/dependency-injection"
import { getWindowChannelsClass, WindowChannels } from "@packages/sync"
import { CustomHandler, EventListener, Service, VueClass } from "@packages/vue-class"

const LABEL_PREFIX = "$$window_channels$$:"

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
   * @throws 如果没有找到匹配的类型抛出错误
   * @returns 返回与指定窗口类型关联的通道数组。
   */
  getWindowChannels<T extends WindowChannels = WindowChannels>(type: CreateWindowOptions["html"]): T {
    const result = this._map.get(type)
    if (!result) throw new Error(type + ":window channels not found")
    return result as T
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
    const window = this.windowService.getWindow(type)
    if (!channels) {
      const clazz = getWindowChannelsClass(type)
      if (clazz && window) {
        channels = new clazz(type, window.id)
        this._map.set(type, channels)
        VueClass.getContainer().bindValue(LABEL_PREFIX + type, channels)
        mainEventBus.emit("onCreateWindowChannels", type)
      }
    } else {
      if (window) channels.updateWindowId(window)
    }
  }
}
