import { FolderOpenOutlined, PictureOutlined, StarOutlined } from "@ant-design/icons-vue"
import { remove } from "@packages/common"
import type { ImageInfo } from "@packages/electron"
import type { Directory } from "@packages/ipc-handler/photo.ts"
import { Invoke, IpcReceived, IpcSync, Mut, Service, VueService, Watcher } from "@packages/vue-class"
import { invoke } from "@renderer/exposed.ts"
import { type ItemType, Modal } from "ant-design-vue"
import type { Key } from "ant-design-vue/es/_util/type"
import type { OverlayScrollbars } from "overlayscrollbars"
import { h, type VNode } from "vue"

/**
 * PhotoDataService 类提供与照片数据相关的服务，
 * 继承自VueService基类。
 */
@Service()
export class PhotoDataService extends VueService {
  // 文件夹的右键菜单
  readonly directoryContextmenu: ItemType[] = [
    {
      label: "创建文件夹",
      key: "create-directory"
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
      label: "删除文件夹",
      key: "remove-directory",
      class: "directory-contextmenu-remove",
      onClick: () => {
        if (this.curDirectory) {
          this.showContextmenu = false
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
            cancelText: "取消",
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
  @Mut() imageSortRule: { order: "birthtimeMs" | "mtimeMs" | "name"; asc: boolean } = {
    order: "birthtimeMs", //排序根据
    asc: true //是否升序
  }

  // 图片的显示配置
  @Mut() imageShowSetting: { type: "rect" | "same-height"; size: "small" | "medium" | "big" } = {
    type: "same-height",
    size: "big"
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

  // OverlayScrollbars instance
  scrollbarInstance?: OverlayScrollbars

  // OverlayScrollbars scroll listeners
  readonly routeViewScrollListeners: Array<() => void> = []

  /**
   * 根据设定的排序规则对图片信息进行排序。
   * 此方法为响应式，当排序规则发生变化时会被自动调用。
   * 无显式返回值，但会修改类成员变量`imageInfos`的顺序。
   */
  @Watcher() sortImageInfos() {
    // 获取当前的排序规则
    const order = this.imageSortRule.order
    this.imageInfos.sort((a, b) => {
      let result = 0
      // 根据排序字段进行比较
      if (order === "name") result = a.name.localeCompare(b.name)
      else result = a[order] - b[order]
      // 如果为降序，则反转结果
      if (!this.imageSortRule.asc) result *= -1
      return result
    })
  }

  /**
   * 监听器函数，更新菜单中的目录信息。
   * 随着allDirectories的变化，动态更新菜单项的子目录列表。
   */
  @Watcher() updateMenuDirectories() {
    ;(this.asideMenu[2] as any).children = this.allDirectories.map(toItemType)
  }

  setup() {
    this.curItemType = this.asideMenu[0] as any
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
    children: dir.children?.map(toItemType) // 如果存在子目录，递归地将它们转换为项目类型对象
  }
}
