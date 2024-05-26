import { ROUTER } from "@packages/vue-class/constants.ts"
import { VueClass } from "@packages/vue-class/vue-class.ts"
import type { Router } from "vue-router"
import { initMutKey } from "./metadata"

export class VueService {
  get router(): Router {
    return VueClass.getContainer().getValue(ROUTER)
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
