import { PlusCircleOutlined } from "@ant-design/icons-vue"
import { Inject } from "@packages/dependency-injection"
import type { Directory } from "@packages/ipc-handler/photo.ts"
import {
  BindThis,
  Component,
  type ComponentProps,
  Setup,
  toNative,
  VueComponent,
  type VueComponentBaseProps
} from "@packages/vue-class"
import { invoke } from "@renderer/exposed.ts"
import { PhotoDataService } from "@renderer/photo/data.service.tsx"
import { Flex } from "ant-design-vue"
import type { VNodeChild } from "vue"
import "./index.scss"
import directoryImg from "../assets/directory.svg"

export interface DirectoryManagerProps extends VueComponentBaseProps {}

@Component()
export class DirectoryManagerInst extends VueComponent<DirectoryManagerProps> {
  static readonly defineProps: ComponentProps<DirectoryManagerProps> = ["inst"]

  @Inject() dataService: PhotoDataService

  @Setup() async updateDirectoryThumbnail() {
    await invoke("photo:getDirectoryThumbnail", this.dataService.allDirectories).then(
      (paths) => (this.dataService.directoryThumbnails = paths)
    )
  }

  @BindThis() showContextmenu(e: MouseEvent, dir: Directory) {
    this.dataService.showContextmenu = true
    this.dataService.contextmenuPos = {
      left: e.clientX + "px",
      top: e.clientY + "px"
    }
    this.dataService.curContextmenu = this.dataService.directoryContextmenu
    this.dataService.curDirectory = dir
  }

  render(): VNodeChild {
    return (
      <Flex gap={50} wrap={"wrap"} class={"pt-2 pl-2 pr-2 box-border"}>
        <div class={"directory-item"} onClick={this.dataService.addDirectory}>
          <PlusCircleOutlined class={"add-icon"} />
          <span class={"add-text"}>添加文件夹</span>
        </div>
        {this.dataService.allDirectories.map((dir, index) => (
          <div class={"directory-item"} onContextmenu={(e) => this.showContextmenu(e, dir)}>
            <img class={"icon"} src={directoryImg} />
            <img class={"thumbnail"} src={this.dataService.directoryThumbnails[index]} />
            <span class={"name"}>{dir.name}</span>
          </div>
        ))}
      </Flex>
    )
  }
}

export default toNative<DirectoryManagerProps>(DirectoryManagerInst)
