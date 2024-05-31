import {
  AppstoreOutlined,
  CheckOutlined,
  CloseOutlined,
  DashOutlined,
  DownOutlined,
  FunnelPlotOutlined,
  RightCircleOutlined,
  SortAscendingOutlined
} from "@ant-design/icons-vue"
import type { Directory } from "@main/photo.ipc.ts"
import { Inject } from "@packages/dependency-injection"
import {
  BindThis,
  Component,
  type ComponentProps,
  Computed,
  EventListener,
  Mut,
  toNative,
  VueComponent,
  type VueComponentBaseProps
} from "@packages/vue-class"
import { PhotoDataService, photoEventBus } from "@renderer/photo/data.service.tsx"
import { Button, Dropdown, Flex, Menu, MenuDivider, MenuItem, Modal, Tree } from "ant-design-vue"
import type { VNodeChild } from "vue"

export interface ToolbarProps extends VueComponentBaseProps {}

@Component()
export class ToolbarInst extends VueComponent<ToolbarProps> {
  static readonly defineProps: ComponentProps<ToolbarProps> = ["inst"]

  @Inject() dataService: PhotoDataService
  @Mut() openModal = false
  @Mut() selectedDirectoryPaths: any[] = []
  copyOrMove: "复制" | "移动" = "移动"

  @Computed() get allDirectories() {
    return this.dataService.allDirectories.map(toTreeData)

    function toTreeData(dir: Directory): any {
      return {
        title: dir.name,
        key: dir.path
      }
    }
  }

  @BindThis() updateOpenModal(val: boolean) {
    this.openModal = val
    if (!this.openModal) {
      this.selectedDirectoryPaths = []
    }
  }

  @EventListener(photoEventBus, "copyOrMoveFiles") @BindThis() copyOrMoveFiles(type: "复制" | "移动") {
    this.openModal = true
    this.copyOrMove = type
  }

  @BindThis() async handleModalConfirm() {
    await this.dataService.copyOrMoveImages(this.copyOrMove, this.selectedDirectoryPaths[0])
    this.openModal = false
  }

  render(): VNodeChild {
    return (
      <Flex align={"center"} style={{ height: "fit-content" }}>
        {this.dataService.selectedImagePaths.size ? (
          <Button type={"text"} icon={<CloseOutlined />} onClick={() => photoEventBus.emit("unselectAll")}>
            已选择{this.dataService.selectedImagePaths.size}
          </Button>
        ) : null}
        {this.dataService.selectedImagePaths.size ? (
          <Dropdown
            trigger={"click"}
            overlay={
              <Menu>
                <MenuItem key={"1"} onClick={() => this.copyOrMoveFiles("移动")}>
                  移动到文件夹
                </MenuItem>
                <MenuItem key={"2"} onClick={() => this.copyOrMoveFiles("复制")}>
                  复制到文件夹
                </MenuItem>
              </Menu>
            }
          >
            <Button type={"text"}>
              <RightCircleOutlined />
              <span class={"ml-1"}>移动/复制</span>
              <DownOutlined style={{ fontSize: "10px" }} />
            </Button>
          </Dropdown>
        ) : null}
        <Dropdown
          trigger={"click"}
          overlay={
            <Menu>
              <MenuItem
                key={"1"}
                onClick={() => (this.dataService.imageSortRule.order = "birthtimeMs")}
                icon={
                  <CheckOutlined
                    style={{ opacity: this.dataService.imageSortRule.order === "birthtimeMs" ? "1" : "0" }}
                  />
                }
              >
                创建日期
              </MenuItem>
              <MenuItem
                key={"2"}
                onClick={() => (this.dataService.imageSortRule.order = "mtimeMs")}
                icon={
                  <CheckOutlined style={{ opacity: this.dataService.imageSortRule.order === "mtimeMs" ? "1" : "0" }} />
                }
              >
                修改日期
              </MenuItem>
              <MenuItem
                key={"3"}
                onClick={() => (this.dataService.imageSortRule.order = "name")}
                icon={
                  <CheckOutlined style={{ opacity: this.dataService.imageSortRule.order === "name" ? "1" : "0" }} />
                }
              >
                名字
              </MenuItem>
              <MenuDivider />
              <MenuItem
                key={"4"}
                onClick={() => (this.dataService.imageSortRule.asc = true)}
                icon={<CheckOutlined style={{ opacity: this.dataService.imageSortRule.asc ? "1" : "0" }} />}
              >
                升序
              </MenuItem>
              <MenuItem
                key={"5"}
                onClick={() => (this.dataService.imageSortRule.asc = false)}
                icon={<CheckOutlined style={{ opacity: !this.dataService.imageSortRule.asc ? "1" : "0" }} />}
              >
                降序
              </MenuItem>
            </Menu>
          }
        >
          <Button type={"text"}>
            <SortAscendingOutlined />
            <DownOutlined style={{ fontSize: "10px" }} />
          </Button>
        </Dropdown>
        <Dropdown
          trigger={"click"}
          overlay={
            <Menu>
              <MenuItem
                key={"1"}
                onClick={() => (this.dataService.imageShowSetting.filter = "all")}
                icon={
                  <CheckOutlined style={{ opacity: this.dataService.imageShowSetting.filter === "all" ? "1" : "0" }} />
                }
              >
                所有媒体
              </MenuItem>
              <MenuItem
                key={"2"}
                onClick={() => (this.dataService.imageShowSetting.filter = "image")}
                icon={
                  <CheckOutlined
                    style={{ opacity: this.dataService.imageShowSetting.filter === "image" ? "1" : "0" }}
                  />
                }
              >
                图片
              </MenuItem>
              <MenuItem
                key={"3"}
                onClick={() => (this.dataService.imageShowSetting.filter = "video")}
                icon={
                  <CheckOutlined
                    style={{ opacity: this.dataService.imageShowSetting.filter === "video" ? "1" : "0" }}
                  />
                }
              >
                视频
              </MenuItem>
            </Menu>
          }
        >
          <Button type={"text"}>
            <FunnelPlotOutlined />
            <DownOutlined style={{ fontSize: "10px" }} />
          </Button>
        </Dropdown>
        <Dropdown
          trigger={"click"}
          overlay={
            <Menu>
              <MenuItem
                key={"1"}
                onClick={() => (this.dataService.imageShowSetting.type = "same-height")}
                icon={
                  <CheckOutlined
                    style={{ opacity: this.dataService.imageShowSetting.type === "same-height" ? "1" : "0" }}
                  />
                }
              >
                等高
              </MenuItem>
              <MenuItem
                key={"2"}
                onClick={() => (this.dataService.imageShowSetting.type = "rect")}
                icon={
                  <CheckOutlined style={{ opacity: this.dataService.imageShowSetting.type === "rect" ? "1" : "0" }} />
                }
              >
                方形
              </MenuItem>
              <MenuDivider />
              <MenuItem
                key={"3"}
                onClick={() => (this.dataService.imageShowSetting.size = "small")}
                icon={
                  <CheckOutlined style={{ opacity: this.dataService.imageShowSetting.size === "small" ? "1" : "0" }} />
                }
              >
                小
              </MenuItem>
              <MenuItem
                key={"4"}
                onClick={() => (this.dataService.imageShowSetting.size = "medium")}
                icon={
                  <CheckOutlined style={{ opacity: this.dataService.imageShowSetting.size === "medium" ? "1" : "0" }} />
                }
              >
                中
              </MenuItem>
              <MenuItem
                key={"5"}
                onClick={() => (this.dataService.imageShowSetting.size = "big")}
                icon={
                  <CheckOutlined style={{ opacity: this.dataService.imageShowSetting.size === "big" ? "1" : "0" }} />
                }
              >
                大
              </MenuItem>
            </Menu>
          }
        >
          <Button type={"text"}>
            <AppstoreOutlined />
            <DownOutlined style={{ fontSize: "10px" }} />
          </Button>
        </Dropdown>
        <Dropdown
          trigger={"click"}
          overlay={
            <Menu>
              <MenuItem key={"1"} onClick={() => photoEventBus.emit("selectAll")}>
                全选
              </MenuItem>
              <MenuItem key={"2"} onClick={() => photoEventBus.emit("unselectAll")}>
                不选择任何项目
              </MenuItem>
            </Menu>
          }
        >
          <Button type={"text"}>
            <DashOutlined />
          </Button>
        </Dropdown>
        <Modal
          centered
          open={this.openModal}
          onUpdate:open={this.updateOpenModal}
          title={this.copyOrMove + this.dataService.selectedImagePaths.size + "项"}
          onOk={this.handleModalConfirm}
          okButtonProps={{ disabled: this.selectedDirectoryPaths.length === 0 }}
        >
          <p>选择文件夹</p>
          <div style={{ height: "500px" }}>
            <Tree
              treeData={this.allDirectories}
              height={500}
              blockNode
              selectedKeys={this.selectedDirectoryPaths}
              onUpdate:selectedKeys={(val) => (this.selectedDirectoryPaths = val)}
            ></Tree>
          </div>
        </Modal>
      </Flex>
    )
  }
}

export default toNative<ToolbarProps>(ToolbarInst)
