import { mainEventBus } from "@main/eventBus.ts"
import { InjectChannels } from "@main/services/channels.service.ts"
import { EventListener, Service } from "@packages/vue-class"
import type { SystemInfoChannels } from "@services/system-info.channels.ts"
import si from "systeminformation"

@Service()
export class SystemInfoService {
  @InjectChannels("system-info") channels: SystemInfoChannels

  @EventListener(mainEventBus, "onCreateWindowChannels") onCreateWindowChannels() {
    si.uuid().then((data) => {
      const timeData = si.time()
      this.channels.general.assign({
        timezone: timeData.timezone,
        timezoneName: timeData.timezoneName,
        Electron: "v" + process.versions.electron,
        Node: "v" + process.versions.node,
        Chrome: "v" + process.versions.chrome,
        V8: "v" + process.versions.v8,
        macs: data.macs,
        osUUID: data.os,
        hardwareUUID: data.hardware
      })
    })

    si.bios().then((data) => this.channels.bios.setValue(data))

    si.baseboard().then((data) => {
      const memMaxGB = data.memMax ? Number(toFixed(data.memMax / 1024 / 1024 / 1024)) : ""
      this.channels.baseboard.setValue({ ...data, memMax: memMaxGB as any })
    })

    si.chassis().then((data) => this.channels.chassis.setValue(data))

    Promise.all([si.cpu(), si.cpuCurrentSpeed(), si.cpuTemperature()]).then(([data, speeds, temperature]) => {
      ;(data as any).cacheL1d = toFixed(data.cache.l1d / 1024)
      ;(data as any).cacheL1i = toFixed(data.cache.l1i / 1024)
      ;(data as any).cacheL2 = toFixed(data.cache.l2 / 1024 / 1024)
      ;(data as any).cacheL3 = toFixed(data.cache.l3 / 1024 / 1024)
      delete (data as any).cache
      this.channels.cpu.assign({
        ...data,
        flags: data.flags.split(/\s/) as any,
        coreSpeeds: speeds.cores.map((speed, index) => "核心" + index + "：" + speed),
        coreTemperatures: temperature.cores.map((value, index) => "核心" + index + "：" + value),
        chipsetTemperature: temperature.chipset,
        socketTemperature: temperature.socket
      })
    })
  }
}

function toFixed(num: number) {
  let result = num.toFixed(2)
  if (!result.includes(".")) return result
  while (true) {
    const lastChar = result.at(-1)
    if (lastChar === "0") result = result.slice(0, result.length - 1)
    else if (lastChar === ".") {
      result = result.slice(0, result.length - 1)
      break
    } else break
  }
  return result
}
