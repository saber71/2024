import {
  DownOutlined,
  FolderOpenOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  StarOutlined
} from "@ant-design/icons-vue"
import type { Directory } from "@packages/ipc-handler/photo.ts"
import {
  BindThis,
  Component,
  type ComponentProps,
  Mut,
  toNative,
  VueComponent,
  type VueComponentBaseProps
} from "@packages/vue-class"
import { invoke } from "@renderer/exposed.ts"
import type { VNodeChild } from "vue"
import "./index.scss"

export interface MenuProps extends VueComponentBaseProps {}

@Component()
export class MenuInst extends VueComponent<MenuProps> {
  static readonly defineProps: ComponentProps<MenuProps> = ["inst"]

  @Mut() isExpand = true
  @Mut() selectedItem = 0
  @Mut() expandDirectory = false
  @Mut() directories: Array<Directory> = []

  setup() {
    invoke("photo:allDirectories").then((res) => (this.directories = res))
  }

  @BindThis() handleClickDirectory() {
    this.selectedItem = 2
    this.expandDirectory = !this.expandDirectory
  }

  @BindThis() handleClickFoldIcon() {
    this.isExpand = !this.isExpand
    if (!this.isExpand) this.expandDirectory = false
  }

  render(): VNodeChild {
    return (
      <div class={"menu " + (this.isExpand ? "" : "folded")}>
        <div class={"fold-icon icon"} onClick={this.handleClickFoldIcon}>
          {this.isExpand ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        </div>
        <div
          class={"item item-border " + (this.selectedItem === 0 ? "selected-item" : "")}
          onClick={() => (this.selectedItem = 0)}
        >
          <div class={"icon margin-left-5px"}>
            <PictureOutlined />
          </div>
          <span class={"title"}>所有图片</span>
        </div>
        <div
          class={"item item-border " + (this.selectedItem === 1 ? "selected-item" : "")}
          onClick={() => (this.selectedItem = 1)}
        >
          <div class={"icon margin-left-5px"}>
            <StarOutlined />
          </div>
          <span class={"title"}>收藏夹</span>
        </div>
        <div class={"item " + (this.selectedItem === 2 ? "selected-item" : "")} onClick={this.handleClickDirectory}>
          <div class={"icon margin-left-5px"}>
            <FolderOpenOutlined />
          </div>
          <span class={"title"}>文件夹</span>
          <DownOutlined class={"arrow " + (this.expandDirectory ? "arrow-selected" : "")} />
        </div>
        {this.expandDirectory
          ? this.directories.map((directory, index) => (
              <div>
                <div
                  class={"item " + (this.selectedItem === 3 + index ? "selected-item" : "")}
                  onClick={() => (this.selectedItem = 3 + index)}
                >
                  <div class={"icon"} style={{ marginLeft: "30px" }}>
                    <FolderOpenOutlined />
                  </div>
                  <span class={"title"}>{directory.name}</span>
                </div>
              </div>
            ))
          : null}
      </div>
    )
  }
}

export default toNative<MenuProps>(MenuInst)
