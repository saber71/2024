import {
  defineComponent,
  type EmitsOptions,
  getCurrentInstance,
  type HTMLAttributes,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  type VNodeChild
} from "vue"
import type { Router } from "vue-router"
import { ROUTER } from "./constants"
import { applyMetadata } from "./metadata"
import type { ComponentProps, VueComponentClass, WithSlotTypes } from "./types"
import { VueClass } from "./vue-class"
import { VueService } from "./vue-service"

export interface VueComponentBaseProps extends Partial<HTMLAttributes> {
  inst?: string
}

export class VueComponent<
  Props extends VueComponentBaseProps = VueComponentBaseProps,
  Emit extends EmitsOptions = {}
> extends VueService {
  static __test__ = false
  static readonly defineProps: ComponentProps<VueComponentBaseProps & any> = ["inst"]

  constructor() {
    super()
    let curInstance = getCurrentInstance()!

    if (!curInstance) {
      if (VueComponent.__test__) curInstance = { appContext: {} } as any
      else throw new Error("Cannot directly create VueComponent instance")
    }

    this.vueInstance = curInstance
    this.context = curInstance.appContext as any
  }

  readonly vueInstance: NonNullable<ReturnType<typeof getCurrentInstance>>
  readonly context: WithSlotTypes<Emit, Props>
  readonly childInstMap: Record<string, VueComponent> = {}

  get props(): Props {
    return this.vueInstance.props as Props
  }

  get slot() {
    return this.vueInstance.slots ?? {}
  }

  get router(): Router {
    return VueClass.getContainer().getValue(ROUTER)
  }

  get route() {
    return this.router.currentRoute.value
  }

  render(): VNodeChild {}

  onMounted(): void {}

  onBeforeUnmounted(): void {}

  onUnmounted(): void {}

  getLinkElement(refName: string): HTMLElement {
    return this.vueInstance.refs?.[refName] as any
  }

  getLinkInst<Inst extends VueComponent = VueComponent>(name: string): Inst {
    return this.childInstMap[name] as any
  }
}

export function toNative<Props extends VueComponentBaseProps, Emit extends EmitsOptions = {}>(
  componentClass: VueComponentClass<Props, Emit>,
  genInstance?: () => VueComponent<Props, Emit>
) {
  return defineComponent<Props, Emit>(
    () => {
      const instance = genInstance ? genInstance() : VueClass.getInstance(componentClass)

      const metadata = applyMetadata(componentClass, instance)

      onMounted(instance.onMounted.bind(instance))

      onBeforeUnmount(instance.onBeforeUnmounted.bind(instance))

      onBeforeUnmount(() => {
        for (let { propName, methodName } of metadata.disposables) {
          const disposable = (instance as any)[propName]
          if (typeof disposable === "function") disposable()
          else disposable?.[methodName ?? "dispose"]?.()
        }
      })

      onUnmounted(instance.onUnmounted.bind(instance))

      return instance.render.bind(instance)
    },
    {
      name: componentClass.name,
      props: componentClass.defineProps as any
      // emits: componentClass.defineEmits as any,
    }
  )
}
