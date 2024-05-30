import { Ipc, IpcHandler, IpcReceived, Mut, Watcher } from "@packages/vue-class"

@Ipc()
export class PingIpc {
  @IpcReceived("ping") @Mut() ping: number

  @IpcHandler("ping") handleInvokePing(arg1: string, arg2: string, windowId: number) {
    console.log("handle ping", arg1, arg2, windowId)
  }

  @Watcher() onPingChanged() {
    if (this.ping) console.log("listen ping", this.ping)
  }
}
