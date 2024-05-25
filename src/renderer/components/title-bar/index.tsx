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
        {/*左侧应用图片和应用名*/}
        <div class={"title"}>
          <img src={this.props.icon} />
          <span>{this.props.title}</span>
        </div>
        {/*中间自定义部分*/}
        <div class={"center app-not-draggable"}>{this.props.renderCenter?.()}</div>
        {/*右侧用来控制窗口的按钮*/}
        <div class={"buttons app-not-draggable"}>
          {/*最小化*/}
          <Button class={"h-full border-transparent"} onClick={this.handleWindowMinimum}>
            <MinusOutlined />
          </Button>
          {/*最大化/取消最大化*/}
          <Button class={"h-full border-transparent"} onClick={this.handleWindowMaximize}>
            {windowInfo.isMaximize.value ? <BlockOutlined /> : <BorderOutlined />}
          </Button>
          {/*关闭窗口*/}
          <Button class={"h-full border-transparent"} onClick={this.handleWindowClose}>
            <CloseOutlined />
          </Button>
        </div>
      </div>
    )
  }
}

export default toNative<TitleBarProps>(TitleBarInst)
