import { SyncData, VueClass } from "@packages/vue-class"
import { VueClassMetadata } from "@packages/vue-class/metadata.ts"
import { invoke, listenIpcFromMain, windowInfo } from "@renderer/exposed.ts"
import { router } from "@renderer/photo/router.ts"
import { createApp } from "vue"
import Index from "./photo.tsx"
import "../global.css"
import "ant-design-vue/dist/reset.css"
import "overlayscrollbars/overlayscrollbars.css"

const app = createApp(Index).use(router)
SyncData.id = await windowInfo.id
VueClassMetadata.invokeFn = invoke
VueClassMetadata.listenIpc = listenIpcFromMain as any
await VueClass.install(app, router)
app.mount("#app")
