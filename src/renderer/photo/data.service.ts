import { FolderOpenOutlined, PictureOutlined, StarOutlined } from "@ant-design/icons-vue"
import type { ImageInfo } from "@packages/electron"
import type { Directory } from "@packages/ipc-handler/photo.ts"
import { Mut, Service, VueService, Watcher } from "@packages/vue-class"
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
  @Mut() allDirectories: Directory[] = []

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
    ;(this.menus[2] as any).children = this.allDirectories.map(
      (dir) =>
        ({
          key: dir.path,
          label: dir.name,
          icon: h(FolderOpenOutlined)
        }) as ItemType
    )
  }
}
