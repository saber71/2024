import { type ExtractArrayGenericType, isBrowser, remove } from "@packages/common"
import { ref, type Ref } from "vue"

interface Data<Value = any> {
  value?: Value
  windowId: number
}

type IntervalCallback<Value> = {
  value?: (() => Value) | Value
  setValue?: (windowId: number) => Value
  set?: (windowId: number) => Array<{ key: keyof Value; value: Value[keyof Value] }>
  delete?: (windowId: number) => Array<keyof Value>
  append?: (windowId: number) => ExtractArrayGenericType<Value>[]
  remove?: (windowId: number) => ExtractArrayGenericType<Value>[]
  interval: number
}

type InitValue<Value> =
  | Value
  | (() => Value)
  | (IntervalCallback<Value> & {
      value: (() => Value) | Value
    })

/**
 * 用于在主进程和指定的窗口间同步数据。
 * 当数据发生变化，向另一方发送事件。另一方则监听这些事件并更新自己的数据
 */
export class Channel<Value> {
  /**
   * 当前环境所属窗口id。如果是主进程，则为-1
   */
  static windowId: number = -1

  // 创建Channel时使用的默认窗口id
  static curDefaultWindowId: number = -1

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

  static off: (channel: string) => void

  /**
   * 静态方法：根据给定参数创建一个新的Channel实例。
   * 该方法主要用于初始化一个通道，并在浏览器环境中触发一个获取初始值的事件。
   *
   * @param name 通道的名称，用于标识和检索通道。
   * @param initValue 通道的初始值，用于设置通道的起始状态。
   * @param windowId 通道关联的窗口ID，默认为SyncData的id。窗口ID用于区分不同窗口间的通道。
   * @returns 返回创建的Channel实例。
   */
  static create<Value>(name: string, initValue: InitValue<Value>, windowId: number = Channel.curDefaultWindowId) {
    const data = new Channel<Value>(name, initValue, windowId)
    if (isBrowser) Channel.emit(data.eventNames.getValue.request, { value: null, windowId })
    return data
  }

  private constructor(
    readonly name: string,
    initValue: InitValue<Value>,
    relateWindowId: number
  ) {
    /**
     * 根据初始化值的类型，设置_ref的引用。
     * 如果初始化值是函数，则直接调用该函数并设置结果为_ref的引用。
     * 如果初始化值是对象，则将value函数调用的结果设置为_ref的引用，并定时调用函数。
     * 其他情况下，直接将初始化值设置为_ref的引用。
     */
    if (typeof initValue === "function") this._ref = ref((initValue as any)()) as any
    else if (typeof initValue === "object" && initValue && "interval" in initValue) {
      this._ref = ref() as any
      this.setIntervalCallback(initValue)
    } else this._ref = ref(initValue) as any

    /**
     * 设置相关窗口的ID，并根据名称前缀生成事件名。
     */
    this.relateWindowId = relateWindowId

    this.eventNames.getValue.request += name
    this.eventNames.getValue.response += name
    this.eventNames.sync += name
    this.eventNames.array.append += name
    this.eventNames.array.remove += name
    this.eventNames.object.set += name
    this.eventNames.object.delete += name

    /**
     * 监听getValue.request事件，当收到请求时，如果请求来源与当前窗口ID匹配，则响应请求并发送当前值。
     */
    Channel.on(this.eventNames.getValue.request, (data) => {
      if (data.windowId !== this.relateWindowId) return
      Channel.emit(this.eventNames.getValue.response, {
        value: this.value,
        windowId: data.windowId
      })
    })

    /**
     * 监听getValue.response事件，当收到响应时，如果响应来源与当前窗口ID匹配，则更新_ref的值。
     */
    Channel.on(this.eventNames.getValue.response, (data) => {
      if (data.windowId !== this.relateWindowId) return
      this._ref.value = data.value
    })

    /**
     * 监听sync事件，当收到同步请求时，如果请求来源与当前窗口ID匹配，则更新_ref的值。
     */
    Channel.on(this.eventNames.sync, (data) => {
      if (data.windowId !== this.relateWindowId) return
      this._ref.value = data.value
    })

    /**
     * 监听array.append事件，当收到数组追加请求时，如果请求来源与当前窗口ID匹配且当前值是数组，则追加元素。
     */
    Channel.on(this.eventNames.array.append, (data) => {
      if (data.windowId !== this.relateWindowId) return
      if (this.value instanceof Array) this.value.push(...data.value)
      else throw new Error("value is not array")
    })

    /**
     * 监听array.remove事件，当收到数组移除请求时，如果请求来源与当前窗口ID匹配且当前值是数组，则移除元素。
     */
    Channel.on(this.eventNames.array.remove, (data) => {
      if (data.windowId !== this.relateWindowId) return
      if (this.value instanceof Array) {
        for (let item of data.value) {
          remove(this.value, item)
        }
      } else throw new Error("value is not array")
    })

    /**
     * 监听object.set事件，当收到对象属性设置请求时，如果请求来源与当前窗口ID匹配，则设置对象属性。
     */
    Channel.on(this.eventNames.object.set, (data) => {
      if (data.windowId !== this.relateWindowId) return
      for (let { key, value } of data.value) {
        ;(this.value as any)[key] = value
      }
    })

    /**
     * 监听object.delete事件，当收到对象属性删除请求时，如果请求来源与当前窗口ID匹配，则删除对象属性。
     */
    Channel.on(this.eventNames.object.delete, (data) => {
      if (data.windowId !== this.relateWindowId) return
      for (let key of data.value) {
        delete (this.value as any)[key]
      }
    })
  }

  // 相关窗口的ID，用于标识数据来源。
  relateWindowId: number

  /**
   * 定义了一个私有的、只读的间隔处理程序属性，用于处理定时任务。
   */
  private _intervalHandler: any

  /**
   * 定义了一个私有的、只读的引用属性，用于存储和访问特定于实现的值。
   */
  private readonly _ref: Ref<Value>

  /**
   * 定义了一个公共的、只读的事件名对象，包含了各种操作的事件名。
   */
  readonly eventNames = {
    getValue: {
      response: "getValue.response:",
      request: "getValue.request:"
    },
    sync: "_channel_sync_:",
    array: {
      append: "appendArray:",
      remove: "removeArray:"
    },
    object: {
      set: "setObjectKeys:",
      delete: "deleteObjectKeys"
    }
  }

  /**
   * 获取当前引用的只读值。
   */
  get value(): Readonly<Value> {
    return this._ref.value
  }

  /**
   * 设置一个定时器，根据传入的回调函数定期更新组件的值或状态。
   * @param intervalCallback 一个包含各种操作方法和间隔时间的对象。
   *                         这些方法可以在指定的时间间隔内被调用，以更新组件的状态或值。
   */
  setIntervalCallback(intervalCallback: IntervalCallback<Value>) {
    // 如果已存在定时器，则清除之前的定时器，避免重复执行。
    if (this._intervalHandler) clearInterval(this._intervalHandler)

    // 检查intervalCallback是否包含value属性，并且如果是函数，则调用该函数并设置组件的值。
    if ("value" in intervalCallback) {
      if (typeof intervalCallback.value === "function") this.setValue((intervalCallback.value as any)())
      else this.setValue(intervalCallback.value as any)
    }

    // 设置一个新的定时器，根据intervalCallback中定义的方法定期更新组件。
    // 这包括设置新值、执行各种操作如添加、删除等，具体操作取决于intervalCallback中定义的方法。
    this._intervalHandler = setInterval(() => {
      if (typeof intervalCallback.setValue === "function") this.setValue(intervalCallback.setValue(this.relateWindowId))
      if (typeof intervalCallback.set === "function") this.set(...intervalCallback.set(this.relateWindowId))
      if (typeof intervalCallback.append === "function") this.append(...intervalCallback.append(this.relateWindowId))
      if (typeof intervalCallback.remove === "function") this.remove(...intervalCallback.remove(this.relateWindowId))
      if (typeof intervalCallback.delete === "function") this.delete(...intervalCallback.delete(this.relateWindowId))
    }, intervalCallback.interval)
  }

  /**
   * 销毁实例，清除定时器。
   */
  dispose() {
    if (this._intervalHandler) {
      clearInterval(this._intervalHandler)
    }
    Channel.off(this.eventNames.array.append)
    Channel.off(this.eventNames.array.remove)
    Channel.off(this.eventNames.object.delete)
    Channel.off(this.eventNames.object.set)
    Channel.off(this.eventNames.sync)
    Channel.off(this.eventNames.getValue.request)
    Channel.off(this.eventNames.getValue.response)
  }

  /**
   * 立即同步当前值到通道。
   */
  flush() {
    Channel.emit(this.eventNames.sync, { value: this.value, windowId: this.relateWindowId })
  }

  /**
   * 设置新值，并同步到通道。
   * @param value 新的值。
   */
  setValue(value: Value) {
    if (value === this.value) return
    this._ref.value = value
    Channel.emit(this.eventNames.sync, { value, windowId: this.relateWindowId })
  }

  /**
   * 向数组末尾追加元素，并同步到通道。
   * @param items 要追加的元素数组。
   */
  append(...items: ExtractArrayGenericType<Value>[]) {
    if (items.length === 0) return
    const value = this.value
    if (value instanceof Array) value.push(...items)
    else throw new Error("value is not array")
    Channel.emit(this.eventNames.array.append, { value: items, windowId: this.relateWindowId })
  }

  /**
   * 向数组末尾追加不重复的元素，并同步到通道。
   * @param items 要追加的元素数组。
   */
  appendNoRepeat(...items: ExtractArrayGenericType<Value>[]) {
    if (items.length === 0) return
    const value = this.value
    if (value instanceof Array) {
      const result: any[] = []
      for (let item of items) {
        if (value.includes(item)) continue
        result.push(item)
        value.push(item)
      }
      if (result.length) Channel.emit(this.eventNames.array.append, { value: result, windowId: this.relateWindowId })
    } else throw new Error("value is not array")
  }

  /**
   * 从数组中移除元素，并同步到通道。
   * @param items 要移除的元素数组。
   */
  remove(...items: ExtractArrayGenericType<Value>[]) {
    if (items.length === 0) return
    remove(this.value as any, items)
    Channel.emit(this.eventNames.array.remove, { value: items, windowId: this.relateWindowId })
  }

  /**
   * 设置对象属性的值，并同步到通道。
   * @param items 包含属性键值对的数组。
   */
  set(...items: Array<{ key: keyof Value; value: Value[keyof Value] }>) {
    if (items.length === 0) return
    const result: any[] = []
    for (let item of items) {
      const { key, value } = item
      const oldValue = this.value[key]
      if (oldValue === value) continue
      ;(this.value as any)[key] = value
      result.push(item)
    }
    if (result.length) Channel.emit(this.eventNames.object.set, { value: result, windowId: this.relateWindowId })
  }

  /**
   * 删除对象的属性，并同步到通道。
   * @param items 要删除的属性键数组。
   */
  delete(...items: Array<keyof Value>) {
    if (items.length === 0) return
    for (let key of items) {
      delete (this.value as any)[key]
    }
    Channel.emit(this.eventNames.object.delete, { value: items, windowId: this.relateWindowId })
  }
}
