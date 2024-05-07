import type { Exposed } from "@packages/exposed"

export const exposed: Exposed = window as any

export const invoke = exposed.api.invoke
