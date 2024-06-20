import { Service } from "@packages/vue-class"
import { FileStorageCollection } from "../utility"

@Service()
export class DataService {
  // 创建一个名为"user-data"的集合，用于存储信息。
  readonly collection = new FileStorageCollection("user-data")

  async set<Value>(id: string, value: Value) {
    await this.collection.save({ _id: id, value })
    return value
  }

  async get<Value>(id: string) {
    return (await this.collection.getById(id))?.value as Value | undefined
  }
}
