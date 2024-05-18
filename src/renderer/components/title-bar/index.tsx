import { CloseOutlined, MinusOutlined } from "@ant-design/icons-vue"
import { Component, type ComponentProps, toNative, VueComponent, type VueComponentBaseProps } from "@packages/vue-class"
import type { VNode, VNodeChild } from "vue"
import "./index.scss"

export interface TitleBarProps extends VueComponentBaseProps {
  icon: string
  title: string
  renderCenter?: () => VNode
}

@Component()
export class TitleBarInst extends VueComponent<TitleBarProps> {
  static readonly defineProps: ComponentProps<TitleBarProps> = ["inst"]

  render(): VNodeChild {
    return (
      <div class={"title-bar"}>
        <div class={"title"}>
          <img src={this.props.icon} />
          <span>{this.props.title}</span>
        </div>
        <div class={"center"}>{this.props.renderCenter?.()}</div>
        <div class={"buttons"}>
          <div class={"minimum"}>
            <MinusOutlined />
          </div>
          <div></div>
          <div class={"closable"}>
            <CloseOutlined />
          </div>
        </div>
      </div>
    )
  }
}

export default toNative<TitleBarProps>(TitleBarInst)
