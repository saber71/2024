import { filter, type FilterCondition, type FilterItem } from "@packages/filter"
import Keyv from "keyv"
import KeyvFile from "keyv-file"
import { v4 } from "uuid"

export class Collection<V extends FilterItem> {
  constructor(readonly namespace: string) {
    this._keyValue = new Keyv({
      namespace,
      store: new KeyvFile({
        filename: `./${namespace}.json`
      })
    })
  }

  private readonly _keyValue: Keyv

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
