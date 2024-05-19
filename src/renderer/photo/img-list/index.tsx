import { Component, type ComponentProps, toNative, VueComponent, type VueComponentBaseProps } from "@packages/vue-class"
import type { VNodeChild } from "vue"
import "./index.scss"

export interface ImgListProps extends VueComponentBaseProps {}

@Component()
export class ImgListInst extends VueComponent<ImgListProps> {
  static readonly defineProps: ComponentProps<ImgListProps> = ["inst"]

  render(): VNodeChild {
    return <div>img-list</div>
  }
}

export default toNative<ImgListProps>(ImgListInst)
