import { type ExtractArrayGenericType, isBrowser, remove } from "@packages/common"
import { ref, type Ref } from "vue"

interface Data<Value = any> {
  value?: Value
  fromId: number
  requestFromId?: number
}

const nameCaches = new Set<string>()

/**
 * 同步数据类，用于在不同环境（如浏览器和Node.js）间同步数据。
 * 通过事件机制来实现数据的更新和传播。
 *
 * @template Value 数据的类型。
 */
export class SyncData<Value> {
  /**
   * @param name 实例的名称，用于标识和区分不同的实例。
   * @param initValue 实例的初始值，用于设置实例的初始状态。
   * @throws 如果实例的名称与已存在的实例名称冲突，则抛出错误。
   */
  private constructor(
    readonly name: string,
    initValue: Value
  ) {
    // 检查名称是否已存在，避免名称冲突。
    if (nameCaches.has(name)) throw new Error("name conflict")
    nameCaches.add(name)

    // 使用ref创建一个引用，用于缓存数据和方便监听变化。
    this._refValue = ref(initValue) as any

    // 注册各种事件通道，用于数据的同步和更新。
    this.channels.getValue.request += name
    this.channels.getValue.response += name
    this.channels.setValue += name
    this.channels.updateObjectValue += name
    this.channels.appendArrayValue += name
    this.channels.removeArrayValue += name
    this.channels.removeObjectValue += name

    // 监听getValue的响应，更新本地值。
    SyncData.on(this.channels.getValue.response, (data) => {
      // 如果请求事件的发送方为本地实例，则更新本地值。
      if (data.requestFromId === SyncData.id) this._refValue.value = data.value
    })
    // 监听getValue的请求，如果不在浏览器环境中，则响应请求。
    SyncData.on(this.channels.getValue.request, (data) => {
      if (isBrowser) return
      SyncData.emit(this.channels.getValue.response, {
        value: this.value,
        fromId: SyncData.id,
        requestFromId: data.fromId
      })
    })
    // 监听setValue事件，直接更新本地值。
    SyncData.on(this.channels.setValue, (data) => {
      this._refValue.value = data.value
    })
    // 监听appendArrayValue事件，向数组中添加元素。
    SyncData.on(this.channels.appendArrayValue, (data) => {
      const value = this.value
      if (value instanceof Array) value.push(...data.value)
      else throw new Error("value is not array")
    })
    // 监听removeArrayValue事件，从数组中移除元素。
    SyncData.on(this.channels.removeArrayValue, (data) => {
      const value = this.value
      if (value instanceof Array) remove(value, data.value)
      else throw new Error("value is not array")
    })
    // 监听removeObjectValue事件，删除对象的属性。
    SyncData.on(this.channels.removeObjectValue, (data) => {
      for (let key of data.value) {
        delete (this.value as any)[key]
      }
    })
    // 监听updateObjectValue事件，更新对象的属性值。
    SyncData.on(this.channels.updateObjectValue, (data) => {
      ;(this.value as any)[data.value.key] = data.value.value
    })
  }

  /**
   * 当前环境内的SyncData实例共享的id，其值等于当前窗口id
   * 在主进程中，id为-1不变
   */
  static id: number = -1

  /**
   * 订阅指定频道的事件。
   * @param channel 频道名称，用于指定订阅的事件类型。
   * @param callback 当频道内发生事件时调用的回调函数。
   *                 回调函数接收事件数据作为参数。
   */
  static on: (channel: string, callback: (data: Data) => void) => void

  /**
   * 在指定频道发布事件。
   * @param channel 频道名称，用于指定发布的事件类型。
   * @param data 发布的事件数据。
   */
  static emit: (channel: string, data: Data) => void

  // 保存本地数据，使用ref方便监听数据改变，以及当用在vue页面中时可以被vue监听到。
  // 私有数据，避免被外部直接访问和修改。要想改变需要通过实例方法
  private readonly _refValue: Ref<Value>

  // 定义事件频道，用于订阅和发布事件。
  readonly channels = {
    getValue: {
      response: "getValue:response:",
      request: "getValue:request:"
    },
    setValue: "setValue:",
    appendArrayValue: "appendArrayValue:",
    removeArrayValue: "removeArrayValue:",
    removeObjectValue: "removeObjectValue:",
    updateObjectValue: "updateObjectValue:"
  }

  /**
   * 创建并初始化一个 SyncData 实例。
   * 如果在浏览器环境中，则向nodejs请求数据初始化。
   *
   * @param {string} name 数据的名称。
   * @param {Value} initValue 初始化的数据值。
   */
  static create<Value>(name: string, initValue: Value) {
    const data = new SyncData(name, initValue)
    if (isBrowser) SyncData.emit(data.channels.getValue.request, { fromId: SyncData.id })
    return data
  }

  // 返回当前的数据值。
  get value() {
    return this._refValue.value
  }

  /**
   * 刷新数据，通过事件发射机制将当前值同步到订阅了相应事件的实例。
   */
  flush() {
    SyncData.emit(this.channels.setValue, { fromId: SyncData.id, value: this.value })
  }

  /**
   * 设置值，并同步到订阅了相应事件的实例。
   * 如果新值与当前引用值相同，则不进行设置。
   * @param value 新的值
   */
  setValue(value: Value) {
    if (value === this._refValue.value) return
    this._refValue.value = value
    SyncData.emit(this.channels.setValue, { fromId: SyncData.id, value })
  }

  /**
   * 向数组中追加值，并同步到订阅了相应事件的实例。
   * 如果当前值不是数组，则抛出错误。
   * @param items 要追加的值的数组
   */
  appendArrayValue(...items: ExtractArrayGenericType<Value>[]) {
    if (items.length === 0) return
    const value = this.value
    if (value instanceof Array) {
      value.push(...items)
      SyncData.emit(this.channels.appendArrayValue, { fromId: SyncData.id, value: items })
    } else throw new Error("value is not array")
  }

  /**
   * 向数组值中添加新元素，但避免重复。
   * @param items 要添加到数组的元素列表。
   */
  appendArrayValueNoRepeat(...items: ExtractArrayGenericType<Value>[]) {
    if (items.length === 0) return
    const value = this.value
    if (value instanceof Array) {
      const noRepeats: any[] = []
      for (let item of items) {
        const exist = value.includes(item)
        if (!exist) {
          noRepeats.push(item)
          value.push(item)
        }
      }
      if (noRepeats.length === 0) return
      SyncData.emit(this.channels.appendArrayValue, { fromId: SyncData.id, value: noRepeats })
    } else throw new Error("value is not array")
  }

  /**
   * 从数组中移除指定的元素。
   * @param items 要从数组中移除的元素列表。
   */
  removeArrayValue(...items: ExtractArrayGenericType<Value>[]) {
    if (items.length === 0) return
    const value = this.value
    if (value instanceof Array) {
      remove(value, items)
      SyncData.emit(this.channels.removeArrayValue, { fromId: SyncData.id, value: items })
    } else throw new Error("value is not array")
  }

  /**
   * 更新对象的某个属性值。
   * @param key 要更新的属性的键。
   * @param value 要更新的属性的新值。
   */
  updateObjectValue<Key extends keyof Value>(key: Key, value: Value[Key]) {
    const oldValue = this.value[key]
    if (oldValue === value) return
    this.value[key] = oldValue
    SyncData.emit(this.channels.updateObjectValue, { fromId: SyncData.id, value: { key, value } })
  }

  /**
   * 移除对象中的多个属性。
   * @param keys 要移除的属性的键列表。
   */
  removeObjectValue(...keys: Array<keyof Value>) {
    if (keys.length) return
    for (let key of keys) {
      delete this.value[key]
    }
    SyncData.emit(this.channels.updateObjectValue, { fromId: SyncData.id, value: keys })
  }
}
