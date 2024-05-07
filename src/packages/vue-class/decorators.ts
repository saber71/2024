import { type WatchOptions } from "vue"
import type { RouteLocationNormalized } from "vue-router"
import type { Class } from "../common"
import { Injectable } from "../dependency-injection"
import { ModuleName } from "./constants"
import { applyMetadata, type ComponentOption, getOrCreateMetadata } from "./metadata"
import type { VueComponentClass } from "./types"
import { VueComponent, type VueComponentBaseProps } from "./vue-component"
import type { VueDirective } from "./vue-directive"
import type { VueRouterGuard } from "./vue-router-guard"
import type { VueService } from "./vue-service"

export type WatcherTarget<T extends VueService> = string | keyof T | ((instance: T) => any)

export type HookType =
  | "onMounted"
  | "onUpdated"
  | "onUnmounted"
  | "onBeforeMount"
  | "onBeforeUnmount"
  | "onErrorCaptured"
  | "onRenderTracked"
  | "onRenderTriggered"
  | "onActivated"
  | "onDeactivated"
  | "onServerPrefetch"
  | "onBeforeRouteUpdate"
  | "onBeforeRouteLeave"

/* 适用于类 */
export function Component<Props extends VueComponentBaseProps>(option?: ComponentOption) {
  const fn = Injectable({ moduleName: ModuleName })
  return (clazz: VueComponentClass<Props>, ctx?: ClassDecoratorContext) => {
    fn(clazz, ctx)
    const metadata = getOrCreateMetadata(clazz, ctx)
    metadata.isComponent = true
    metadata.componentOption = option
  }
}

/* 适用于类 */
export function Service(option?: Parameters<typeof Injectable>[0]) {
  const fn = Injectable(
    Object.assign(
      {
        moduleName: ModuleName,
        singleton: true,
        onCreate: (instance: object) => applyMetadata(instance.constructor, instance)
      },
      option
    )
  )
  return (clazz: Class, ctx?: any) => {
    fn(clazz, ctx)
    getOrCreateMetadata(clazz, ctx).isService = true
  }
}

/* 适用于类 */
export function RouterGuard(option?: {
  matchTo?: RegExp | ((path: RouteLocationNormalized) => boolean)
  matchFrom?: RegExp | ((path: RouteLocationNormalized) => boolean)
}) {
  const fn = Injectable(
    Object.assign(
      {
        moduleName: ModuleName,
        singleton: true,
        onCreate: (instance: object) => applyMetadata(instance.constructor, instance)
      },
      option
    )
  )
  return (clazz: Class<VueRouterGuard>, ctx?: any) => {
    fn(clazz, ctx)
    const metadata = getOrCreateMetadata(clazz, ctx)
    metadata.isRouterGuard = true
    metadata.routerGuardMatchTo = option?.matchTo
    metadata.routerGuardMatchFrom = option?.matchFrom
  }
}

/* 适用于类 */
export function Directive(name?: string) {
  const fn = Injectable({ moduleName: ModuleName })
  return (clazz: Class<VueDirective>, ctx?: any) => {
    fn(clazz, ctx)
    const metadata = getOrCreateMetadata(clazz, ctx)
    metadata.isDirective = true
    if (!name) {
      name = clazz.name.replace(/Directive$/, "")
      name = name[0].toLowerCase() + name.slice(1)
    }
    metadata.directiveName = name
  }
}

/* 适用于属性 */
export function Disposable(methodName?: string) {
  return (target: object, arg: any) => {
    const metadata = getOrCreateMetadata(target, arg)
    metadata.disposables.push({ propName: getName(arg), methodName })
  }
}

/* 适用于属性 */
export function Mut(shallow?: boolean) {
  return (target: object, arg: any) => {
    const metadata = getOrCreateMetadata(target, arg)
    metadata.mutts.push({ propName: getName(arg), shallow })
  }
}

/* 适用于属性 */
export function Readonly(shallow?: boolean) {
  return (target: object, arg: any) => {
    const metadata = getOrCreateMetadata(target, arg)
    metadata.readonlys.push({ propName: getName(arg), shallow })
  }
}

/* 适用于属性 */
export function Link(option?: { refName?: string; isDirective?: boolean; directiveName?: string }) {
  return (target: VueComponent, arg: any) => {
    getOrCreateMetadata(target, arg).links.push({
      propName: getName(arg),
      refName: option?.refName,
      isDirective: !!(option?.isDirective || option?.directiveName),
      directiveName: option?.directiveName
    })
  }
}

/* 适用于属性 */
export function VueInject(key?: string | symbol) {
  return (target: object, arg: any) => {
    if (!key) key = (Reflect as any).getMetadata("design:type", target, arg)?.name
    getOrCreateMetadata(target, arg).vueInject.push({
      propName: getName(arg),
      provideKey: key
    })
  }
}

/*
 * 适用于方法和getter
 * 初始时会调用两次getter
 */
export function Computed() {
  return (target: any, arg: any) => {
    getOrCreateMetadata(target, arg).computers.push(getName(arg))
  }
}

/* 适用于方法 */
export function Hook(type: HookType) {
  return (target: object, arg: any) => {
    getOrCreateMetadata(target, arg).hooks.push({
      methodName: getName(arg),
      type
    })
  }
}

/* 适用于方法 */
export function PropsWatcher(option?: WatchOptions) {
  return (target: object, arg: string) => {
    getOrCreateMetadata(target, arg).propsWatchers.push({
      methodName: getName(arg),
      option
    })
  }
}

/* 适用于方法 */
export function Watcher<T extends VueService>(option?: {
  source?: WatcherTarget<T> | WatcherTarget<T>[]
  option?: WatchOptions
}) {
  return (target: object, arg: any) => {
    getOrCreateMetadata(target, arg).watchers.push({
      methodName: getName(arg),
      ...option
    })
  }
}

/* 适用于方法 */
export function BindThis() {
  return (target: object, arg: any) => {
    getOrCreateMetadata(target, arg).bindThis.push(getName(arg))
  }
}

function getName(arg: string | { name: string }) {
  if (typeof arg === "string") return arg
  return arg.name
}
