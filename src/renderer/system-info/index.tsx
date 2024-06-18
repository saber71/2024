import { Inject } from "@packages/dependency-injection"
import {
  BindThis,
  Component,
  type ComponentProps,
  Mut,
  toNative,
  VueComponent,
  type VueComponentBaseProps
} from "@packages/vue-class"
import { translationSystemInfoKey } from "@services/system-info.channels.ts"
import { ConfigProvider, Descriptions, DescriptionsItem, Flex, Tag } from "ant-design-vue"
import zhCN from "ant-design-vue/es/locale/zh_CN"
import type { VNodeChild } from "vue"
import { SystemInfoService } from "./service.ts"
import "./index.css"

export interface IndexProps extends VueComponentBaseProps {}

@Component()
export class IndexInst extends VueComponent<IndexProps> {
  static readonly defineProps: ComponentProps<IndexProps> = ["inst"]

  @Inject() service: SystemInfoService
  @Mut() curChannel: "general" | "cpu" | "baseboard" | "chassis" = "general"
  @Mut() curChannelName: string = "常规"

  @BindThis() setCurChannel(channel: IndexInst["curChannel"], channelName: string) {
    this.curChannel = channel
    this.curChannelName = channelName
  }

  render(): VNodeChild {
    const channels = this.service.channels

    return (
      <ConfigProvider locale={zhCN}>
        <Flex class={"h-full"} gap={10}>
          <div class={"w-fit flex-shrink-0 aside"}>
            <div
              class={["btn", this.curChannel === "general" ? "active-btn" : ""]}
              onClick={() => this.setCurChannel("general", "常规")}
            >
              常规
            </div>
            <div
              class={["btn", this.curChannel === "cpu" ? "active-btn" : ""]}
              onClick={() => this.setCurChannel("cpu", "CPU")}
            >
              CPU
            </div>
            <div
              class={["btn", this.curChannel === "baseboard" ? "active-btn" : ""]}
              onClick={() => this.setCurChannel("baseboard", "主板")}
            >
              主板
            </div>
            <div
              class={["btn", this.curChannel === "chassis" ? "active-btn" : ""]}
              onClick={() => this.setCurChannel("chassis", "机箱")}
            >
              机箱
            </div>
          </div>
          <Descriptions
            class={"flex-grow h-full overflow-auto pt-2 pb-2 pr-2"}
            bordered
            title={this.curChannelName}
            column={2}
          >
            {Object.entries(channels[this.curChannel].value).map(([key, value]) => {
              let result: any = "N/A"
              if (typeof value === "boolean") result = value ? "支持" : "不支持"
              else if (value instanceof Array) {
                if (value.length)
                  result = value.map((val) => (
                    <Tag style={{ marginBlockEnd: "4px", marginBlockStart: "4px" }}>{val}</Tag>
                  ))
              } else if (value) result = value

              return (
                <DescriptionsItem
                  label={translationSystemInfoKey(key)}
                  labelStyle={{ whiteSpace: "nowrap" }}
                  span={key === "flags" ? 2 : 1}
                >
                  {result}
                </DescriptionsItem>
              )
            })}
          </Descriptions>
        </Flex>
      </ConfigProvider>
    )
  }
}

export default toNative<IndexProps>(IndexInst)
