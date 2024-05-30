import {
  BindThis,
  Component,
  type ComponentProps,
  toNative,
  VueComponent,
  type VueComponentBaseProps
} from "@packages/vue-class"
import TitleBar from "@renderer/components/title-bar"
import { invoke, transferDataToMain } from "@renderer/exposed"
import type { VNodeChild } from "vue"
import electronSvg from "./assets/electron.svg"

export interface IndexProps extends VueComponentBaseProps {}

@Component()
export class IndexInst extends VueComponent<IndexProps> {
  static readonly defineProps: ComponentProps<IndexProps> = ["inst"]

  @BindThis() handlePing() {
    invoke("ping", "123", 1)
    transferDataToMain("ping", 1)
  }

  @BindThis() handleOpenPhoto() {
    invoke("photo:open")
  }

  render(): VNodeChild {
    return (
      <div>
        <TitleBar
          class={"top-0 left-0 w-full bg-white"}
          title={"Electron"}
          icon={electronSvg}
          style={{ position: "fixed", color: "black" }}
        />
        <img alt="logo" class="logo" src={electronSvg} />
        <div class="creator">Powered by electron-vite</div>
        <div class="text">
          Build an Electron app with
          <span class="vue">Vue</span>
          and
          <span class="ts">TypeScript</span>
        </div>
        <p class="tip">
          Please try pressing <code>F12</code> to open the devTool
        </p>
        <div class="actions">
          <div class="action">
            <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
              Documentation
            </a>
            <a target="_blank" rel="noreferrer" onClick={this.handlePing}>
              ping主进程一下
            </a>
            <a target="_blank" rel="noreferrer" onClick={this.handleOpenPhoto}>
              打开照片
            </a>
          </div>
        </div>
      </div>
    )
  }
}

export default toNative<IndexProps>(IndexInst)
