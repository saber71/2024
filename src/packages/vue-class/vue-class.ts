import { type App } from "vue"
import type { Router } from "vue-router"
import type { Class } from "../common"
import { LoadableContainer } from "../dependency-injection"
import { ModuleName, ROUTER } from "./constants"
import { VueDirective } from "./vue-directive"
import { VueRouterGuard } from "./vue-router-guard"

export class VueClass {
  private static readonly _dependencyInjection = new LoadableContainer()

  static getInstance<T>(clazz: Class<T>): T {
    return this.getValue(clazz.name)
  }

  static getValue<T>(label: string): T {
    return this._dependencyInjection.getValue(label)
  }

  static load() {
    this._dependencyInjection.load({ moduleName: ModuleName })
  }

  static async install(app: App, router?: Router) {
    this.load()
    VueDirective.install(app)
    if (router) {
      this._dependencyInjection.bindValue(ROUTER, router)
      VueRouterGuard.install(router)
    }
  }
}
