import { FolderOpenOutlined, PictureOutlined, StarOutlined } from "@ant-design/icons-vue"
import type { ImageInfo } from "@packages/electron"
import type { Directory } from "@packages/ipc-handler/photo.ts"
import { Invoke, Mut, Service, VueService, Watcher } from "@packages/vue-class"
import type { ItemType } from "ant-design-vue"
import { h } from "vue"

/**
 * PhotoDataService 类提供与照片数据相关的服务，
 * 继承自VueService基类。
 */
@Service()
export class PhotoDataService extends VueService {
  // 当前目录对象，用于存储当前选择的目录信息
  @Mut() curDirectory?: Directory

  // 当前图片列表的名称，用于标识当前显示的图片列表
  @Mut() curImageListName: string = ""

  // 存储目录信息
  @Invoke("photo:allDirectories") @Mut() allDirectories: Directory[] = []

  // 菜单项列表，存储应用中的菜单项信息。包括所有图片、收藏夹和文件夹等菜单。
  @Mut() menus: ItemType[] = [
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
      children: []
    }
  ]

  // 图片信息列表，用于存储图片的各种信息，例如元数据、文件路径等。
  @Mut() imageInfos: ImageInfo[] = []

  /**
   * 监听器函数，更新菜单中的目录信息。
   * 随着allDirectories的变化，动态更新菜单项的子目录列表。
   */
  @Watcher() updateMenuDirectories() {
    ;(this.menus[2] as any).children = this.allDirectories.map(toItemType)
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
    key: dir.path, // 使用目录的路径作为键
    label: dir.name, // 目录的名称作为标签和标题
    title: dir.name,
    icon: h(FolderOpenOutlined), // 使用打开的文件夹图标
    children: dir.children?.map(toItemType) // 如果存在子目录，递归地将它们转换为项目类型对象
  }
}
