import type { CreateWindowOptions } from "@main/utility"
import EventEmitter from "eventemitter3"

export const mainEventBus = new EventEmitter<{
  onCreateWindow: (type: CreateWindowOptions["html"]) => void
  onWindowClosed: (type: CreateWindowOptions["html"]) => void
}>()
