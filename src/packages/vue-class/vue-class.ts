import { type App, inject, type InjectionKey, provide } from "vue"
import type { Router } from "vue-router"
import type { Class } from "../common"
import { type Container, LoadableContainer } from "../dependency-injection"
import { ModuleName, ROUTER } from "./constants"
import { VueDirective } from "./vue-directive"
import { VueRouterGuard } from "./vue-router-guard"

const customContainerLabel: InjectionKey<Container> = Symbol("__vue_class__:custom-container")

export class VueClass {
  static readonly dependencyInjection = new LoadableContainer()

  static getInstance<T>(clazz: Class<T>): T {
    return this.getContainer().getValue(clazz)
  }

  static setCustomContainer(container: Container) {
    provide(customContainerLabel, container)
  }

  static getContainer(): Container {
    return inject(customContainerLabel, this.dependencyInjection) || this.dependencyInjection
  }

  static async install(app: App, router: Router) {
    this.dependencyInjection.load({ moduleName: ModuleName })
    this.dependencyInjection.bindValue(ROUTER, router)
    VueDirective.install(app)
    VueRouterGuard.install(router)
  }
}
