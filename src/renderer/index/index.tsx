import {
  BindThis,
  Component,
  type ComponentProps,
  toNative,
  VueComponent,
  type VueComponentBaseProps
} from "@packages/vue-class"
import { invoke } from "@renderer/exposed"
import type { VNodeChild } from "vue"
import electronSvg from "./assets/electron.svg"

export interface IndexProps extends VueComponentBaseProps {}

@Component()
export class IndexInst extends VueComponent<IndexProps> {
  static readonly defineProps: ComponentProps<IndexProps> = ["inst"]

  @BindThis() handlePing() {
    invoke("ping", "123", 1)
  }

  @BindThis() handleOpenPhoto() {
    invoke("photo:open")
  }

  @BindThis()
  async handleShowSaveDialog() {
    const result = await invoke("showSaveDialog", {
      filters: [
        {
          extensions: ["png"],
          name: "image"
        }
      ]
    })
    console.log(result)
  }

  render(): VNodeChild {
    return (
      <div>
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
          </div>
          <div class="action">
            <a target="_blank" rel="noreferrer" onClick={this.handlePing}>
              Send IPC
            </a>
            <a target="_blank" rel="noreferrer" onClick={this.handleOpenPhoto}>
              Open photo
            </a>
            <a target="_blank" onClick={this.handleShowSaveDialog}>
              Show save dialog
            </a>
          </div>
        </div>
      </div>
    )
  }
}

export default toNative<IndexProps>(IndexInst)
