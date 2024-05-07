import type { App, ComponentPublicInstance, DirectiveBinding } from "vue"
import type { Class } from "../common"
import { getAllMetadata, type VueClassMetadata } from "./metadata"

export class VueDirective<El extends HTMLElement | ComponentPublicInstance = HTMLElement, Value = any> {
  private static readonly _elMapVueDirective = new Map<any, Map<string, VueDirective>>()
  private static readonly _directiveNameMapVueDirective = new Map<string, Class<VueDirective>>()

  static install(app: App) {
    const directives: Array<[string, [Class<VueDirective>, VueClassMetadata]]> = getAllMetadata()
      .filter((item) => item[1].isDirective)
      .map((item) => [item[1].directiveName, item])
    ;(VueDirective as any)._directiveNameMapVueDirective = new Map(directives)
    for (let directive of directives) {
      const directiveName = directive[1][1].directiveName
      const clazz = directive[1][0]
      app.directive(directiveName, {
        created(el, binding) {
          VueDirective.getInstance(el, directiveName, clazz).created(binding)
        },
        mounted(el, binding) {
          const directive = VueDirective.getInstance(el, directiveName, clazz)
          directive.mounted(binding)
          directive.mountedAndUpdated(binding)
        },
        updated(el, binding) {
          const directive = VueDirective.getInstance(el, directiveName, clazz)
          directive.updated(binding)
          directive.mountedAndUpdated(binding)
        },
        beforeUnmount(el, binding) {
          VueDirective.getInstance(el, directiveName, clazz).beforeUnmount(binding)
        },
        beforeUpdate(el, binding) {
          VueDirective.getInstance(el, directiveName, clazz).beforeUpdate(binding)
        },
        beforeMount(el, binding) {
          VueDirective.getInstance(el, directiveName, clazz).beforeMount(binding)
        },
        unmounted(el, binding) {
          VueDirective.getInstance(el, directiveName, clazz).unmounted(binding)
        }
      })
    }
  }

  static getInstance<T extends VueDirective>(el: any, directiveName: string, clazz?: Class<T>): T {
    if (!clazz) {
      clazz = this._directiveNameMapVueDirective.get(directiveName) as Class<T>
      if (!clazz) throw new Error("Unable to find the VueDirective class corresponding to the directive name")
    }
    let map = this._elMapVueDirective.get(el)
    if (!map) this._elMapVueDirective.set(el, (map = new Map()))
    let instance = map.get(directiveName)
    if (!instance) map.set(directiveName, (instance = new clazz(el, directiveName)))
    return instance as T
  }

  constructor(
    readonly el: El,
    readonly name: string
  ) {}

  mountedAndUpdated(binding: DirectiveBinding<Value>) {}

  created(binding: DirectiveBinding<Value>) {}

  beforeMount(binding: DirectiveBinding<Value>) {}

  mounted(binding: DirectiveBinding<Value>) {}

  beforeUpdate(binding: DirectiveBinding<Value>) {}

  updated(binding: DirectiveBinding<Value>) {}

  beforeUnmount(binding: DirectiveBinding<Value>) {}

  unmounted(binding: DirectiveBinding<Value>) {
    const map = VueDirective._elMapVueDirective.get(this.el)
    if (map) {
      map.delete(this.name)
      if (!map.size) VueDirective._elMapVueDirective.delete(this.el)
    }
  }
}
