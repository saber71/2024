import { BlockOutlined, BorderOutlined, CloseOutlined, MinusOutlined } from "@ant-design/icons-vue"
import {
  BindThis,
  Component,
  type ComponentProps,
  toNative,
  VueComponent,
  type VueComponentBaseProps
} from "@packages/vue-class"
import { invoke, windowInfo } from "@renderer/exposed.ts"
import { Button } from "ant-design-vue"
import type { VNode, VNodeChild } from "vue"
import "./index.scss"

export interface TitleBarProps extends VueComponentBaseProps {
  icon: string
  title: string
  renderCenter?: () => VNode
}

@Component()
export class TitleBarInst extends VueComponent<TitleBarProps> {
  static readonly defineProps: ComponentProps<TitleBarProps> = ["inst", "icon", "title", "renderCenter"]

  @BindThis() handleWindowMaximize() {
    if (windowInfo.isMaximize.value) invoke("window:unmaximize")
    else invoke("window:maximize")
  }

  @BindThis() handleWindowClose() {
    invoke("window:close")
  }

  @BindThis() handleWindowMinimum() {
    invoke("window:minimize")
  }

  render(): VNodeChild {
    return (
      <div class={"title-bar app-draggable"}>
        <div class={"title"}>
          <img src={this.props.icon} />
          <span>{this.props.title}</span>
        </div>
        <div class={"center app-not-draggable"}>{this.props.renderCenter?.()}</div>
        <div class={"buttons app-not-draggable"}>
          <Button class={"h-full border-transparent"} onClick={this.handleWindowMinimum}>
            <MinusOutlined />
          </Button>
          <Button class={"h-full border-transparent"} onClick={this.handleWindowMaximize}>
            {windowInfo.isMaximize.value ? <BlockOutlined /> : <BorderOutlined />}
          </Button>
          <Button class={"h-full border-transparent"} onClick={this.handleWindowClose}>
            <CloseOutlined />
          </Button>
        </div>
      </div>
    )
  }
}

export default toNative<TitleBarProps>(TitleBarInst)
