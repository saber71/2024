import { CloseOutlined, MinusOutlined } from "@ant-design/icons-vue"
import {
  BindThis,
  Component,
  type ComponentProps,
  toNative,
  VueComponent,
  type VueComponentBaseProps
} from "@packages/vue-class"
import { invoke, windowInfo } from "@renderer/exposed.ts"
import type { VNode, VNodeChild } from "vue"
import "./index.scss"
import maximum from "./maximum.svg"
import roundRect from "./round-rect.svg"

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
      <div class={"title-bar draggable"}>
        <div class={"title"}>
          <img src={this.props.icon} />
          <span>{this.props.title}</span>
        </div>
        <div class={"center not-draggable"}>{this.props.renderCenter?.()}</div>
        <div class={"buttons not-draggable"}>
          <div class={"minimum"} onClick={this.handleWindowMinimum}>
            <MinusOutlined />
          </div>
          <div class={"scalable"} onClick={this.handleWindowMaximize}>
            {windowInfo.isMaximize.value ? <img src={maximum} /> : <img src={roundRect} />}
          </div>
          <div class={"closable"} onClick={this.handleWindowClose}>
            <CloseOutlined />
          </div>
        </div>
      </div>
    )
  }
}

export default toNative<TitleBarProps>(TitleBarInst)
