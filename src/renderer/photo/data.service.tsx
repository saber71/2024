import { FolderOpenOutlined, PictureOutlined, StarOutlined } from "@ant-design/icons-vue"
import { remove } from "@packages/common"
import type { ImageInfo } from "@packages/electron"
import type { Directory } from "@packages/ipc-handler/photo.ts"
import {
  BindThis,
  EventListener,
  Invoke,
  IpcReceived,
  IpcSync,
  Mut,
  Service,
  Throttle,
  VueService,
  Watcher
} from "@packages/vue-class"
import { invoke } from "@renderer/exposed.ts"
import { Input, type ItemType, Modal } from "ant-design-vue"
import type { Key } from "ant-design-vue/es/_util/type"
import EventEmitter from "eventemitter3"
import type { OverlayScrollbars } from "overlayscrollbars"
import { h, ref, type VNode } from "vue"

type SortOrder = "birthtimeMs" | "mtimeMs" | "name"
type ShowType = "rect" | "same-height"
type ShowSize = "small" | "medium" | "big"
export type FilterType = "all" | "image" | "video"

export const photoEventBus = new EventEmitter<{
  scroll: () => void
  selectAll: () => void
  unselectAll: () => void
  updateRows: () => void
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
              const path = await invoke("createDirectory", curDirectory.path, directoryName)
              if (!path) {
                status.value = "error"
                return Promise.reject(`文件名${directoryName}已存在`)
              } else {
                status.value = ""
                if (!curDirectory.children) curDirectory.children = []
                curDirectory.children.push({
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
      label: "在文件资源管理器中打开",
      key: "open-directory",
      onClick: () => {
        if (this.curDirectory) {
          invoke("showItemInFolder", this.curDirectory.path)
        }
      }
    },
    {
      type: "divider"
    },
    {
      label: "删除文件夹",
      key: "remove-directory",
      class: "directory-contextmenu-remove",
      onClick: () => {
        this.showContextmenu = false
        if (this.curDirectory) {
          Modal.confirm({
            title: "删除文件夹",
            content: `是否从应用中删除文件夹${this.curDirectory?.name}？`,
            onOk: () => {
              const index = this.allDirectories.indexOf(this.curDirectory!)
              this.directoryThumbnails.splice(index, 1)
              remove(this.allDirectories, this.curDirectory)
              this.allDirectories = this.allDirectories.slice()
            },
            centered: true,
            okText: "删除"
          })
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

  // 当前选中的菜单项
  @Mut() curItemType?: { label: string; icon: VNode }

  // 存储目录信息
  // 当数据发生变化时发送数据到photo:updateDirectories频道
  // 初始化时从频道photo:allDirectories获取所有目录的数据
  @IpcSync("photo:updateDirectories")
  @Invoke("photo:allDirectories")
  @Mut(true)
  allDirectories: Directory[] = []

  // 目录的缩略图
  @Mut() directoryThumbnails: string[] = []

  // 图片信息列表，用于存储图片的各种信息，例如元数据、文件路径等。
  // 接受来自photo:transferImageInfo频道的数据
  @IpcReceived("photo:transferImageInfo", { concat: true })
  @Mut()
  imageInfos: ImageInfo[] = []

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
  @Mut() selectedKeys: Key[] = ["all-images"]

  // 滚动条实例
  scrollbarInstance?: OverlayScrollbars

  // 选中的图片地址集合
  @Mut() selectedImagePaths = new Set<string>()

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
    this.selectedImagePaths.add(pic.path)
  }

  /**
   * 根据设定的排序规则对图片信息进行排序。
   * 此方法为响应式，当排序规则发生变化时会被自动调用。
   * 无显式返回值，但会修改类成员变量`imageInfos`的顺序。
   */
  @Watcher() sortImageInfos() {
    if (!this.imageInfos.length) return
    // 获取当前的排序规则
    const order = this.imageSortRule.order
    const asc = this.imageSortRule.asc
    this._sortImageInfosImpl(order, asc)
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
    for (let info of this.imageInfos) {
      this.selectedImagePaths.add(info.path)
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
    const result = await invoke("photo:selectDirectory")
    if (result) {
      // 如果选择成功，将新目录添加到所有目录列表中
      this.allDirectories.push(result.dir)
      // 通过切片操作更新 `allDirectories` 数组，以触发视图更新
      this.allDirectories = this.allDirectories.slice()
      // 将新目录的缩略图添加到缩略图数组中
      this.directoryThumbnails.push(result.thumbnail)
    }
  }

  /**
   * 查找指定路径的目录。
   * @param key 以"$path:"开头的字符串，表示要查找的路径。
   * @returns 返回找到的目录对象，如果未找到则返回undefined。
   */
  findDirectory(key: string) {
    // 从key中截取路径字符串
    const path = key.slice("$path:".length)
    // 调用find函数在所有目录中查找指定路径
    return find(this.allDirectories, path)

    /**
     * 在目录列表中递归查找指定路径的目录。
     * @param directories 目录列表数组。
     * @param path 要查找的路径字符串。
     * @returns 找到的目录对象，如果未找到则返回undefined。
     */
    function find(directories: Directory[], path: string): Directory | undefined {
      // 遍历目录列表
      for (let directory of directories) {
        // 如果路径匹配，则返回当前目录
        if (directory.path === path) return directory
        // 如果当前目录有子目录，则在子目录中递归查找
        if (directory.children) {
          const result = find(directory.children, path)
          // 如果在子目录中找到了目标目录，则返回该目录
          if (result) return result
        }
      }
    }
  }

  setup() {
    this.curItemType = this.asideMenu[0] as any
  }

  /**
   * 根据指定排序条件对图片信息进行排序。
   * 使用防抖装饰器限制函数的调用频率，以提高性能。
   *
   * @param order 排序字段，可为"name"或其他图片信息的属性名。
   * @param asc 是否为升序排序。true为升序，false为降序。
   */
  @Throttle()
  private _sortImageInfosImpl(order: SortOrder, asc: boolean) {
    this.imageInfos.sort((a, b) => {
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
}

/**
 * 将目录对象转换为项目类型对象。
 *
 * @param dir 目录对象，包含路径、名称以及可能的子目录信息。
 * @returns 返回一个具有键、标签、标题、图标和子项的项目类型对象。
 */
function toItemType(dir: Directory): ItemType {
  return {
    key: "$path:" + dir.path, // 使用目录的路径作为键
    label: dir.name, // 目录的名称作为标签和标题
    title: dir.name,
    icon: h(FolderOpenOutlined), // 使用打开的文件夹图标
    children: dir.children?.map(toItemType), // 如果存在子目录，递归地将它们转换为项目类型对象
    class: "menu-item-subdirectory"
  }
}
