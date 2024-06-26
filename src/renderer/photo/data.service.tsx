import { FolderOpenOutlined, PictureOutlined, StarOutlined } from "@ant-design/icons-vue"
import type { Directory } from "@main/ipc/photo.ipc.ts"
import { type ImageInfo } from "@main/utility"
import { listen, remove, throttleFnImmediate } from "@packages/common"
import {
  BindThis,
  Computed,
  EventListener,
  Invoke,
  IpcListener,
  IpcSync,
  Mut,
  Service,
  Throttle,
  VueService,
  Watcher
} from "@packages/vue-class"
import { invoke } from "@renderer/exposed.ts"
import { Input, type ItemType, Modal, notification } from "ant-design-vue"
import type { Key } from "ant-design-vue/es/_util/type"
import EventEmitter from "eventemitter3"
import type { OverlayScrollbars } from "overlayscrollbars"
import { h, ref, type VNode } from "vue"

type SortOrder = "birthtimeMs" | "mtimeMs" | "name"
type ShowType = "rect" | "same-height"
type ShowSize = "small" | "medium" | "big"
export type FilterType = "all" | "image" | "video"
export const KEY_PREFIX = "$path:"

export const photoEventBus = new EventEmitter<{
  scroll: () => void
  selectAll: () => void
  unselectAll: () => void
  updateRows: () => void
  copyOrMoveFiles: (type: "复制" | "移动") => void
}>()

/**
 * PhotoDataService 类提供与照片数据相关的服务，
 * 继承自VueService基类。
 */
@Service()
export class PhotoDataService extends VueService {
  // 左侧菜单的文件夹的右键菜单
  readonly directoriesContextMenu: ItemType[] = [
    {
      label: "添加文件夹",
      key: "create-directory",
      onClick: () => this.addDirectory()
    }
  ]

  // 文件夹的右键菜单
  readonly directoryContextmenu: ItemType[] = [
    {
      label: "创建文件夹",
      key: "create-directory",
      onClick: () => {
        this.showContextmenu = false
        if (this.curDirectory) {
          let directoryName = "",
            status = ref("")
          Modal.confirm({
            title: "输入新文件夹名",
            centered: true,
            okText: "新建",
            content: () => (
              <Input
                value={directoryName}
                onUpdate:value={(val) => (directoryName = val)}
                placeholder={"请输入新文件夹名字"}
                status={status.value as any}
              />
            ),
            onOk: async () => {
              const curDirectory = this.curDirectory!
              const path = await invoke("fs:createDirectory", curDirectory.path, directoryName)
              if (!path) {
                status.value = "error"
                return Promise.reject(`文件名${directoryName}已存在`)
              } else {
                status.value = ""
                this.allDirectories.push({
                  path: path,
                  name: directoryName
                })
                this.allDirectories = this.allDirectories.slice()
                return Promise.resolve()
              }
            }
          })
        }
      }
    },
    {
      label: "重命名",
      key: "rename",
      onClick: () => {
        this.showContextmenu = false
        if (this.curDirectory) {
          let directoryName = this.curDirectory.name
          Modal.confirm({
            title: "重命名文件夹",
            centered: true,
            content: () => (
              <Input
                value={directoryName}
                onUpdate:value={(val) => (directoryName = val)}
                placeholder={"请输入文件夹的新名字"}
              />
            ),
            onOk: async () => {
              if (!directoryName) return Promise.reject("directory name is empty!")
              const curDirectory = this.curDirectory!
              return this.renameDirectory(curDirectory, directoryName)
            }
          })
        }
      }
    },
    {
      label: "在文件资源管理器中打开",
      key: "open-directory",
      onClick: () => {
        if (this.curDirectory) {
          this.showContextmenu = false
          invoke("fs:showItemInFolder", this.curDirectory.path)
        }
      }
    },
    {
      type: "divider"
    },
    {
      label: "删除文件夹",
      key: "remove-directory",
      class: "contextmenu-remove",
      onClick: () => {
        this.showContextmenu = false
        if (this.curDirectory) {
          Modal.confirm({
            title: "删除文件夹",
            content: `是否从应用中删除文件夹${this.curDirectory?.name}？`,
            onOk: () => {
              remove(this.allDirectories, this.curDirectory)
              this.allDirectories = this.allDirectories.slice()
              const imageInfos = this.dirPathMapImageInfos.get(this.curDirectory!.path)
              if (imageInfos) {
                for (let imageInfo of imageInfos.slice()) {
                  this._removeImage(imageInfo)
                }
                this.dirPathMapImageInfos.delete(this.curDirectory!.path)
              }
            },
            centered: true,
            okText: "删除"
          })
        }
      }
    },
    {
      label: "开始幻灯片放映",
      key: "play-slide",
      onClick: () => {
        this.showContextmenu = false
        this.startSlide()
      }
    }
  ]

  // 图片的右键菜单
  readonly imageContextmenu: ItemType[] = [
    {
      label: "打开",
      key: "open",
      onClick: () => {
        this.showContextmenu = false
        if (this.curImageInfo) this.openImage(this.curImageInfo)
      }
    },
    {
      label: "编辑",
      key: "edit"
    },
    {
      label: "开始幻灯片放映",
      key: "play-slide",
      onClick: () => {
        this.showContextmenu = false
        this.startSlide()
      }
    },
    {
      label: "打印",
      key: "print",
      onClick: () => {
        this.showContextmenu = false
        if (this.curImageInfo) {
          invoke("photo:print", this.curImageInfo.filePath)
        }
      }
    },
    {
      label: "复制",
      key: "copy",
      onClick: () => {
        this.showContextmenu = false
        if (this.curImageInfo) {
          invoke("fs:copyFilesIntoClipboard", [this.curImageInfo.filePath])
        }
      }
    },
    {
      label: "复制为路径",
      key: "copy-path",
      onClick: () => {
        this.showContextmenu = false
        if (this.curImageInfo) invoke("fs:copyIntoClipboard", this.curImageInfo.filePath)
      }
    },
    {
      label: "移动/复制",
      key: "move/copy",
      children: [
        {
          label: "复制到文件夹",
          key: "copy-to-directory",
          onClick: () => {
            this.showContextmenu = false
            photoEventBus.emit("copyOrMoveFiles", "复制")
          }
        },
        {
          label: "移动到文件夹",
          key: "move-to-directory",
          onClick: () => {
            this.showContextmenu = false
            photoEventBus.emit("copyOrMoveFiles", "移动")
          }
        }
      ]
    },
    {
      label: "重命名",
      key: "rename",
      onClick: () => {
        this.showContextmenu = false
        if (this.curImageInfo) {
          let newName = this.curImageInfo.nameWithoutExt
          Modal.confirm({
            title: "重命名图片",
            centered: true,
            content: () => (
              <Input value={newName} onUpdate:value={(val) => (newName = val)} placeholder={"请输入图片的新名字"} />
            ),
            onOk: async () => {
              if (!newName) return Promise.reject("image name is empty!")
              const imageInfo = this.curImageInfo!
              return this.renameImage(imageInfo, newName)
            }
          })
        }
      }
    },
    {
      type: "divider"
    },
    {
      label: "在文件资源管理器中打开",
      key: "open-file",
      onClick: () => {
        if (this.curImageInfo) {
          this.showContextmenu = false
          invoke("fs:showItemInFolder", this.curImageInfo.filePath)
        }
      }
    },
    {
      label: "删除",
      key: "remove",
      class: "contextmenu-remove",
      onClick: () => {
        this.showContextmenu = false
        if (this.curImageInfo) {
          this.checkConfirmRemoveImage([this.curImageInfo])
          this.curImageInfo = undefined
        }
      }
    }
  ]

  // 是否显示右键菜单
  @Mut() showContextmenu = false

  // 右键菜单位置
  @Mut() contextmenuPos?: { left: string; top: string }

  // 当前正在展示的右键菜单
  @Mut() curContextmenu?: ItemType[]

  // 当前目录对象，用于存储当前选择的目录信息
  @Mut(true) curDirectory?: Directory

  @Mut(true) curImageInfo?: ImageInfo

  @Mut() dirPathMapImageInfos = new Map<string, ImageInfo[]>()

  // 记录已存储的图片，key为图片的atomPath
  readonly imageInfoMap = new Map<string, ImageInfo>()

  // 当前选中的菜单项
  @Mut() curItemType?: { label: string; icon: VNode }

  // 存储目录信息
  // 当数据发生变化时发送数据到photo:updateDirectories频道
  // 初始化时从频道photo:allDirectories获取所有目录的数据
  @IpcSync("photo:updateDirectories")
  @Invoke("photo:allDirectories")
  @Mut(true)
  allDirectories: Directory[] = []

  @IpcSync("photo:updateFavorites")
  @Invoke("photo:allFavorites")
  @Mut(true)
  allFavorites: string[] = []

  // 图片信息列表，用于存储图片的各种信息，例如元数据、文件路径等。
  @Mut() curImageInfos: ImageInfo[] = []

  // 图片的排序规则
  @Mut() imageSortRule: { order: SortOrder; asc: boolean } = {
    order: "birthtimeMs", //排序根据
    asc: false //是否升序
  }

  // 图片的显示配置
  @Mut() imageShowSetting: { type: ShowType; size: ShowSize; filter: FilterType } = {
    type: "same-height",
    size: "big",
    filter: "all"
  }

  // 菜单项列表，存储应用中的菜单项信息。包括所有图片、收藏夹和文件夹等菜单。
  @Mut() asideMenu: ItemType[] = [
    {
      key: "all-images",
      label: "所有图片",
      icon: h(PictureOutlined)
    },
    {
      key: "favorite",
      label: "收藏夹",
      icon: h(StarOutlined)
    },
    {
      key: "directories",
      label: "文件夹",
      title: "文件夹",
      icon: h(FolderOpenOutlined),
      children: [],
      class: "menu-item-directories"
    }
  ]

  // 左侧菜单的选中项key
  @Mut() selectedAsideKeys: Key[] = ["all-images"]

  // 滚动条实例
  scrollbarInstance?: OverlayScrollbars

  // 选中的图片地址集合
  @Mut() selectedImagePaths = new Set<string>()

  /**
   * 计算属性：获取所有图片信息的集合。
   * @returns 返回一个ImageInfo类型的数组，包含所有目录下的图片信息。
   */
  @Computed() get allImageInfos() {
    return ([] as ImageInfo[]).concat(...Array.from(this.dirPathMapImageInfos.values()))
  }

  /**
   * 异步重命名图片文件。
   *
   * @param imageInfo 图片信息对象，包含文件路径、文件名等信息。
   * @param newImageName 新的图片文件名（不包括扩展名）。
   * @returns 如果重命名成功，则排序并更新图片信息数组；如果失败，则显示错误通知并拒绝承诺。
   */
  async renameImage(imageInfo: ImageInfo, newImageName: string) {
    if (newImageName === imageInfo.nameWithoutExt) return
    const newPath = await invoke("fs:rename", imageInfo.filePath, newImageName + "." + imageInfo.extName)
    if ("filePath" in newPath) {
      imageInfo.nameWithoutExt = newImageName
      imageInfo.name = newImageName + "." + imageInfo.extName
      const index = this.allFavorites.indexOf(imageInfo.atomPath)
      Object.assign(imageInfo, newPath)
      if (index >= 0) {
        this.allFavorites[index] = imageInfo.atomPath
        this.allFavorites = this.allFavorites.slice()
      }
      this.sortImageInfos()
      return
    } else {
      notification.error({ message: newPath.message })
      return Promise.reject(newPath)
    }
  }

  /**
   * 异步重命名目录。
   *
   * @param targetDirectory 目标目录对象，包含目录名和路径等信息。
   * @param newDirectoryName 新的目录名。
   * @returns 如果重命名成功，则更新相关图片信息和目录信息；如果失败，则显示错误通知并拒绝承诺。
   */
  async renameDirectory(targetDirectory: Directory, newDirectoryName: string) {
    if (newDirectoryName === targetDirectory.name) return
    const newPath = await invoke("fs:rename", targetDirectory.path, newDirectoryName)
    if ("filePath" in newPath) {
      this.allDirectories = this.allDirectories.slice()
      for (let info of this.curImageInfos) {
        info.filePath = info.filePath.replace(targetDirectory.path, newPath.filePath)
        info.directoryPath = info.directoryPath.replace(targetDirectory.path, newPath.filePath)
        this.imageInfoMap.delete(info.atomPath)
        info.atomPath = info.atomPath.replace(newPath.oldAtomPath, newPath.atomPath)
        this.imageInfoMap.set(info.atomPath, info)
      }
      for (let i = 0; i < this.allFavorites.length; i++) {
        this.allFavorites[i] = this.allFavorites[i].replace(newPath.oldAtomPath, newPath.atomPath)
      }
      this.allFavorites = this.allFavorites.slice()
      const array = this.dirPathMapImageInfos.get(targetDirectory.path)!
      this.dirPathMapImageInfos.delete(targetDirectory.path)
      const asideMenu = this.findMenuItem(targetDirectory.path)
      targetDirectory.name = newDirectoryName
      targetDirectory.path = newPath.filePath
      this.dirPathMapImageInfos.set(targetDirectory.path, array)
      if (asideMenu) Object.assign(asideMenu, toItemType(targetDirectory))
      return
    } else {
      notification.error({ message: newPath.message })
      return Promise.reject(newPath)
    }
  }

  /**
   * 弹出确认对话框，询问用户是否删除指定的图片。
   *
   * 此函数通过Modal.confirm弹出一个确认对话框，提示用户是否确认删除指定的图片。
   * 如果用户确认删除，将调用后台服务删除图片，并根据删除结果给出相应的提示。
   */
  checkConfirmRemoveImage(infos?: ImageInfo[]) {
    if (!infos) {
      const array = Array.from(this.selectedImagePaths)
      infos = array.map((path) => this.imageInfoMap.get(path)).filter((info) => !!info) as ImageInfo[]
    }
    if (!infos.length) return
    Modal.confirm({
      title: "删除图片",
      content: `是否删除图片${infos[0].name}${infos.length ? "等" : ""}？`,
      onOk: () => {
        infos!.forEach((info) => {
          // 调用后台服务删除图片文件
          invoke("fs:rm", info.filePath).then((result) => {
            // 如果删除失败，显示错误通知
            if (result) notification.error({ message: result })
            else {
              // 如果删除成功，从列表中移除图片
              this._removeImage(info)
            }
          })
        })
      },
      centered: true,
      okText: "删除"
    })
  }

  /**
   * 监听器：当所有目录被设置且尚未读取图片信息时，触发读取图片信息的操作。
   */
  @Watcher() toReadAllImageInfos() {
    const existDirectories = this.allDirectories.length
    const existImages = this.dirPathMapImageInfos.size
    if (existDirectories && !existImages) {
      invoke("photo:readImages", this.allDirectories)
    }
  }

  /**
   * IPC监听器：接收图片信息。
   * @param infos 图片信息数组。
   * 将接收到的图片信息分类存储，并更新当前目录的图片信息。
   */
  @IpcListener("photo:transferImageInfo") receiveImageInfos(infos: ImageInfo[]) {
    for (let info of infos) {
      let array = this.dirPathMapImageInfos.get(info.directoryPath)
      if (!array) this.dirPathMapImageInfos.set(info.directoryPath, (array = []))
      if (!this.imageInfoMap.has(info.atomPath)) {
        array.push(info)
        this.imageInfoMap.set(info.atomPath, info)
      }
    }
    this.setCurDirectory(this.curDirectory)
  }

  /**
   * IPC监听器：接收图片信息结束的信号。
   * 标记当前目录图片信息读取完成，并打印当前目录的图片信息。
   */
  @IpcListener("photo:transferImageInfoEnd") receiveImageInfosEnd() {
    this.setCurDirectory(this.curDirectory)
  }

  /**
   * 设置当前目录，并更新当前目录下的图片信息。
   * @param dir 可选参数，指定要设置的目录。
   * 更新curImageInfos为当前目录下的图片信息，如果没有指定目录，则使用所有图片信息。
   */
  setCurDirectory(dir?: Directory) {
    this.curDirectory = dir
    if (!dir) {
      const key = this.selectedAsideKeys[0]
      if (key === "favorite") this.curImageInfos = this.allFavorites.map((atomPath) => this.imageInfoMap.get(atomPath)!)
      else this.curImageInfos = this.allImageInfos
      throttleFnImmediate(this._sortImageInfosImpl)
    } else {
      const array = this.dirPathMapImageInfos.get(dir.path)
      if (array) {
        this.curImageInfos = array
        throttleFnImmediate(this._sortImageInfosImpl)
      }
    }
  }

  /**
   * 启动幻灯片播放。
   * 首先检查当前图片信息列表是否为空，若为空则警告，否则初始化并打开幻灯片查看器。
   */
  async startSlide() {
    const imageInfos = this.curImageInfos
    if (imageInfos.length === 0) {
      notification.warn({
        message: "无可播放图片"
      })
    } else {
    }
  }

  /**
   * 异步打开图片
   * @param info 图片信息对象，包含图片的各种详细信息
   * 该函数首先会设置当前图片信息，然后打开图片查看器
   */
  async openImage(info: ImageInfo) {}

  /**
   * 选择图像
   * @param pic 可以是ImageInfo类型或包含ImageInfo的物体。如果传入的是一个包含ImageInfo的对象，函数会使用该对象的info属性。
   * @param multi 是否允许多选，默认为false。如果为true，则可以一次选择多个图像；如果为false，则每次选择都会清除之前的选择。
   */
  selectImage(pic: ImageInfo | { info: ImageInfo }, multi?: boolean) {
    // 如果传入的对象包含info属性，则使用该info属性
    if ("info" in pic) pic = pic.info
    // 如果不允许多选，则清除之前的图像选择
    if (!multi) this.selectedImagePaths.clear()
    // 添加选定图像的路径到集合中
    this.selectedImagePaths.add(pic.atomPath)
  }

  /**
   * 根据设定的排序规则对图片信息进行排序。
   * 此方法为响应式，当排序规则发生变化时会被自动调用。
   * 无显式返回值，但会修改类成员变量`imageInfos`的顺序。
   */
  @Watcher() sortImageInfos() {
    listen(this.curImageInfos.length, this.imageSortRule.order, this.imageSortRule.asc)
    this._sortImageInfosImpl()
  }

  /**
   * 监听器函数，更新菜单中的目录信息。
   * 随着allDirectories的变化，动态更新菜单项的子目录列表。
   */
  @Watcher() updateMenuDirectories() {
    ;(this.asideMenu[2] as any).children = this.allDirectories.map(toItemType)
  }

  /**
   * 监听选择全部图片的事件，当事件触发时，选择所有图片。
   * 使用 @EventListener 装饰器绑定事件监听器。
   */
  @EventListener(photoEventBus, "selectAll") handleSelectAllImage() {
    // 遍历图片信息列表，将每张图片的路径添加到已选择图片路径的集合中
    for (let info of this.curImageInfos) {
      this.selectedImagePaths.add(info.atomPath)
    }
  }

  /**
   * 监听取消选择全部图片的事件，当事件触发时，清除所有已选择的图片路径。
   * 使用 @EventListener 装饰器绑定事件监听器。
   */
  @EventListener(photoEventBus, "unselectAll") handleUnSelectAllImage() {
    // 清除已选择图片路径的集合
    this.selectedImagePaths.clear()
  }

  /**
   * 异步添加目录到所有目录列表中，并更新目录缩略图数组。
   * 通过调用 `invoke("photo:selectDirectory")` 方法获取目录信息，
   * 如果调用成功，则将新目录路径和缩略图添加到相应的数组中。
   */
  @BindThis()
  async addDirectory() {
    // 调用接口选择目录
    const dir = await invoke("photo:selectDirectory")
    if (dir) {
      // 如果选择成功，将新目录添加到所有目录列表中
      this.allDirectories.push(dir)
      // 通过切片操作更新 `allDirectories` 数组，以触发视图更新
      this.allDirectories = this.allDirectories.slice()
    }
  }

  /**
   * 在侧边菜单中查找指定键的菜单项。
   *
   * @param key 要查找的菜单项的键。
   * @returns 返回找到的菜单项，如果未找到则返回 undefined。
   */
  findMenuItem(key: string): ItemType | undefined {
    // 通过递归查找指定键的菜单项
    return find(this.asideMenu)

    /**
     * 递归查找菜单项。
     *
     * @param itemTypes 要在其中查找的菜单项数组。
     * @returns 返回找到的菜单项，如果未找到则返回 undefined。
     */
    function find(itemTypes: ItemType[]): ItemType | undefined {
      for (let item of itemTypes) {
        // 如果当前项的键与目标键匹配，则返回当前项
        if (item!.key === key) return item
        // 如果当前项有子项，则在子项中递归查找
        if ((item as any).children) {
          const result = find((item as any).children)
          // 如果在子项中找到了目标项，则返回该项
          if (result) return result
        }
      }
    }
  }

  /**
   * 查找指定路径的目录。
   * @param key 以"$path:"开头的字符串，表示要查找的路径。
   * @returns 返回找到的目录对象，如果未找到则返回undefined。
   */
  findDirectory(key: string) {
    // 从key中截取路径字符串
    const path = key.indexOf(KEY_PREFIX) === 0 ? key.slice(KEY_PREFIX.length) : key
    // 调用find函数在所有目录中查找指定路径
    return this.allDirectories.find((dir) => dir.path === path)
  }

  /**
   * 异步复制或移动选择的图片到目标目录。
   * @param copyOrMove 操作类型，为"复制"或"移动"字符串。
   * @param targetDirectoryPath 目标目录的路径。
   * @returns 返回一个布尔值，表示所有操作是否成功完成。若所有操作成功，则为true；至少有一个操作失败，则为false。
   */
  async copyOrMoveImages(copyOrMove: "复制" | "移动", targetDirectoryPath: string) {
    // 获取当前选中的图片路径集合
    const imagePaths = Array.from(this.selectedImagePaths)

    /**
     * 根据提供的图片路径数组，获取对应的图片信息数组，并清理掉已读取的图片信息。
     * 之后，会调用 `invoke` 方法，传入一个包含所有图片所在目录的数组，重新读取图片。
     */
    const imageInfos = imagePaths.map((path) => this.imageInfoMap.get(path)!) // 根据路径获取图片信息数组
    const directories = new Set<Directory>() // 创建一个用于存储目录的集合
    directories.add(this.findDirectory(targetDirectoryPath)!)
    // 遍历图片信息，查找对应的目录，并从相关集合中移除已处理的图片信息
    for (let imageInfo of imageInfos) {
      const directory = this.allDirectories.find((val) => val.path === imageInfo.directoryPath)
      if (directory) {
        directories.add(directory) // 将找到的目录添加到集合中
        if (copyOrMove === "移动") this._removeImage(imageInfo)
      }
    }

    let result: PromiseSettledResult<string>[]

    // 根据操作类型执行复制或移动
    if (copyOrMove === "移动")
      result = await invoke("fs:move", {
        dest: targetDirectoryPath,
        src: imagePaths,
        overwriteAsSameName: false
      })
    else
      result = await invoke("fs:copy", {
        dest: targetDirectoryPath,
        src: imagePaths,
        overwriteAsSameName: false
      })

    let allSuccess = true

    // 清空已选择的图片路径集合
    this.selectedImagePaths.clear()

    // 遍历操作结果，处理每个图片的复制或移动结果
    for (let res of result) {
      if (res.status === "rejected") {
        // 若操作失败，则设置allSuccess为false，并显示错误信息
        allSuccess = false
        notification.error({
          message: res.reason.message,
          duration: null
        })
      }
    }

    invoke("photo:readImages", Array.from(directories)) // 调用invoke方法，传入目录数组进行进一步处理

    return allSuccess
  }

  setup() {
    this.curItemType = this.asideMenu[0] as any
  }

  /**
   * 根据指定排序条件对图片信息进行排序。
   * 使用防抖装饰器限制函数的调用频率，以提高性能。
   */
  @Throttle()
  private _sortImageInfosImpl() {
    const { order, asc } = this.imageSortRule
    this.curImageInfos.sort((a, b) => {
      let result: number
      // 根据排序字段进行比较，如果是按名称排序，则使用localeCompare方法比较字符串，
      // 否则直接比较对应属性的值。
      if (order === "name") result = a.name.localeCompare(b.name)
      else result = a[order] - b[order]
      // 如果为降序，则反转结果
      if (!asc) result *= -1
      return result
    })
    // 发出更新行事件，通知相关组件数据已变更。
    photoEventBus.emit("updateRows")
  }

  private _removeImage(info: ImageInfo) {
    const array = this.dirPathMapImageInfos.get(info.directoryPath)
    if (array) {
      remove(array, info)
    }
    this.imageInfoMap.delete(info.atomPath)
    this.selectedImagePaths.delete(info.atomPath)
    const index = this.allFavorites.indexOf(info.atomPath)
    if (index >= 0) {
      this.allFavorites.splice(index, 1)
      this.allFavorites = this.allFavorites.slice()
    }
  }
}

/**
 * 将目录对象转换为项目类型对象。
 *
 * @param dir 目录对象，包含路径、名称以及可能的子目录信息。
 * @returns 返回一个具有键、标签、标题、图标和子项的项目类型对象。
 */
function toItemType(dir: Directory): ItemType {
  return {
    key: KEY_PREFIX + dir.path, // 使用目录的路径作为键
    label: dir.name, // 目录的名称作为标签和标题
    title: dir.name,
    icon: h(FolderOpenOutlined), // 使用打开的文件夹图标
    class: "menu-item-subdirectory"
  }
}
