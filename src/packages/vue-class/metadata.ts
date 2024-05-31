import type {
  InvokeChannelMap,
  TransferDataToMainChannelMap,
  TransferDataToRendererChannelMap
} from "@packages/exposed"
import EventEmitter from "eventemitter3"
import {
  computed,
  inject,
  type InjectionKey,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onDeactivated,
  onErrorCaptured,
  onMounted,
  onRenderTracked,
  onRenderTriggered,
  onServerPrefetch,
  onUnmounted,
  onUpdated,
  provide,
  readonly,
  ref,
  shallowReadonly,
  shallowRef,
  watch,
  watchEffect,
  type WatchOptions
} from "vue"
import { onBeforeRouteLeave, onBeforeRouteUpdate, type RouteLocationNormalized } from "vue-router"
import { type Class, debounce, deepClone, throttle } from "../common"
import { type HookType, type WatcherTarget } from "./decorators"
import { VueComponent } from "./vue-component"
import { VueDirective } from "./vue-directive"
import { VueService } from "./vue-service"

export interface ComponentOption {
  provideThis?: string | boolean
}

const childInstMapKey: InjectionKey<Record<string, VueComponent>> = Symbol("childInstMap")
export const initMutKey = Symbol("init-mut")

export class VueClassMetadata {
  // 只需在渲染进程初始化. 调用invoke发送channel给主进程
  static invokeFn: (...args: any[]) => Promise<any> = () => Promise.resolve()
  // 只需在主进程初始化. 在ipcMain上调用handle监听channel
  static ipcHandler: (channel: string, callback: Function) => void = () => void 0
  // 需要在渲染进程和主进程初始化. 在ipcMain或ipcRenderer上监听事件
  static listenIpc: (channel: string, callback: Function) => Function = () => () => 0

  isComponent = false

  componentOption?: ComponentOption

  isService = false

  isIpc = false

  isDirective = false

  isRouterGuard = false

  directiveName = ""

  routerGuardMatchTo?: RegExp | ((path: RouteLocationNormalized) => boolean)

  routerGuardMatchFrom?: RegExp | ((path: RouteLocationNormalized) => boolean)

  readonly mutts: { propName: string; shallow?: boolean }[] = []

  readonly disposables: { propName: string; methodName?: string }[] = []

  readonly readonlys: { propName: string; shallow?: boolean }[] = []

  readonly ipcReceived: {
    propName: string
    channel: keyof TransferDataToRendererChannelMap | keyof TransferDataToMainChannelMap
    options?: {
      append?: boolean
      concat?: boolean
    }
  }[] = []

  readonly ipcSync: Array<{
    propName: string
    channel: keyof InvokeChannelMap | keyof TransferDataToRendererChannelMap
  }> = []

  readonly ipcHandlers: { methodOrProp: string; channel: keyof InvokeChannelMap }[] = []

  readonly ipcListener: {
    methodName: string
    channel: keyof TransferDataToRendererChannelMap | keyof TransferDataToMainChannelMap
  }[] = []

  readonly throttles: { methodName: string; args: any[] }[] = []

  readonly debounce: { methodName: string; args: any[] }[] = []

  readonly invokes: Array<{ propName: string; args: any[] }> = []

  readonly links: {
    refName?: string
    propName: string
    isDirective?: boolean
    directiveName?: string
  }[] = []

  readonly vueInject: Array<{ propName: string; provideKey: any }> = []

  readonly bindThis: string[] = []

  readonly setup: string[] = []

  readonly eventListener: Array<{
    eventTarget: EventTarget | EventEmitter<any> | string
    eventName: string
    methodName: string
  }> = []

  readonly hooks: { methodName: string; type: HookType }[] = []

  readonly watchers: {
    methodName: string
    source?: WatcherTarget<any> | WatcherTarget<any>[]
    option?: WatchOptions
  }[] = []

  readonly propsWatchers: { methodName: string; option?: WatchOptions }[] = []

  readonly computers: string[] = []

  clone() {
    return deepClone(this) as VueClassMetadata
  }

  handleIpcHandler(instance: any) {
    for (let handler of this.ipcHandlers) {
      let fn: Function
      if (typeof instance[handler.methodOrProp] === "function") fn = instance[handler.methodOrProp].bind(instance)
      else fn = () => instance[handler.methodOrProp]
      VueClassMetadata.ipcHandler(handler.channel, fn)
    }
  }

  handleSetup(instance: any) {
    for (let methodName of this.setup) {
      instance[methodName].call(instance)
    }
  }

  handleIpcSync(instance: any) {
    for (let item of this.ipcSync) {
      let updateCount = 0
      // 当该属性被Invoke装饰时，跳过它的第一次更新，因为这一次更新是从IPC发过来的
      if (!this.invokes.find((item) => item.propName === item.propName)) updateCount++
      instance["$__" + item.channel + "_" + item.propName] = watch(instance[Symbol.for(item.propName)], () => {
        if (updateCount) VueClassMetadata.invokeFn(item.channel, instance[item.propName])
        updateCount++
      })
    }
  }

  handleIpcReceived(instance: any) {
    for (let item of this.ipcReceived) {
      instance["$__" + item.channel + "_" + item.propName] = VueClassMetadata.listenIpc(item.channel, (data: any) => {
        const oldData = instance[item.propName]
        if (item.options) {
          if (oldData instanceof Array) {
            if (item.options.append) {
              oldData.push(data)
            } else if (item.options.concat) {
              if (data instanceof Array) oldData.push(...data)
              else oldData.push(data)
            } else instance[item.propName] = data
          } else if (oldData instanceof Set) {
            if (item.options.append) {
              oldData.add(data)
            } else if (item.options.concat) {
              if (data instanceof Array) {
                for (let val of data) {
                  oldData.add(val)
                }
              } else oldData.add(data)
            } else instance[item.propName] = data
          } else instance[item.propName] = data
        } else instance[item.propName] = data
      })
    }
  }

  handleDebounce(instance: any) {
    for (let item of this.debounce) {
      const method = instance[item.methodName].bind(instance)
      instance[item.methodName] = debounce(method, item.args[0])
    }
  }

  handleThrottle(instance: any) {
    for (let item of this.throttles) {
      const method = instance[item.methodName].bind(instance)
      instance[item.methodName] = throttle(method, item.args[0])
    }
  }

  handleEventListener(instance: object) {
    for (let item of this.eventListener) {
      const method = (instance as any)[item.methodName].bind(instance)
      if (typeof item.eventTarget === "string") {
        const className = item.eventTarget
        onMounted(() => {
          const array = document.getElementsByClassName(className)
          for (let el of array) {
            el.addEventListener(item.eventName, method)
          }
        })
      } else if (item.eventTarget instanceof EventEmitter) item.eventTarget.on(item.eventName, method)
      else item.eventTarget.addEventListener(item.eventName, method)
    }
  }

  handleInvokes(instance: object) {
    for (let item of this.invokes) {
      VueClassMetadata.invokeFn(...item.args).then((res) => ((instance as any)[item.propName] = res))
    }
  }

  handleComponentOption(instance: VueComponent) {
    if (instance.props.inst) {
      const instMap = inject(childInstMapKey)
      if (instMap) instMap[instance.props.inst] = instance
    }
    provide(childInstMapKey, instance.childInstMap)
    if (this.componentOption) {
      const { provideThis } = this.componentOption
      if (provideThis) {
        const key = typeof provideThis === "boolean" ? instance.constructor.name : provideThis
        provide(key, instance)
      }
    }
  }

  handleBindThis(instance: object) {
    for (let methodName of this.bindThis) {
      const method = (instance as any)[methodName]
      ;(instance as any)[methodName] = method.bind(instance)
    }
  }

  handleIpcListener(instance: object) {
    for (let item of this.ipcListener) {
      const method = (instance as any)[item.methodName].bind(instance)
      ;(instance as any)["$off_" + item.methodName] = VueClassMetadata.listenIpc(item.channel, method)
    }
  }

  handleWatchers(instance: object) {
    for (let metadata of this.watchers) {
      let fn = (instance as any)[metadata.methodName]
      if (typeof fn !== "function") throw new Error("Decorator Watcher can only be used on methods")
      fn = fn.bind(instance)
      if (!metadata.source) watchEffect(fn, metadata.option)
      else {
        if (!(metadata.source instanceof Array)) metadata.source = [metadata.source]
        const source: any = metadata.source.map((item: any) => {
          if (typeof item === "string") {
            const $ = (instance as any)[Symbol.for(item)]
            return $ ?? (() => (instance as any)[item])
          } else return () => item(instance)
        })
        watch(source, fn, metadata.option)
      }
    }
  }

  handlePropsWatchers(instance: VueComponent) {
    for (let data of this.propsWatchers) {
      let fn = (instance as any)[data.methodName]
      if (typeof fn !== "function") throw new Error("Decorator PropsWatcher can only be used on methods")
      fn = fn.bind(instance)
      watch(instance.props, fn, data.option)
    }
  }

  handleHook(instance: VueComponent) {
    for (let hookData of this.hooks) {
      let fn = (instance as any)[hookData.methodName]
      if (typeof fn !== "function") throw new Error("Decorator Hook can only be used for methods")
      fn = fn.bind(instance)
      switch (hookData.type) {
        case "onMounted":
          onMounted(fn)
          break
        case "onUnmounted":
          onUnmounted(fn)
          break
        case "onBeforeMount":
          onBeforeMount(fn)
          break
        case "onBeforeUnmount":
          onBeforeUnmount(fn)
          break
        case "onUpdated":
          onUpdated(fn)
          break
        case "onActivated":
          onActivated(fn)
          break
        case "onDeactivated":
          onDeactivated(fn)
          break
        case "onErrorCaptured":
          onErrorCaptured(fn)
          break
        case "onRenderTracked":
          onRenderTracked(fn)
          break
        case "onRenderTriggered":
          onRenderTriggered(fn)
          break
        case "onServerPrefetch":
          onServerPrefetch(fn)
          break
        case "onBeforeRouteLeave":
          onBeforeRouteLeave(fn)
          break
        case "onBeforeRouteUpdate":
          onBeforeRouteUpdate(fn)
          break
        default:
          throw new Error("Unknown Hook Type " + hookData.type)
      }
    }
  }

  handleVueInject(instance: any) {
    for (let item of this.vueInject) {
      const val = inject(item.provideKey)
      Object.defineProperty(instance, item.propName, {
        configurable: true,
        enumerable: true,
        get: () => val
      })
    }
  }

  handleMut(instance: object) {
    let initMut = (instance as any)[initMutKey]
    if (!initMut) initMut = (instance as any)[initMutKey] = {}
    for (let data of this.mutts) {
      const value = (instance as any)[data.propName]
      initMut[data.propName] = deepClone(value)
      const ref$ = data.shallow ? shallowRef(value) : ref(value)
      ;(instance as any)[Symbol.for(data.propName)] = ref$
      Object.defineProperty(instance, data.propName, {
        configurable: true,
        enumerable: true,
        set(v: any) {
          ref$.value = v
        },
        get(): any {
          return ref$.value
        }
      })
    }
  }

  handleReadonly(instance: object) {
    for (let data of this.readonlys) {
      const value = (instance as any)[data.propName]
      const $ = data.shallow ? shallowReadonly(value) : readonly(value)
      ;(instance as any)[Symbol.for(data.propName)] = $
      Object.defineProperty(instance, data.propName, {
        configurable: true,
        enumerable: true,
        get(): any {
          return $
        }
      })
    }
  }

  handleLink(instance: VueComponent) {
    for (let data of this.links) {
      let refName = data.propName
      let directiveName = ""
      if (data.refName) {
        refName = data.refName
      } else if (data.isDirective) {
        refName = refName.replace(/Directive$/, "")
      }
      if (data.isDirective) {
        directiveName = data.directiveName ?? ""
        if (!directiveName) directiveName = refName
      }
      Object.defineProperty(instance, data.propName, {
        configurable: true,
        enumerable: true,
        get(): any {
          const el = instance.childInstMap[refName] ?? instance.vueInstance.refs?.[refName]
          if (data.isDirective) {
            if (!el) throw new Error("There is no ref named " + refName)
            return VueDirective.getInstance(el, directiveName)
          }
          return el
        }
      })
    }
  }

  handleComputer(instance: object) {
    if (!this.computers.length) return
    const prototypeOf = Object.getPrototypeOf(instance)
    for (let computerName of this.computers) {
      const target = (instance as any)[computerName]
      if (typeof target === "function") {
        const fn = target.bind(instance)
        const computer = computed(fn)
        ;(instance as any)[Symbol.for(computerName)] = computer
        ;(instance as any)[computerName] = () => computer.value
      } else {
        const getter = Object.getOwnPropertyDescriptor(prototypeOf, computerName)?.get
        if (!getter) throw new Error("Computer can only be used on getters or no parameter methods")
        const computer = computed(() => getter.call(instance))
        ;(instance as any)[Symbol.for(computerName)] = computer
        Object.defineProperty(instance, computerName, {
          configurable: true,
          get: () => computer.value
        })
      }
    }
  }
}

const metadataMap = new Map<any, VueClassMetadata>()

export function getAllMetadata(): [Class, VueClassMetadata][] {
  return Array.from(metadataMap.entries())
}

export function getMetadata(clazz: any) {
  const metadata = metadataMap.get(clazz)
  if (!metadata) throw new Error("Unable to find corresponding Metadata instance")
  return metadata
}

const appliedSymbol = Symbol("__appliedMetadata__")

export function applyMetadata(clazz: any, instance: VueService | object) {
  const metadata = getMetadata(clazz)
  if ((instance as any)[appliedSymbol]) return metadata
  ;(instance as any)[appliedSymbol] = true
  metadata.handleMut(instance)
  metadata.handleReadonly(instance)
  metadata.handleVueInject(instance)
  metadata.handleDebounce(instance)
  metadata.handleThrottle(instance)
  metadata.handleComputer(instance)
  metadata.handleWatchers(instance)
  metadata.handleBindThis(instance)
  metadata.handleIpcListener(instance)
  metadata.handleInvokes(instance)
  metadata.handleEventListener(instance)
  metadata.handleIpcReceived(instance)
  metadata.handleIpcSync(instance)
  metadata.handleIpcHandler(instance)
  if (instance instanceof VueComponent) {
    metadata.handleLink(instance)
    metadata.handleHook(instance)
    metadata.handlePropsWatchers(instance)
    metadata.handleComponentOption(instance)
  }
  if (instance instanceof VueService) {
    instance.setup()
  }
  metadata.handleSetup(instance)
  return metadata
}

export function getOrCreateMetadata(
  clazz: Class | object | any,
  ctx?: ClassDecoratorContext | { kind: string; metadata: Record<string, any> } | string
): VueClassMetadata {
  if (!ctx || typeof ctx === "string") {
    if (typeof clazz === "object") clazz = clazz.constructor as Class
    let metadata = metadataMap.get(clazz)
    if (!metadata) {
      const parentClass = Object.getPrototypeOf(clazz)
      const parentMetadata = metadataMap.get(parentClass)
      if (parentMetadata) metadataMap.set(clazz, (metadata = parentMetadata.clone()))
      else metadataMap.set(clazz, (metadata = new VueClassMetadata()))
    }
    return metadata
  } else {
    let metadata = ctx.metadata.metadata
    if (!metadata) metadata = ctx.metadata.metadata = new VueClassMetadata()
    if (ctx.kind === "class") metadataMap.set(clazz, metadata)
    return metadata
  }
}
