import { AppstoreAddOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons-vue"
import { If } from "@packages/common"
import { Inject } from "@packages/dependency-injection"
import {
  BindThis,
  Component,
  type ComponentProps,
  EventListener,
  Hook,
  Link,
  Mut,
  toNative,
  VueComponent,
  type VueComponentBaseProps,
  Watcher
} from "@packages/vue-class"
import TitleBar from "@renderer/components/title-bar"
import { KEY_PREFIX, PhotoDataService, photoEventBus } from "@renderer/photo/data.service.tsx"
import DirectoryManager from "@renderer/photo/directory-manager"
import ImgList from "@renderer/photo/img-list"
import Toolbar from "@renderer/photo/toolbar"
import { Button, ConfigProvider, Dropdown, Flex, Menu } from "ant-design-vue"
import type { Key } from "ant-design-vue/es/_util/type"
import zhCN from "ant-design-vue/es/locale/zh_CN"
import type { MenuInfo } from "ant-design-vue/es/menu/src/interface"
import interact from "interactjs"
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue"
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
  @Mut() inResize = false
  @Link() asideEl: HTMLElement
  @Mut() asideWidth = -1

  @Watcher({
    source: (instance: PhotoInst) => [instance.dataService.allDirectories, instance.dataService.selectedAsideKeys]
  })
  toReadImageInfos() {
    const key = this.dataService.selectedAsideKeys[0]
    if (key === "all-images") {
      this.dataService.setCurDirectory(undefined)
    } else if ((key + "").indexOf(KEY_PREFIX) === 0) {
      const dir = this.dataService.findDirectory(key + "")
      this.dataService.setCurDirectory(dir)
    } else {
      this.dataService.setCurDirectory(undefined)
    }
  }

  @Hook("onMounted") toResizeAside() {
    interact(this.asideEl)
      .resizable({
        edges: {
          right: true
        },
        listeners: {
          move: (e: { rect: { width: number } }) => {
            this.asideWidth = Math.max(e.rect.width, 0)
          }
        }
      })
      .on("resizestart", () => (this.inResize = true))
      .on("resizeend", () => (this.inResize = false))
  }

  @BindThis() handleToDirectoryManager() {
    this.dataService.curItemType = this.dataService.asideMenu[2] as any
    this.dataService.selectedImagePaths.clear()
    this.dataService.selectedAsideKeys = ["directories"]
    this.router.push({ name: DirectoryManager.name })
  }

  @BindThis() handleClickMenuItem(val: MenuInfo) {
    this.dataService.curItemType = val.item.originItemValue as any
    this.dataService.selectedImagePaths.clear()
    this.router.push({ name: ImgList.name })
  }

  @BindThis() handleScroll(instance: any) {
    this.dataService.scrollbarInstance = instance
    photoEventBus.emit("scroll")
  }

  @EventListener("menu-item-directories", "contextmenu") showDirectoriesContextmenu(e: MouseEvent) {
    let target: HTMLElement = e.target as any
    let gotIt = false
    while (!target.className.includes("menu-item-directories") && !gotIt) {
      gotIt = target.className.includes("menu-item-subdirectory")
      if (!gotIt) target = target.parentElement!
    }
    this.dataService.showContextmenu = true
    this.dataService.contextmenuPos = {
      left: e.clientX + "px",
      top: e.clientY + "px"
    }
    if (gotIt) {
      this.dataService.curContextmenu = this.dataService.directoryContextmenu
      const path = target.getAttribute("data-menu-id")
      this.dataService.curDirectory = this.dataService.findDirectory(path ?? "")
    } else this.dataService.curContextmenu = this.dataService.directoriesContextMenu
  }

  render(): VNodeChild {
    const imageInfos = this.dataService.curImageInfos
    const curItemType = this.dataService.curItemType

    return (
      <ConfigProvider locale={zhCN}>
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
                If(this.inResize).then("").else("transition-all")
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
                selectedKeys={this.dataService.selectedAsideKeys}
                openKeys={this.openKeys}
                inlineCollapsed={this.collapsed || (this.asideWidth <= 90 && this.asideWidth >= 0)}
                mode={"inline"}
                onUpdate:selectedKeys={(val) => (this.dataService.selectedAsideKeys = val)}
                onClick={this.handleClickMenuItem}
                style={{ border: "0" }}
              />
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
                    </div>
                  </div>

                  {/*工具栏*/}
                  {this.route.name === ImgList.name ? <Toolbar /> : <div></div>}
                </Flex>

                {/*路由页面*/}
                <OverlayScrollbarsComponent
                  options={{ scrollbars: { theme: "os-theme-light scrollbar-theme-light" } }}
                  events={{
                    scroll: this.handleScroll,
                    initialized: (instance) => (this.dataService.scrollbarInstance = instance)
                  }}
                  style={{ height: "calc(100% - 100px)" }}
                >
                  <RouterView />
                </OverlayScrollbarsComponent>
              </div>
            </div>
          </Flex>

          {/*右键菜单*/}
          <div class={"fixed left-0 top-0"} style={this.dataService.contextmenuPos}>
            <Dropdown
              trigger={"click"}
              open={this.dataService.showContextmenu}
              onUpdate:open={(val) => (this.dataService.showContextmenu = val)}
              overlay={<Menu items={this.dataService.curContextmenu}></Menu>}
            >
              <div></div>
            </Dropdown>
          </div>
        </div>
      </ConfigProvider>
    )
  }
}

export default toNative<PhotoProps>(PhotoInst)
