import {
  AppstoreOutlined,
  CheckOutlined,
  DashOutlined,
  DownOutlined,
  FunnelPlotOutlined,
  SortAscendingOutlined
} from "@ant-design/icons-vue"
import { Inject } from "@packages/dependency-injection"
import { Component, type ComponentProps, toNative, VueComponent, type VueComponentBaseProps } from "@packages/vue-class"
import { PhotoDataService, photoEventBus } from "@renderer/photo/data.service.tsx"
import { Button, Dropdown, Flex, Menu, MenuDivider, MenuItem } from "ant-design-vue"
import type { VNodeChild } from "vue"

export interface ToolbarProps extends VueComponentBaseProps {}

@Component()
export class ToolbarInst extends VueComponent<ToolbarProps> {
  static readonly defineProps: ComponentProps<ToolbarProps> = ["inst"]

  @Inject() dataService: PhotoDataService

  render(): VNodeChild {
    return (
      <Flex align={"center"}>
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
      </Flex>
    )
  }
}

export default toNative<ToolbarProps>(ToolbarInst)
