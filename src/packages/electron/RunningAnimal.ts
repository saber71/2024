import { Collection } from "@packages/collection"
import type { FilterItem } from "@packages/filter"
import { type NativeImage, nativeImage, Tray } from "electron"

const [cats] = await Promise.all([importAll(import.meta.glob("../../../resources/cat/*.png"))])

const cache = { cat: cats }

type RunnerType = "cat"
type ThemeType = "light" | "dark"

interface RunningAnimalOption extends FilterItem {
  runner: RunnerType
  theme: ThemeType
}

export class RunningAnimal {
  constructor() {
    this.show = this.show.bind(this)
  }

  tray?: Tray
  readonly collection = new Collection<RunningAnimalOption>("running-animal")
  private readonly _option: RunningAnimalOption = {
    runner: "cat",
    theme: "dark",
    _id: "running-animal"
  }
  private _activeImages: Image[] = []
  private _intervalTime = 1000
  private _curImageIndex = 0
  private _handler: any

  async init() {
    const option = await this.collection.getById(this._option._id)
    if (option) Object.assign(this._option, option)
    this.use()
  }

  show() {
    if (!this.tray) {
      this.tray = new Tray(this._activeImages[0].nativeImage)
      this.tray.setTitle("123")
      this.tray.setToolTip("222")
    }
    this._curImageIndex = (this._curImageIndex + 1) % this._activeImages.length
    this.tray.setImage(this._activeImages[this._curImageIndex].nativeImage)
    if (!this._handler) this._handler = setInterval(this.show, this._intervalTime)
  }

  hide() {
    if (this._handler) {
      clearInterval(this._handler)
      this._handler = null
    }
    if (this.tray) {
      this.tray.destroy()
      this.tray = undefined
    }
  }

  use(type: RunnerType = this._option.runner, theme: ThemeType = this._option.theme) {
    this._option.runner = type
    this._option.theme = theme
    this.collection.save(this._option)
    this._activeImages = cache[type].filter((img) => img.path.indexOf(theme) >= 0)
    if (this._handler) {
      clearInterval(this._handler)
      this._handler = 0
      this.show()
    }
  }
}

function importAll(record: Record<string, () => Promise<any>>): Promise<Array<Image>> {
  return Promise.all(
    Object.entries(record).map(([path, fn]) =>
      fn().then((m) => {
        let img: NativeImage | undefined
        return {
          base64: m.default,
          path,
          get nativeImage() {
            if (!img) img = nativeImage.createFromDataURL(m.default)
            return img
          }
        }
      })
    )
  )
}

interface Image {
  base64: string
  path: string
  nativeImage: NativeImage
}
