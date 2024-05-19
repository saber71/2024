import { Component, type ComponentProps, toNative, VueComponent, type VueComponentBaseProps } from "@packages/vue-class"
import TitleBar from "@renderer/components/title-bar"
import Menu from "@renderer/photo/menu"
import { Flex } from "ant-design-vue"
import type { VNodeChild } from "vue"
import { RouterView } from "vue-router"
import icon from "./icon.svg"

export interface PhotoProps extends VueComponentBaseProps {}

@Component()
export class PhotoInst extends VueComponent<PhotoProps> {
  static readonly defineProps: ComponentProps<PhotoProps> = ["inst"]

  render(): VNodeChild {
    return (
      <div>
        <TitleBar icon={icon} title={"照片"} />
        <Flex>
          <Menu style={{ flexShrink: 0 }} />
          <RouterView />
        </Flex>
      </div>
    )
  }
}

export default toNative<PhotoProps>(PhotoInst)
