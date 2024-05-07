import {
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
  type Router
} from "vue-router"
import type { Class } from "../common"
import { getAllMetadata, type VueClassMetadata } from "./metadata"
import { VueClass } from "./vue-class"

export class VueRouterGuard {
  static install(router: Router) {
    const guards: Array<[Class<VueRouterGuard>, VueClassMetadata]> = getAllMetadata().filter(
      (item) => item[1].isRouterGuard
    )
    for (let guard of guards) {
      const guardInstance = VueClass.getInstance(guard[0])
      const metadata = guard[1]
      const beforeEach = guardInstance.beforeEach.bind(guardInstance)
      const afterEach = guardInstance.afterEach.bind(guardInstance)
      const beforeResolve = guardInstance.beforeResolve.bind(guardInstance)
      const onError = guardInstance.onError.bind(guardInstance)
      router.onError((error, to, from) => {
        if (match(to, from, metadata.routerGuardMatchTo, metadata.routerGuardMatchFrom)) onError(error, to, from)
      })
      router.beforeEach(async (to, from, next) => {
        if (match(to, from, metadata.routerGuardMatchTo, metadata.routerGuardMatchFrom))
          await beforeEach(to, from, next)
        else next()
      })
      router.afterEach(async (to, from) => {
        if (match(to, from, metadata.routerGuardMatchTo, metadata.routerGuardMatchFrom)) await afterEach(to, from)
      })
      router.beforeResolve(async (to, from, next) => {
        if (match(to, from, metadata.routerGuardMatchTo, metadata.routerGuardMatchFrom))
          await beforeResolve(to, from, next)
        else next()
      })
    }

    function match(
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      matchTo?: RegExp | ((path: RouteLocationNormalized) => boolean),
      matchFrom?: RegExp | ((path: RouteLocationNormalized) => boolean)
    ) {
      if (!matchFrom && !matchTo) return true
      else if (matchTo && matchFrom) return match(matchFrom, from) && match(matchTo, to)
      else return match(matchTo, to) || match(matchFrom, from)

      function match(
        item: undefined | RegExp | ((path: RouteLocationNormalized) => boolean),
        path: RouteLocationNormalized
      ) {
        if (!item) return false
        if (item instanceof RegExp) return item.test(path.path)
        return item(path)
      }
    }
  }

  beforeEach(to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) {
    next()
  }

  beforeResolve(to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) {
    next()
  }

  afterEach(to: RouteLocationNormalized, from: RouteLocationNormalized) {}

  onError(error: Error, to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded) {}
}
