import { filter, type FilterCondition, type FilterItem } from "@packages/filter"
import Keyv from "keyv"
import { KeyvFile } from "keyv-file"
import { v4 } from "uuid"
import { join } from "path"
import { app } from "electron"
import { deepAssign } from "@packages/common"

export class Collection<V extends FilterItem = FilterItem> {
  constructor(readonly namespace: string) {
    this._keyValue = new Keyv({
      namespace,
      store: new KeyvFile({
        filename: join(app.getPath("userData"), namespace + ".json")
      })
    })
  }

  private readonly _keyValue: Keyv

  async update(...items: Array<Partial<V> & { _id: string }>) {
    for (let item of items) {
      const oldData = await this._keyValue.get(item._id)
      if (!oldData) throw new Error("Not found item in collection by id " + item._id)
      deepAssign(oldData, item)
      await this._keyValue.set(item._id, oldData)
    }
  }

  async save(...items: Array<Omit<V, "_id"> & { _id?: string }>) {
    for (let item of items) {
      if (!item._id) item._id = v4()
      await this._keyValue.set(item._id, item)
    }
    return items as V[]
  }

  getById(id: string) {
    return this._keyValue.get(id) as Promise<V | undefined>
  }

  async search(condition?: FilterCondition<V>) {
    const fn = filter(condition)
    const result: V[] = []
    for await (let item of this._keyValue.iterator(this.namespace)) {
      if (fn(item)) result.push(item)
    }
    return result
  }

  async searchOne(condition?: FilterCondition<V>): Promise<V | undefined> {
    const fn = filter(condition)
    for await (let item of this._keyValue.iterator(this.namespace)) {
      if (fn(item)) return item
    }
  }

  deleteById(id: string) {
    return this._keyValue.delete(id)
  }

  async delete(condition: FilterCondition<V>): Promise<V[]> {
    const result = await this.search(condition)
    for (let value of result) {
      await this._keyValue.delete(value._id)
    }
    return result
  }
}

export class Select<Result extends FilterItem, FromValue extends FilterItem> {
  private constructor(fromCollection: Collection<FromValue>) {
    this._from = fromCollection
    return this.expose(fromCollection, (value) => value as any)
  }

  private readonly _from: Collection<FromValue>
  private _condition?: FilterCondition<FromValue>
  private readonly _joinMap = new Map<Collection, Function>()
  private readonly _exposeMap = new Map<Collection, Function>()

  static from<Result extends FilterItem, FromValue extends FilterItem>(fromCollection: Collection<FromValue>) {
    return new Select<Result, FromValue>(fromCollection)
  }

  where(condition?: FilterCondition<FromValue>) {
    this._condition = condition
    return this
  }

  join<V extends FilterItem>(collection: Collection<V>, cb: (item: FromValue) => Promise<V>) {
    this._joinMap.set(collection, cb)
    return this
  }

  expose<V extends FilterItem>(collection: Collection<V>, cb: (value: V) => Partial<Result>) {
    this._exposeMap.set(collection, cb)
    return this
  }

  async toOne(): Promise<Result | undefined> {
    const fromValue = await this._from.searchOne(this._condition)
    if (!fromValue) return
    return await this._handleFromValue(fromValue)
  }

  async toArray() {
    const array = await this._from.search(this._condition)
    const resultArray: Result[] = []
    for (let item of array) {
      resultArray.push(await this._handleFromValue(item))
    }
    return resultArray
  }

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
