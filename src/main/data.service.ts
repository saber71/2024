import { Collection } from "@packages/collection"
import { Service } from "@packages/vue-class"
import type { BrowserWindow } from "electron"

@Service()
export class DataService {
  // 创建一个名为"main"的集合，用于存储目录信息。
  readonly collection = new Collection("main")

  // 照片窗口的对象
  photoWindow?: BrowserWindow
}
