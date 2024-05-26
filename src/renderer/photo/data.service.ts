import { FolderOpenOutlined, PictureOutlined, StarOutlined } from "@ant-design/icons-vue"
import { remove } from "@packages/common"
import type { ImageInfo } from "@packages/electron"
import type { Directory } from "@packages/ipc-handler/photo.ts"
import { Invoke, IpcReceived, IpcSync, Mut, Service, VueService, Watcher } from "@packages/vue-class"
import { invoke } from "@renderer/exposed.ts"
import { type ItemType, Modal } from "ant-design-vue"
import { h, type VNode } from "vue"

/**
 * PhotoDataService 类提供与照片数据相关的服务，
 * 继承自VueService基类。
 */
@Service()
export class PhotoDataService extends VueService {
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

  @Mut() showContextmenu = false

  @Mut() contextmenuPos?: { left: string; top: string }

  @Mut() curContextmenu?: ItemType[]

  // 当前目录对象，用于存储当前选择的目录信息
  @Mut(true) curDirectory?: Directory

  // 当前选中的菜单项
  @Mut() curItemType?: { label: string; icon: VNode }

  // 存储目录信息
  @IpcSync("photo:updateDirectories")
  @Invoke("photo:allDirectories")
  @Mut(true)
  allDirectories: Directory[] = []

  @Mut() directoryThumbnails: string[] = []

  // 图片信息列表，用于存储图片的各种信息，例如元数据、文件路径等。
  @IpcReceived("photo:transferImageInfo", { concat: true })
  @Mut()
  imageInfos: ImageInfo[] = []

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
