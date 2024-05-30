import { isBrowser } from "@packages/common"
import type { Router } from "vue-router"
import { ROUTER } from "./constants.ts"
import { initMutKey } from "./metadata"
import { VueClass } from "./vue-class.ts"

export class VueService {
  get router(): Router {
    if (!isBrowser) throw new Error("router is not available in nodejs side")
    return VueClass.getValue(ROUTER)
  }

  get route() {
    return this.router.currentRoute.value
  }

  setup() {}

  reset() {
    const initMut = (this as any)[initMutKey]
    if (initMut) {
      for (let key in initMut) {
        ;(this as any)[key] = initMut[key]
      }
    }
  }
}
