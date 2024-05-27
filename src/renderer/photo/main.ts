import { VueClass } from "@packages/vue-class"
import { VueClassMetadata } from "@packages/vue-class/metadata.ts"
import { invoke, listenIpcRenderer } from "@renderer/exposed.ts"
import { router } from "@renderer/photo/router.ts"
import { createApp } from "vue"
import Index from "./photo.tsx"
import "../global.css"
import "ant-design-vue/dist/reset.css"
import "overlayscrollbars/overlayscrollbars.css"

const app = createApp(Index).use(router)
VueClassMetadata.invokeFn = invoke
VueClassMetadata.listenIpc = listenIpcRenderer
await VueClass.install(app, router)
app.mount("#app")
