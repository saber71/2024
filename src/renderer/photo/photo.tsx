import { Component, type ComponentProps, toNative, VueComponent, type VueComponentBaseProps } from "@packages/vue-class"
import TitleBar from "@renderer/components/title-bar"
import type { VNodeChild } from "vue"
import icon from "./icon.svg"

export interface PhotoProps extends VueComponentBaseProps {}

@Component()
export class PhotoInst extends VueComponent<PhotoProps> {
  static readonly defineProps: ComponentProps<PhotoProps> = ["inst"]

  render(): VNodeChild {
    return (
      <div>
        <TitleBar icon={icon} title={"照片"} />
        photo123
      </div>
    )
  }
}

export default toNative<PhotoProps>(PhotoInst)
