import { deepAssign } from "@packages/common"
import { filter, type FilterCondition, type FilterItem } from "@packages/filter"
import { app } from "electron"
import Keyv from "keyv"
import { KeyvFile } from "keyv-file"
import { join } from "path"
import { v4 } from "uuid"

/**
 * Collection 类用于管理和操作数据集合。
 * @template V 继承自 FilterItem 的数据项类型。
 */
export class Collection<V extends FilterItem = FilterItem> {
  /**
   * 构造函数，初始化 Collection 实例。
   * @param namespace 集合的命名空间，用于数据存储的标识。
   */
  constructor(readonly namespace: string) {
    this._keyValue = new Keyv({
      namespace,
      store: new KeyvFile({
        filename: join(app.getPath("userData"), namespace + ".json")
      })
    })
  }

  private readonly _keyValue: Keyv

  /**
   * 更新指定数据项。
   * @param items 要更新的数据项数组，每个数据项需包含 _id 属性。
   */
  async update(...items: Array<Partial<V> & { _id: string }>) {
    for (let item of items) {
      const oldData = await this._keyValue.get(item._id)
      if (!oldData) throw new Error("Not found item in collection by id " + item._id)
      deepAssign(oldData, item)
      await this._keyValue.set(item._id, oldData)
    }
  }

  /**
   * 保存一个或多个数据项。
   * @param items 要保存的数据项数组，每个数据项可以包含 _id 属性，若不存在则自动生成。
   * @returns 返回保存后的数据项数组。
   */
  async save(...items: Array<Omit<V, "_id"> & { _id?: string }>) {
    for (let item of items) {
      if (!item._id) item._id = v4()
      await this._keyValue.set(item._id, item)
    }
    return items as V[]
  }

  /**
   * 通过 ID 获取数据项。
   * @param id 要获取的数据项的 ID。
   * @returns 返回指定 ID 的数据项，若不存在则返回 undefined。
   */
  getById(id: string) {
    return this._keyValue.get(id) as Promise<V | undefined>
  }

  /**
   * 根据条件搜索数据项。
   * @param condition 搜索条件，可选。
   * @returns 返回满足条件的所有数据项数组。
   */
  async search(condition?: FilterCondition<V>) {
    const fn = filter(condition)
    const result: V[] = []
    for await (let item of this._keyValue.iterator(this.namespace)) {
      if (fn(item)) result.push(item)
    }
    return result
  }

  /**
   * 根据条件搜索一个数据项。
   * @param condition 搜索条件，可选。
   * @returns 返回满足条件的第一个数据项，若不存在则返回 undefined。
   */
  async searchOne(condition?: FilterCondition<V>): Promise<V | undefined> {
    const fn = filter(condition)
    for await (let item of this._keyValue.iterator(this.namespace)) {
      if (fn(item)) return item
    }
  }

  /**
   * 通过 ID 删除数据项。
   * @param id 要删除的数据项的 ID。
   * @returns 返回删除操作的结果。
   */
  deleteById(id: string) {
    return this._keyValue.delete(id)
  }

  /**
   * 根据条件删除数据项。
   * @param condition 删除条件。
   * @returns 返回被删除的数据项数组。
   */
  async delete(condition: FilterCondition<V>): Promise<V[]> {
    const result = await this.search(condition)
    for (let value of result) {
      await this._keyValue.delete(value._id)
    }
    return result
  }
}

/**
 * Select 类用于构建和执行复杂的查询操作。
 * @template Result 查询结果的数据项类型。
 * @template FromValue 来源数据项的类型。
 */
export class Select<Result extends FilterItem, FromValue extends FilterItem> {
  /**
   * 构造函数，初始化 Select 实例。
   * @param fromCollection 来源数据集合。
   */
  private constructor(fromCollection: Collection<FromValue>) {
    this._from = fromCollection
    return this.expose(fromCollection, (value) => value as any)
  }

  private readonly _from: Collection<FromValue>
  private _condition?: FilterCondition<FromValue>
  private readonly _joinMap = new Map<Collection, Function>()
  private readonly _exposeMap = new Map<Collection, Function>()

  /**
   * 从指定集合开始构建查询。
   * @param fromCollection 来源数据集合。
   */
  static from<Result extends FilterItem, FromValue extends FilterItem>(fromCollection: Collection<FromValue>) {
    return new Select<Result, FromValue>(fromCollection)
  }

  /**
   * 设置查询条件。
   * @param condition 查询条件，可选。
   * @returns 返回 Select 实例，支持链式调用。
   */
  where(condition?: FilterCondition<FromValue>) {
    this._condition = condition
    return this
  }

  /**
   * 添加连接操作。
   * @param collection 要连接的数据集合。
   * @param cb 连接回调函数，用于根据来源数据项获取连接数据项。
   * @returns 返回 Select 实例，支持链式调用。
   */
  join<V extends FilterItem>(collection: Collection<V>, cb: (item: FromValue) => Promise<V>) {
    this._joinMap.set(collection, cb)
    return this
  }

  /**
   * 设置数据项的暴露方式。
   * @param collection 数据集合。
   * @param cb 暴露回调函数，用于根据数据项转换为查询结果项的部分属性。
   * @returns 返回 Select 实例，支持链式调用。
   */
  expose<V extends FilterItem>(collection: Collection<V>, cb: (value: V) => Partial<Result>) {
    this._exposeMap.set(collection, cb)
    return this
  }

  /**
   * 执行查询并返回一个结果项。
   * @returns 返回查询结果的第一个数据项，若不存在则返回 undefined。
   */
  async toOne() {
    const fromValue = await this._from.searchOne(this._condition)
    if (!fromValue) return
    return await this._handleFromValue(fromValue)
  }

  /**
   * 执行查询并返回结果项数组。
   * @returns 返回查询结果的数据项数组。
   */
  async toArray() {
    const array = await this._from.search(this._condition)
    const resultArray: Result[] = []
    for (let item of array) {
      resultArray.push(await this._handleFromValue(item))
    }
    return resultArray
  }

  /**
   * 处理来源数据项，结合连接和暴露操作生成最终的查询结果项。
   * @param item 来源数据项。
   * @returns 返回处理后的查询结果项。
   */
  private async _handleFromValue(item: FromValue) {
    const result: Result = Object.assign({}, this._exposeMap.get(this._from)?.(item))
    for (let [joinCollection, joinCB] of this._joinMap.entries()) {
      const value = await joinCB(item)
      const exposedValue = this._exposeMap.get(joinCollection)?.(value)
      Object.assign(result, exposedValue)
    }
    return result
  }
}
