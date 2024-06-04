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
  private constructor(
    readonly name: string,
    initValue: Value
  ) {
    if (nameCaches.has(name)) throw new Error("name conflict")
    nameCaches.add(name)

    this._refValue = ref(initValue) as any

    this.channels.getValue.request += name
    this.channels.getValue.response += name
    this.channels.setValue += name
    this.channels.updateObjectValue += name
    this.channels.appendArrayValue += name
    this.channels.removeArrayValue += name
    this.channels.removeObjectValue += name

    SyncData.on(this.channels.getValue.response, (data) => {
      if (data.requestFromId === SyncData.id) this._refValue.value = data.value
    })
    SyncData.on(this.channels.getValue.request, (data) => {
      if (isBrowser) return
      SyncData.emit(this.channels.getValue.response, {
        value: data.value,
        fromId: SyncData.id,
        requestFromId: data.fromId
      })
    })
    SyncData.on(this.channels.setValue, (data) => (this._refValue.value = data.value))
    SyncData.on(this.channels.appendArrayValue, (data) => {
      const value = this.value
      if (value instanceof Array) value.push(...data.value)
      else throw new Error("value is not array")
    })
    SyncData.on(this.channels.removeArrayValue, (data) => {
      const value = this.value
      if (value instanceof Array) remove(value, data.value)
      else throw new Error("value is not array")
    })
    SyncData.on(this.channels.removeObjectValue, (data) => {
      for (let key of data.value) {
        delete (this.value as any)[key]
      }
    })
    SyncData.on(this.channels.updateObjectValue, (data) => {
      ;(this.value as any)[data.value.key] = data.value.value
    })
  }

  static id: number = -1
  static on: (channel: string, callback: (data: Data) => void) => void
  static emit: (channel: string, data: Data) => void

  private readonly _refValue: Ref<Value>
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

  get value() {
    return this._refValue.value
  }

  flush() {
    SyncData.emit(this.channels.setValue, { fromId: SyncData.id, value: this.value })
  }

  setValue(value: Value) {
    if (value === this._refValue.value) return
    this._refValue.value = value
    SyncData.emit(this.channels.setValue, { fromId: SyncData.id, value })
  }

  appendArrayValue(...items: ExtractArrayGenericType<Value>[]) {
    if (items.length === 0) return
    const value = this.value
    if (value instanceof Array) {
      value.push(...items)
      SyncData.emit(this.channels.appendArrayValue, { fromId: SyncData.id, value: items })
    } else throw new Error("value is not array")
  }

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

  removeArrayValue(...items: ExtractArrayGenericType<Value>[]) {
    if (items.length === 0) return
    const value = this.value
    if (value instanceof Array) {
      remove(value, items)
      SyncData.emit(this.channels.removeArrayValue, { fromId: SyncData.id, value: items })
    } else throw new Error("value is not array")
  }

  updateObjectValue<Key extends keyof Value>(key: Key, value: Value[Key]) {
    const oldValue = this.value[key]
    if (oldValue === value) return
    this.value[key] = oldValue
    SyncData.emit(this.channels.updateObjectValue, { fromId: SyncData.id, value: { key, value } })
  }

  removeObjectValue(...keys: Array<keyof Value>) {
    if (keys.length) return
    for (let key of keys) {
      delete this.value[key]
    }
    SyncData.emit(this.channels.updateObjectValue, { fromId: SyncData.id, value: keys })
  }
}
