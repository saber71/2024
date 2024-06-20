import { app } from "electron"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import { ref, type Ref, watch, type WatchStopHandle } from "vue"

export class StorageObject<V> {
  constructor(
    readonly name: string,
    initValue?: V
  ) {
    this._ref = ref(initValue) as any
    const fileName = name + "_storage"
    const filepath = path.join(app.getPath("appData"), fileName)
    this._stopWatch = watch(this._ref, () => {
      this._storageReady = fs.writeFile(filepath, JSON.stringify({ value: this._ref.value }))
    })
    this.initReady = new Promise(async (resolve) => {
      try {
        await fs.access(filepath)
        const content = await fs.readFile(filepath, "utf8")
        this._ref.value = JSON.parse(content).value
      } catch {
        resolve()
      }
    })
  }

  readonly initReady: Promise<void>
  private readonly _ref: Ref<V>
  private readonly _stopWatch: WatchStopHandle
  private _disposed = false
  private _storageReady: Promise<void> = Promise.resolve()

  get storageReady(): Promise<void> {
    return this._storageReady
  }

  get value(): V {
    if (this._disposed) throw new Error(this.name + ":already disposed")
    return this._ref.value
  }

  set value(value: V) {
    if (this._disposed) throw new Error(this.name + ":already disposed")
    this._ref.value = value
  }

  dispose() {
    if (this._disposed) return
    this._stopWatch()
    this._disposed = true
  }
}
