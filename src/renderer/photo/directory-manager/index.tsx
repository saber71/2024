import { PlusCircleOutlined } from "@ant-design/icons-vue"
import type { Directory } from "@main/photo.ipc.ts"
import { Inject } from "@packages/dependency-injection"
import {
  BindThis,
  Component,
  type ComponentProps,
  toNative,
  VueComponent,
  type VueComponentBaseProps
} from "@packages/vue-class"
import { KEY_PREFIX, PhotoDataService } from "@renderer/photo/data.service.tsx"
import ImgList from "@renderer/photo/img-list"
import { Flex } from "ant-design-vue"
import type { VNodeChild } from "vue"
import "./index.scss"
import directoryImg from "../assets/directory.svg"

export interface DirectoryManagerProps extends VueComponentBaseProps {}

@Component()
export class DirectoryManagerInst extends VueComponent<DirectoryManagerProps> {
  static readonly defineProps: ComponentProps<DirectoryManagerProps> = ["inst"]

  @Inject() dataService: PhotoDataService

  @BindThis() showContextmenu(e: MouseEvent, dir: Directory) {
    this.dataService.showContextmenu = true
    this.dataService.contextmenuPos = {
      left: e.clientX + "px",
      top: e.clientY + "px"
    }
    this.dataService.curContextmenu = this.dataService.directoryContextmenu
    this.dataService.curDirectory = dir
  }

  @BindThis() handleClickDirectory(dir: Directory) {
    const key = KEY_PREFIX + dir.path
    this.dataService.selectedAsideKeys = [key]
    this.dataService.curItemType = this.dataService.findMenuItem(key) as any
    this.dataService.curDirectory = this.dataService.findDirectory(dir.path)
    this.router.push({ name: ImgList.name })
  }

  render(): VNodeChild {
    return (
      <Flex gap={50} wrap={"wrap"} class={"pt-2 pl-2 pr-2 box-border"}>
        <div class={"directory-item"} onClick={this.dataService.addDirectory}>
          <PlusCircleOutlined class={"add-icon"} />
          <span class={"add-text"}>添加文件夹</span>
        </div>
        {this.dataService.allDirectories.map((dir) => (
          <div
            class={"directory-item"}
            onContextmenu={(e) => this.showContextmenu(e, dir)}
            onClick={() => this.handleClickDirectory(dir)}
          >
            <img class={"icon"} src={directoryImg} />
            <img class={"thumbnail"} src={dir.thumbnail} />
            <span class={"name"}>{dir.name}</span>
          </div>
        ))}
      </Flex>
    )
  }
}

export default toNative<DirectoryManagerProps>(DirectoryManagerInst)
