import { VueClass } from "@packages/vue-class"
import { VueClassMetadata } from "@packages/vue-class/metadata.ts"
import { invoke } from "@renderer/exposed.ts"
import { router } from "@renderer/photo/router.ts"
import { createApp } from "vue"
import Index from "./photo.tsx"
import "../global.css"
import "ant-design-vue/dist/reset.css"

const app = createApp(Index).use(router)
VueClassMetadata.invokeFn = invoke
await VueClass.install(app, router)
app.mount("#app")
