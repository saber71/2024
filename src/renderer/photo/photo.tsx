import { Styles } from "@packages/style"
import {
  Component,
  type ComponentProps,
  Disposable,
  toNative,
  VueComponent,
  type VueComponentBaseProps
} from "@packages/vue-class"
import Flex from "@renderer/components/flex"
import TitleBar from "@renderer/components/title-bar"
import Menu from "@renderer/photo/menu"
import type { VNodeChild } from "vue"
import { RouterView } from "vue-router"
import icon from "./icon.svg"

export interface PhotoProps extends VueComponentBaseProps {}

@Component()
export class PhotoInst extends VueComponent<PhotoProps> {
  static readonly defineProps: ComponentProps<PhotoProps> = ["inst"]

  @Disposable() style = new Styles<"photo-container" | "photo-container_layout" | "photo-main" | "photo-main_wrap">()
    .add("photo-container", {
      height: "100%",
      background: "#222222"
    })
    .add("photo-container_layout", {
      height: "calc(100% - 40px)"
    })
    .add("photo-main", {
      height: "100%",
      "flex-grow": "1",
      padding: "5px",
      "box-sizing": "border-box"
    })
    .add("photo-main_wrap", {
      background: "rgba(255,255,255,0.75)",
      height: "100%",
      "border-radius": "15px",
      overflow: "hidden"
    })

  render(): VNodeChild {
    return (
      <div class={this.style.classNames["photo-container"]}>
        <TitleBar icon={icon} title={"照片"} />
        <Flex class={this.style.classNames["photo-container_layout"]}>
          <Menu />
          <div class={this.style.classNames["photo-main"]}>
            <div class={this.style.classNames["photo-main_wrap"]}>
              <RouterView />
            </div>
          </div>
        </Flex>
      </div>
    )
  }
}

export default toNative<PhotoProps>(PhotoInst)
