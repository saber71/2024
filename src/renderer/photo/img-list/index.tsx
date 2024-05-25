import { Inject } from "@packages/dependency-injection"
import { Component, type ComponentProps, toNative, VueComponent, type VueComponentBaseProps } from "@packages/vue-class"
import { PhotoDataService } from "@renderer/photo/data.service.ts"
import type { VNodeChild } from "vue"
import "./index.scss"

export interface ImgListProps extends VueComponentBaseProps {}

@Component()
export class ImgListInst extends VueComponent<ImgListProps> {
  static readonly defineProps: ComponentProps<ImgListProps> = ["inst"]

  @Inject() dataService: PhotoDataService

  render(): VNodeChild {
    return (
      <div>
        {this.dataService.curItemType?.label}
        <img src={"atom://D:/WebstormProjects/2024/resources/icon.png"} />
        {this.dataService.imageInfos.map((info) => (
          <div>
            <img src={info.path} width={info.width} height={info.height} />
          </div>
        ))}
      </div>
    )
  }
}

export default toNative<ImgListProps>(ImgListInst)
