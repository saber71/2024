import { initMutKey } from "./metadata"

export class VueService {
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
