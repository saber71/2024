import { WindowService } from "@main/services"
import { Inject } from "@packages/dependency-injection"
import { Ipc, IpcHandler } from "@packages/vue-class"

export interface SystemInfoInvokeChannelMap {
  "system-info:open": {
    args: []
    return: void
  }
}

@Ipc()
export class SystemInfoIpc {
  @Inject() windowService: WindowService

  @IpcHandler("system-info:open")
  async open() {
    await this.windowService.open({
      html: "system-info",
      frame: true,
      minWidth: 900,
      minHeight: 670
    })
  }
}
