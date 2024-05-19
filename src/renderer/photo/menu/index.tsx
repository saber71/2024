import { Component, type ComponentProps, toNative, VueComponent, type VueComponentBaseProps } from "@packages/vue-class"
import type { VNodeChild } from "vue"
import "./index.scss"

export interface MenuProps extends VueComponentBaseProps {}

@Component()
export class MenuInst extends VueComponent<MenuProps> {
  static readonly defineProps: ComponentProps<MenuProps> = ["inst"]

  render(): VNodeChild {
    return <div></div>
  }
}

export default toNative<MenuProps>(MenuInst)
