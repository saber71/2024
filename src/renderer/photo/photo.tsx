import { Inject } from "@packages/dependency-injection"
import {
  Component,
  type ComponentProps,
  Mut,
  toNative,
  VueComponent,
  type VueComponentBaseProps
} from "@packages/vue-class"
import TitleBar from "@renderer/components/title-bar"
import { PhotoDataService } from "@renderer/photo/data.service.ts"
import { Flex, Menu } from "ant-design-vue"
import type { Key } from "ant-design-vue/es/_util/type"
import type { VNodeChild } from "vue"
import { RouterView } from "vue-router"
import icon from "./assets/icon.svg"

export interface PhotoProps extends VueComponentBaseProps {}

@Component()
export class PhotoInst extends VueComponent<PhotoProps> {
  static readonly defineProps: ComponentProps<PhotoProps> = ["inst"]

  @Inject() dataService: PhotoDataService
  @Mut() selectedKeys: Key[] = []
  @Mut() openKeys: Key[] = []

  render(): VNodeChild {
    return (
      <div class={"h-full"}>
        <TitleBar icon={icon} title={"照片"} />
        <Flex class={"border-0 border-t-gray-100 border-t border-solid"} style={{ height: "calc(100% - 40px)" }}>
          <Menu
            items={this.dataService.menus}
            selectedKeys={this.selectedKeys}
            openKeys={this.openKeys}
            mode={"vertical"}
            onUpdate:selectedKeys={(val) => (this.selectedKeys = val)}
          />
          <div class={"h-full flex-grow box-border p-1"}>
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
