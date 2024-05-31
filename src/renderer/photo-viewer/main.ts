import { VueClass } from "@packages/vue-class"
import { VueClassMetadata } from "@packages/vue-class/metadata.ts"
import { invoke, listenIpcFromMain } from "@renderer/exposed.ts"
import { createApp } from "vue"
import Index from "./index.tsx"
import "../global.css"
import "ant-design-vue/dist/reset.css"

const app = createApp(Index)
VueClassMetadata.invokeFn = invoke
VueClassMetadata.listenIpc = listenIpcFromMain as any
await VueClass.install(app)
app.mount("#app")