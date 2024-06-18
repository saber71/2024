import { Channel, Channels, WindowChannels } from "@packages/sync"
import { type Systeminformation } from "systeminformation"

interface GeneralInformation extends Systeminformation.SystemData {
  Electron: string
  Node: string
  Chrome: string
  V8: string
  osUUID: string
  hardwareUUID: string
  macs: string[]
  timezone: string
  timezoneName: string
}

type CpuInformation = Systeminformation.CpuData & {
  cacheL1d: string
  cacheL1i: string
  cacheL2: string
  cacheL3: string
  coreSpeeds: string[]
  coreTemperatures: string[]
  chipsetTemperature?: number
  socketTemperature?: number[]
}

@Channels("system-info")
export class SystemInfoChannels extends WindowChannels {
  readonly general = Channel.create<GeneralInformation>("general", {} as any)

  readonly bios = Channel.create<Systeminformation.BiosData>("bios", {} as any)

  // 主板
  readonly baseboard = Channel.create<Systeminformation.BaseboardData>("baseboard", {} as any)

  // 机箱
  readonly chassis = Channel.create<Systeminformation.ChassisData>("chassis", {} as any)

  readonly cpu = Channel.create<CpuInformation>("cpu", {} as any)
}

/**
 * 翻译系统信息键值。
 *
 * 该函数旨在提供一种机制，将系统信息中的键值翻译成不同的语言，
 * 默认情况下，如果键值不存在于翻译映射中，则返回原始键值。
 *
 * @param key 需要翻译的系统信息键。
 * @returns 翻译后的字符串或者原始键值。
 */
export function translationSystemInfoKey(key: string): string {
  return (translationMapper as any)[key] || key
}

const translationMapper = {
  manufacturer: "制造商",
  model: "型号",
  version: "版本",
  serial: "序列号",
  uuid: "UUID",
  sku: "SKU",
  virtual: "是否是虚拟机",
  virtualHost: "虚拟主机",
  raspberry: "Raspberry",
  macs: "MAC地址",
  osUUID: "系统UUID",
  hardwareUUID: "硬件UUID",
  vendor: "供应商",
  releaseDate: "发布日期",
  revision: "修订值",
  language: "语言",
  features: "支持的功能集",
  assetTag: "资产标签",
  memMax: "最大支持内存（单位：GB）",
  memSlots: "内存插槽",
  type: "类型",
  brand: "品牌",
  speed: "主频（单位：GHz）",
  speedMin: "最小主频（单位：GHz）",
  speedMax: "最大主频（单位：GHz）",
  governor: "调速器",
  cores: "核心数",
  physicalCores: "物理核心数",
  performanceCores: "性能核心数",
  efficiencyCores: "能效核心数",
  processors: "处理器数量",
  socket: "插座类型",
  stepping: "步进值",
  family: "系列",
  voltage: "核心电压（单位：V）",
  flags: "支持的功能集",
  virtualization: "虚拟化",
  cacheL1d: "1级数据缓存（单位：KB）",
  cacheL1i: "1级指令缓存（单位：KB）",
  cacheL2: "2级缓存（单位：MB）",
  cacheL3: "3级缓存（单位：MB）",
  coreSpeeds: "核心频率（单位：GHz）",
  coreTemperatures: "核心温度（单位：℃）",
  socketTemperature: "插座温度（单位：℃）",
  chipsetTemperature: "芯片组温度（单位：℃）",
  timezone: "时区",
  timezoneName: "时区名称",
  Electron: "Electron版本",
  Node: "Node版本",
  V8: "V8版本",
  Chrome: "Chrome版本"
}
