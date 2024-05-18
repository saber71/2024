import { Component, type ComponentProps, toNative, VueComponent, type VueComponentBaseProps } from "@packages/vue-class"
import type { VNodeChild } from "vue"

export interface PhotoProps extends VueComponentBaseProps {}

@Component()
export class PhotoInst extends VueComponent<PhotoProps> {
  static readonly defineProps: ComponentProps<PhotoProps> = ["inst"]

  render(): VNodeChild {
    return <div>photo123</div>
  }
}

export default toNative<PhotoProps>(PhotoInst)
