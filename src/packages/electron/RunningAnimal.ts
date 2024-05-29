import { Collection } from "@packages/collection"
import type { FilterItem } from "@packages/filter"
import { type NativeImage, nativeImage, Tray } from "electron"

// 加载所有资源文件夹中的猫图片
const [cats] = await Promise.all([importAll(import.meta.glob("../../../resources/cat/*.png"))])

// 缓存猫图片
const cache = { cat: cats }

// 定义运行者类型和主题类型
type RunnerType = "cat"
type ThemeType = "light" | "dark"

// 运动中的动物选项接口，扩展自过滤项
interface RunningAnimalOption extends FilterItem {
  runner: RunnerType
  theme: ThemeType
}

/**
 * 表示一个正在运动的动物，支持在系统托盘中展示动画。
 */
export class RunningAnimal {
  constructor() {
    this.show = this.show.bind(this)
  }

  tray?: Tray // 托盘图标实例
  readonly collection = new Collection<RunningAnimalOption>("running-animal") // 存储配置项的集合
  private readonly _option: RunningAnimalOption = {
    runner: "cat",
    theme: "dark",
    _id: "running-animal"
  } // 运行时配置
  private _activeImages: Image[] = [] // 活跃的图片数组
  private _intervalTime = 100 // 图片切换间隔时间
  private _curImageIndex = 0 // 当前显示图片的索引
  private _handler: any // 定时器句柄

  /**
   * 初始化函数，从集合中获取配置并应用。
   */
  async init() {
    const option = await this.collection.getById(this._option._id)
    if (option) Object.assign(this._option, option)
    this.use()
  }

  /**
   * 显示托盘图标，并开始切换图片。
   */
  show() {
    if (!this.tray) {
      this.tray = new Tray(this._activeImages[0].nativeImage)
      this.tray.setToolTip("222")
    }
    this._curImageIndex = (this._curImageIndex + 1) % this._activeImages.length
    this.tray.setImage(this._activeImages[this._curImageIndex].nativeImage)
    if (!this._handler) this._handler = setInterval(this.show, this._intervalTime)
  }

  /**
   * 隐藏托盘图标，停止图片切换。
   */
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

  /**
   * 更改当前运行的动物和主题，并更新显示。
   * @param type 运动员类型（如：cat）
   * @param theme 主题（如：light 或 dark）
   */
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

/**
 * 批量导入所有匹配的图片资源。
 * @param record 包含图片路径和导入函数的对象映射。
 * @returns 返回一个包含导入图片信息的数组承诺。
 */
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

// 定义图片接口
interface Image {
  base64: string
  path: string
  nativeImage: NativeImage
}
