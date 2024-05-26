import { AppstoreAddOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons-vue"
import { If } from "@packages/common"
import { Inject } from "@packages/dependency-injection"
import type { Directory } from "@packages/ipc-handler/photo.ts"
import {
  BindThis,
  Component,
  type ComponentProps,
  EventListener,
  Link,
  Mut,
  toNative,
  VueComponent,
  type VueComponentBaseProps,
  Watcher
} from "@packages/vue-class"
import TitleBar from "@renderer/components/title-bar"
import { invoke } from "@renderer/exposed.ts"
import { PhotoDataService } from "@renderer/photo/data.service.ts"
import DirectoryManager from "@renderer/photo/directory-manager"
import ImgList from "@renderer/photo/img-list"
import { Button, Dropdown, Flex, Menu } from "ant-design-vue"
import type { Key } from "ant-design-vue/es/_util/type"
import type { MenuInfo } from "ant-design-vue/es/menu/src/interface"
import type { VNodeChild } from "vue"
import { RouterView } from "vue-router"
import icon from "./assets/icon.svg"
import "./photo.scss"

export interface PhotoProps extends VueComponentBaseProps {}

@Component()
export class PhotoInst extends VueComponent<PhotoProps> {
  static readonly defineProps: ComponentProps<PhotoProps> = ["inst"]

  @Inject() dataService: PhotoDataService
  @Mut() openKeys: Key[] = []
  @Mut() collapsed = false
  @Mut() isStretching = false
  @Link() asideEl: HTMLElement
  @Mut() asideWidth = -1
  stretchLineDownPos?: MouseEvent

  @Watcher() toReadImageInfos() {
    this.dataService.imageInfos = []
    const key = this.dataService.selectedKeys[0]
    if (key === "all-images") {
      invoke("photo:readImages", this.dataService.allDirectories)
      this.dataService.curDirectory = undefined
    } else if ((key + "").indexOf("$path:") === 0) {
      const path = (key + "").replace("$path:", "")
      const dir = findDirectory(this.dataService.allDirectories, path)
      if (dir) invoke("photo:readImages", [dir])
      this.dataService.curDirectory = dir
    } else {
      this.dataService.curDirectory = undefined
    }

    function findDirectory(directories: Directory[], path: string): Directory | undefined {
      for (let directory of directories) {
        if (directory.path === path) return directory
        if (directory.children) {
          const result = findDirectory(directory.children, path)
          if (result) return result
        }
      }
    }
  }

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

  @BindThis() handleToDirectoryManager() {
    this.dataService.curItemType = this.dataService.asideMenu[2] as any
    this.dataService.selectedKeys = ["directories"]
    this.router.push({ name: DirectoryManager.name })
  }

  @BindThis() handleClickMenuItem(val: MenuInfo) {
    this.dataService.curItemType = val.item.originItemValue as any
    this.router.push({ name: ImgList.name })
  }

  render(): VNodeChild {
    const curDirectory = this.dataService.curDirectory
    const imageInfos = this.dataService.imageInfos
    const curItemType = this.dataService.curItemType

    return (
      <div class={"h-full"}>
        {/*顶部窗口栏*/}
        <TitleBar icon={icon} title={"照片"} />

        {/*应用内容*/}
        <Flex class={"border-0 border-t-gray-100 border-t border-solid"} style={{ height: "calc(100% - 40px)" }}>
          {/*左侧菜单*/}
          <div
            ref={"asideEl"}
            class={[
              "relative h-full overflow-auto border-r-gray-100 border-0 border-r border-solid border-box select-none flex-shrink-0",
              If(this.collapsed).then("").else("w-96"),
              If(this.isStretching).then("").else("transition-all")
            ]}
            style={{
              minWidth: "81px",
              width: this.collapsed ? "81px" : this.asideWidth >= 0 ? this.asideWidth + "px" : "",
              maxWidth: "50%"
            }}
          >
            {/*折叠按钮*/}
            <Button class={"mt-1 mb-1 ml-0.5"} type={"primary"} onClick={() => (this.collapsed = !this.collapsed)}>
              {this.collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </Button>

            {/*跳转文件夹管理页面*/}
            <Button block type={"dashed"} icon={<AppstoreAddOutlined />} onClick={this.handleToDirectoryManager}>
              {this.collapsed || (this.asideWidth <= 130 && this.asideWidth >= 0) ? null : "管理文件夹"}
            </Button>

            {/*菜单*/}
            <Menu
              items={this.dataService.asideMenu}
              selectedKeys={this.dataService.selectedKeys}
              openKeys={this.openKeys}
              inlineCollapsed={this.collapsed || (this.asideWidth <= 90 && this.asideWidth >= 0)}
              mode={"inline"}
              onUpdate:selectedKeys={(val) => (this.dataService.selectedKeys = val)}
              onClick={this.handleClickMenuItem}
              style={{ border: "0" }}
            />

            {/*用来拉伸菜单栏的线*/}
            <div
              class={"absolute top-0 right-0 h-full cursor-col-resize"}
              style={{ width: "5px" }}
              onMousedown={this.handleMouseDownStretchLine}
            ></div>
          </div>

          {/*主体部分容器*/}
          <div class={"h-full flex-grow box-border select-none relative"}>
            {/*主体部分*/}
            <div
              class={"overflow-hidden absolute left-6 top-6"}
              style={{ width: "calc(100% - 48px)", height: "calc(100% - 24px)" }}
            >
              {/*头部标题和工具栏*/}
              <Flex class={"px-2 box-border"} justify={"space-between"} style={{ height: "100px" }}>
                {/*标题部分*/}
                <div>
                  {/*大标题*/}
                  <Flex align={"center"} class={"text-2xl mb-2"}>
                    {curItemType?.icon}
                    <span class={"ml-2"}>{curItemType?.label}</span>
                  </Flex>

                  {/*下方小字*/}
                  <div>
                    <span>{imageInfos.length ? `${imageInfos.length}张图片` : ""}</span>
                    {curDirectory?.children?.length ? (
                      <span class={"ml-2"}>{curDirectory.children.length}个文件夹</span>
                    ) : null}
                  </div>
                </div>

                {/*工具栏*/}
                <div></div>
              </Flex>

              {/*路由页面*/}
              <div class={"overflow-auto"} style={{ height: "calc(100% - 100px)" }}>
                <RouterView />
              </div>
            </div>
          </div>
        </Flex>

        {/*右键菜单*/}
        <div class={"fixed left-0 top-0"} style={this.dataService.contextmenuPos}>
          <Dropdown
            trigger={"contextmenu"}
            open={this.dataService.showContextmenu}
            onUpdate:open={(val) => (this.dataService.showContextmenu = val)}
            overlay={<Menu items={this.dataService.curContextmenu}></Menu>}
          >
            <div></div>
          </Dropdown>
        </div>
      </div>
    )
  }
}

export default toNative<PhotoProps>(PhotoInst)
