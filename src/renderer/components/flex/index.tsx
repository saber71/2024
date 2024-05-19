import { Component, type ComponentProps, toNative, VueComponent, type VueComponentBaseProps } from "@packages/vue-class"
import { type Property } from "csstype"
import type { VNodeChild } from "vue"

export interface FlexProps extends VueComponentBaseProps {
  justify?: Property.JustifyItems
  align?: Property.AlignItems
  direction?: Property.FlexDirection
  gap?: string | number
  wrap?: boolean
}

@Component()
export class FlexInst extends VueComponent<FlexProps> {
  static readonly defineProps: ComponentProps<FlexProps> = ["inst", "justify", "align", "direction", "wrap", "gap"]

  render(): VNodeChild {
    return (
      <div
        style={{
          display: "flex",
          justifyItems: this.props.justify,
          alignItems: this.props.align,
          flexDirection: this.props.direction,
          flexWrap: this.props.wrap ? "wrap" : "nowrap",
          gap: this.props.gap
        }}
      >
        {this.slot.default?.()}
      </div>
    )
  }
}

export default toNative<FlexProps>(FlexInst)
