import { AppstoreAddOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons-vue"
import { If } from "@packages/common"
import { Inject } from "@packages/dependency-injection"
import {
  BindThis,
  Component,
  type ComponentProps,
  EventListener,
  Link,
  Mut,
  toNative,
  VueComponent,
  type VueComponentBaseProps
} from "@packages/vue-class"
import TitleBar from "@renderer/components/title-bar"
import { PhotoDataService } from "@renderer/photo/data.service.ts"
import { Button, Flex, Menu } from "ant-design-vue"
import type { Key } from "ant-design-vue/es/_util/type"
import type { VNodeChild } from "vue"
import { RouterView } from "vue-router"
import icon from "./assets/icon.svg"

export interface PhotoProps extends VueComponentBaseProps {}

@Component()
export class PhotoInst extends VueComponent<PhotoProps> {
  static readonly defineProps: ComponentProps<PhotoProps> = ["inst"]

  @Inject() dataService: PhotoDataService
  @Mut() selectedKeys: Key[] = ["all-images"]
  @Mut() openKeys: Key[] = []
  @Mut() collapsed = false
  @Mut() isStretching = false
  @Link() asideEl: HTMLElement
  @Mut() asideWidth = -1
  stretchLineDownPos?: MouseEvent

  @BindThis() handleMouseDownStretchLine(e: MouseEvent) {
    this.isStretching = true
    this.stretchLineDownPos = e
    this.asideWidth = this.asideEl.getBoundingClientRect().width
    this.collapsed = false
  }

  @EventListener(document, "mouseup") handleMouseUpStretchLine() {
    if (!this.isStretching) return
    this.isStretching = false
    this.stretchLineDownPos = undefined
  }

  @EventListener(document, "mousemove") handleMouseMoveStretchLine(e: MouseEvent) {
    if (!this.stretchLineDownPos) return
    const delta = e.clientX - this.stretchLineDownPos.clientX
    this.asideWidth = Math.max(this.asideWidth + delta, 0)
    this.stretchLineDownPos = e
  }

  render(): VNodeChild {
    return (
      <div class={"h-full"}>
        <TitleBar icon={icon} title={"照片"} />
        <Flex class={"border-0 border-t-gray-100 border-t border-solid"} style={{ height: "calc(100% - 40px)" }}>
          <div
            ref={"asideEl"}
            class={
              "relative h-full overflow-auto border-r-gray-100 border-0 border-r border-solid border-box select-none" +
              If(this.collapsed).then("").else("w-96") +
              If(this.isStretching).then("").else("transition-all")
            }
            style={{
              minWidth: "81px",
              width: this.collapsed ? "81px" : this.asideWidth >= 0 ? this.asideWidth + "px" : "",
              maxWidth: "50%"
            }}
          >
            <Button class={"mt-1 mb-1 ml-0.5"} type={"primary"} onClick={() => (this.collapsed = !this.collapsed)}>
              {this.collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </Button>
            <Button block type={"dashed"} icon={<AppstoreAddOutlined />}>
              {this.collapsed || (this.asideWidth <= 130 && this.asideWidth >= 0) ? null : "管理文件夹"}
            </Button>
            <Menu
              items={this.dataService.menus}
              selectedKeys={this.selectedKeys}
              openKeys={this.openKeys}
              inlineCollapsed={this.collapsed || (this.asideWidth <= 90 && this.asideWidth >= 0)}
              mode={"inline"}
              onUpdate:selectedKeys={(val) => (this.selectedKeys = val)}
              onClick={(val) => console.log(val)}
              style={{ border: "0" }}
            />
            <div
              class={"absolute top-0 right-0 h-full cursor-col-resize"}
              style={{ width: "5px" }}
              onMousedown={this.handleMouseDownStretchLine}
            ></div>
          </div>
          <div class={"h-full flex-grow box-border p-1 select-none"}>
            <div class={"h-full overflow-hidden"}>
              <RouterView />
            </div>
          </div>
        </Flex>
      </div>
    )
  }
}

export default toNative<PhotoProps>(PhotoInst)
