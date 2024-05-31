import { Component, type ComponentProps, toNative, VueComponent, type VueComponentBaseProps } from "@packages/vue-class"
import type { VNodeChild } from "vue"

export interface IndexProps extends VueComponentBaseProps {}

@Component()
export class IndexInst extends VueComponent<IndexProps> {
  static readonly defineProps: ComponentProps<IndexProps> = ["inst"]

  render(): VNodeChild {
    return <div></div>
  }
}

export default toNative<IndexProps>(IndexInst)
